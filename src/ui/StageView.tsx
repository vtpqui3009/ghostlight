import { useState } from 'react';
import { runScenario } from '../domain/engine';
import { applyFix, isGuidedFix, suggestFix } from '../domain/guidedFix';
import type { Action, Scenario, Frame, RunResult } from '../domain/types';

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

  const { action, before, issues } = selectedFrame;
  const prop = scenario.props.find(p => p.id === action.propId);
  const requiredSource = action.requiredSource;
  const plannedState = before[action.propId];

  // Group props by zone for display
  type PropDisplay = {
    propId: string;
    propName: string;
    type: 'required' | 'planned' | 'match' | 'mismatch' | 'other';
    holderId: string | null;
    label: string;
  };

  const zoneProps = new Map<string, PropDisplay[]>();

  // Add current action's required position
  if (requiredSource && requiredSource.zoneId) {
    const zone = requiredSource.zoneId;
    if (!zoneProps.has(zone)) zoneProps.set(zone, []);
    
    const display: PropDisplay = {
      propId: action.propId,
      propName: prop?.name || action.propId,
      type: 'required',
      holderId: requiredSource.holderId,
      label: `REQUIRED: ${prop?.name || action.propId} (${action.propId})`,
    };

    // Check if it matches planned
    if (plannedState.status === 'available') {
      const match = plannedState.zoneId === requiredSource.zoneId && plannedState.holderId === requiredSource.holderId;
      display.type = match ? 'match' : 'mismatch';
      display.label = match 
        ? `MATCH: ${prop?.name || action.propId} (${action.propId})` 
        : `MISMATCH: ${prop?.name || action.propId} (${action.propId})`;
    }

    zoneProps.get(zone)!.push(display);
  }

  // Add planned position if different from required
  if (plannedState.status === 'available') {
    const zone = plannedState.zoneId;
    const alreadyShown = requiredSource 
      && requiredSource.zoneId === zone 
      && requiredSource.holderId === plannedState.holderId;
    
    if (!alreadyShown) {
      if (!zoneProps.has(zone)) zoneProps.set(zone, []);
      zoneProps.get(zone)!.push({
        propId: action.propId,
        propName: prop?.name || action.propId,
        type: 'planned',
        holderId: plannedState.holderId,
        label: `BEFORE: ${prop?.name || action.propId} (${action.propId})`,
      });
    }
  }

  // Add other props in their before positions
  Object.entries(before).forEach(([id, state]) => {
    if (id === action.propId) return;
    if (state.status !== 'available') return;
    
    const zone = state.zoneId;
    if (!zoneProps.has(zone)) zoneProps.set(zone, []);
    
    const p = scenario.props.find(pr => pr.id === id);
    zoneProps.get(zone)!.push({
      propId: id,
      propName: p?.name || id,
      type: 'other',
      holderId: state.holderId,
      label: `${p?.name || id} (${id})`,
    });
  });

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

      <div className="stage-zones">
        {scenario.zones.map(zone => {
          const props = zoneProps.get(zone.id) || [];
          
          return (
            <div key={zone.id} className="zone-card">
              <h3 className="zone-title">{zone.name}</h3>
              
              {props.length === 0 && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', fontStyle: 'italic' }}>Empty</p>
              )}
              
              {props.map((p, idx) => {
                const holderName = p.holderId ? scenario.holders.find(h => h.id === p.holderId)?.name || p.holderId : 'resting';
                
                return (
                  <div key={`${p.propId}-${idx}`} className={`prop-glyph ${p.type}`}>
                    <div className="prop-id">{p.label}</div>
                    <div className="prop-position">
                      Zone: {zone.name} / {holderName}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {plannedState.status !== 'available' && (
        <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
          <strong>Non-available state:</strong> {action.propId} is currently <strong>{plannedState.status}</strong>.
        </div>
      )}
    </div>
  );
}
