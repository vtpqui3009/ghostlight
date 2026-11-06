import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FindingList } from './components/Findings';
import { Reports } from './components/Reports';
import { SceneEditor } from './components/SceneEditor';
import { StageView } from './components/StageView';
import { Timeline } from './components/Timeline';
import { countIssues, describeAction, makeLabels, runScenario } from './domain/engine';
import { presetCsv, resetCsv, runCsv } from './domain/reports';
import { EXAMPLES, demoScenario } from './domain/samples';
import { parseScenarioJson } from './domain/schema';
import { LIMITS } from './domain/schema';
import { clearScene, fileSlug, loadScene, saveScene, sceneToJson } from './domain/storage';
import type { Scenario } from './domain/types';

type View = 'run' | 'scene' | 'reports';
type Notice = { tone: 'info' | 'problem'; text: string; details?: string[] } | null;

const BLANK: Scenario = {
  version: 1,
  title: 'Untitled scene',
  description: 'Synthetic planning scene. Planned state only.',
  zones: [{ id: 'zone-1', name: 'Stage' }],
  holders: [],
  props: [],
  cues: [],
};

const prefersReducedMotion = () => {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

function download(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [scenario, setScenario] = useState<Scenario>(() => demoScenario());
  const [history, setHistory] = useState<Scenario[]>([]);
  const [view, setView] = useState<View>('run');
  const [cursor, setCursor] = useState(-1);
  const [stageMode, setStageMode] = useState<'diagram' | 'list'>(() => (prefersReducedMotion() ? 'list' : 'diagram'));
  const [notice, setNotice] = useState<Notice>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const loadedOnce = useRef(false);

  const run = useMemo(() => runScenario(scenario), [scenario]);
  const labels = useMemo(() => makeLabels(scenario), [scenario]);
  const counts = countIssues(run.issues);
  const lastIndex = run.frames.length - 1;
  const safeCursor = Math.max(-1, Math.min(cursor, lastIndex));
  const frame = safeCursor >= 0 ? run.frames[safeCursor] : undefined;
  const shownState = frame ? frame.after : run.initial;

  // Open whatever was last worked on, but never let a damaged record replace a usable scene.
  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    const outcome = loadScene();
    if (outcome.status === 'loaded') {
      setScenario(outcome.scenario);
      setSavedAt(outcome.savedAt);
      setNotice({ tone: 'info', text: 'Opened the scene saved in this browser.' });
    } else if (outcome.status === 'invalid') {
      setNotice({ tone: 'problem', text: 'The scene saved in this browser could not be opened, so the example scene is shown instead.', details: outcome.errors });
    } else if (outcome.status === 'unavailable') {
      setNotice({ tone: 'problem', text: outcome.reason });
    }
  }, []);

  // Local autosave. Nothing is sent anywhere; the file export is the durable copy.
  useEffect(() => {
    const timer = setTimeout(() => {
      const outcome = saveScene(scenario);
      if (outcome.status === 'saved') setSavedAt(outcome.savedAt);
      else setNotice({ tone: 'problem', text: outcome.reason });
    }, 400);
    return () => clearTimeout(timer);
  }, [scenario]);

  const update = useCallback((next: Scenario) => {
    setHistory(previous => [scenario, ...previous].slice(0, 25));
    setScenario(next);
  }, [scenario]);

  const replace = useCallback((next: Scenario, text: string) => {
    setHistory(previous => [scenario, ...previous].slice(0, 25));
    setScenario(next);
    setCursor(-1);
    setNotice({ tone: 'info', text });
  }, [scenario]);

  const goToStep = useCallback((actionId: string) => {
    const target = run.frames.find(entry => entry.actionId === actionId);
    if (!target) return;
    setCursor(target.index);
    setView('run');
  }, [run]);

  const step = useCallback((delta: number) => {
    setCursor(previous => Math.max(-1, Math.min(Math.max(-1, Math.min(previous, lastIndex)) + delta, lastIndex)));
  }, [lastIndex]);

  // Arrow keys walk the plan, but never while someone is typing in a field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (view !== 'run' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
      if (event.key === 'ArrowLeft') { step(-1); event.preventDefault(); }
      else if (event.key === 'ArrowRight') { step(1); event.preventDefault(); }
      else if (event.key === 'Home') { setCursor(-1); event.preventDefault(); }
      else if (event.key === 'End') { setCursor(lastIndex); event.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, step, lastIndex]);

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > LIMITS.jsonBytes) {
      setNotice({ tone: 'problem', text: 'That file is larger than 200 KB, so it was not opened. Your current scene is unchanged.' });
      return;
    }
    const parsed = parseScenarioJson(await file.text());
    if (parsed.success) replace(parsed.data, `Imported “${parsed.data.title}”.`);
    else setNotice({ tone: 'problem', text: 'That file was not opened, so your current scene is unchanged.', details: parsed.errors });
  };

  const onDownloadCsv = (kind: 'run' | 'preset' | 'reset') => {
    const slug = fileSlug(scenario.title);
    if (kind === 'run') download(`${slug}-steps.csv`, runCsv(scenario, run), 'text/csv;charset=utf-8');
    if (kind === 'preset') download(`${slug}-preset.csv`, presetCsv(scenario), 'text/csv;charset=utf-8');
    if (kind === 'reset') download(`${slug}-reset.csv`, resetCsv(scenario, run), 'text/csv;charset=utf-8');
  };

  const stepSummary = frame
    ? `Step ${frame.cueIndex + 1}.${frame.actionIndex + 1} of cue “${scenario.cues[frame.cueIndex]?.title ?? frame.cueId}”: ${describeAction(frame.action, labels)}`
    : 'Top of the scene: the recorded preset, before any cue runs.';

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to the plan</a>
      <header className="masthead">
        <div>
          <h1>Ghostlight</h1>
          <p>Checks a physical-prop plan before the curtain rises.</p>
        </div>
        <p className="status-line" role="status">
          {savedAt ? `Saved in this browser at ${new Date(savedAt).toLocaleTimeString()}` : 'Not saved in this browser yet'}
        </p>
        <p className="banner">
          <strong>Planned state, not live tracking.</strong> Ghostlight replays the plan you type in. It does not
          observe the real stage, does not know where anything actually is, and is not a safety system. It has not
          been tested with stage managers, so treat its findings as a second read of your own run sheet.
        </p>
      </header>

      <section className="no-print" aria-label="Scene file, view and notices">
        <div className="toolbar">
        <label htmlFor="example-picker" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <span>Example</span>
          <select
            id="example-picker"
            defaultValue=""
            onChange={event => {
              const example = EXAMPLES.find(entry => entry.id === event.target.value);
              if (example) replace(example.build(), `Opened the example “${example.label}”. ${example.summary}`);
              event.currentTarget.selectedIndex = 0;
            }}
          >
            <option value="">Open an example…</option>
            {EXAMPLES.map(example => <option key={example.id} value={example.id}>{example.label}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => fileInput.current?.click()}>Import JSON</button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={event => { void onImport(event.target.files?.[0]); event.target.value = ''; }}
        />
        <button type="button" onClick={() => download(`${fileSlug(scenario.title)}.json`, sceneToJson(scenario), 'application/json')}>
          Export JSON
        </button>
        <button type="button" onClick={() => window.print()}>Print</button>
        <button
          type="button"
          disabled={history.length === 0}
          onClick={() => { setScenario(history[0]); setHistory(previous => previous.slice(1)); setNotice({ tone: 'info', text: 'Undid the last change.' }); }}
        >
          Undo
        </button>
        <button type="button" onClick={() => { clearScene(); replace(BLANK, 'Started a new, empty scene.'); }}>New scene</button>
        <span className="spacer" />
        <button type="button" onClick={() => setStageMode(mode => (mode === 'diagram' ? 'list' : 'diagram'))}>
          {stageMode === 'diagram' ? 'Switch to the list view' : 'Switch to the stage diagram'}
        </button>
      </div>

      <div aria-live="polite">
        {notice ? (
          <div className={`finding ${notice.tone === 'problem' ? 'error' : 'uncertain'} no-print`}>
            <div className="row">
              <strong>{notice.text}</strong>
              <button type="button" onClick={() => setNotice(null)}>Dismiss</button>
            </div>
            {notice.details ? (
              <ul className="muted">{notice.details.slice(0, 12).map(detail => <li key={detail}>{detail}</li>)}</ul>
            ) : null}
          </div>
        ) : null}
      </div>
      </section>

      <nav className="tabs no-print" aria-label="Views">
        {([['run', 'Run-through'], ['scene', 'Scene'], ['reports', 'Reports']] as const).map(([id, label]) => (
          <button key={id} type="button" aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}>{label}</button>
        ))}
      </nav>

      <main id="main">
        <section className="panel">
          <header>
            <h2>{scenario.title}</h2>
            <p className="row">
              <span className={`badge ${counts.errors > 0 ? 'error' : 'ok'}`}>
                <span aria-hidden="true">{counts.errors > 0 ? '▲' : '✓'}</span>
                {counts.errors} {counts.errors === 1 ? 'problem' : 'problems'}
              </span>
              <span className={`badge ${counts.uncertain > 0 ? 'uncertain' : 'plain'}`}>
                <span aria-hidden="true">?</span>
                {counts.uncertain} unclear
              </span>
              <span className="badge plain">{run.frames.length} steps · {scenario.cues.length} cues · {scenario.props.length} instances</span>
            </p>
          </header>
          {scenario.description ? <p className="muted">{scenario.description}</p> : null}
        </section>

        {view === 'run' ? (
          <>
            <section className="panel">
              <header>
                <h2>Where the plan puts things</h2>
                <div className="row no-print">
                  <button type="button" onClick={() => setCursor(-1)} disabled={safeCursor === -1}>Top of scene</button>
                  <button type="button" onClick={() => step(-1)} disabled={safeCursor === -1}>Previous step</button>
                  <button type="button" className="primary" onClick={() => step(1)} disabled={safeCursor >= lastIndex}>Next step</button>
                </div>
              </header>
              <p role="status">{stepSummary}</p>
              {frame && !frame.applied ? (
                <p className="finding error">This step was not applied, because the plan does not satisfy what it requires. Later cues are checked against the plan as written.</p>
              ) : null}
              <StageView scenario={scenario} state={shownState} frame={frame} mode={stageMode} />
              <p className="muted no-print">Arrow keys step through the plan. Home goes to the top of the scene, End to the last step.</p>
            </section>

            <div className="columns">
              <section className="panel">
                <h2>The plan, in order</h2>
                <Timeline scenario={scenario} run={run} cursor={safeCursor} onSelect={setCursor} />
              </section>
              <section className="panel">
                <h2>Findings on this step</h2>
                <FindingList
                  scenario={scenario}
                  run={run}
                  issues={frame ? frame.issues : []}
                  onGoToStep={goToStep}
                  emptyMessage={frame ? 'Nothing to report on this step.' : 'Pick a step to see what it requires.'}
                />
              </section>
            </div>

            <section className="panel">
              <h2>Everything found in this scene</h2>
              <p className="muted">
                Problems are contradictions in the plan. “Not enough information” means the plan does not say
                enough to check the step — it is not a claim that something is wrong.
              </p>
              <FindingList
                scenario={scenario}
                run={run}
                issues={run.issues}
                onGoToStep={goToStep}
                emptyMessage="Nothing found. Every step's required source matches the plan so far."
              />
            </section>
          </>
        ) : null}

        {view === 'scene' ? (
          <SceneEditor scenario={scenario} run={run} onChange={update} onFocusStep={goToStep} />
        ) : null}

        {view === 'reports' ? <Reports scenario={scenario} run={run} onDownload={onDownloadCsv} /> : null}
      </main>

      <footer className="muted" style={{ padding: '1rem 0' }}>
        <p>
          Everything stays in this browser: scenes are saved locally and exported by hand. Limits per scene:
          {' '}{LIMITS.props} instances, {LIMITS.zones} areas, {LIMITS.cues} cues, {LIMITS.actionsPerCue} steps per cue.
        </p>
      </footer>
    </div>
  );
}
