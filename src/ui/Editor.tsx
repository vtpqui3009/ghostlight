import { useState } from 'react';
import type { Scenario, RunResult, Action } from '../domain/types';
import { addProp, addZone, addHolder, addCue, deleteProp, deleteZone, deleteHolder, deleteCue, deleteAction, moveCue, moveAction } from '../domain/edit';
import { ActionForm } from './ActionForm';
import { useEffect } from 'react';

interface EditorProps {
  scenario: Scenario;
  onUpdate: (scenario: Scenario) => void;
  runResult: RunResult;
  onDraftChange?: (hasDraft: boolean) => void;
}

type EditMode = 'scene' | 'zones' | 'holders' | 'props' | 'cues';

type ActionDraft = {
  cueId: string;
  action?: Action;
};

export function Editor({ scenario, onUpdate, runResult, onDraftChange }: EditorProps) {
  const [mode, setMode] = useState<EditMode>('cues');
  const [error, setError] = useState<string | null>(null);
  const [actionDraft, setActionDraft] = useState<ActionDraft | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ cueId: string; actionId: string } | null>(null);

  useEffect(() => {
    onDraftChange?.(!!actionDraft);
  }, [actionDraft, onDraftChange]);

  const handleError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const handleUpdateScene = (updates: Partial<Scenario>) => {
    onUpdate({ ...scenario, ...updates });
  };

  const handleAddZone = () => {
    const id = prompt('Zone ID (e.g., "backstage"):');
    if (!id) return;
    const name = prompt('Zone name:');
    if (!name) return;
    const result = addZone(scenario, id, name);
    if (result.blocked) {
      handleError(result.reason);
    } else {
      onUpdate(result.result);
    }
  };

  const handleAddHolder = () => {
    const id = prompt('Holder ID (e.g., "actor-1"):');
    if (!id) return;
    const name = prompt('Holder name:');
    if (!name) return;
    const result = addHolder(scenario, id, name);
    if (result.blocked) {
      handleError(result.reason);
    } else {
      onUpdate(result.result);
    }
  };

  const handleAddProp = () => {
    const id = prompt('Prop ID (e.g., "letter-A"):');
    if (!id) return;
    const name = prompt('Prop name:');
    if (!name) return;
    const kind = prompt('Prop kind:');
    if (!kind) return;
    const status = prompt('Initial status (available/unknown/absent):') as 'available' | 'unknown' | 'absent';
    if (!['available', 'unknown', 'absent'].includes(status)) {
      handleError('Invalid status');
      return;
    }
    const result = addProp(scenario, id, name, kind, status);
    if (result.blocked) {
      handleError(result.reason);
    } else {
      onUpdate(result.result);
    }
  };

  const handleAddCue = () => {
    const id = prompt('Cue ID (e.g., "cue-1"):');
    if (!id) return;
    const title = prompt('Cue title:');
    if (!title) return;
    const result = addCue(scenario, id, title);
    if (result.blocked) {
      handleError(result.reason);
    } else {
      onUpdate(result.result);
    }
  };

  const handleDeleteZone = (id: string) => {
    if (!confirm(`Delete zone ${id}?`)) return;
    const result = deleteZone(scenario, id);
    if (result.blocked) {
      handleError(result.reason + (result.references.length > 0 ? ` References: ${result.references[0].refs.map(r => r.context).join(', ')}` : ''));
    } else {
      onUpdate(result.result);
    }
  };

  const handleDeleteHolder = (id: string) => {
    if (!confirm(`Delete holder ${id}?`)) return;
    const result = deleteHolder(scenario, id);
    if (result.blocked) {
      handleError(result.reason + (result.references.length > 0 ? ` References: ${result.references[0].refs.map(r => r.context).join(', ')}` : ''));
    } else {
      onUpdate(result.result);
    }
  };

  const handleDeleteProp = (id: string) => {
    if (!confirm(`Delete prop ${id}?`)) return;
    const result = deleteProp(scenario, id);
    if (result.blocked) {
      handleError(result.reason + (result.references.length > 0 ? ` References: ${result.references[0].refs.map(r => r.context).join(', ')}` : ''));
    } else {
      onUpdate(result.result);
    }
  };

  const handleDeleteCue = (id: string) => {
    if (actionDraft && actionDraft.cueId === id) {
      handleError('Save or Cancel the current action draft before deleting this cue.');
      return;
    }
    if (!confirm(`Delete cue ${id} and all its actions?`)) return;
    const result = deleteCue(scenario, id);
    if (result.blocked) {
      handleError(result.reason);
    } else {
      onUpdate(result.result);
    }
  };

  const handleAddAction = (cueId: string) => {
    if (actionDraft) return; // Block - user must Save or Cancel current draft
    setActionDraft({ cueId });
  };

  const handleEditAction = (cueId: string, action: Action) => {
    if (actionDraft) return; // Block - user must Save or Cancel current draft
    setActionDraft({ cueId, action });
  };

  const handleDeleteAction = (cueId: string, actionId: string) => {
    if (actionDraft && actionDraft.cueId === cueId && actionDraft.action?.id === actionId) {
      return; // Cannot delete action being edited
    }
    setDeleteConfirm({ cueId, actionId });
  };

  const confirmDeleteAction = () => {
    if (!deleteConfirm) return;
    const result = deleteAction(scenario, deleteConfirm.cueId, deleteConfirm.actionId);
    if (result.blocked) {
      handleError(result.reason);
    } else {
      onUpdate(result.result);
    }
    setDeleteConfirm(null);
  };

  const cancelDeleteAction = () => {
    setDeleteConfirm(null);
  };

  const handleSaveAction = (updated: Scenario) => {
    onUpdate(updated);
    setActionDraft(null);
  };

  const handleCancelAction = () => {
    setActionDraft(null);
  };

  return (
    <div className="card">
      <h2 className="panel-header">Editor</h2>

      {error && (
        <div className="alert alert-error" role="alert">{error}</div>
      )}

      {actionDraft && (
        <div className="action-draft-notice">
          <p><strong>Active Draft:</strong> Save or Cancel the current action before starting another.</p>
        </div>
      )}

      {actionDraft && (
        <ActionForm
          scenario={scenario}
          cueId={actionDraft.cueId}
          existingAction={actionDraft.action}
          onSave={handleSaveAction}
          onCancel={handleCancelAction}
        />
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => setMode('scene')} className={mode === 'scene' ? 'secondary' : 'small'}>Scene</button>
        <button onClick={() => setMode('zones')} className={mode === 'zones' ? 'secondary' : 'small'}>Zones</button>
        <button onClick={() => setMode('holders')} className={mode === 'holders' ? 'secondary' : 'small'}>Holders</button>
        <button onClick={() => setMode('props')} className={mode === 'props' ? 'secondary' : 'small'}>Props</button>
        <button onClick={() => setMode('cues')} className={mode === 'cues' ? 'secondary' : 'small'}>Cues</button>
      </div>

      {mode === 'scene' && (
        <div>
          <div className="form-group">
            <label htmlFor="scene-title">Scene Title</label>
            <input
              id="scene-title"
              type="text"
              value={scenario.title}
              onChange={(e) => handleUpdateScene({ title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="scene-description">Description (optional)</label>
            <textarea
              id="scene-description"
              value={scenario.description || ''}
              onChange={(e) => handleUpdateScene({ description: e.target.value })}
            />
          </div>
        </div>
      )}

      {mode === 'zones' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Zones ({scenario.zones.length})</h3>
            <button onClick={handleAddZone} className="small">Add Zone</button>
          </div>
          {scenario.zones.map(zone => (
            <div key={zone.id} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{zone.name}</strong>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-mid)' }}>ID: {zone.id}</div>
                </div>
                <button onClick={() => handleDeleteZone(zone.id)} className="small">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'holders' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Holders ({scenario.holders.length})</h3>
            <button onClick={handleAddHolder} className="small">Add Holder</button>
          </div>
          {scenario.holders.map(holder => (
            <div key={holder.id} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{holder.name}</strong>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-mid)' }}>ID: {holder.id}</div>
                </div>
                <button onClick={() => handleDeleteHolder(holder.id)} className="small">Delete</button>
              </div>
            </div>
          ))}
          {scenario.holders.length === 0 && (
            <p style={{ color: 'var(--text-mid)', fontStyle: 'italic' }}>No holders yet. Add holders who can carry props.</p>
          )}
        </div>
      )}

      {mode === 'props' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Props ({scenario.props.length})</h3>
            <button onClick={handleAddProp} className="small">Add Prop</button>
          </div>
          {scenario.props.map(prop => (
            <div key={prop.id} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <strong>{prop.name}</strong> ({prop.kind})
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-mid)' }}>
                    ID: {prop.id}
                  </div>
                  <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Initial: <strong>{prop.initial.status}</strong>
                    {prop.initial.status === 'available' && ` at ${prop.initial.zoneId}${prop.initial.holderId ? ` / ${prop.initial.holderId}` : ' (resting)'}`}
                  </div>
                </div>
                <button onClick={() => handleDeleteProp(prop.id)} className="small">Delete</button>
              </div>
            </div>
          ))}
          {scenario.props.length === 0 && (
            <p style={{ color: 'var(--text-mid)', fontStyle: 'italic' }}>No props yet. Add physical prop instances.</p>
          )}
        </div>
      )}

      {mode === 'cues' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Cues ({scenario.cues.length})</h3>
            <button onClick={handleAddCue} className="small">Add Cue</button>
          </div>
          {scenario.cues.map((cue, cueIndex) => {
            const cueFrames = runResult.frames.filter(f => f.cueId === cue.id);
            const hasIssues = cueFrames.some(f => f.issues.length > 0);
            
            return (
              <div key={cue.id} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px', marginBottom: '0.75rem', background: hasIssues ? '#fef4e6' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <strong>{cue.title}</strong>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-mid)' }}>
                      ID: {cue.id} • {cue.actions.length} actions
                      {hasIssues && <span style={{ color: 'var(--error)', marginLeft: '0.5rem' }}>⚠ Has issues</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {cueIndex > 0 && (
                      <button onClick={() => {
                        const result = moveCue(scenario, cue.id, cueIndex - 1);
                        if (!result.blocked) onUpdate(result.result);
                        else handleError(result.reason);
                      }} className="icon-btn small" aria-label="Move cue up">↑</button>
                    )}
                    {cueIndex < scenario.cues.length - 1 && (
                      <button onClick={() => {
                        const result = moveCue(scenario, cue.id, cueIndex + 1);
                        if (!result.blocked) onUpdate(result.result);
                        else handleError(result.reason);
                      }} className="icon-btn small" aria-label="Move cue down">↓</button>
                    )}
                    <button onClick={() => handleDeleteCue(cue.id)} className="small">Delete</button>
                  </div>
                </div>
                
                <div style={{ marginTop: '0.5rem' }}>
                  <button onClick={() => handleAddAction(cue.id)} className="small">Add Action</button>
                </div>

                {cue.actions.map((action, actionIndex) => {
                  const frame = cueFrames.find(f => f.actionId === action.id);
                  const prop = scenario.props.find(p => p.id === action.propId);
                  const isDeleting = deleteConfirm?.cueId === cue.id && deleteConfirm?.actionId === action.id;
                  
                  return (
                    <div key={action.id} style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '3px', marginTop: '0.5rem', background: 'var(--parchment)' }}>
                      {isDeleting ? (
                        <div className="delete-confirm">
                          <p><strong>Delete action {action.id}?</strong></p>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button onClick={confirmDeleteAction} className="small">Confirm Delete</button>
                            <button onClick={cancelDeleteAction} className="small secondary">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ fontSize: '0.875rem', flex: 1 }}>
                            <strong>{action.kind}</strong> {prop?.name || action.propId} ({action.propId})
                            {frame && frame.issues.length > 0 && (
                              <div style={{ color: 'var(--error)', marginTop: '0.25rem' }}>
                                ⚠ {frame.issues[0].message}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                            {actionIndex > 0 && (
                              <button onClick={() => {
                                const result = moveAction(scenario, cue.id, action.id, actionIndex - 1);
                                if (!result.blocked) onUpdate(result.result);
                                else handleError(result.reason);
                              }} className="icon-btn small" aria-label="Move action up">↑</button>
                            )}
                            {actionIndex < cue.actions.length - 1 && (
                              <button onClick={() => {
                                const result = moveAction(scenario, cue.id, action.id, actionIndex + 1);
                                if (!result.blocked) onUpdate(result.result);
                                else handleError(result.reason);
                              }} className="icon-btn small" aria-label="Move action down">↓</button>
                            )}
                            <button onClick={() => handleEditAction(cue.id, action)} className="small">Edit</button>
                            <button onClick={() => handleDeleteAction(cue.id, action.id)} className="small">Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {scenario.cues.length === 0 && (
            <p style={{ color: 'var(--text-mid)', fontStyle: 'italic' }}>No cues yet. Add cues to organize actions.</p>
          )}
        </div>
      )}
    </div>
  );
}
