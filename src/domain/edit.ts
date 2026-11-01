import type { Scenario, Prop, Zone, Holder, Cue, Action } from './types';
import { parseScenario, LIMITS } from './schema';
import { isValidId, copyAction } from './ids';

// Helper to build consistent error results
function errorResult(reason: string, references: ReferenceInfo[] = []): EditResult<Scenario> {
  return { blocked: true, reason, references };
}

// Helper to convert parse result to edit result
function parseResultToEditResult(parseResult: { success: true; data: Scenario } | { success: false; errors: string[] }): EditResult<Scenario> {
  if (parseResult.success) {
    return { blocked: false, result: parseResult.data };
  }
  return errorResult(parseResult.errors.join('; '), []);
}

// Deep clone and normalize scenario
function cloneAndNormalize(scenario: Scenario): Scenario {
  return JSON.parse(JSON.stringify(scenario)) as Scenario;
}

// Reference checking helpers
function findPropReferences(propId: string, scenario: Scenario): ReferenceEntry[] {
  const refs: ReferenceEntry[] = [];
  for (const cue of scenario.cues) {
    for (const action of cue.actions) {
      // Only matching action.propId references count
      if (action.propId === propId) {
        refs.push({ context: `action '${action.id}' in cue '${cue.id}'`, field: 'propId' });
      }
    }
  }
  return refs;
}

function findZoneReferences(zoneId: string, scenario: Scenario): ReferenceEntry[] {
  const refs: ReferenceEntry[] = [];
  for (const prop of scenario.props) {
    if (prop.initial.zoneId === zoneId) {
      refs.push({ context: `prop '${prop.id}' initial state`, field: 'zoneId' });
    }
  }
  for (const cue of scenario.cues) {
    for (const action of cue.actions) {
      if (action.requiredSource && action.requiredSource.zoneId === zoneId) {
        refs.push({ context: `action '${action.id}' in cue '${cue.id}'`, field: 'requiredSource.zoneId' });
      }
      if (action.destination && action.destination.zoneId === zoneId) {
        refs.push({ context: `action '${action.id}' in cue '${cue.id}'`, field: 'destination.zoneId' });
      }
    }
  }
  return refs;
}

function findHolderReferences(holderId: string, scenario: Scenario): ReferenceEntry[] {
  const refs: ReferenceEntry[] = [];
  for (const prop of scenario.props) {
    if (prop.initial.holderId === holderId) {
      refs.push({ context: `prop '${prop.id}' initial state`, field: 'holderId' });
    }
  }
  for (const cue of scenario.cues) {
    for (const action of cue.actions) {
      if (action.requiredSource && action.requiredSource.holderId === holderId) {
        refs.push({ context: `action '${action.id}' in cue '${cue.id}'`, field: 'requiredSource.holderId' });
      }
      if (action.destination && action.destination.holderId === holderId) {
        refs.push({ context: `action '${action.id}' in cue '${cue.id}'`, field: 'destination.holderId' });
      }
    }
  }
  return refs;
}

function findCueReferences(): ReferenceEntry[] {
  // Cues have no internal references to check; the caller validates existence.
  return [];
}

export interface ReferenceEntry {
  context: string;
  field: string;
}

export interface ReferenceInfo {
  type: 'prop' | 'zone' | 'holder' | 'cue';
  id: string;
  name: string;
  refs: ReferenceEntry[];
}

export interface EditBlock {
  blocked: true;
  reason: string;
  references: ReferenceInfo[];
}

export interface EditSuccess<T> {
  blocked: false;
  result: T;
}

export type EditResult<T> = EditBlock | EditSuccess<T>;

export function checkBlockDeletion(entityType: 'prop' | 'zone' | 'holder' | 'cue', entityId: string, scenario: Scenario): EditBlock | null {
  const refs: ReferenceEntry[] = [];
  if (entityType === 'prop') {
    refs.push(...findPropReferences(entityId, scenario));
  } else if (entityType === 'zone') {
    refs.push(...findZoneReferences(entityId, scenario));
  } else if (entityType === 'holder') {
    refs.push(...findHolderReferences(entityId, scenario));
  } else if (entityType === 'cue') {
    refs.push(...findCueReferences());
  }
  if (refs.length > 0) {
    const name = entityType === 'prop' ? scenario.props.find(p => p.id === entityId)?.name || entityId :
                 entityType === 'zone' ? scenario.zones.find(z => z.id === entityId)?.name || entityId :
                 entityType === 'holder' ? scenario.holders.find(h => h.id === entityId)?.name || entityId :
                 scenario.cues.find(c => c.id === entityId)?.title || entityId;
    return { blocked: true, reason: `Cannot delete ${entityType} '${entityId}' - it is referenced by ${refs.length} location(s).`, references: [{ type: entityType, id: entityId, name, refs }] };
  }
  return null;
}

export function wouldLeaveNoZones(zoneId: string, scenario: Scenario): boolean {
  return scenario.zones.length === 1 && scenario.zones[0].id === zoneId;
}

export function retargetReferences(scenario: Scenario, entityType: 'prop' | 'zone' | 'holder', fromId: string, toId: string): EditResult<Scenario> {
  if (entityType === 'zone' && !scenario.zones.some(z => z.id === toId)) {
    return errorResult(`Target zone '${toId}' does not exist.`);
  }
  if (entityType === 'holder' && !scenario.holders.some(h => h.id === toId)) {
    return errorResult(`Target holder '${toId}' does not exist.`);
  }
  if (entityType === 'prop' && !scenario.props.some(p => p.id === toId)) {
    return errorResult(`Target prop '${toId}' does not exist.`);
  }
  const cloned = cloneAndNormalize(scenario);
  if (entityType === 'prop') {
    for (const cue of cloned.cues) {
      for (const action of cue.actions) {
        if (action.propId === fromId) {
          action.propId = toId;
        }
      }
    }
  } else if (entityType === 'zone') {
    for (const prop of cloned.props) {
      if (prop.initial.zoneId === fromId) {
        prop.initial.zoneId = toId;
      }
    }
    for (const cue of cloned.cues) {
      for (const action of cue.actions) {
        if (action.requiredSource && action.requiredSource.zoneId === fromId) {
          action.requiredSource.zoneId = toId;
        }
        if (action.destination && action.destination.zoneId === fromId) {
          action.destination.zoneId = toId;
        }
      }
    }
  } else if (entityType === 'holder') {
    for (const prop of cloned.props) {
      if (prop.initial.holderId === fromId) {
        prop.initial.holderId = toId;
      }
    }
    for (const cue of cloned.cues) {
      for (const action of cue.actions) {
        if (action.requiredSource && action.requiredSource.holderId === fromId) {
          action.requiredSource.holderId = toId;
        }
        if (action.destination && action.destination.holderId === fromId) {
          action.destination.holderId = toId;
        }
      }
    }
  }
  return parseResultToEditResult(parseScenario(cloned));
}

export function addProp(scenario: Scenario, id: string, name: string, kind: string, initialStatus: 'available' | 'unknown' | 'absent'): EditResult<Scenario> {
  if (!isValidId(id)) {
    return errorResult(`Invalid prop ID: '${id}'.`);
  }
  if (scenario.props.some(p => p.id === id)) {
    return errorResult(`Prop ID '${id}' already exists.`);
  }
  if (scenario.props.length >= LIMITS.props) {
    return errorResult(`Cannot add prop: limit of ${LIMITS.props} props reached.`);
  }
  const newProp: Prop = {
    id,
    name,
    kind,
    initial: initialStatus === 'available' ? { status: 'available', zoneId: scenario.zones[0].id, holderId: null } : { status: initialStatus },
  };
  const cloned = { ...scenario, props: [...scenario.props, newProp] };
  return parseResultToEditResult(parseScenario(cloned));
}

export function addZone(scenario: Scenario, id: string, name: string): EditResult<Scenario> {
  if (!isValidId(id)) {
    return errorResult(`Invalid zone ID: '${id}'.`);
  }
  if (!name || name.trim() === '') {
    return errorResult('Zone name cannot be empty.');
  }
  if (scenario.zones.some(z => z.id === id)) {
    return errorResult(`Zone ID '${id}' already exists.`);
  }
  if (scenario.zones.length >= LIMITS.zones) {
    return errorResult(`Cannot add zone: limit of ${LIMITS.zones} zones reached.`);
  }
  const newZone = { id, name };
  const cloned = { ...scenario, zones: [...scenario.zones, newZone] };
  return parseResultToEditResult(parseScenario(cloned));
}

export function addHolder(scenario: Scenario, id: string, name: string): EditResult<Scenario> {
  if (!isValidId(id)) {
    return errorResult(`Invalid holder ID: '${id}'.`);
  }
  if (!name || name.trim() === '') {
    return errorResult('Holder name cannot be empty.');
  }
  if (scenario.holders.some(h => h.id === id)) {
    return errorResult(`Holder ID '${id}' already exists.`);
  }
  if (scenario.holders.length >= LIMITS.holders) {
    return errorResult(`Cannot add holder: limit of ${LIMITS.holders} holders reached.`);
  }
  const newHolder = { id, name };
  const cloned = { ...scenario, holders: [...scenario.holders, newHolder] };
  return parseResultToEditResult(parseScenario(cloned));
}

export function addCue(scenario: Scenario, id: string, title: string): EditResult<Scenario> {
  if (!isValidId(id)) {
    return errorResult(`Invalid cue ID: '${id}'.`);
  }
  if (!title || title.trim() === '') {
    return errorResult('Cue title cannot be empty.');
  }
  if (scenario.cues.some(c => c.id === id)) {
    return errorResult(`Cue ID '${id}' already exists.`);
  }
  if (scenario.cues.length >= LIMITS.cues) {
    return errorResult(`Cannot add cue: limit of ${LIMITS.cues} cues reached.`);
  }
  const newCue: Cue = { id, title, actions: [] };
  const cloned = { ...scenario, cues: [...scenario.cues, newCue] };
  return parseResultToEditResult(parseScenario(cloned));
}

export function updateProp(scenario: Scenario, id: string, updates: Partial<Prop>): EditResult<Scenario> {
  const idx = scenario.props.findIndex(p => p.id === id);
  if (idx === -1) {
    return errorResult(`Prop '${id}' not found.`);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'id') && updates.id !== id) {
    return errorResult(`Cannot change prop ID from '${id}' to '${updates.id}'.`);
  }
  const prop = scenario.props[idx];
  const newProp: Prop = {
    id: prop.id,
    name: updates.name ?? prop.name,
    kind: updates.kind ?? prop.kind,
    initial: updates.initial ?? prop.initial,
  };
  const cloned = { ...scenario, props: [...scenario.props.slice(0, idx), newProp, ...scenario.props.slice(idx + 1)] };
  return parseResultToEditResult(parseScenario(cloned));
}

export function updateZone(scenario: Scenario, id: string, updates: Partial<Zone>): EditResult<Scenario> {
  const idx = scenario.zones.findIndex(z => z.id === id);
  if (idx === -1) {
    return errorResult(`Zone '${id}' not found.`);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'id') && updates.id !== id) {
    return errorResult(`Cannot change zone ID from '${id}' to '${updates.id}'.`);
  }
  const zone = scenario.zones[idx];
  const newZone = { id: zone.id, name: updates.name ?? zone.name };
  const cloned = { ...scenario, zones: [...scenario.zones.slice(0, idx), newZone, ...scenario.zones.slice(idx + 1)] };
  return parseResultToEditResult(parseScenario(cloned));
}

export function updateHolder(scenario: Scenario, id: string, updates: Partial<Holder>): EditResult<Scenario> {
  const idx = scenario.holders.findIndex(h => h.id === id);
  if (idx === -1) {
    return errorResult(`Holder '${id}' not found.`);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'id') && updates.id !== id) {
    return errorResult(`Cannot change holder ID from '${id}' to '${updates.id}'.`);
  }
  const holder = scenario.holders[idx];
  const newHolder = { id: holder.id, name: updates.name ?? holder.name };
  const cloned = { ...scenario, holders: [...scenario.holders.slice(0, idx), newHolder, ...scenario.holders.slice(idx + 1)] };
  return parseResultToEditResult(parseScenario(cloned));
}

export function updateCue(scenario: Scenario, id: string, updates: Partial<Cue>): EditResult<Scenario> {
  const idx = scenario.cues.findIndex(c => c.id === id);
  if (idx === -1) {
    return errorResult(`Cue '${id}' not found.`);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'id') && updates.id !== id) {
    return errorResult(`Cannot change cue ID from '${id}' to '${updates.id}'.`);
  }
  const cue = scenario.cues[idx];
  const newCue: Cue = {
    id: cue.id,
    title: updates.title ?? cue.title,
    actions: updates.actions ?? cue.actions,
  };
  const cloned = { ...scenario, cues: [...scenario.cues.slice(0, idx), newCue, ...scenario.cues.slice(idx + 1)] };
  return parseResultToEditResult(parseScenario(cloned));
}

export function deleteProp(scenario: Scenario, propId: string): EditResult<Scenario> {
  const idx = scenario.props.findIndex(p => p.id === propId);
  if (idx === -1) {
    return errorResult(`Prop '${propId}' not found.`);
  }
  const block = checkBlockDeletion('prop', propId, scenario);
  if (block) {
    return { blocked: true, reason: block.reason, references: block.references };
  }
  const newProps = scenario.props.filter(p => p.id !== propId);
  const cloned = { ...scenario, props: newProps };
  return parseResultToEditResult(parseScenario(cloned));
}

export function deleteZone(scenario: Scenario, zoneId: string): EditResult<Scenario> {
  const idx = scenario.zones.findIndex(z => z.id === zoneId);
  if (idx === -1) {
    return errorResult(`Zone '${zoneId}' not found.`);
  }
  if (wouldLeaveNoZones(zoneId, scenario)) {
    return errorResult('Cannot delete the last zone; a scene must have at least one zone.');
  }
  const block = checkBlockDeletion('zone', zoneId, scenario);
  if (block) {
    return { blocked: true, reason: block.reason, references: block.references };
  }
  const newZones = scenario.zones.filter(z => z.id !== zoneId);
  const cloned = { ...scenario, zones: newZones };
  return parseResultToEditResult(parseScenario(cloned));
}

export function deleteHolder(scenario: Scenario, holderId: string): EditResult<Scenario> {
  const idx = scenario.holders.findIndex(h => h.id === holderId);
  if (idx === -1) {
    return errorResult(`Holder '${holderId}' not found.`);
  }
  const block = checkBlockDeletion('holder', holderId, scenario);
  if (block) {
    return { blocked: true, reason: block.reason, references: block.references };
  }
  const newHolders = scenario.holders.filter(h => h.id !== holderId);
  const cloned = { ...scenario, holders: newHolders };
  return parseResultToEditResult(parseScenario(cloned));
}

export function deleteCue(scenario: Scenario, cueId: string): EditResult<Scenario> {
  const idx = scenario.cues.findIndex(c => c.id === cueId);
  if (idx === -1) {
    return errorResult(`Cue '${cueId}' not found.`);
  }
  const newCues = scenario.cues.filter(c => c.id !== cueId);
  const cloned = { ...scenario, cues: newCues };
  return parseResultToEditResult(parseScenario(cloned));
}

export function addAction(scenario: Scenario, cueId: string, action: Action): EditResult<Scenario> {
  const cueIdx = scenario.cues.findIndex(c => c.id === cueId);
  if (cueIdx === -1) {
    return errorResult(`Cue '${cueId}' not found.`);
  }
  if (scenario.cues[cueIdx].actions.length >= LIMITS.actionsPerCue) {
    return errorResult(`Cannot add action: limit of ${LIMITS.actionsPerCue} actions per cue reached.`);
  }
  if (!isValidId(action.id)) {
    return errorResult(`Invalid action ID: '${action.id}'.`);
  }
  for (const c of scenario.cues) {
    for (const a of c.actions) {
      if (a.id === action.id) {
        return errorResult(`Action ID '${action.id}' already exists in cue '${c.id}'.`);
      }
    }
  }
  const clonedAction = copyAction(action);
  const cue = { ...scenario.cues[cueIdx], actions: [...scenario.cues[cueIdx].actions, clonedAction] };
  const cloned = { ...scenario, cues: [...scenario.cues.slice(0, cueIdx), cue, ...scenario.cues.slice(cueIdx + 1)] };
  return parseResultToEditResult(parseScenario(cloned));
}

export function updateAction(scenario: Scenario, cueId: string, actionId: string, updates: Partial<Action>): EditResult<Scenario> {
  const cueIdx = scenario.cues.findIndex(c => c.id === cueId);
  if (cueIdx === -1) {
    return errorResult(`Cue '${cueId}' not found.`);
  }
  const actionIdx = scenario.cues[cueIdx].actions.findIndex(a => a.id === actionId);
  if (actionIdx === -1) {
    return errorResult(`Action '${actionId}' not found in cue '${cueId}'.`);
  }
  const action = scenario.cues[cueIdx].actions[actionIdx];
  if (Object.prototype.hasOwnProperty.call(updates, 'id') && updates.id !== actionId) {
    return errorResult(`Cannot change action ID from '${actionId}' to '${updates.id}'.`);
  }

  const hasOwnDest = Object.prototype.hasOwnProperty.call(updates, 'destination');
  const hasOwnNote = Object.prototype.hasOwnProperty.call(updates, 'note');

  const newAction: Action = {
    id: action.id,
    propId: updates.propId ?? action.propId,
    kind: updates.kind ?? action.kind,
    requiredSource: updates.requiredSource !== undefined ? (updates.requiredSource ? copyPosition(updates.requiredSource) : null) : action.requiredSource,
    ...(hasOwnDest ? (updates.destination ? { destination: copyPosition(updates.destination) } : {}) : (action.destination ? { destination: action.destination } : {})),
    ...(hasOwnNote ? (updates.note !== undefined ? { note: updates.note } : {}) : (action.note !== undefined ? { note: action.note } : {})),
  };
  const cue = { ...scenario.cues[cueIdx], actions: [...scenario.cues[cueIdx].actions.slice(0, actionIdx), newAction, ...scenario.cues[cueIdx].actions.slice(actionIdx + 1)] };
  const cloned = { ...scenario, cues: [...scenario.cues.slice(0, cueIdx), cue, ...scenario.cues.slice(cueIdx + 1)] };
  return parseResultToEditResult(parseScenario(cloned));
}

export function deleteAction(scenario: Scenario, cueId: string, actionId: string): EditResult<Scenario> {
  const cueIdx = scenario.cues.findIndex(c => c.id === cueId);
  if (cueIdx === -1) {
    return errorResult(`Cue '${cueId}' not found.`);
  }
  const actionIdx = scenario.cues[cueIdx].actions.findIndex(a => a.id === actionId);
  if (actionIdx === -1) {
    return errorResult(`Action '${actionId}' not found in cue '${cueId}'.`);
  }
  const cue = { ...scenario.cues[cueIdx], actions: [...scenario.cues[cueIdx].actions.slice(0, actionIdx), ...scenario.cues[cueIdx].actions.slice(actionIdx + 1)] };
  const cloned = { ...scenario, cues: [...scenario.cues.slice(0, cueIdx), cue, ...scenario.cues.slice(cueIdx + 1)] };
  return parseResultToEditResult(parseScenario(cloned));
}

export function moveCue(scenario: Scenario, cueId: string, newIndex: number): EditResult<Scenario> {
  const idx = scenario.cues.findIndex(c => c.id === cueId);
  if (idx === -1) {
    return errorResult(`Cue '${cueId}' not found.`);
  }
  // Defect 1: Validate integer index within bounds
  if (!Number.isInteger(newIndex) || newIndex < 0 || newIndex >= scenario.cues.length) {
    return errorResult(`Invalid index ${newIndex}; must be an integer between 0 and ${scenario.cues.length - 1}.`);
  }
  if (idx === newIndex) {
    // Defect 3: No-op must normalize like other edits
    const parsed = parseScenario(scenario);
    if (!parsed.success) {
      return errorResult(`No-op reorder produced invalid scene: ${parsed.errors.join('; ')}`);
    }
    return { blocked: false, result: parsed.data };
  }
  const cues = [...scenario.cues];
  const [cue] = cues.splice(idx, 1);
  cues.splice(newIndex, 0, cue);
  const cloned = { ...scenario, cues };
  return parseResultToEditResult(parseScenario(cloned));
}

export function moveAction(scenario: Scenario, cueId: string, actionId: string, newIndex: number): EditResult<Scenario> {
  const cueIdx = scenario.cues.findIndex(c => c.id === cueId);
  if (cueIdx === -1) {
    return errorResult(`Cue '${cueId}' not found.`);
  }
  const actionIdx = scenario.cues[cueIdx].actions.findIndex(a => a.id === actionId);
  if (actionIdx === -1) {
    return errorResult(`Action '${actionId}' not found in cue '${cueId}'.`);
  }
  if (!Number.isInteger(newIndex) || newIndex < 0 || newIndex >= scenario.cues[cueIdx].actions.length) {
    return errorResult(`Invalid index ${newIndex}; must be an integer between 0 and ${scenario.cues[cueIdx].actions.length - 1}.`);
  }
  if (actionIdx === newIndex) {
    const parsed = parseScenario(scenario);
    if (!parsed.success) {
      return errorResult(`No-op reorder produced invalid scene: ${parsed.errors.join('; ')}`);
    }
    return { blocked: false, result: parsed.data };
  }
  const cue = { ...scenario.cues[cueIdx], actions: [...scenario.cues[cueIdx].actions] };
  const [action] = cue.actions.splice(actionIdx, 1);
  cue.actions.splice(newIndex, 0, action);
  const cues = [...scenario.cues];
  cues[cueIdx] = cue;
  const cloned = { ...scenario, cues };
  return parseResultToEditResult(parseScenario(cloned));
}

function copyPosition(pos: { zoneId: string; holderId: string | null }): { zoneId: string; holderId: string | null } {
  return { zoneId: pos.zoneId, holderId: pos.holderId };
}
