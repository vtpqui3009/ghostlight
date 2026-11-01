import type { Scenario, Frame, RunResult } from '../domain/types';

interface StageViewProps {
  scenario: Scenario;
  selectedFrame: Frame | null;
  onSelectFrame: (index: number | null) => void;
  runResult: RunResult;
}

export function StageView({ scenario, selectedFrame }: StageViewProps) {
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

  return (
    <div className="card">
      <h2 className="panel-header">Stage View — {selectedFrame.cueId}</h2>
      
      {issue && (
        <div className={`alert ${issue.severity === 'error' ? 'alert-error' : 'alert-warning'}`}>
          <strong>{issue.severity === 'error' ? 'Error' : 'Uncertain'}:</strong> {issue.message}
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
            <em>Suggestion:</em> {issue.suggestion}
          </div>
          {issue.cause && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
              <em>Cause:</em> {issue.cause.kind === 'initial' 
                ? `Initial state of ${issue.cause.propId}` 
                : `Earlier action ${issue.cause.ref.actionId} in cue ${issue.cause.ref.cueId}`}
            </div>
          )}
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
