// Kiro-authored (K3, 2026-11-13). Hand-calculated oracles: every frame below is built by
// hand, not produced by the engine, and every expected string is written out in full.
import { describe, it, expect } from 'vitest';
import type { Action, Frame, Scenario, StateMap } from '../../src/domain/types';
import { deriveStageModel, verdictSentence } from '../../src/ui/stageModel';
import { chooseInitialReading, storeReading, type ReadingEnv } from '../../src/ui/stageReading';

const scenario: Scenario = {
  version: 1,
  title: 'Hand-built',
  zones: [
    { id: 'L', name: 'Stage Left' },
    { id: 'R', name: 'Stage Right' },
  ],
  holders: [
    { id: 'A', name: 'Alice' },
    { id: 'B', name: 'Bob' },
  ],
  props: [
    { id: 'letter-A', name: 'Sealed Letter', kind: 'paper', initial: { status: 'available', zoneId: 'L', holderId: null } },
    { id: 'letter-B', name: 'Sealed Letter', kind: 'paper', initial: { status: 'available', zoneId: 'R', holderId: null } },
    { id: 'toString', name: 'Odd Id', kind: 'paper', initial: { status: 'absent' } },
  ],
  cues: [],
};

function stateMap(entries: Record<string, StateMap[string]>): StateMap {
  const m: StateMap = Object.create(null);
  for (const [k, v] of Object.entries(entries)) m[k] = v;
  return m;
}

function frame(action: Action, before: StateMap): Frame {
  return {
    index: 0, cueIndex: 0, actionIndex: 0, cueId: 'cue-1', actionId: action.id,
    action, before, after: before, issues: [], applied: false,
  };
}

const carryByB: Action = {
  id: 'a1', propId: 'letter-A', kind: 'carryOff',
  requiredSource: { zoneId: 'L', holderId: 'B' }, destination: { zoneId: 'R', holderId: 'B' },
};

describe('deriveStageModel — the one derivation both stage readings share', () => {
  it('missing handoff: the ghost and the solid are separate entries that point at each other', () => {
    const before = stateMap({
      'letter-A': { status: 'available', zoneId: 'L', holderId: 'A' },
      'letter-B': { status: 'available', zoneId: 'R', holderId: null },
      toString: { status: 'absent' as const },
    });
    const model = deriveStageModel(scenario, frame(carryByB, before));

    expect(model.subject.verdict).toBe('mismatch');
    expect(model.entries.map(e => [e.type, e.propId, e.zoneId, e.holderId])).toEqual([
      ['mismatch', 'letter-A', 'L', 'B'],
      ['planned', 'letter-A', 'L', 'A'],
      ['other', 'letter-B', 'R', null],
    ]);
    expect(model.entries[0].label).toBe('MISMATCH: Sealed Letter (letter-A)');
    expect(model.entries[0].pairNote).toBe('\u2192 Not here. Before this step it is at Stage Left / Alice.');
    expect(model.entries[1].label).toBe('BEFORE: Sealed Letter (letter-A)');
    expect(model.entries[1].pairNote).toBe('\u2192 The step requires it at Stage Left / Bob.');
    expect(model.entries[2].holderName).toBe('resting');
    expect(verdictSentence(model.subject)).toBe(
      'Does not agree: Sealed Letter (letter-A) is required at Stage Left / Bob, but before this step the plan has it at Stage Left / Alice.',
    );
  });

  it('match: one entry for the selected prop, no separate solid, and an "Agrees" sentence', () => {
    const before = stateMap({
      'letter-A': { status: 'available', zoneId: 'L', holderId: 'B' },
      'letter-B': { status: 'available', zoneId: 'R', holderId: null },
      toString: { status: 'absent' as const },
    });
    const model = deriveStageModel(scenario, frame(carryByB, before));
    expect(model.subject.verdict).toBe('match');
    expect(model.entries.filter(e => e.propId === 'letter-A').map(e => e.type)).toEqual(['match']);
    expect(model.entries[0].pairNote).toBeUndefined();
    expect(verdictSentence(model.subject)).toBe(
      'Agrees: Sealed Letter (letter-A) is required at Stage Left / Bob and the plan has it there before this step.',
    );
  });

  it('same-named duplicates stay distinct by id', () => {
    const before = stateMap({
      'letter-A': { status: 'available', zoneId: 'L', holderId: 'B' },
      'letter-B': { status: 'available', zoneId: 'L', holderId: 'B' },
      toString: { status: 'absent' as const },
    });
    const model = deriveStageModel(scenario, frame(carryByB, before));
    expect(model.entries.map(e => e.label)).toEqual([
      'MATCH: Sealed Letter (letter-A)',
      'Sealed Letter (letter-B)',
    ]);
  });

  it('a consumed subject shows only the ghost, and says the instance is consumed', () => {
    const before = stateMap({
      'letter-A': { status: 'consumed' },
      'letter-B': { status: 'available', zoneId: 'R', holderId: null },
      toString: { status: 'absent' as const },
    });
    const model = deriveStageModel(scenario, frame(carryByB, before));
    expect(model.subject.verdict).toBe('not-available');
    expect(model.entries.map(e => e.type)).toEqual(['required', 'other']);
    expect(model.entries[0].label).toBe('REQUIRED: Sealed Letter (letter-A)');
    expect(model.entries[0].pairNote).toBe('\u2192 Not here. Before this step it is consumed.');
    expect(verdictSentence(model.subject)).toBe(
      'Does not agree: Sealed Letter (letter-A) is required at Stage Left / Bob, but before this step it is consumed.',
    );
  });

  it('no requirement: the solid is shown without a pair note, and the sentence says so', () => {
    const replenish: Action = {
      id: 'a2', propId: 'toString', kind: 'replenish', requiredSource: null, destination: { zoneId: 'R', holderId: null },
    };
    const before = stateMap({
      'letter-A': { status: 'available', zoneId: 'L', holderId: null },
      'letter-B': { status: 'available', zoneId: 'R', holderId: null },
      toString: { status: 'absent' as const },
    });
    const model = deriveStageModel(scenario, frame(replenish, before));
    expect(model.subject.verdict).toBe('no-requirement');
    expect(model.subject.required).toBeNull();
    expect(model.entries.map(e => [e.type, e.propId])).toEqual([
      ['other', 'letter-A'],
      ['other', 'letter-B'],
    ]);
    expect(verdictSentence(model.subject)).toBe(
      'No source requirement: this step does not name where Odd Id (toString) must come from. Before this step it is absent.',
    );
  });

  it('never fills a requirement from computed state, and does not mutate its input', () => {
    const before = stateMap({
      'letter-A': { status: 'available', zoneId: 'R', holderId: 'A' },
      'letter-B': { status: 'available', zoneId: 'R', holderId: null },
      toString: { status: 'absent' as const },
    });
    const f = frame(carryByB, before);
    const snapshot = JSON.stringify(f);
    const model = deriveStageModel(scenario, f);
    expect(model.subject.required).toEqual({ zoneId: 'L', zoneName: 'Stage Left', holderId: 'B', holderName: 'Bob' });
    expect(JSON.stringify(f)).toBe(snapshot);
  });
});

describe('stage reading — diagram or list', () => {
  function env(stored: string | null, reduced: boolean, opts: { throwGet?: boolean; throwSet?: boolean } = {}) {
    const writes: string[] = [];
    const e: ReadingEnv = {
      getStored: () => { if (opts.throwGet) throw new Error('denied'); return stored; },
      setStored: (v) => { if (opts.throwSet) throw new Error('denied'); writes.push(v); },
      prefersReducedMotion: () => reduced,
    };
    return { e, writes };
  }

  it('defaults to the list under prefers-reduced-motion: reduce', () => {
    expect(chooseInitialReading(env(null, true).e)).toBe('list');
  });

  it('defaults to the diagram otherwise', () => {
    expect(chooseInitialReading(env(null, false).e)).toBe('diagram');
  });

  it('a remembered choice wins over the motion preference', () => {
    expect(chooseInitialReading(env('diagram', true).e)).toBe('diagram');
    expect(chooseInitialReading(env('list', false).e)).toBe('list');
  });

  it('ignores a garbage stored value and denied storage', () => {
    expect(chooseInitialReading(env('hologram', true).e)).toBe('list');
    expect(chooseInitialReading(env(null, true, { throwGet: true }).e)).toBe('list');
  });

  it('remembers a choice, and a denied write does not throw', () => {
    const ok = env(null, false);
    storeReading(ok.e, 'list');
    expect(ok.writes).toEqual(['list']);
    expect(() => storeReading(env(null, false, { throwSet: true }).e, 'diagram')).not.toThrow();
  });
});
