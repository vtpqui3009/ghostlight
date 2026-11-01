import type { Scenario, Action, ActionKind } from '../domain/types';
import { addAction, updateAction, type EditResult } from '../domain/edit';
import { isValidId } from '../domain/ids';
import { LIMITS } from '../domain/schema';

/** Encoded select value format to distinguish: no selection, null/resting, or actual holder/zone ID */
export const SENTINEL_UNSELECTED = '__UNSELECTED__';
export const SENTINEL_RESTING = '__RESTING_NULL__';

export function encodeHolderId(id: string | null | undefined): string {
  if (id === undefined || id === '') return SENTINEL_UNSELECTED;
  if (id === null) return SENTINEL_RESTING;
  return id;
}

export function decodeHolderId(encoded: string): string | null | undefined {
  if (encoded === SENTINEL_UNSELECTED) return undefined;
  if (encoded === SENTINEL_RESTING) return null;
  return encoded;
}

export interface ActionFormData {
  id: string;
  propId: string;
  kind: ActionKind;
  sourceNull: boolean;
  sourceZoneId: string;
  sourceHolderId: string; // encoded
  destOmitted: boolean;
  destZoneId: string;
  destHolderId: string; // encoded
  noteOmitted: boolean;
  note: string;
}

export interface FormErrors {
  id?: string;
  propId?: string;
  kind?: string;
  requiredSource?: string;
  destination?: string;
  note?: string;
  byteLimit?: string;
}

export function validateActionForm(
  data: ActionFormData,
  scenario: Scenario,
  _cueId: string,
  isEditing: boolean
): FormErrors {
  const errors: FormErrors = {};
  
  // ID validation
  if (!data.id.trim()) {
    errors.id = 'Action ID is required';
  } else if (!isValidId(data.id)) {
    errors.id = 'Use a unique identifier with letters, numbers, hyphens or underscores (max 64)';
  } else if (!isEditing) {
    // Check for duplicate action ID across all cues
    for (const c of scenario.cues) {
      if (c.actions.some(a => a.id === data.id)) {
        errors.id = `Action ID '${data.id}' already exists in cue '${c.id}'`;
        break;
      }
    }
  }
  
  // Prop validation
  if (!data.propId) {
    errors.propId = 'Select a physical prop';
  } else if (!scenario.props.some(p => p.id === data.propId)) {
    errors.propId = 'Physical prop instance does not exist';
  }
  
  // Source validation
  if (data.sourceNull && data.kind !== 'replenish') {
    errors.requiredSource = `${data.kind} requires a source position (only replenish uses null source)`;
  } else if (!data.sourceNull) {
    if (data.kind === 'replenish') {
      errors.requiredSource = 'replenish must use null source';
    } else {
      if (!data.sourceZoneId) {
        errors.requiredSource = 'Choose a source zone';
      } else if (!scenario.zones.some(z => z.id === data.sourceZoneId)) {
        errors.requiredSource = 'Source zone does not exist';
      }
      
      const decodedSourceHolder = decodeHolderId(data.sourceHolderId);
      if (decodedSourceHolder === undefined) {
        errors.requiredSource = 'Choose an explicit source holder (or "No holder (resting)")';
      } else if (decodedSourceHolder !== null && !scenario.holders.some(h => h.id === decodedSourceHolder)) {
        errors.requiredSource = 'Source holder does not exist';
      }
      
      // Kind-specific holder requirements
      if (data.kind === 'place' && decodedSourceHolder === null) {
        errors.requiredSource = 'place requires a holder source (cannot place from resting)';
      }
      if (data.kind === 'collect' && decodedSourceHolder !== null) {
        errors.requiredSource = 'collect requires resting source (use transfer for holder→holder)';
      }
      if ((data.kind === 'transfer' || data.kind === 'carryOff') && decodedSourceHolder === null) {
        errors.requiredSource = `${data.kind} requires a holder source (cannot transfer/carry from resting)`;
      }
    }
  }
  
  // Destination validation
  if (data.kind === 'consume') {
    if (!data.destOmitted) {
      errors.destination = 'consume must omit destination';
    }
  } else {
    // All non-consume kinds require destination
    if (data.destOmitted) {
      errors.destination = `${data.kind} requires destination`;
    }
  }
  
  if (!data.destOmitted) {
    if (!data.destZoneId) {
      errors.destination = 'Choose a destination zone';
    } else if (!scenario.zones.some(z => z.id === data.destZoneId)) {
      errors.destination = 'Destination zone does not exist';
    }
    
    const decodedDestHolder = decodeHolderId(data.destHolderId);
    if (decodedDestHolder === undefined) {
      errors.destination = 'Choose an explicit destination holder (or "No holder (resting)")';
    } else if (decodedDestHolder !== null && !scenario.holders.some(h => h.id === decodedDestHolder)) {
      errors.destination = 'Destination holder does not exist';
    }
    
    // Kind-specific destination requirements
    if (data.kind === 'place' && decodedDestHolder !== null) {
      errors.destination = 'place requires resting destination (holder→none transition)';
    }
    if (data.kind === 'collect' && decodedDestHolder === null) {
      errors.destination = 'collect requires holder destination (none→holder transition)';
    }
    if (data.kind === 'transfer') {
      if (decodedDestHolder === null) {
        errors.destination = 'transfer requires holder destination (use place for holder→none)';
      } else {
        const decodedSourceHolder = decodeHolderId(data.sourceHolderId);
        if (decodedSourceHolder === decodedDestHolder) {
          errors.destination = 'transfer requires different holder (cannot transfer to same holder)';
        }
      }
    }
    if (data.kind === 'carryOff') {
      const decodedSourceHolder = decodeHolderId(data.sourceHolderId);
      if (decodedDestHolder !== decodedSourceHolder) {
        errors.destination = 'carryOff requires same holder as source (holder retains custody)';
      }
      if (!data.sourceNull && data.sourceZoneId === data.destZoneId) {
        errors.destination = 'carryOff requires zone change (use transfer for same-zone handoff)';
      }
    }
  }
  
  // Note validation
  if (!data.noteOmitted && data.note.length > 500) {
    errors.note = 'Use at most 500 characters';
  }
  
  return errors;
}

export function serializeAction(data: ActionFormData): Action {
  const action: Action = {
    id: data.id,
    propId: data.propId,
    kind: data.kind,
    requiredSource: data.sourceNull ? null : {
      zoneId: data.sourceZoneId,
      holderId: decodeHolderId(data.sourceHolderId) as string | null,
    },
  };
  
  if (!data.destOmitted) {
    action.destination = {
      zoneId: data.destZoneId,
      holderId: decodeHolderId(data.destHolderId) as string | null,
    };
  }
  
  if (!data.noteOmitted) {
    action.note = data.note;
  }
  
  return action;
}

export function applyActionUpdate(
  scenario: Scenario,
  cueId: string,
  data: ActionFormData,
  existingActionId?: string
): EditResult<Scenario> {
  const action = serializeAction(data);
  
  if (existingActionId) {
    // For update, use explicit undefined to signal clearing
    return updateAction(scenario, cueId, existingActionId, {
      propId: action.propId,
      kind: action.kind,
      requiredSource: action.requiredSource,
      destination: Object.prototype.hasOwnProperty.call(action, 'destination') ? action.destination : undefined,
      note: Object.prototype.hasOwnProperty.call(action, 'note') ? action.note : undefined,
    });
  } else {
    return addAction(scenario, cueId, action);
  }
}

export function checkByteLimit(scenario: Scenario): { ok: true } | { ok: false; error: string } {
  // Match actual store/export pretty-printed format
  const json = JSON.stringify(scenario, null, 2);
  const bytes = new TextEncoder().encode(json).length;
  
  if (bytes > LIMITS.jsonBytes) {
    return { 
      ok: false, 
      error: `Scene too large: ${bytes} bytes exceeds ${LIMITS.jsonBytes} byte limit. Remove actions or simplify data.` 
    };
  }
  
  return { ok: true };
}

export function getKindGuidance(kind: ActionKind): string {
  switch (kind) {
    case 'place': return 'holder → none (put down)';
    case 'collect': return 'none → holder (pick up)';
    case 'transfer': return 'holder → different holder (handoff)';
    case 'carryOff': return 'holder → same holder, zone changes (relocate)';
    case 'consume': return 'available → consumed (terminal, no destination)';
    case 'replenish': return 'absent → available (null source required)';
  }
}
