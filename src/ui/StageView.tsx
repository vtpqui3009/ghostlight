import { useState } from 'react';
import { runScenario } from '../domain/engine';
import { applyFix, isGuidedFix, suggestFix } from '../domain/guidedFix';
import type { Action, Scenario, Frame, RunResult } from '../domain/types';
import { deriveStageModel, verdictSentence, type StageEntry, type StageEntryType } from './stageModel';
import { initialStageReading, rememberStageReading, type StageReading } from './stageReading';

interface StageViewProps {
  scenario: Scenario;
  selectedFrame: Frame | null;
  onSelectFrame: (index: number | null) => void;
  runResult: RunResult;
  onUpdate: (scenario: Scenario) => void;
}

/** What an action does, in words, so a cause can be named without raw ids. */
function describeAction(action: Action, scenario: Scenario): string {
  const prop = scenario.props.find(p => p.id === action.propId);
  const holder = (id: string | null | undefined) =>
    id ? scenario.holders.find(h => h.id === id)?.name ?? id : null;
  const subject = holder(action.destination?.holderId) ?? holder(action.requiredSource?.holderId);
  const verb: Record<string, string> = {
    place: 'places', collect: 'collects', transfer: 'hands over',
    carryOff: 'carries off', consume: 'uses up', replenish: 'brings on',
  };
  const name = prop ? `${prop.name} (${action.propId})` : action.propId;
  return subject ? `${subject} ${verb[action.kind] ?? action.kind} ${name}` : `${verb[action.kind] ?? action.kind} ${name}`;
}

export function StageView({ scenario, selectedFrame, onSelectFrame, runResult, onUpdate }: StageViewProps) {
  const [fixError, setFixError] = useState<string | null>(null);
  const [reading, setReading] = useState<StageReading>(initialStageReading);
  const chooseReading = (next: StageReading) => {
    setReading(next);
    rememberStageReading(next);
  };
  if (!selectedFrame) {
    return (
      <div className="card">
        <h2 className="panel-header">Stage View</h2>
        <div className="empty-state">
          <p>Select an action from the timeline to view its required and planned state.</p>
        </div>
      </div>
    );
  }

  const { action, issues } = selectedFrame;
  const model = deriveStageModel(scenario, selectedFrame);
  const plannedState = model.subject.before;

  // Group the shared entries by zone for the diagram. The list reads the same entries.
  const zoneProps = new Map<string, StageEntry[]>();
  for (const entry of model.entries) {
    if (!zoneProps.has(entry.zoneId)) zoneProps.set(entry.zoneId, []);
    zoneProps.get(entry.zoneId)!.push(entry);
  }

  const issue = issues.length > 0 ? issues[0] : null;

  // Built outside the JSX so TypeScript can narrow the Cause union properly.
  const cause = issue?.cause;
  let causeNode: React.ReactNode = null;
  if (cause?.kind === 'initial') {
    const causeProp = scenario.props.find(p => p.id === cause.propId);
    causeNode = (
      <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
        <em>Cause:</em> the recorded starting state of {causeProp?.name ?? cause.propId} ({cause.propId}).
        Nothing earlier moved it, so the starting declaration is where to look.
      </div>
    );
  } else if (cause?.kind === 'action') {
    const causeFrame = runResult.frames.find(f => f.actionId === cause.ref.actionId);
    const cueTitle = scenario.cues.find(c => c.id === cause.ref.cueId)?.title ?? cause.ref.cueId;
    causeNode = (
      <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
        <em>Cause:</em>{' '}
        {causeFrame ? (
          <button type="button" className="small link-button" onClick={() => onSelectFrame(causeFrame.index)}>
            Cue &ldquo;{cueTitle}&rdquo; — {describeAction(causeFrame.action, scenario)}
          </button>
        ) : (
          <>an earlier action in cue &ldquo;{cueTitle}&rdquo;.</>
        )}
      </div>
    );
  }

  const outcome = suggestFix(scenario, selectedFrame);
  let fixNode: React.ReactNode = null;
  if (outcome && !isGuidedFix(outcome)) {
    fixNode = (
      <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
        <em>No single fix:</em> {outcome.advice}
      </div>
    );
  } else if (outcome) {
    const fix = outcome;
    fixNode = (
      <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
        <em>Suggested fix:</em> {fix.description}
        <div style={{ marginTop: '0.5rem' }}>
          <button
            type="button"
            className="small"
            onClick={() => {
              const applied = applyFix(scenario, fix);
              if (applied.blocked) {
                setFixError(applied.reason);
                return;
              }
              setFixError(null);
              const next = applied.result;
              const index = runScenario(next).frames.findIndex(f => f.actionId === fix.action.id);
              onUpdate(next);
              onSelectFrame(index >= 0 ? index : null);
            }}
          >
            Add this step and replay
          </button>
        </div>
        {fixError && (
          <div style={{ marginTop: '0.5rem', color: 'var(--error-text)' }}>
            The edit was refused: {fixError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="panel-header">Stage View — {selectedFrame.cueId}</h2>
      
      {issue && (
        <div className={`alert ${issue.severity === 'error' ? 'alert-error' : 'alert-warning'}`}>
          <strong>{issue.severity === 'error' ? 'Error' : 'Uncertain'}:</strong> {issue.message}
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
            <em>Suggestion:</em> {issue.suggestion}
          </div>
          {causeNode}
          {fixNode}
        </div>
      )}

      <div className="stage-reading-toggle" role="group" aria-label="How to show the stage">
        <button
          type="button"
          className="small"
          aria-pressed={reading === 'diagram'}
          onClick={() => chooseReading('diagram')}
        >
          Diagram
        </button>
        <button
          type="button"
          className="small"
          aria-pressed={reading === 'list'}
          onClick={() => chooseReading('list')}
        >
          List
        </button>
      </div>

      {reading === 'list' ? (
        <StageList model={model} />
      ) : (
      <>
      <ul className="stage-legend" aria-label="How to read the stage">
        <li><span className="glyph" aria-hidden="true">{'\u25CC'}</span> Dashed outline: the ghost, where the plan requires the prop to be</li>
        <li><span className="glyph" aria-hidden="true">{'\u25CF'}</span> Solid fill: where the plan actually has the prop</li>
        <li><span className="glyph" aria-hidden="true">{'\u2713'}</span> Match: the ghost and the solid agree (calm, still)</li>
        <li><span className="glyph" aria-hidden="true">{'\u2715'}</span> Mismatch: they disagree (thicker outline)</li>
      </ul>

      <div className="stage-zones">
        {scenario.zones.map(zone => {
          const props = zoneProps.get(zone.id) || [];
          
          return (
            <div key={zone.id} className="zone-card">
              <h3 className="zone-title">{zone.name}</h3>
              
              {props.length === 0 && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', fontStyle: 'italic' }}>Empty</p>
              )}
              
              {props.map((p, idx) => (
                  <div key={`${p.propId}-${idx}`} className={`prop-glyph ${p.type}`}>
                    <div className="prop-id">{p.label}</div>
                    <div className="prop-position">
                      Zone: {p.zoneName} / {p.holderName}
                    </div>
                    {p.pairNote && <div className="prop-pair-note">{p.pairNote}</div>}
                  </div>
              ))}
            </div>
          );
        })}
      </div>
      </>
      )}

      {plannedState.status !== 'available' && (
        <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
          <strong>Non-available state:</strong> {action.propId} is currently <strong>{plannedState.status}</strong>.
        </div>
      )}
    </div>
  );
}

/** What each entry is, in words, for the list reading. */
const ROLE_TEXT: Record<StageEntryType, string> = {
  required: 'Required here for this step (ghost)',
  match: 'Required here, and the plan has it here (match)',
  mismatch: 'Required here, but the plan does not have it here (mismatch)',
  planned: 'Where the plan has it before this step (solid)',
  other: 'Another instance, before this step',
};

/**
 * The list reading of the stage. Reads the same StageModel as the diagram, so it can
 * never disagree with it. It stands alone: the verdict sentence names the instance,
 * the required position and the planned position, without needing the picture.
 */
function StageList({ model }: { model: ReturnType<typeof deriveStageModel> }) {
  return (
    <div className="stage-list">
      <p className={`stage-verdict ${model.subject.verdict}`}>
        <strong>{verdictSentence(model.subject)}</strong>
      </p>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Stage as a list">
        <table className="report-table">
          <caption className="sr-only">Every available instance before this step, and what the step requires</caption>
          <thead>
            <tr>
              <th scope="col">Instance</th>
              <th scope="col">Role</th>
              <th scope="col">Zone</th>
              <th scope="col">Holder</th>
            </tr>
          </thead>
          <tbody>
            {model.entries.length === 0 && (
              <tr><td colSpan={4}>No instance is available before this step.</td></tr>
            )}
            {model.entries.map((e, idx) => (
              <tr key={`${e.propId}-${e.type}-${idx}`}>
                <td>{e.label}</td>
                <td>
                  {ROLE_TEXT[e.type]}
                  {e.pairNote && <div className="prop-pair-note">{e.pairNote}</div>}
                </td>
                <td>{e.zoneName}</td>
                <td>{e.holderName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
