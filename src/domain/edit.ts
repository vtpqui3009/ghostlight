import { LIMITS } from './schema';
import type { Action, ActionKind, Cue, InitialState, NamedEntity, Position, Prop, Scenario } from './types';

/** Pure, immutable edits on a scene. The UI never mutates a scene in place. */

const ID_SAFE = /[^A-Za-z0-9_-]+/g;

export function nextId(prefix: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const base = (prefix.replace(ID_SAFE, '-').replace(/^-+/, '') || 'item').slice(0, 48);
  if (!used.has(base)) return base;
  for (let n = 2; n < 10_000; n += 1) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

const allActionIds = (scenario: Scenario) => scenario.cues.flatMap(cue => cue.actions.map(action => action.id));

/** Move an item within a list by `delta`, returning the same array when the move is impossible. */
export function moveWithin<T>(items: readonly T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return [...items];
  const copy = [...items];
  const [item] = copy.splice(index, 1);
  copy.splice(target, 0, item);
  return copy;
}

export const canAddCue = (scenario: Scenario) => scenario.cues.length < LIMITS.cues;
export const canAddProp = (scenario: Scenario) => scenario.props.length < LIMITS.props;
export const canAddAction = (cue: Cue) => cue.actions.length < LIMITS.actionsPerCue;

export function moveCue(scenario: Scenario, cueId: string, delta: number): Scenario {
  const index = scenario.cues.findIndex(cue => cue.id === cueId);
  return { ...scenario, cues: moveWithin(scenario.cues, index, delta) };
}

export function moveAction(scenario: Scenario, cueId: string, actionId: string, delta: number): Scenario {
  return mapCue(scenario, cueId, cue => {
    const index = cue.actions.findIndex(action => action.id === actionId);
    return { ...cue, actions: moveWithin(cue.actions, index, delta) };
  });
}

function mapCue(scenario: Scenario, cueId: string, change: (cue: Cue) => Cue): Scenario {
  return { ...scenario, cues: scenario.cues.map(cue => (cue.id === cueId ? change(cue) : cue)) };
}

export function addCue(scenario: Scenario): { scenario: Scenario; cueId: string } {
  if (!canAddCue(scenario)) return { scenario, cueId: '' };
  const id = nextId(`cue-${scenario.cues.length + 1}`, scenario.cues.map(cue => cue.id));
  const cue: Cue = { id, title: `Cue ${scenario.cues.length + 1}`, actions: [] };
  return { scenario: { ...scenario, cues: [...scenario.cues, cue] }, cueId: id };
}

export function removeCue(scenario: Scenario, cueId: string): Scenario {
  return { ...scenario, cues: scenario.cues.filter(cue => cue.id !== cueId) };
}

export function updateCue(scenario: Scenario, cueId: string, patch: Partial<Omit<Cue, 'id' | 'actions'>>): Scenario {
  return mapCue(scenario, cueId, cue => ({ ...cue, ...patch }));
}

export function addAction(scenario: Scenario, cueId: string, kind: ActionKind = 'place'): { scenario: Scenario; actionId: string } {
  const cue = scenario.cues.find(entry => entry.id === cueId);
  if (!cue || !canAddAction(cue) || scenario.props.length === 0) return { scenario, actionId: '' };
  const existing = allActionIds(scenario);
  const id = nextId(`act-${existing.length + 1}`, existing);
  const zoneId = scenario.zones[0]?.id ?? '';
  const action: Action = {
    id, propId: scenario.props[0].id, kind,
    requiredSource: null,
    ...(kind === 'consume' ? {} : { destination: { zoneId, holderId: null } }),
  };
  return { scenario: mapCue(scenario, cueId, entry => ({ ...entry, actions: [...entry.actions, action] })), actionId: id };
}

export function removeAction(scenario: Scenario, cueId: string, actionId: string): Scenario {
  return mapCue(scenario, cueId, cue => ({ ...cue, actions: cue.actions.filter(action => action.id !== actionId) }));
}

/**
 * Patch one action. `requiredSource` and `destination` are authored requirements, so they are only
 * ever changed by an explicit edit here — never derived from the replayed state.
 */
export function updateAction(scenario: Scenario, cueId: string, actionId: string, patch: Partial<Omit<Action, 'id'>>): Scenario {
  return mapCue(scenario, cueId, cue => ({
    ...cue,
    actions: cue.actions.map(action => {
      if (action.id !== actionId) return action;
      const next: Action = { ...action, ...patch };
      if (next.kind === 'consume') delete next.destination;
      else if (!next.destination) next.destination = { zoneId: scenario.zones[0]?.id ?? '', holderId: null };
      if (next.kind === 'place' && next.destination) next.destination = { ...next.destination, holderId: null };
      if (next.note !== undefined && next.note.trim() === '') delete next.note;
      return next;
    }),
  }));
}

export function addProp(scenario: Scenario): { scenario: Scenario; propId: string } {
  if (!canAddProp(scenario)) return { scenario, propId: '' };
  const id = nextId(`prop-${scenario.props.length + 1}`, scenario.props.map(prop => prop.id));
  const prop: Prop = {
    id, name: `New prop ${scenario.props.length + 1}`, kind: 'Prop',
    initial: { status: 'available', zoneId: scenario.zones[0]?.id ?? '', holderId: null },
  };
  return { scenario: { ...scenario, props: [...scenario.props, prop] }, propId: id };
}

/** Removing an instance also removes the steps that referenced it, so the scene stays importable. */
export function removeProp(scenario: Scenario, propId: string): Scenario {
  return {
    ...scenario,
    props: scenario.props.filter(prop => prop.id !== propId),
    cues: scenario.cues.map(cue => ({ ...cue, actions: cue.actions.filter(action => action.propId !== propId) })),
  };
}

export function updateProp(scenario: Scenario, propId: string, patch: Partial<Omit<Prop, 'id'>>): Scenario {
  return {
    ...scenario,
    props: scenario.props.map(prop => (prop.id === propId ? { ...prop, ...patch } : prop)),
  };
}

export function setPropInitial(scenario: Scenario, propId: string, initial: InitialState): Scenario {
  const normalised: InitialState = initial.status === 'available'
    ? { status: 'available', zoneId: initial.zoneId ?? scenario.zones[0]?.id ?? '', holderId: initial.holderId ?? null }
    : { status: initial.status };
  return updateProp(scenario, propId, { initial: normalised });
}

export function renameEntity(scenario: Scenario, collection: 'zones' | 'holders', id: string, name: string): Scenario {
  const entities: NamedEntity[] = scenario[collection].map(entity => (entity.id === id ? { ...entity, name } : entity));
  return { ...scenario, [collection]: entities };
}

export function updateScene(scenario: Scenario, patch: { title?: string; description?: string }): Scenario {
  const next: Scenario = { ...scenario, ...patch };
  if (next.description !== undefined && next.description.trim() === '') delete next.description;
  return next;
}

const ENTITY_LIMIT = { zones: LIMITS.zones, holders: LIMITS.holders } as const;

export const canAddEntity = (scenario: Scenario, collection: 'zones' | 'holders') =>
  scenario[collection].length < ENTITY_LIMIT[collection];

export function addEntity(scenario: Scenario, collection: 'zones' | 'holders'): { scenario: Scenario; id: string } {
  if (!canAddEntity(scenario, collection)) return { scenario, id: '' };
  const prefix = collection === 'zones' ? 'zone' : 'holder';
  const label = collection === 'zones' ? 'New area' : 'New runner';
  const id = nextId(`${prefix}-${scenario[collection].length + 1}`, scenario[collection].map(entity => entity.id));
  const entities: NamedEntity[] = [...scenario[collection], { id, name: `${label} ${scenario[collection].length + 1}` }];
  return { scenario: { ...scenario, [collection]: entities }, id };
}

/** Where an area or a runner is still referenced, so the UI can explain why it cannot be removed. */
export function entityUsage(scenario: Scenario, collection: 'zones' | 'holders', id: string): string[] {
  const matches = (position: Position | null | undefined) =>
    !!position && (collection === 'zones' ? position.zoneId === id : (position.holderId ?? null) === id);
  const used: string[] = [];
  for (const prop of scenario.props) {
    if (prop.initial.status !== 'available') continue;
    const hit = collection === 'zones' ? prop.initial.zoneId === id : (prop.initial.holderId ?? null) === id;
    if (hit) used.push(`starting position of ${prop.name}`);
  }
  scenario.cues.forEach((cue, cueIndex) => {
    for (const action of cue.actions) {
      if (matches(action.requiredSource) || matches(action.destination)) used.push(`cue ${cueIndex + 1} (${cue.title})`);
    }
  });
  return [...new Set(used)];
}

export function removeEntity(scenario: Scenario, collection: 'zones' | 'holders', id: string): { scenario: Scenario; blockedBy: string[] } {
  const blockedBy = entityUsage(scenario, collection, id);
  const last = collection === 'zones' && scenario.zones.length <= 1;
  if (blockedBy.length > 0 || last) return { scenario, blockedBy: last ? ['a scene needs at least one area'] : blockedBy };
  const entities: NamedEntity[] = scenario[collection].filter(entity => entity.id !== id);
  return { scenario: { ...scenario, [collection]: entities }, blockedBy: [] };
}
