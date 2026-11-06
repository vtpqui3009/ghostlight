import type {
  Action, ActionKind, Frame, Issue, Position, PropState, RunResult, Scenario, StateMap, TraceRef,
} from './types';

/**
 * Deterministic replay of a planned prop run.
 *
 * The engine models *planned* state only. It never observes the real stage, and it never
 * writes back into the authored requirements: `requiredSource` comes from the run sheet and
 * is compared against modelled state, so a scene cannot validate itself by construction.
 */

const NEEDS_SOURCE: Record<ActionKind, boolean> = {
  place: false, collect: true, transfer: true, carryOff: true, consume: true, replenish: false,
};
const NEEDS_DESTINATION: Record<ActionKind, boolean> = {
  place: true, collect: true, transfer: true, carryOff: true, consume: false, replenish: true,
};
const HOLDER_AT_DESTINATION: Partial<Record<ActionKind, 'required' | 'forbidden'>> = {
  place: 'forbidden', collect: 'required', transfer: 'required', carryOff: 'required',
};

export const ACTION_VERBS: Record<ActionKind, string> = {
  place: 'Place', collect: 'Collect', transfer: 'Hand over', carryOff: 'Carry off',
  consume: 'Use up', replenish: 'Bring on a fresh instance',
};

export interface Labels {
  prop: (id: string) => string;
  zone: (id: string) => string;
  holder: (id: string | null | undefined) => string;
  position: (position: Position | null | undefined) => string;
  state: (state: PropState | undefined) => string;
}

/** Human labels for ids, falling back to the raw id so a partial scene still reads sensibly. */
export function makeLabels(scenario: Scenario): Labels {
  const name = (entries: { id: string; name: string }[]) => {
    const map = new Map(entries.map(entry => [entry.id, entry.name]));
    return (id: string) => map.get(id) ?? id;
  };
  const prop = name(scenario.props);
  const zone = name(scenario.zones);
  const holderName = name(scenario.holders);
  const holder = (id: string | null | undefined) => (id ? holderName(id) : 'no holder');
  const position = (value: Position | null | undefined) =>
    value ? `${zone(value.zoneId)} (${holder(value.holderId)})` : 'not recorded';
  const state = (value: PropState | undefined) => {
    if (!value) return 'not in this scene';
    if (value.status === 'available') return `${zone(value.zoneId!)} (${holder(value.holderId)})`;
    if (value.status === 'unknown') return 'starting position not recorded';
    if (value.status === 'consumed') return 'used up';
    return 'not in the scene';
  };
  return { prop, zone, holder, position, state };
}

function describePosition(labels: Labels, action: Action): string {
  return labels.position(action.destination ?? null);
}

/** One-line plain-language description of an action, used by the timeline and the print reports. */
export function describeAction(action: Action, labels: Labels): string {
  const prop = labels.prop(action.propId);
  switch (action.kind) {
    case 'place': return `Place ${prop} at ${describePosition(labels, action)}`;
    case 'collect': return `${labels.holder(action.destination?.holderId)} collects ${prop} from ${labels.position(action.requiredSource)}`;
    case 'transfer': return `${labels.holder(action.requiredSource?.holderId)} hands ${prop} to ${labels.holder(action.destination?.holderId)}`;
    case 'carryOff': return action.destination
      ? `${labels.holder(action.destination.holderId)} carries ${prop} to ${labels.zone(action.destination.zoneId)}`
      : `Someone carries ${prop} off, to a destination that is not recorded`;
    case 'consume': return `${prop} is used up`;
    case 'replenish': return `Bring on a fresh ${prop} at ${describePosition(labels, action)}`;
  }
}

/** The holders who physically do the work in this action, for the per-runner report. */
export function actionRunners(action: Action): { holderId: string | null; role: 'gives' | 'takes' | 'does' }[] {
  switch (action.kind) {
    case 'transfer': return [
      { holderId: action.requiredSource?.holderId ?? null, role: 'gives' },
      { holderId: action.destination?.holderId ?? null, role: 'takes' },
    ];
    case 'collect': case 'carryOff': return [{ holderId: action.destination?.holderId ?? null, role: 'takes' }];
    case 'replenish': return [{ holderId: action.destination?.holderId ?? null, role: 'does' }];
    default: return [{ holderId: action.requiredSource?.holderId ?? null, role: 'does' }];
  }
}

function positionsMatch(required: Position, state: PropState): boolean {
  return state.status === 'available'
    && state.zoneId === required.zoneId
    && (state.holderId ?? null) === (required.holderId ?? null);
}

function freezeState(map: StateMap): StateMap {
  for (const key of Object.keys(map)) Object.freeze(map[key]);
  return Object.freeze(map);
}

export function initialStateOf(scenario: Scenario): StateMap {
  const map: StateMap = {};
  for (const prop of scenario.props) {
    map[prop.id] = prop.initial.status === 'available'
      ? { status: 'available', zoneId: prop.initial.zoneId!, holderId: prop.initial.holderId ?? null }
      : { status: prop.initial.status };
  }
  return freezeState(map);
}

interface Outcome { next: StateMap; issues: Issue[]; applied: boolean }

function evaluate(state: StateMap, action: Action, ref: TraceRef, labels: Labels, cueName: (ref: TraceRef) => string): Outcome {
  const issues: Issue[] = [];
  const add = (code: string, severity: Issue['severity'], message: string, suggestion: string, cause?: TraceRef) => {
    issues.push({ id: `${action.id}:${code}`, code, severity, message, suggestion, propId: action.propId, cueId: ref.cueId, actionId: action.id, ...(cause ? { cause } : {}) });
  };
  const reject = (): Outcome => ({ next: state, issues, applied: false });
  const prop = labels.prop(action.propId);
  const current = state[action.propId] as PropState | undefined;

  if (!current) {
    add('unknown-prop', 'error', `${prop} is not one of the physical instances in this scene.`,
      'Add the instance to the props list, or point this action at an existing one.');
    return reject();
  }

  // Structural requirements of the action itself.
  if (NEEDS_DESTINATION[action.kind] && !action.destination) {
    add('destination-missing', 'error', `${ACTION_VERBS[action.kind]} needs a destination, but none is recorded.`,
      'Choose the zone (and holder) this action ends in.');
    return reject();
  }
  const holderRule = HOLDER_AT_DESTINATION[action.kind];
  const destinationHolder = action.destination?.holderId ?? null;
  if (holderRule === 'required' && destinationHolder === null) {
    add('holder-missing', 'error', `${ACTION_VERBS[action.kind]} needs the person who ends up holding ${prop}.`,
      'Name the holder on this action, or use "Place" if the piece is set down instead.');
    return reject();
  }
  if (holderRule === 'forbidden' && destinationHolder !== null) {
    add('holder-unexpected', 'error', `A place step leaves ${prop} on a surface, so it cannot end in someone's hands.`,
      'Clear the holder on this action, or use "Hand over" if it goes to a person.');
    return reject();
  }
  if (action.kind === 'transfer'
    && action.requiredSource
    && (action.requiredSource.holderId ?? null) === destinationHolder) {
    add('transfer-same-holder', 'error', `${labels.holder(destinationHolder)} cannot hand ${prop} to themselves.`,
      'Pick a different receiving holder, or delete this handoff.');
    return reject();
  }

  const cause = current.lastChange;
  const sinceText = cause ? `since ${cueName(cause)}` : 'from the recorded starting state';

  if (action.kind === 'replenish') {
    if (current.status === 'consumed') {
      add('replenish-consumed', 'error', `${prop} was used up ${sinceText}, so it cannot come back.`,
        'Add a separate new instance (for example a "-B" copy) and bring that one on instead.', cause);
      return reject();
    }
    if (current.status === 'available') {
      add('replenish-present', 'error', `${prop} is already in the scene at ${labels.state(current)}.`,
        'Point this step at a new instance, or remove it.', cause);
      return reject();
    }
  } else {
    if (current.status === 'consumed') {
      add('consumed-reuse', 'error', `${prop} was used up ${sinceText}, so it cannot be used again in this run.`,
        'Add a fresh instance and point this action at it. A reset does not revive a used-up piece.', cause);
      return reject();
    }
    if (current.status === 'absent') {
      add('absent-instance', 'error', `${prop} is not in the scene at this point ${sinceText}.`,
        'Give the instance a starting position, or bring it on with a replenish step before this cue.', cause);
      return reject();
    }
    if (current.status === 'unknown') {
      add('unknown-start', 'uncertain', `${prop} has no recorded starting position, so this step cannot be confirmed.`,
        'Record where this instance starts in the props list to turn this into a real check.');
      // Not an error: too little information. Carry on from the stated requirement.
    } else if (!action.requiredSource) {
      if (NEEDS_SOURCE[action.kind]) {
        add('source-not-recorded', 'uncertain', `No required source is recorded for this step, so ${prop} is only checked against the plan so far (${labels.state(current)}).`,
          'Record the zone and holder the run sheet expects, so a missing handoff would show up here.');
      }
    } else if (!positionsMatch(action.requiredSource, current)) {
      add('source-mismatch', 'error',
        `${prop} is needed at ${labels.position(action.requiredSource)} but the plan leaves it at ${labels.state(current)} ${sinceText}.`,
        'Add the missing move or handoff before this cue, or correct the required source if the run sheet is right.',
        cause);
      return reject();
    }
  }

  const next: StateMap = { ...state };
  next[action.propId] = action.kind === 'consume'
    ? { status: 'consumed', lastChange: ref }
    : { status: 'available', zoneId: action.destination!.zoneId, holderId: action.destination!.holderId ?? null, lastChange: ref };
  return { next: freezeState(next), issues, applied: true };
}

/**
 * Replay a scene in order. Pure: the same scene always produces the same frames and issues.
 * A rejected action leaves state untouched, so later cues are checked against the plan as written.
 */
export function runScenario(scenario: Scenario): RunResult {
  const labels = makeLabels(scenario);
  const cueName = (ref: TraceRef) => {
    const title = scenario.cues[ref.cueIndex]?.title;
    const step = `step ${ref.actionIndex + 1}`;
    return title ? `cue ${ref.cueIndex + 1} "${title}", ${step}` : `cue ${ref.cueIndex + 1}, ${step}`;
  };
  const initial = initialStateOf(scenario);
  const frames: Frame[] = [];
  const issues: Issue[] = [];
  let state = initial;
  let index = 0;
  scenario.cues.forEach((cue, cueIndex) => {
    cue.actions.forEach((action, actionIndex) => {
      const ref: TraceRef = { cueId: cue.id, actionId: action.id, cueIndex, actionIndex };
      const before = state;
      const outcome = evaluate(state, action, ref, labels, cueName);
      state = outcome.next;
      frames.push(Object.freeze({
        index, cueIndex, actionIndex, cueId: cue.id, actionId: action.id, action,
        before, after: state, issues: outcome.issues, applied: outcome.applied,
      }));
      issues.push(...outcome.issues);
      index += 1;
    });
  });
  return { initial, final: state, frames, issues };
}

export function frameOf(run: RunResult, ref: TraceRef | undefined): Frame | undefined {
  if (!ref) return undefined;
  return run.frames.find(frame => frame.actionId === ref.actionId);
}

export function countIssues(issues: Issue[]): { errors: number; uncertain: number } {
  let errors = 0;
  let uncertain = 0;
  for (const issue of issues) {
    if (issue.severity === 'error') errors += 1; else uncertain += 1;
  }
  return { errors, uncertain };
}
