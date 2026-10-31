// ID validation and own-key-safe dictionary helpers
import type { Action, Cause, TraceRef, PropState, StateMap, Position, AvailableState, UnknownState, AbsentState, ConsumedState } from './types';

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const FORBIDDEN_IDS = new Set(['__proto__', 'constructor', 'prototype']);

export function isValidId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value) && !FORBIDDEN_IDS.has(value);
}

/** Create an own-key-safe dictionary (uses Object.create(null) to prevent prototype pollution). */
export function createOwnKeyMap<T>(): Record<string, T> {
  return Object.create(null);
}

/** Deep-copy a Position for independent mutation safety. */
export function copyPosition(pos: Position): Position {
  return { zoneId: pos.zoneId, holderId: pos.holderId };
}

/** Deep-copy a TraceRef for independent mutation safety. */
export function copyTraceRef(ref: TraceRef): TraceRef {
  return {
    cueId: ref.cueId,
    actionId: ref.actionId,
    cueIndex: ref.cueIndex,
    actionIndex: ref.actionIndex,
  };
}

/** Deep-copy a Cause for independent mutation safety. */
export function copyCause(cause: Cause | undefined): Cause | undefined {
  if (!cause) return undefined;
  if (cause.kind === 'initial') {
    return { kind: 'initial', propId: cause.propId };
  }
  return { kind: 'action', ref: copyTraceRef(cause.ref) };
}

/** Deep-copy a PropState for independent mutation safety. */
export function copyPropState(state: PropState): PropState {
  if (state.status === 'available') {
    const avail = state as AvailableState;
    return {
      status: 'available',
      zoneId: avail.zoneId,
      holderId: avail.holderId,
      ...(avail.lastChange ? { lastChange: copyTraceRef(avail.lastChange) } : {}),
    };
  }
  if (state.status === 'unknown') {
    const unk = state as UnknownState;
    return {
      status: 'unknown',
      ...(unk.lastChange ? { lastChange: copyTraceRef(unk.lastChange) } : {}),
    };
  }
  if (state.status === 'absent') {
    const abs = state as AbsentState;
    return {
      status: 'absent',
      ...(abs.lastChange ? { lastChange: copyTraceRef(abs.lastChange) } : {}),
    };
  }
  const cons = state as ConsumedState;
  return {
    status: 'consumed',
    ...(cons.lastChange ? { lastChange: copyTraceRef(cons.lastChange) } : {}),
  };
}

/** Deep-copy a state map with all nested PropStates. */
export function copyStateMap(map: StateMap): StateMap {
  const copy = createOwnKeyMap<PropState>();
  for (const key of Object.keys(map)) {
    copy[key] = copyPropState(map[key]);
  }
  return copy;
}

/** Deep-copy an Action for frame emission, preserving all fields including empty note. */
export function copyAction(action: Action): Action {
  return {
    id: action.id,
    propId: action.propId,
    kind: action.kind,
    requiredSource: action.requiredSource ? copyPosition(action.requiredSource) : null,
    ...(action.destination ? { destination: copyPosition(action.destination) } : {}),
    ...(action.note !== undefined ? { note: action.note } : {}),
  };
}
