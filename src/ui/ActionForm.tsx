import { useState } from 'react';
import type { Scenario, Action, ActionKind } from '../domain/types';
import { ACTION_KINDS } from '../domain/types';
import { LIMITS } from '../domain/schema';
import {
  type ActionFormData,
  type FormErrors,
  SENTINEL_UNSELECTED,
  SENTINEL_RESTING,
  encodeHolderId,
  validateActionForm,
  applyActionUpdate,
  checkByteLimit,
  getKindGuidance,
} from './actionFormHelpers';

interface ActionFormProps {
  scenario: Scenario;
  cueId: string;
  existingAction?: Action;
  onSave: (scenario: Scenario) => void;
  onCancel: () => void;
}

export function ActionForm({ scenario, cueId, existingAction, onSave, onCancel }: ActionFormProps) {
  const isEditing = !!existingAction;
  
  // Initialize form state from existing action, preserving all authored values
  const [formData, setFormData] = useState<ActionFormData>(() => ({
    id: existingAction?.id || '',
    propId: existingAction?.propId || '',
    kind: existingAction?.kind || 'collect',
    sourceNull: !existingAction?.requiredSource,
    sourceZoneId: existingAction?.requiredSource?.zoneId || '',
    sourceHolderId: encodeHolderId(existingAction?.requiredSource?.holderId),
    destOmitted: !existingAction?.destination,
    destZoneId: existingAction?.destination?.zoneId || '',
    destHolderId: encodeHolderId(existingAction?.destination?.holderId),
    noteOmitted: existingAction?.note === undefined,
    note: existingAction?.note || '',
  }));
  
  const [errors, setErrors] = useState<FormErrors>({});

  const handleKindChange = (newKind: ActionKind) => {
    // Apply kind guidance when user explicitly changes kind
    const updates: Partial<ActionFormData> = { kind: newKind };
    
    if (newKind === 'consume') {
      updates.destOmitted = true;
    } else if (newKind === 'replenish') {
      updates.sourceNull = true;
    }
    
    setFormData({ ...formData, ...updates });
  };

  const handleSave = () => {
    const validationErrors = validateActionForm(formData, scenario, cueId, isEditing);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return; // Keep draft, show errors
    }
    
    // Apply the action update
    const result = applyActionUpdate(scenario, cueId, formData, existingAction?.id);
    
    if (result.blocked) {
      setErrors({ id: result.reason });
      return; // Keep draft
    }
    
    // Check byte limit on the normalized result
    const byteLimitCheck = checkByteLimit(result.result);
    if (!byteLimitCheck.ok) {
      setErrors({ byteLimit: byteLimitCheck.error });
      return; // Keep draft
    }
    
    // Success
    onSave(result.result);
  };

  const cue = scenario.cues.find(c => c.id === cueId);
  const actionCount = cue?.actions.length || 0;
  const atLimit = !isEditing && actionCount >= LIMITS.actionsPerCue;

  return (
    <div className="action-form" role="form" aria-label={isEditing ? 'Edit action' : 'Add action'}>
      <h3 className="form-title">{isEditing ? 'Edit Action' : 'Add Action'} in {cue?.title || cueId}</h3>
      
      {atLimit && (
        <div className="alert alert-warning" role="alert">
          Warning: This cue has reached the limit of {LIMITS.actionsPerCue} actions.
        </div>
      )}
      
      {errors.byteLimit && (
        <div className="alert alert-error" role="alert">{errors.byteLimit}</div>
      )}
      
      <div className="form-group">
        <label htmlFor="action-id">
          Action ID {isEditing && <span className="text-muted">(read-only)</span>}
        </label>
        <input
          id="action-id"
          type="text"
          value={formData.id}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          disabled={isEditing}
          aria-invalid={!!errors.id}
          aria-describedby={errors.id ? 'action-id-error' : undefined}
        />
        {errors.id && <div id="action-id-error" className="field-error" role="alert">{errors.id}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="action-prop">Physical Prop</label>
        <select
          id="action-prop"
          value={formData.propId}
          onChange={(e) => setFormData({ ...formData, propId: e.target.value })}
          aria-invalid={!!errors.propId}
          aria-describedby={errors.propId ? 'action-prop-error' : undefined}
        >
          <option value="">Select a prop...</option>
          {scenario.props.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.id})
            </option>
          ))}
        </select>
        {errors.propId && <div id="action-prop-error" className="field-error" role="alert">{errors.propId}</div>}
        {scenario.props.length === 0 && <div className="field-hint">No props yet. Add props first.</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="action-kind">Action Kind</label>
        <select
          id="action-kind"
          value={formData.kind}
          onChange={(e) => handleKindChange(e.target.value as ActionKind)}
          aria-invalid={!!errors.kind}
          aria-describedby="action-kind-hint"
        >
          {ACTION_KINDS.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <div id="action-kind-hint" className="field-hint">{getKindGuidance(formData.kind)}</div>
      </div>
      
      {/* Required Source */}
      <fieldset className="form-fieldset">
        <legend>Required Source Position</legend>
        
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData.sourceNull}
              onChange={(e) => setFormData({ ...formData, sourceNull: e.target.checked })}
              aria-invalid={!!errors.requiredSource}
              aria-describedby={errors.requiredSource ? 'source-error' : 'source-null-hint'}
            />
            <span id="source-null-hint">No source (null) — only for replenish</span>
          </label>
        </div>
        
        {!formData.sourceNull && (
          <>
            <div className="form-group">
              <label htmlFor="source-zone">Source Zone</label>
              <select
                id="source-zone"
                value={formData.sourceZoneId}
                onChange={(e) => setFormData({ ...formData, sourceZoneId: e.target.value })}
                aria-invalid={!!errors.requiredSource}
                aria-describedby={errors.requiredSource ? 'source-error' : undefined}
              >
                <option value="">Select zone...</option>
                {scenario.zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name} ({z.id})</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="source-holder">Source Holder</label>
              <select
                id="source-holder"
                value={formData.sourceHolderId}
                onChange={(e) => setFormData({ ...formData, sourceHolderId: e.target.value })}
                aria-invalid={!!errors.requiredSource}
                aria-describedby={errors.requiredSource ? 'source-error' : undefined}
              >
                <option value={SENTINEL_UNSELECTED}>Select holder...</option>
                <option value={SENTINEL_RESTING}>No holder (resting)</option>
                {scenario.holders.map(h => (
                  <option key={h.id} value={h.id}>{h.name} ({h.id})</option>
                ))}
              </select>
            </div>
          </>
        )}
        
        {errors.requiredSource && (
          <div id="source-error" className="field-error" role="alert">{errors.requiredSource}</div>
        )}
      </fieldset>
      
      {/* Destination */}
      <fieldset className="form-fieldset">
        <legend>Destination Position</legend>
        
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData.destOmitted}
              onChange={(e) => setFormData({ ...formData, destOmitted: e.target.checked })}
              aria-invalid={!!errors.destination}
              aria-describedby={errors.destination ? 'dest-error' : 'dest-omit-hint'}
            />
            <span id="dest-omit-hint">Omit destination — consume must omit; all others require destination</span>
          </label>
        </div>
        
        {!formData.destOmitted && (
          <>
            <div className="form-group">
              <label htmlFor="dest-zone">Destination Zone</label>
              <select
                id="dest-zone"
                value={formData.destZoneId}
                onChange={(e) => setFormData({ ...formData, destZoneId: e.target.value })}
                aria-invalid={!!errors.destination}
                aria-describedby={errors.destination ? 'dest-error' : undefined}
              >
                <option value="">Select zone...</option>
                {scenario.zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name} ({z.id})</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="dest-holder">Destination Holder</label>
              <select
                id="dest-holder"
                value={formData.destHolderId}
                onChange={(e) => setFormData({ ...formData, destHolderId: e.target.value })}
                aria-invalid={!!errors.destination}
                aria-describedby={errors.destination ? 'dest-error' : 'dest-hint'}
              >
                <option value={SENTINEL_UNSELECTED}>Select holder...</option>
                <option value={SENTINEL_RESTING}>No holder (resting)</option>
                {scenario.holders.map(h => (
                  <option key={h.id} value={h.id}>{h.name} ({h.id})</option>
                ))}
              </select>
              {formData.kind === 'carryOff' && (
                <div id="dest-hint" className="field-hint">carryOff retains the source holder</div>
              )}
            </div>
          </>
        )}
        
        {errors.destination && (
          <div id="dest-error" className="field-error" role="alert">{errors.destination}</div>
        )}
      </fieldset>
      
      {/* Note */}
      <fieldset className="form-fieldset">
        <legend>Note (Optional)</legend>
        
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData.noteOmitted}
              onChange={(e) => setFormData({ ...formData, noteOmitted: e.target.checked })}
              aria-invalid={!!errors.note}
              aria-describedby={errors.note ? 'action-note-error' : 'note-omit-hint'}
            />
            <span id="note-omit-hint">Omit note field</span>
          </label>
        </div>
        
        {!formData.noteOmitted && (
          <div className="form-group">
            <label htmlFor="action-note">Note</label>
            <textarea
              id="action-note"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              maxLength={500}
              aria-invalid={!!errors.note}
              aria-describedby={errors.note ? 'action-note-error' : 'action-note-hint'}
            />
            <div id="action-note-hint" className="field-hint">{formData.note.length}/500 characters</div>
            {errors.note && <div id="action-note-error" className="field-error" role="alert">{errors.note}</div>}
          </div>
        )}
      </fieldset>
      
      <div className="form-actions">
        <button type="button" onClick={handleSave} disabled={atLimit}>
          Save
        </button>
        <button type="button" onClick={onCancel} className="secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
