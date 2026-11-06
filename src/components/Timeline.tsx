import { useEffect, useRef } from 'react';
import { describeAction, makeLabels } from '../domain/engine';
import type { RunResult, Scenario } from '../domain/types';

export interface TimelineProps {
  scenario: Scenario;
  run: RunResult;
  cursor: number;
  onSelect: (index: number) => void;
}

/** The ordered plan. Steps inside one cue are explicit and ordered; nothing is treated as simultaneous. */
export function Timeline({ scenario, run, cursor, onSelect }: TimelineProps) {
  const labels = makeLabels(scenario);
  const current = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    current.current?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (run.frames.length === 0) {
    return <p className="muted">No steps yet. Add a cue and a step in the Scene tab.</p>;
  }

  return (
    <ol className="timeline">
      {scenario.cues.map((cue, cueIndex) => {
        const frames = run.frames.filter(frame => frame.cueIndex === cueIndex);
        return (
          <li key={cue.id}>
            <p className="cue-head">Cue {cueIndex + 1} — {cue.title}</p>
            {frames.length === 0 ? <p className="muted" style={{ paddingLeft: '0.2rem' }}>No steps in this cue.</p> : null}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="stack">
              {frames.map(frame => {
                const error = frame.issues.some(issue => issue.severity === 'error');
                const uncertain = frame.issues.some(issue => issue.severity === 'uncertain');
                const selected = frame.index === cursor;
                return (
                  <li key={frame.actionId}>
                    <button
                      type="button"
                      className="step-button"
                      aria-current={selected ? 'step' : undefined}
                      ref={selected ? current : undefined}
                      onClick={() => onSelect(frame.index)}
                    >
                      <span className="n">{cueIndex + 1}.{frame.actionIndex + 1}</span>
                      <span className="text">{describeAction(frame.action, labels)}</span>
                      <span className={`badge ${error ? 'error' : uncertain ? 'uncertain' : 'ok'}`}>
                        <span aria-hidden="true">{error ? '▲' : uncertain ? '?' : '✓'}</span>
                        {error ? 'Problem' : uncertain ? 'Unclear' : 'Checks out'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
