import { useState, useEffect, useRef, useCallback } from 'react';
import type { Scenario, RunResult, Frame } from './domain/types';
import { runScenario } from './domain/engine';
import { loadScene, saveScene } from './persistence/store';
import { DEMO_SCENARIOS, emptyScenario } from './fixtures/demos';
import { parseScenarioJson } from './domain/schema';
import { makeImportGuard } from './ui/importGuard';
import { Timeline } from './ui/Timeline';
import { StageView } from './ui/StageView';
import { Editor } from './ui/Editor';
import { ImportExport } from './ui/ImportExport';
import { Reports } from './ui/Reports';
import './styles.css';

type View = 'stage' | 'editor' | 'reports';

// K7 (Kiro, 2026-11-13): the first screen suggests one obvious first move, and says in
// one sentence what each bundled scene is for. Written from the fixtures' own
// descriptions in src/fixtures/demos.ts; the scenes themselves are unchanged.
const FIRST_DEMO_ID = 'missing-handoff';
const DEMO_BLURBS: Record<string, string> = {
  'missing-handoff':
    'A letter is never handed from Actor A to Actor B, so a later carry fails. See the failing step, its cause and a suggested fix.',
  'valid-control': 'The control: four clean steps. It should report nothing at all.',
  'consumed-reuse': 'A seal is used up and then needed again. A consumed prop never comes back; only a different instance can replace it.',
  'duplicate-identity': 'Two props share a display name. They stay separate physical instances, told apart by id.',
  'reordered-cues': 'Actor B can only collect the key after Actor A puts it down. It passes as shipped; swap cues 2 and 3 in the editor to see why order matters.',
  'unknown-start': 'Nobody recorded where a ring starts. Ghostlight reports uncertainty instead of guessing.',
};

export function App() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null);
  const [view, setView] = useState<View>('stage');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [corruptData, setCorruptData] = useState<string | null>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  // A ref, not state: nothing renders from this, and the import guard has to read the
  // value at the moment a file read completes rather than the value captured in the
  // render that started it. See src/ui/importGuard.ts.
  const editorHasDraftRef = useRef(false);
  const handleDraftChange = useCallback((hasDraft: boolean) => {
    editorHasDraftRef.current = hasDraft;
  }, []);
  const importGuard = useRef(makeImportGuard(() => editorHasDraftRef.current)).current;

  // Load scene on mount
  useEffect(() => {
    const result = loadScene();
    if (result.success) {
      setScenario(result.data);
    } else if (result.reason === 'parse-error') {
      setLoadError(`Failed to load saved scene: ${result.errors.join('; ')}`);
      setCorruptData(result.corruptData);
    } else if (result.reason === 'storage-denied') {
      setLoadError(`Storage access denied: ${result.error}`);
    }
    // If not-found, remain null and show empty state
  }, []);

  // Run engine when scenario changes
  useEffect(() => {
    if (scenario) {
      const result = runScenario(scenario);
      setRunResult(result);
      setSaveStatus('unsaved');
    } else {
      setRunResult(null);
    }
  }, [scenario]);

  const handleSave = () => {
    if (!scenario) return;
    setSaveStatus('saving');
    const result = saveScene(scenario);
    if (result.success) {
      setSaveStatus('saved');
      announce('Scene saved successfully');
    } else {
      setSaveStatus('error');
      const msg = result.reason === 'quota-exceeded' 
        ? `Save failed: storage quota exceeded. ${result.error}` 
        : `Save failed: ${result.error}`;
      alert(msg);
    }
  };

  const handleLoadDemo = (demo: Scenario) => {
    setScenario(demo);
    setSelectedFrameIndex(null);
    setLoadError(null);
    setCorruptData(null);
    announce(`Loaded demo: ${demo.title}`);
  };

  const handleStartEmpty = () => {
    setScenario(emptyScenario());
    setSelectedFrameIndex(null);
    setLoadError(null);
    setCorruptData(null);
    announce('Started new empty scene');
  };

  const handleImport = (json: string) => {
    const guard = importGuard();
    if (guard.blocked) {
      return { success: false as const, errors: guard.errors };
    }
    const parseResult = parseScenarioJson(json);
    if (parseResult.success) {
      setScenario(parseResult.data);
      setSelectedFrameIndex(null);
      setLoadError(null);
      setCorruptData(null);
      announce(`Imported scene: ${parseResult.data.title}`);
      return { success: true as const };
    } else {
      return { success: false as const, errors: parseResult.errors };
    }
  };

  const handleExport = (): string => {
    if (!scenario) return '';
    return JSON.stringify(scenario, null, 2);
  };

  const handleScenarioUpdate = (updated: Scenario) => {
    setScenario(updated);
    // Preserve selection if valid, else reset
    if (selectedFrameIndex !== null && runResult) {
      const newResult = runScenario(updated);
      if (selectedFrameIndex >= newResult.frames.length) {
        setSelectedFrameIndex(null);
      }
    }
  };

  const handleSelectFrame = (index: number | null) => {
    setSelectedFrameIndex(index);
    if (index !== null && runResult) {
      const frame = runResult.frames[index];
      announce(`Selected action ${frame.actionId} in cue ${frame.cueId}`);
    }
  };

  const handleClearCorrupt = () => {
    setLoadError(null);
    setCorruptData(null);
  };

  const announce = (message: string) => {
    if (announceRef.current) {
      announceRef.current.textContent = message;
    }
  };

  const selectedFrame: Frame | null = selectedFrameIndex !== null && runResult ? runResult.frames[selectedFrameIndex] : null;

  return (
    <div className="app">
      <div ref={announceRef} className="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
      
      <header className="app-header">
        <h1>Ghostlight</h1>
        <p className="subtitle">Planned state checker — not live tracking</p>
        <div className="header-actions">
          <button onClick={() => setView('stage')} className={view === 'stage' ? 'secondary' : 'small'}>Stage</button>
          <button onClick={() => setView('editor')} className={view === 'editor' ? 'secondary' : 'small'}>Editor</button>
          <button onClick={() => setView('reports')} className={view === 'reports' ? 'secondary' : 'small'}>Reports</button>
          <button onClick={handleSave} disabled={!scenario || saveStatus === 'saving' || saveStatus === 'saved'} className="small">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
          </button>
          {scenario && <ImportExport onImport={handleImport} onExport={handleExport} />}
          {saveStatus === 'error' && <span style={{ color: 'var(--error-text)', fontSize: '0.875rem' }}>Save failed</span>}
        </div>
      </header>

      {/* One landmark, always present: the empty state and the storage alert used to
          render outside it, so the first screen a reader meets had no main at all. */}
      <main>
      {loadError && (
        <div className="alert alert-error" style={{ margin: '1rem' }}>
          <strong>Storage Error:</strong> {loadError}
          {corruptData && (
            <div style={{ marginTop: '0.75rem' }}>
              <button onClick={handleClearCorrupt} className="small">Start Fresh (discard corrupt data)</button>
              <button onClick={() => {
                const blob = new Blob([corruptData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'ghostlight-corrupt-data.json';
                a.click();
                URL.revokeObjectURL(url);
              }} className="small secondary" style={{ marginLeft: '0.5rem' }}>Export Corrupt Data</button>
            </div>
          )}
        </div>
      )}

      {!scenario && !loadError && (
        <div className="empty-state first-screen">
          <h2>No Scene Loaded</h2>
          <p className="first-screen-lead">
            Ghostlight replays a theatre prop plan in cue order and shows where the plan
            contradicts itself: which physical prop a step requires somewhere it cannot be,
            and which earlier step caused it.
          </p>
          <p className="first-screen-limits">
            It checks the <strong>planned</strong> state only. It is not live tracking, it never
            sees the real stage, and the bundled scenes are invented examples.
          </p>

          <section className="first-move" aria-labelledby="first-move-heading">
            <h3 id="first-move-heading">Start here</h3>
            {DEMO_SCENARIOS.filter(d => d.id === FIRST_DEMO_ID).map(demo => (
              <div key={demo.id} className="demo-choice featured">
                <button onClick={() => handleLoadDemo(demo.scenario)} aria-describedby={`demo-desc-${demo.id}`}>
                  {demo.title}
                </button>
                <span id={`demo-desc-${demo.id}`}>{DEMO_BLURBS[demo.id]}</span>
              </div>
            ))}
          </section>

          <section aria-labelledby="other-demos-heading">
            <h3 id="other-demos-heading">Other example scenes</h3>
            <ul className="demo-list">
              {DEMO_SCENARIOS.filter(d => d.id !== FIRST_DEMO_ID).map(demo => (
                <li key={demo.id} className="demo-choice">
                  <button onClick={() => handleLoadDemo(demo.scenario)} className="secondary" aria-describedby={`demo-desc-${demo.id}`}>
                    {demo.title}
                  </button>
                  <span id={`demo-desc-${demo.id}`}>{DEMO_BLURBS[demo.id]}</span>
                </li>
              ))}
              <li className="demo-choice">
                <button onClick={handleStartEmpty} className="secondary" aria-describedby="demo-desc-empty">Empty Scene</button>
                <span id="demo-desc-empty">Start a blank plan and write your own zones, holders, props and cues.</span>
              </li>
            </ul>
          </section>
        </div>
      )}

      {scenario && runResult && (
        <div className="app-main">
          <aside className="timeline-panel">
            <div className="card">
              <h2 className="panel-header">Timeline</h2>
              <Timeline
                scenario={scenario}
                runResult={runResult}
                selectedFrameIndex={selectedFrameIndex}
                onSelectFrame={handleSelectFrame}
              />
            </div>
          </aside>

          <div className="workspace">
            {view === 'stage' && (
              <StageView
                scenario={scenario}
                selectedFrame={selectedFrame}
                onSelectFrame={handleSelectFrame}
                runResult={runResult}
                onUpdate={handleScenarioUpdate}
              />
            )}
            {view === 'reports' && (
              <Reports
                scenario={scenario}
                runResult={runResult}
              />
            )}
            <div style={{ display: view === 'editor' ? 'block' : 'none' }}>
              <Editor
                scenario={scenario}
                onUpdate={handleScenarioUpdate}
                runResult={runResult}
                onDraftChange={handleDraftChange}
              />
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
