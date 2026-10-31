import type {
  Scenario,
  Action,
  Position,
  TraceRef,
  PropState,
  AvailableState,
  StateMap,
  Cause,
  Issue,
  Frame,
  RunResult,
} from './types';
import { createOwnKeyMap, copyStateMap, copyAction, copyCause } from './ids';

/** Pure deterministic replay engine. */
export function runScenario(scenario: Scenario): RunResult {
  // Build initial state from props.
  const initial = createOwnKeyMap<PropState>();
  for (const prop of scenario.props) {
    if (prop.initial.status === 'available') {
      initial[prop.id] = {
        status: 'available',
        zoneId: prop.initial.zoneId!,
        holderId: prop.initial.holderId!,
      };
    } else {
      initial[prop.id] = { status: prop.initial.status };
    }
  }

  // Maintain per-prop cause and current state.
  const propCause = createOwnKeyMap<Cause>();
  for (const prop of scenario.props) {
    propCause[prop.id] = { kind: 'initial', propId: prop.id };
  }
  const state = copyStateMap(initial);

  const frames: Frame[] = [];
  const allIssues: Issue[] = [];
  let frameIndex = 0;

  // Iterate cues and actions.
  for (let cueIndex = 0; cueIndex < scenario.cues.length; cueIndex++) {
    const cue = scenario.cues[cueIndex];
    for (let actionIndex = 0; actionIndex < cue.actions.length; actionIndex++) {
      const action = cue.actions[actionIndex];
      const before = copyStateMap(state);

      // Evaluate the action.
      const result = evaluateAction(
        action,
        state,
        propCause
      );

      let after: StateMap;
      let issues: Issue[];
      let applied: boolean;

      if (result.type === 'success') {
        // Apply the state transition.
        state[action.propId] = result.newState;
        const ref: TraceRef = {
          cueId: cue.id,
          actionId: action.id,
          cueIndex,
          actionIndex,
        };
        propCause[action.propId] = { kind: 'action', ref };
        after = copyStateMap(state);
        issues = [];
        applied = true;
      } else {
        // Rejection: state unchanged, emit issue with deep-copied cause.
        after = copyStateMap(state);
        const issue: Issue = {
          id: `issue::${action.id}`,
          code: result.code,
          severity: result.severity,
          message: result.message,
          suggestion: result.suggestion,
          propId: action.propId,
          cueId: cue.id,
          actionId: action.id,
          ...(result.cause ? { cause: copyCause(result.cause) } : {}),
        };
        // Clone issue independently for frame and for allIssues to prevent aliasing.
        const issueForFrame: Issue = {
          id: issue.id,
          code: issue.code,
          severity: issue.severity,
          message: issue.message,
          suggestion: issue.suggestion,
          propId: issue.propId,
          cueId: issue.cueId,
          actionId: issue.actionId,
          ...(issue.cause ? { cause: copyCause(issue.cause) } : {}),
        };
        issues = [issueForFrame];
        applied = false;
        allIssues.push(issue);
      }

      const frame: Frame = {
        index: frameIndex,
        cueIndex,
        actionIndex,
        cueId: cue.id,
        actionId: action.id,
        action: copyAction(action),
        before,
        after,
        issues,
        applied,
      };

      frames.push(frame);
      frameIndex++;
    }
  }

  const final = copyStateMap(state);

  return {
    initial: copyStateMap(initial),
    final,
    frames,
    issues: allIssues,
  };
}

interface SuccessResult {
  type: 'success';
  newState: PropState;
}

interface RejectionResult {
  type: 'rejection';
  code: string;
  severity: 'error' | 'uncertain';
  message: string;
  suggestion: string;
  cause?: Cause;
}

type EvalResult = SuccessResult | RejectionResult;

function evaluateAction(
  action: Action,
  state: StateMap,
  propCause: Record<string, Cause>
): EvalResult {
  const kind = action.kind;
  const src = action.requiredSource;
  const dst = action.destination;

  // Step 1: Action shape/holder rules (no cause).
  const shapeError = checkActionShape(kind, src, dst);
  if (shapeError) return shapeError;

  // Step 2: State and mismatch (with cause).
  const propState = state[action.propId];
  const cause: Cause = (propCause[action.propId] as Cause) || {
    kind: 'initial',
    propId: action.propId,
  };

  if (kind === 'replenish') {
    // Special check for replenish: pre-state must be absent.
    if (propState.status === 'available') {
      return {
        type: 'rejection',
        code: 'already-available',
        severity: 'error',
        message: `${action.propId} is already available; no replenish needed.`,
        suggestion: 'remove this action or use a different prop instance',
        cause,
      };
    }
    if (propState.status === 'consumed') {
      return {
        type: 'rejection',
        code: 'consumed-no-replenish',
        severity: 'error',
        message: `${action.propId} was consumed and cannot be replenished.`,
        suggestion: 'add a new physical instance with a different prop ID',
        cause,
      };
    }
    if (propState.status === 'unknown') {
      return {
        type: 'rejection',
        code: 'unknown-no-replenish',
        severity: 'error',
        message: `${action.propId} has an unknown initial state; cannot replenish.`,
        suggestion: 'verify the initial location of this instance',
        cause,
      };
    }
    // propState.status === 'absent' → success
    return {
      type: 'success',
      newState: {
        status: 'available',
        zoneId: dst!.zoneId,
        holderId: dst!.holderId,
      },
    };
  }

  // For non-replenish, check pre-state.
  if (propState.status === 'unknown') {
    return {
      type: 'rejection',
      code: 'unknown-state',
      severity: 'uncertain',
      message: `${action.propId} has an unknown initial state; source cannot be matched.`,
      suggestion: 'verify the initial location of this instance',
      cause,
    };
  }
  if (propState.status === 'absent') {
    return {
      type: 'rejection',
      code: 'absent-before-replenish',
      severity: 'error',
      message: `${action.propId} is not available (absent); use replenish to add it.`,
      suggestion: 'add a replenish action before using this prop',
      cause,
    };
  }
  if (propState.status === 'consumed') {
    return {
      type: 'rejection',
      code: 'consumed-reuse',
      severity: 'error',
      message: `${action.propId} was consumed and cannot be reused.`,
      suggestion: 'add a new physical instance with a different prop ID',
      cause,
    };
  }

  // propState.status === 'available' → check source match.
  const propAvailable = propState as AvailableState;
  const posMatch = src!.zoneId === propAvailable.zoneId && src!.holderId === propAvailable.holderId;
  if (!posMatch) {
    return {
      type: 'rejection',
      code: 'source-mismatch',
      severity: 'error',
      message: `${action.propId} is at zone ${propAvailable.zoneId}${propAvailable.holderId ? ` / ${propAvailable.holderId}` : ' (resting)'}; source requires zone ${src!.zoneId}${src!.holderId ? ` / ${src!.holderId}` : ' (resting)'}.`,
      suggestion: `add a transfer to move ${action.propId} to the required source first`,
      cause,
    };
  }

  // Apply the transition.
  if (kind === 'place') {
    return {
      type: 'success',
      newState: {
        status: 'available',
        zoneId: dst!.zoneId,
        holderId: null,
      },
    };
  }
  if (kind === 'collect') {
    return {
      type: 'success',
      newState: {
        status: 'available',
        zoneId: dst!.zoneId,
        holderId: dst!.holderId,
      },
    };
  }
  if (kind === 'transfer') {
    return {
      type: 'success',
      newState: {
        status: 'available',
        zoneId: dst!.zoneId,
        holderId: dst!.holderId,
      },
    };
  }
  if (kind === 'carryOff') {
    return {
      type: 'success',
      newState: {
        status: 'available',
        zoneId: dst!.zoneId,
        holderId: src!.holderId,
      },
    };
  }
  if (kind === 'consume') {
    return {
      type: 'success',
      newState: {
        status: 'consumed',
      },
    };
  }

  // Should not reach here.
  return {
    type: 'rejection',
    code: 'internal-error',
    severity: 'error',
    message: 'Internal engine error',
    suggestion: 'report this issue',
  };
}

function checkActionShape(
  kind: string,
  src: Position | null,
  dst: Position | undefined
): RejectionResult | null {
  // Validate src and dst presence per kind.
  if (kind === 'place') {
    if (!src) {
      return {
        type: 'rejection',
        code: 'source-required',
        severity: 'error',
        message: 'place: source position is required',
        suggestion: 'specify where the prop currently is',
      };
    }
    if (src.holderId === null) {
      return {
        type: 'rejection',
        code: 'invalid-holder-transition',
        severity: 'error',
        message: 'place: source must be held by a named holder',
        suggestion: 'use collect to hold the prop first',
      };
    }
    if (!dst) {
      return {
        type: 'rejection',
        code: 'destination-required',
        severity: 'error',
        message: 'place: destination position is required',
        suggestion: 'specify where to place the prop',
      };
    }
    if (dst.holderId !== null) {
      return {
        type: 'rejection',
        code: 'invalid-holder-transition',
        severity: 'error',
        message: 'place: destination must have no holder (null)',
        suggestion: 'use transfer to hand to another holder, not place',
      };
    }
  } else if (kind === 'collect') {
    if (!src) {
      return {
        type: 'rejection',
        code: 'source-required',
        severity: 'error',
        message: 'collect: source position is required',
        suggestion: 'specify where the prop currently is',
      };
    }
    if (src.holderId !== null) {
      return {
        type: 'rejection',
        code: 'invalid-holder-transition',
        severity: 'error',
        message: 'collect: source must have no holder (null)',
        suggestion: 'use transfer to take from another holder',
      };
    }
    if (!dst) {
      return {
        type: 'rejection',
        code: 'destination-required',
        severity: 'error',
        message: 'collect: destination position is required',
        suggestion: 'specify which holder to collect into',
      };
    }
    if (dst.holderId === null) {
      return {
        type: 'rejection',
        code: 'invalid-holder-transition',
        severity: 'error',
        message: 'collect: destination must name a holder',
        suggestion: 'specify a holder for the collected prop',
      };
    }
  } else if (kind === 'transfer') {
    if (!src) {
      return {
        type: 'rejection',
        code: 'source-required',
        severity: 'error',
        message: 'transfer: source position is required',
        suggestion: 'specify who currently holds the prop',
      };
    }
    if (src.holderId === null) {
      return {
        type: 'rejection',
        code: 'invalid-holder-transition',
        severity: 'error',
        message: 'transfer: source must name a holder',
        suggestion: 'use collect if taking from a resting position',
      };
    }
    if (!dst) {
      return {
        type: 'rejection',
        code: 'destination-required',
        severity: 'error',
        message: 'transfer: destination position is required',
        suggestion: 'specify the new holder',
      };
    }
    if (!dst.holderId) {
      return {
        type: 'rejection',
        code: 'invalid-holder-transition',
        severity: 'error',
        message: 'transfer: destination must name a holder',
        suggestion: 'use place to set the prop down',
      };
    }
    if (dst.holderId === src.holderId) {
      return {
        type: 'rejection',
        code: 'invalid-holder-transition',
        severity: 'error',
        message: 'transfer: destination holder must differ from source',
        suggestion: 'source and destination are the same holder',
      };
    }
  } else if (kind === 'carryOff') {
    if (!src) {
      return {
        type: 'rejection',
        code: 'source-required',
        severity: 'error',
        message: 'carryOff: source position is required',
        suggestion: 'specify who currently holds the prop',
      };
    }
    if (src.holderId === null) {
      return {
        type: 'rejection',
        code: 'invalid-holder-transition',
        severity: 'error',
        message: 'carryOff: source must name a holder',
        suggestion: 'use place if moving a resting prop offstage',
      };
    }
    if (!dst) {
      return {
        type: 'rejection',
        code: 'destination-required',
        severity: 'error',
        message: 'carryOff: destination position is required',
        suggestion: 'specify the offstage zone',
      };
    }
    if (!dst.holderId || dst.holderId !== src.holderId) {
      return {
        type: 'rejection',
        code: 'invalid-holder-transition',
        severity: 'error',
        message: 'carryOff: destination holder must equal source holder',
        suggestion: 'custody is retained; specify the same holder',
      };
    }
    if (dst.zoneId === src.zoneId) {
      return {
        type: 'rejection',
        code: 'no-move',
        severity: 'error',
        message: 'carryOff: destination zone must differ from source',
        suggestion: 'carryOff requires a zone change; use transfer for a same-zone handoff',
      };
    }
  } else if (kind === 'consume') {
    if (!src) {
      return {
        type: 'rejection',
        code: 'source-required',
        severity: 'error',
        message: 'consume: source position is required',
        suggestion: 'specify where the prop currently is',
      };
    }
    if (dst !== undefined) {
      return {
        type: 'rejection',
        code: 'destination-forbidden',
        severity: 'error',
        message: 'consume: destination must not be specified',
        suggestion: 'consume does not need a destination',
      };
    }
  } else if (kind === 'replenish') {
    if (src !== null) {
      return {
        type: 'rejection',
        code: 'source-required',
        severity: 'error',
        message: 'replenish: source must be null (no custody to check)',
        suggestion: 'replenish uses only a destination',
      };
    }
    if (!dst) {
      return {
        type: 'rejection',
        code: 'destination-required',
        severity: 'error',
        message: 'replenish: destination position is required',
        suggestion: 'specify where the replenished instance appears',
      };
    }
  }

  return null;
}
