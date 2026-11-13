// Kiro-authored (K3, 2026-11-13). The single derivation behind both readings of the
// stage: the diagram (zone cards with ghost and solid glyphs) and the list. Both views
// render from `deriveStageModel`, so they cannot disagree about where anything is.
//
// It reads the selected frame's BEFORE state and the action's authored requiredSource.
// It never fills a requirement from computed state.
import type { Frame, Scenario, PropState } from '../domain/types';

export type StageEntryType = 'required' | 'planned' | 'match' | 'mismatch' | 'other';

export interface StageEntry {
  propId: string;
  propName: string;
  type: StageEntryType;
  zoneId: string;
  zoneName: string;
  holderId: string | null;
  holderName: string;
  /** Word label shown on the glyph and in the list; the meaning never rests on colour. */
  label: string;
  /** Points at the other half of a ghost/solid pair that stands somewhere else. */
  pairNote?: string;
}

export type Verdict = 'match' | 'mismatch' | 'not-available' | 'no-requirement';

export interface StageSubject {
  propId: string;
  propName: string;
  /** The authored requirement for the selected action, or null when it has none. */
  required: { zoneId: string; zoneName: string; holderId: string | null; holderName: string } | null;
  /** The prop's planned state immediately before the selected action. */
  before: PropState;
  beforeZoneName: string | null;
  beforeHolderName: string | null;
  verdict: Verdict;
}

export interface StageModel {
  subject: StageSubject;
  /** Every entry, in display order: the selected prop first, then the others. */
  entries: StageEntry[];
}

/** Holder display name, or "resting" for a prop with no holder. */
export function holderDisplayName(scenario: Scenario, id: string | null): string {
  if (!id) return 'resting';
  return scenario.holders.find(h => h.id === id)?.name ?? id;
}

export function zoneDisplayName(scenario: Scenario, id: string): string {
  return scenario.zones.find(z => z.id === id)?.name ?? id;
}

export function deriveStageModel(scenario: Scenario, frame: Frame): StageModel {
  const { action, before } = frame;
  const prop = scenario.props.find(p => p.id === action.propId);
  const propName = prop?.name || action.propId;
  const requiredSource = action.requiredSource;
  const planned = before[action.propId];
  const entries: StageEntry[] = [];

  let verdict: Verdict = 'no-requirement';
  if (requiredSource) {
    verdict = planned.status !== 'available'
      ? 'not-available'
      : planned.zoneId === requiredSource.zoneId && planned.holderId === requiredSource.holderId
        ? 'match'
        : 'mismatch';
  }

  if (requiredSource) {
    const entry: StageEntry = {
      propId: action.propId,
      propName,
      type: verdict === 'match' ? 'match' : verdict === 'mismatch' ? 'mismatch' : 'required',
      zoneId: requiredSource.zoneId,
      zoneName: zoneDisplayName(scenario, requiredSource.zoneId),
      holderId: requiredSource.holderId,
      holderName: holderDisplayName(scenario, requiredSource.holderId),
      label: `${verdict === 'match' ? 'MATCH' : verdict === 'mismatch' ? 'MISMATCH' : 'REQUIRED'}: ${propName} (${action.propId})`,
    };
    if (planned.status === 'available' && verdict === 'mismatch') {
      entry.pairNote = `\u2192 Not here. Before this step it is at ${zoneDisplayName(scenario, planned.zoneId)} / ${holderDisplayName(scenario, planned.holderId)}.`;
    } else if (planned.status !== 'available') {
      entry.pairNote = `\u2192 Not here. Before this step it is ${planned.status}.`;
    }
    entries.push(entry);
  }

  if (planned.status === 'available' && verdict !== 'match') {
    entries.push({
      propId: action.propId,
      propName,
      type: 'planned',
      zoneId: planned.zoneId,
      zoneName: zoneDisplayName(scenario, planned.zoneId),
      holderId: planned.holderId,
      holderName: holderDisplayName(scenario, planned.holderId),
      label: `BEFORE: ${propName} (${action.propId})`,
      pairNote: requiredSource
        ? `\u2192 The step requires it at ${zoneDisplayName(scenario, requiredSource.zoneId)} / ${holderDisplayName(scenario, requiredSource.holderId)}.`
        : undefined,
    });
  }

  // Other instances in their before positions, in scenario declaration order so the
  // order is stable and independent of how the state map happens to be keyed.
  for (const p of scenario.props) {
    if (p.id === action.propId) continue;
    const state = before[p.id];
    if (!state || state.status !== 'available') continue;
    entries.push({
      propId: p.id,
      propName: p.name || p.id,
      type: 'other',
      zoneId: state.zoneId,
      zoneName: zoneDisplayName(scenario, state.zoneId),
      holderId: state.holderId,
      holderName: holderDisplayName(scenario, state.holderId),
      label: `${p.name || p.id} (${p.id})`,
    });
  }

  return {
    subject: {
      propId: action.propId,
      propName,
      required: requiredSource
        ? {
            zoneId: requiredSource.zoneId,
            zoneName: zoneDisplayName(scenario, requiredSource.zoneId),
            holderId: requiredSource.holderId,
            holderName: holderDisplayName(scenario, requiredSource.holderId),
          }
        : null,
      before: planned,
      beforeZoneName: planned.status === 'available' ? zoneDisplayName(scenario, planned.zoneId) : null,
      beforeHolderName: planned.status === 'available' ? holderDisplayName(scenario, planned.holderId) : null,
      verdict,
    },
    entries,
  };
}

/** Plain-language verdict sentence, shared by the list view and its tests. */
export function verdictSentence(subject: StageSubject): string {
  const who = `${subject.propName} (${subject.propId})`;
  const req = subject.required ? `${subject.required.zoneName} / ${subject.required.holderName}` : null;
  const bef = subject.beforeZoneName !== null ? `${subject.beforeZoneName} / ${subject.beforeHolderName}` : subject.before.status;
  switch (subject.verdict) {
    case 'match':
      return `Agrees: ${who} is required at ${req} and the plan has it there before this step.`;
    case 'mismatch':
      return `Does not agree: ${who} is required at ${req}, but before this step the plan has it at ${bef}.`;
    case 'not-available':
      return `Does not agree: ${who} is required at ${req}, but before this step it is ${bef}.`;
    case 'no-requirement':
      return `No source requirement: this step does not name where ${who} must come from. Before this step it is ${subject.beforeZoneName !== null ? `at ${bef}` : bef}.`;
  }
}
