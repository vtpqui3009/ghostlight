// Reviewer-authored (Claude), not Kiro — see README "Who wrote what".
//
// A guided fix offers the ONE edit that would resolve a finding, and only where that edit is
// unambiguous. A planning tool that guesses is worse than one that stays quiet, because the user
// believes it. Everything outside the two cases below returns advice in words and no edit.
//
// The suggested edit always changes the PLAN. It never rewrites the authored requiredSource to
// agree with the model — that would silence the finding by destroying the thing that makes the
// check meaningful.

import { addAction, moveAction } from './edit';
import type { EditResult } from './edit';
import type { Action, Frame, Issue, Position, PropState, Scenario } from './types';

export interface GuidedFix {
  /** What will be inserted, in words, shown before the user accepts. */
  description: string;
  /** The cue the new action goes into. */
  cueId: string;
  /** Index within that cue's actions. */
  index: number;
  /** The action to insert. */
  action: Action;
}

export interface NoFix {
  /** Why there is no unambiguous edit, and what the user would do themselves. */
  advice: string;
}

export type FixOutcome = GuidedFix | NoFix | null;

export const isGuidedFix = (outcome: FixOutcome): outcome is GuidedFix =>
  outcome !== null && 'action' in outcome;

const available = (state: PropState | undefined): state is Extract<PropState, { status: 'available' }> =>
  !!state && state.status === 'available';

const name = (scenario: Scenario, kind: 'props' | 'holders' | 'zones', id: string | null): string => {
  if (!id) return 'no one';
  const found = (scenario[kind] as { id: string; name: string }[]).find(entry => entry.id === id);
  return found ? found.name : id;
};

const where = (scenario: Scenario, position: Position): string =>
  `${name(scenario, 'zones', position.zoneId)} / ${position.holderId ? name(scenario, 'holders', position.holderId) : 'resting'}`;

/** A free action id that does not collide anywhere in the scene. */
function freeActionId(scenario: Scenario, base: string): string {
  const taken = new Set(scenario.cues.flatMap(cue => cue.actions.map(action => action.id)));
  if (!taken.has(base)) return base;
  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Looks at one frame's first finding and decides whether a single edit resolves it.
 *
 * Two unambiguous cases, both for `source-mismatch`:
 *   - the zones agree and only the holder differs  -> the missing handoff, inserted as a transfer
 *   - the zones differ and neither side has a holder -> the missing move, inserted as a place
 *
 * Everything else, including reuse of a consumed instance, returns advice and no edit.
 */
export function suggestFix(scenario: Scenario, frame: Frame): FixOutcome {
  const issue: Issue | undefined = frame.issues[0];
  if (!issue || issue.severity !== 'error') return null;

  const propName = name(scenario, 'props', issue.propId);

  if (issue.code === 'consumed-reuse') {
    return {
      advice: `${propName} (${issue.propId}) was used up earlier, and a used-up instance never comes back. There is no edit that fixes this one. Add a separate instance — a second physical copy with its own id — bring it on with a replenish action, and point this step at that instance instead.`,
    };
  }

  if (issue.code !== 'source-mismatch') return null;

  const required = frame.action.requiredSource;
  const planned = frame.before[frame.action.propId];
  if (!required || !available(planned)) return null;

  const cue = scenario.cues.find(entry => entry.id === frame.cueId);
  if (!cue) return null;
  const index = cue.actions.findIndex(action => action.id === frame.actionId);
  if (index === -1) return null;

  const sameZone = planned.zoneId === required.zoneId;
  const plannedHolder = planned.holderId ?? null;
  const requiredHolder = required.holderId ?? null;

  // The missing handoff: it is in the right place, in the wrong hands.
  if (sameZone && plannedHolder !== requiredHolder && plannedHolder !== null && requiredHolder !== null) {
    const action: Action = {
      id: freeActionId(scenario, `fix-transfer-${frame.action.propId}`),
      propId: frame.action.propId,
      kind: 'transfer',
      requiredSource: { zoneId: planned.zoneId, holderId: plannedHolder },
      destination: { zoneId: required.zoneId, holderId: requiredHolder },
      note: 'Added by a guided fix: the handoff this cue assumed had already happened.',
    };
    return {
      description: `Insert a handoff of ${propName} (${frame.action.propId}) from ${name(scenario, 'holders', plannedHolder)} to ${name(scenario, 'holders', requiredHolder)}, in cue "${cue.title}", as step ${index + 1} — immediately before the step that fails. It leaves the piece at ${where(scenario, required)}.`,
      cueId: cue.id,
      index,
      action,
    };
  }

  // The missing move: nobody is holding it, it is simply in the wrong place.
  if (!sameZone && plannedHolder === null && requiredHolder === null) {
    const action: Action = {
      id: freeActionId(scenario, `fix-place-${frame.action.propId}`),
      propId: frame.action.propId,
      kind: 'place',
      requiredSource: { zoneId: planned.zoneId, holderId: null },
      destination: { zoneId: required.zoneId, holderId: null },
      note: 'Added by a guided fix: the move this cue assumed had already happened.',
    };
    return {
      description: `Insert a move of ${propName} (${frame.action.propId}) from ${name(scenario, 'zones', planned.zoneId)} to ${name(scenario, 'zones', required.zoneId)}, in cue "${cue.title}", as step ${index + 1} — immediately before the step that fails.`,
      cueId: cue.id,
      index,
      action,
    };
  }

  return {
    advice: `${propName} (${frame.action.propId}) is needed at ${where(scenario, required)} but the plan leaves it at ${where(scenario, planned)}. More than one thing differs, so there is no single obvious step to add. Decide whether the requirement or the earlier plan is the one that is wrong, and edit that.`,
  };
}

/**
 * Applies a suggestion through the ordinary edit layer, so the result is validated the same way
 * any hand edit is and is undoable the same way. The action is appended and then moved into
 * place, because that is what the edit layer offers.
 */
export function applyFix(scenario: Scenario, fix: GuidedFix): EditResult<Scenario> {
  const added = addAction(scenario, fix.cueId, fix.action);
  if (added.blocked) return added;
  return moveAction(added.result, fix.cueId, fix.action.id, fix.index);
}
