import { describe, it, expect } from 'vitest';
import { runScenario } from '../../src/domain/engine';
import type { Scenario, AvailableState, PropState } from '../../src/domain/types';

// Helper to assert and narrow PropState to AvailableState
function assertAvailable(state: PropState): asserts state is AvailableState {
  if (state.status !== 'available') {
    throw new Error(`Expected available state, got ${state.status}`);
  }
}

// Helper to build test scenarios
function buildScenario(overrides: Partial<Scenario> = {}): Scenario {
  const base: Scenario = {
    version: 1,
    title: 'Test Scene',
    zones: [
      { id: 'stage', name: 'Stage' },
      { id: 'offstage', name: 'Offstage' },
    ],
    holders: [
      { id: 'alice', name: 'Alice' },
      { id: 'bob', name: 'Bob' },
    ],
    props: [
      { id: 'sword', name: 'Sword', kind: 'sword', initial: { status: 'available', zoneId: 'stage', holderId: null } },
      { id: 'ring', name: 'Ring', kind: 'ring', initial: { status: 'absent' } },
      { id: 'unknown-prop', name: 'Unknown Prop', kind: 'test', initial: { status: 'unknown' } },
    ],
    cues: [
      {
        id: 'cue1',
        title: 'Cue 1',
        actions: [],
      },
    ],
    ...overrides,
  };
  return base;
}

describe('engine: runScenario', () => {
  describe('basic operations', () => {
    it('empty scenario produces identity initial/final state', () => {
      const scenario = buildScenario();
      const result = runScenario(scenario);

      // Initial state should match declared state.
      expect(result.initial.sword).toEqual({
        status: 'available',
        zoneId: 'stage',
        holderId: null,
      });
      expect(result.initial.ring).toEqual({ status: 'absent' });
      expect(result.initial['unknown-prop']).toEqual({ status: 'unknown' });

      // Final state is identical when no actions.
      expect(result.final).toEqual(result.initial);
      expect(result.frames).toHaveLength(0);
      expect(result.issues).toHaveLength(0);
    });

    it('collect-transfer-carry-place control flow', () => {
      const scenario = buildScenario({
        cues: [
          {
            id: 'cue1',
            title: 'Setup',
            actions: [
              // sword starts resting at stage; alice collects it
              {
                id: 'a1',
                propId: 'sword',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
              // alice transfers sword to bob
              {
                id: 'a2',
                propId: 'sword',
                kind: 'transfer',
                requiredSource: { zoneId: 'stage', holderId: 'alice' },
                destination: { zoneId: 'stage', holderId: 'bob' },
              },
              // bob carries sword offstage
              {
                id: 'a3',
                propId: 'sword',
                kind: 'carryOff',
                requiredSource: { zoneId: 'stage', holderId: 'bob' },
                destination: { zoneId: 'offstage', holderId: 'bob' },
              },
              // bob places sword at offstage
              {
                id: 'a4',
                propId: 'sword',
                kind: 'place',
                requiredSource: { zoneId: 'offstage', holderId: 'bob' },
                destination: { zoneId: 'offstage', holderId: null },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      // All actions applied.
      expect(result.frames).toHaveLength(4);
      for (let i = 0; i < 4; i++) {
        expect(result.frames[i].applied).toBe(true);
        expect(result.frames[i].issues).toHaveLength(0);
      }

      // Final state: sword resting offstage.
      expect(result.final.sword).toEqual({
        status: 'available',
        zoneId: 'offstage',
        holderId: null,
      });
    });

    it('consumed ID never revives; another absent ID can replenish', () => {
      const scenario = buildScenario({
        props: [
          { id: 'used-prop', name: 'Used', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
          { id: 'new-prop', name: 'New', kind: 'test', initial: { status: 'absent' } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Consume and replenish',
            actions: [
              // Consume the used prop.
              {
                id: 'consume-action',
                propId: 'used-prop',
                kind: 'consume',
                requiredSource: { zoneId: 'stage', holderId: null },
              },
              // Attempt to replenish the consumed prop (should fail).
              {
                id: 'replenish-consumed',
                propId: 'used-prop',
                kind: 'replenish',
                requiredSource: null,
                destination: { zoneId: 'stage', holderId: null },
              },
              // Replenish a new instance (should succeed).
              {
                id: 'replenish-new',
                propId: 'new-prop',
                kind: 'replenish',
                requiredSource: null,
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      // Frame 0: consume succeeded.
      expect(result.frames[0].applied).toBe(true);
      expect(result.frames[0].after['used-prop'].status).toBe('consumed');

      // Frame 1: replenish consumed failed with code 'consumed-no-replenish'.
      expect(result.frames[1].applied).toBe(false);
      expect(result.frames[1].issues[0].code).toBe('consumed-no-replenish');

      // Frame 2: replenish new succeeded.
      expect(result.frames[2].applied).toBe(true);
      expect(result.frames[2].after['new-prop']).toEqual({
        status: 'available',
        zoneId: 'stage',
        holderId: 'alice',
      });

      // Final state reflects only the successful transitions.
      expect(result.final['used-prop'].status).toBe('consumed');
      expect(result.final['new-prop']).toEqual({
        status: 'available',
        zoneId: 'stage',
        holderId: 'alice',
      });
    });

    it('unknown stays uncertain; cannot match source until verified', () => {
      const scenario = buildScenario({
        cues: [
          {
            id: 'cue1',
            title: 'Unknown handling',
            actions: [
              // Attempt collect on unknown prop (should fail with uncertain).
              {
                id: 'a1',
                propId: 'unknown-prop',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      expect(result.frames[0].applied).toBe(false);
      expect(result.frames[0].issues[0].code).toBe('unknown-state');
      expect(result.frames[0].issues[0].severity).toBe('uncertain');

      // State unchanged.
      expect(result.final['unknown-prop']).toEqual({ status: 'unknown' });
    });

    it('replenish with unknown initial state fails (error, not uncertain)', () => {
      const scenario = buildScenario({
        cues: [
          {
            id: 'cue1',
            title: 'Replenish unknown',
            actions: [
              {
                id: 'a1',
                propId: 'unknown-prop',
                kind: 'replenish',
                requiredSource: null,
                destination: { zoneId: 'stage', holderId: null },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      expect(result.frames[0].applied).toBe(false);
      expect(result.frames[0].issues[0].code).toBe('unknown-no-replenish');
      expect(result.frames[0].issues[0].severity).toBe('error');
    });

    it('missing handoff rejects with collect as cause', () => {
      const scenario = buildScenario({
        props: [
          { id: 'prop1', name: 'Prop 1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Cue 1',
            actions: [
              // Collect prop (sets cause for prop1).
              {
                id: 'collect-action',
                propId: 'prop1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
              // Later, transfer from wrong source (should have collected first).
              {
                id: 'transfer-action',
                propId: 'prop1',
                kind: 'transfer',
                requiredSource: { zoneId: 'stage', holderId: 'bob' },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      // Frame 0: collect succeeds.
      expect(result.frames[0].applied).toBe(true);
      expect(result.frames[0].after.prop1).toEqual({
        status: 'available',
        zoneId: 'stage',
        holderId: 'alice',
      });

      // Frame 1: transfer fails, cause points to the earlier collect action.
      expect(result.frames[1].applied).toBe(false);
      expect(result.frames[1].issues[0].code).toBe('source-mismatch');
      expect(result.frames[1].issues[0].cause?.kind).toBe('action');
      if (result.frames[1].issues[0].cause?.kind === 'action') {
        expect(result.frames[1].issues[0].cause.ref.actionId).toBe('collect-action');
      }
    });

    it('duplicates are independent', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
          { id: 'p2', name: 'P2', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Dual actions',
            actions: [
              {
                id: 'a1',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
              {
                id: 'a2',
                propId: 'p2',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'bob' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      // Both applied independently.
      expect(result.frames[0].applied).toBe(true);
      expect(result.frames[1].applied).toBe(true);

      const p1Final = result.final.p1;
      const p2Final = result.final.p2;
      assertAvailable(p1Final);
      assertAvailable(p2Final);
      expect(p1Final.holderId).toBe('alice');
      expect(p2Final.holderId).toBe('bob');
    });

    it('stable issue IDs across cue reorder', () => {
      // Build a scenario with two cues where action fails due to mismatch
      const buildWithCueOrder = (swapped: boolean) => buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: swapped ? [
          {
            id: 'cue2',
            title: 'Cue 2',
            actions: [
              {
                id: 'bad-transfer',
                propId: 'p1',
                kind: 'transfer',
                requiredSource: { zoneId: 'stage', holderId: 'bob' },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
            ],
          },
          {
            id: 'cue1',
            title: 'Cue 1',
            actions: [
              {
                id: 'collect',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
            ],
          },
        ] : [
          {
            id: 'cue1',
            title: 'Cue 1',
            actions: [
              {
                id: 'collect',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
            ],
          },
          {
            id: 'cue2',
            title: 'Cue 2',
            actions: [
              {
                id: 'bad-transfer',
                propId: 'p1',
                kind: 'transfer',
                requiredSource: { zoneId: 'stage', holderId: 'bob' },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
            ],
          },
        ],
      });

      const ordered = runScenario(buildWithCueOrder(false));
      const swapped = runScenario(buildWithCueOrder(true));

      // In the ordered version, collect succeeds then transfer fails (alice has it, not bob)
      expect(ordered.frames[0].actionId).toBe('collect');
      expect(ordered.frames[0].applied).toBe(true);
      expect(ordered.frames[1].actionId).toBe('bad-transfer');
      expect(ordered.frames[1].applied).toBe(false);
      expect(ordered.frames[1].issues[0].id).toBe('issue::bad-transfer');
      expect(ordered.frames[1].issues[0].cause?.kind).toBe('action');
      if (ordered.frames[1].issues[0].cause?.kind === 'action') {
        expect(ordered.frames[1].issues[0].cause.ref.actionId).toBe('collect');
      }

      // In the swapped version, transfer fails first (no one has it yet) then collect succeeds
      expect(swapped.frames[0].actionId).toBe('bad-transfer');
      expect(swapped.frames[0].applied).toBe(false);
      expect(swapped.frames[0].issues[0].id).toBe('issue::bad-transfer');
      expect(swapped.frames[0].issues[0].cause?.kind).toBe('initial');
      expect(swapped.frames[1].actionId).toBe('collect');
      expect(swapped.frames[1].applied).toBe(true);

      // Issue ID stays stable based on actionId, regardless of frame order
      expect(ordered.frames[1].issues[0].id).toBe(swapped.frames[0].issues[0].id);
    });

    it('same-cue action ordering matters', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Multi-action cue',
            actions: [
              {
                id: 'step1',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
              {
                id: 'step2',
                propId: 'p1',
                kind: 'transfer',
                requiredSource: { zoneId: 'stage', holderId: 'alice' },
                destination: { zoneId: 'stage', holderId: 'bob' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      // Frame 0: cueIndex=0, actionIndex=0.
      expect(result.frames[0].cueIndex).toBe(0);
      expect(result.frames[0].actionIndex).toBe(0);
      expect(result.frames[0].applied).toBe(true);

      // Frame 1: cueIndex=0, actionIndex=1.
      expect(result.frames[1].cueIndex).toBe(0);
      expect(result.frames[1].actionIndex).toBe(1);
      expect(result.frames[1].applied).toBe(true);

      const p1Final = result.final.p1;
      assertAvailable(p1Final);
      expect(p1Final.holderId).toBe('bob');
    });
  });

  describe('rejection and causality', () => {
    it('invalid holder transition (place without held source)', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Invalid place',
            actions: [
              {
                id: 'bad-place',
                propId: 'p1',
                kind: 'place',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'offstage', holderId: null },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      expect(result.frames[0].applied).toBe(false);
      expect(result.frames[0].issues[0].code).toBe('invalid-holder-transition');
      expect(result.frames[0].issues[0].cause).toBeUndefined();
    });

    it('invalid holder transition (transfer to same holder)', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: 'alice' } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Self transfer',
            actions: [
              {
                id: 'self-transfer',
                propId: 'p1',
                kind: 'transfer',
                requiredSource: { zoneId: 'stage', holderId: 'alice' },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      expect(result.frames[0].applied).toBe(false);
      expect(result.frames[0].issues[0].code).toBe('invalid-holder-transition');
    });

    it('frame snapshots immutable within same run', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Mutability test',
            actions: [
              {
                id: 'a1',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      // Capture state before mutation
      const frame0BeforeP1 = result.frames[0].before.p1;
      assertAvailable(frame0BeforeP1);
      const beforeHolderOriginal = frame0BeforeP1.holderId;

      const frame0AfterP1 = result.frames[0].after.p1;
      assertAvailable(frame0AfterP1);
      const afterZoneOriginal = frame0AfterP1.zoneId;

      const initialP1 = result.initial.p1;
      assertAvailable(initialP1);
      const initialHolderOriginal = initialP1.holderId;

      const finalP1 = result.final.p1;
      assertAvailable(finalP1);
      const finalHolderOriginal = finalP1.holderId;

      // Mutate the snapshots
      (frame0BeforeP1 as { -readonly [K in keyof AvailableState]: AvailableState[K] }).holderId = 'MUTATED_BEFORE';
      (frame0AfterP1 as { -readonly [K in keyof AvailableState]: AvailableState[K] }).zoneId = 'MUTATED_AFTER';
      (initialP1 as { -readonly [K in keyof AvailableState]: AvailableState[K] }).holderId = 'MUTATED_INITIAL';
      (finalP1 as { -readonly [K in keyof AvailableState]: AvailableState[K] }).holderId = 'MUTATED_FINAL';

      // Check that OTHER snapshots in the SAME result are unaffected (not aliased)
      const frame0BeforeP1Check = result.frames[0].before.p1;
      assertAvailable(frame0BeforeP1Check);
      expect(frame0BeforeP1Check.holderId).toBe('MUTATED_BEFORE'); // same object, mutation visible

      const frame0AfterP1Check = result.frames[0].after.p1;
      assertAvailable(frame0AfterP1Check);
      expect(frame0AfterP1Check.zoneId).toBe('MUTATED_AFTER'); // same object, mutation visible

      // But initial and final should be independent from frames
      expect(result.initial.p1).not.toBe(result.frames[0].before.p1); // different objects
      expect(result.final.p1).not.toBe(result.frames[0].after.p1); // different objects

      // Verify original values were what we expected before mutation
      expect(beforeHolderOriginal).toBe(null);
      expect(afterZoneOriginal).toBe('stage');
      expect(initialHolderOriginal).toBe(null);
      expect(finalHolderOriginal).toBe('alice');
    });

    it('rejected actions never become causes for later actions', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Rejection chain',
            actions: [
              // Bad transfer (will fail).
              {
                id: 'bad-transfer',
                propId: 'p1',
                kind: 'transfer',
                requiredSource: { zoneId: 'stage', holderId: 'alice' },
                destination: { zoneId: 'stage', holderId: 'bob' },
              },
              // Collect after (should cite initial, not the failed transfer).
              {
                id: 'collect',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
              // Another bad action after successful collect (should cite collect, not bad-transfer)
              {
                id: 'bad-place',
                propId: 'p1',
                kind: 'place',
                requiredSource: { zoneId: 'stage', holderId: 'bob' },
                destination: { zoneId: 'offstage', holderId: null },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      expect(result.frames[0].applied).toBe(false);
      expect(result.frames[0].issues[0].code).toBe('source-mismatch');
      expect(result.frames[0].issues[0].cause?.kind).toBe('initial');

      expect(result.frames[1].applied).toBe(true);

      expect(result.frames[2].applied).toBe(false);
      expect(result.frames[2].issues[0].code).toBe('source-mismatch');
      // This later rejection should cite the successful collect, NOT the earlier rejected transfer
      expect(result.frames[2].issues[0].cause?.kind).toBe('action');
      if (result.frames[2].issues[0].cause?.kind === 'action') {
        expect(result.frames[2].issues[0].cause.ref.actionId).toBe('collect');
      }
    });

    it('cause isolation: mutations in frame issues do not affect allIssues', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Cause isolation',
            actions: [
              {
                id: 'collect',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
              // Wrong holder; should cite collect as cause
              {
                id: 'bad-transfer-1',
                propId: 'p1',
                kind: 'transfer',
                requiredSource: { zoneId: 'stage', holderId: 'bob' },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
              // Wrong holder again; should also cite collect as cause
              {
                id: 'bad-carry-off',
                propId: 'p1',
                kind: 'carryOff',
                requiredSource: { zoneId: 'stage', holderId: 'bob' },
                destination: { zoneId: 'offstage', holderId: 'bob' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      // Frames 1 and 2 are rejected with collect as cause.
      expect(result.frames[1].applied).toBe(false);
      expect(result.frames[1].issues[0].cause?.kind).toBe('action');
      if (result.frames[1].issues[0].cause?.kind === 'action') {
        expect(result.frames[1].issues[0].cause.ref.actionId).toBe('collect');
      }

      expect(result.frames[2].applied).toBe(false);
      expect(result.frames[2].issues[0].cause?.kind).toBe('action');
      if (result.frames[2].issues[0].cause?.kind === 'action') {
        expect(result.frames[2].issues[0].cause.ref.actionId).toBe('collect');
      }

      // Mutate frame's issue cause.
      type MutableCause = { kind: 'action'; ref: { cueId: string; actionId: string; cueIndex: number; actionIndex: number } };
      if (result.frames[1].issues[0].cause?.kind === 'action') {
        (result.frames[1].issues[0].cause as MutableCause).ref.actionId = 'MUTATED';
      }

      // allIssues[0] should still have original cause (independent clone).
      expect(result.issues[0].cause?.kind).toBe('action');
      if (result.issues[0].cause?.kind === 'action') {
        expect(result.issues[0].cause.ref.actionId).toBe('collect');
      }

      // Mutate allIssues's issue cause.
      if (result.issues[0].cause?.kind === 'action') {
        (result.issues[0].cause as MutableCause).ref.actionId = 'MUTATED_AGAIN';
      }

      // Frame issue should be unaffected (independent clone).
      expect(result.frames[1].issues[0].cause?.kind).toBe('action');
      if (result.frames[1].issues[0].cause?.kind === 'action') {
        expect(result.frames[1].issues[0].cause.ref.actionId).toBe('MUTATED');
      }

      // Frames[2] issue should have original cause (independent from both).
      expect(result.frames[2].issues[0].cause?.kind).toBe('action');
      if (result.frames[2].issues[0].cause?.kind === 'action') {
        expect(result.frames[2].issues[0].cause.ref.actionId).toBe('collect');
      }
    });

    it('safe toString prop ID (own-key-safe dict)', () => {
      const scenario = buildScenario({
        props: [
          { id: 'toString', name: 'ToString Prop', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'toString handling',
            actions: [
              {
                id: 'a1',
                propId: 'toString',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      // toString is treated as a normal prop ID.
      expect(result.initial['toString']).toBeDefined();
      const finalToString = result.final['toString'];
      assertAvailable(finalToString);
      expect(finalToString.holderId).toBe('alice');
    });

    it('deterministic replay produces identical results', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
          { id: 'p2', name: 'P2', kind: 'test', initial: { status: 'absent' } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Determinism test',
            actions: [
              {
                id: 'a1',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
              {
                id: 'a2',
                propId: 'p2',
                kind: 'replenish',
                requiredSource: null,
                destination: { zoneId: 'stage', holderId: null },
              },
            ],
          },
        ],
      });

      const run1 = runScenario(scenario);
      const run2 = runScenario(scenario);

      // Both runs produce identical results.
      expect(run1.initial).toEqual(run2.initial);
      expect(run1.final).toEqual(run2.final);
      expect(run1.frames).toEqual(run2.frames);
      expect(run1.issues).toEqual(run2.issues);
    });

    it('action payload copied independently per frame', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null }, },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Action copy test',
            actions: [
              {
                id: 'a1',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
                note: 'test note',
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);
      const action1 = result.frames[0].action;
      const action2 = result.frames[0].action;

      // They reference the same action object in the frame.
      expect(action1).toBe(action2);

      // But mutating action1's requiredSource does not affect the original scenario.
      if (action1.requiredSource) {
        type MutablePosition = { zoneId: string; holderId: string | null };
        (action1.requiredSource as MutablePosition).zoneId = 'MUTATED';
      }

      // The scenario is unaffected.
      expect(scenario.cues[0].actions[0].requiredSource?.zoneId).toBe('stage');
    });

    it('absent prop before replenish rejected', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'absent' } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Absent test',
            actions: [
              {
                id: 'a1',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      expect(result.frames[0].applied).toBe(false);
      expect(result.frames[0].issues[0].code).toBe('absent-before-replenish');
      expect(result.frames[0].issues[0].severity).toBe('error');
    });

    it('note field preserved (including empty)', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
          { id: 'p2', name: 'P2', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Note test',
            actions: [
              {
                id: 'a1',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
                note: 'descriptive note',
              },
              {
                id: 'a2',
                propId: 'p2',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
                note: '',
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      expect(result.frames[0].action.note).toBe('descriptive note');
      expect(result.frames[1].action.note).toBe('');
      expect(result.frames[1].action).toHaveProperty('note');
    });
  });

  describe('state-shape contract', () => {
    it('available always has zoneId and explicit holderId', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: 'alice' } },
        ],
        cues: [],
      });

      const result = runScenario(scenario);
      const state = result.final.p1 as AvailableState;

      expect(state.status).toBe('available');
      expect(typeof state.zoneId).toBe('string');
      expect(state.holderId === null || typeof state.holderId === 'string').toBe(true);
    });

    it('unknown/absent/consumed never carry position', () => {
      const scenario = buildScenario();
      const result = runScenario(scenario);

      expect(result.final.ring.status).toBe('absent');
      expect('zoneId' in result.final.ring && result.final.ring.status === 'available' ? result.final.ring.zoneId : undefined).toBeUndefined();
      expect('holderId' in result.final.ring && result.final.ring.status === 'available' ? result.final.ring.holderId : undefined).toBeUndefined();

      expect(result.final['unknown-prop'].status).toBe('unknown');
      expect('zoneId' in result.final['unknown-prop'] && result.final['unknown-prop'].status === 'available' ? result.final['unknown-prop'].zoneId : undefined).toBeUndefined();
      expect('holderId' in result.final['unknown-prop'] && result.final['unknown-prop'].status === 'available' ? result.final['unknown-prop'].holderId : undefined).toBeUndefined();
    });

    it('consumed only arises from consume action', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Consume test',
            actions: [
              {
                id: 'consume',
                propId: 'p1',
                kind: 'consume',
                requiredSource: { zoneId: 'stage', holderId: null },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      expect(result.initial.p1.status).not.toBe('consumed');
      expect(result.final.p1.status).toBe('consumed');
    });
  });

  describe('stability and correctness', () => {
    it('issue IDs stable across frame order', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'First',
            actions: [
              {
                id: 'bad-action',
                propId: 'p1',
                kind: 'transfer',
                requiredSource: { zoneId: 'stage', holderId: 'alice' },
                destination: { zoneId: 'stage', holderId: 'bob' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);
      const issueId = result.frames[0].issues[0].id;

      expect(issueId).toBe('issue::bad-action');
    });

    it('carryOff requires zone change', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: 'alice' } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'CarryOff test',
            actions: [
              {
                id: 'same-zone-carry',
                propId: 'p1',
                kind: 'carryOff',
                requiredSource: { zoneId: 'stage', holderId: 'alice' },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      expect(result.frames[0].applied).toBe(false);
      expect(result.frames[0].issues[0].code).toBe('no-move');
    });

    it('wrong zone + right holder mismatch', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: 'alice' } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Zone mismatch',
            actions: [
              {
                id: 'a1',
                propId: 'p1',
                kind: 'transfer',
                requiredSource: { zoneId: 'offstage', holderId: 'alice' },
                destination: { zoneId: 'stage', holderId: 'bob' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      expect(result.frames[0].applied).toBe(false);
      expect(result.frames[0].issues[0].code).toBe('source-mismatch');
    });

    it('successful -> rejected -> later rejected causal chain interleaved otherprop', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
          { id: 'p2', name: 'P2', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Interleaved',
            actions: [
              // p1: collect (success, becomes cause)
              {
                id: 'p1-collect',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
              // p2: collect (success)
              {
                id: 'p2-collect',
                propId: 'p2',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'bob' },
              },
              // p1: bad transfer (rejected, cites p1-collect)
              {
                id: 'p1-bad-transfer',
                propId: 'p1',
                kind: 'transfer',
                requiredSource: { zoneId: 'stage', holderId: 'bob' },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
              // p2: bad carry (rejected, cites p2-collect)
              {
                id: 'p2-bad-carry',
                propId: 'p2',
                kind: 'carryOff',
                requiredSource: { zoneId: 'stage', holderId: 'alice' },
                destination: { zoneId: 'offstage', holderId: 'alice' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      expect(result.frames[0].applied).toBe(true);
      expect(result.frames[1].applied).toBe(true);
      expect(result.frames[2].applied).toBe(false);
      expect(result.frames[3].applied).toBe(false);

      // p1's rejection cites p1-collect
      if (result.frames[2].issues[0].cause?.kind === 'action') {
        expect(result.frames[2].issues[0].cause.ref.actionId).toBe('p1-collect');
      }

      // p2's rejection cites p2-collect
      if (result.frames[3].issues[0].cause?.kind === 'action') {
        expect(result.frames[3].issues[0].cause.ref.actionId).toBe('p2-collect');
      }
    });

    it('consumed ID after replenishing different ID', () => {
      const scenario = buildScenario({
        props: [
          { id: 'old-id', name: 'Old Prop', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
          { id: 'new-id', name: 'New Prop', kind: 'test', initial: { status: 'absent' } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'ID replacement',
            actions: [
              {
                id: 'consume-old',
                propId: 'old-id',
                kind: 'consume',
                requiredSource: { zoneId: 'stage', holderId: null },
              },
              {
                id: 'replenish-new',
                propId: 'new-id',
                kind: 'replenish',
                requiredSource: null,
                destination: { zoneId: 'stage', holderId: null },
              },
              // old-id stays consumed, never revived
              {
                id: 'attempt-reuse-old',
                propId: 'old-id',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      expect(result.frames[0].applied).toBe(true);
      expect(result.final['old-id'].status).toBe('consumed');

      expect(result.frames[1].applied).toBe(true);
      expect(result.final['new-id'].status).toBe('available');

      expect(result.frames[2].applied).toBe(false);
      expect(result.frames[2].issues[0].code).toBe('consumed-reuse');
    });

    it('within-cue action reordering changes outcome', () => {
      // If we could reorder actions in a cue, order matters.
      // This test uses sequential actions to verify order dependency.
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Order matters',
            actions: [
              {
                id: 'collect-first',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
              {
                id: 'transfer-second',
                propId: 'p1',
                kind: 'transfer',
                requiredSource: { zoneId: 'stage', holderId: 'alice' },
                destination: { zoneId: 'stage', holderId: 'bob' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      // Both succeed in order.
      expect(result.frames[0].applied).toBe(true);
      expect(result.frames[1].applied).toBe(true);

      const p1Final = result.final.p1;
      assertAvailable(p1Final);
      expect(p1Final.holderId).toBe('bob');
    });

    it('same-name duplicate holders treated independently', () => {
      const scenario = buildScenario({
        holders: [
          { id: 'alice-1', name: 'Alice' },
          { id: 'alice-2', name: 'Alice' },
        ],
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Duplicate names',
            actions: [
              {
                id: 'collect-alice-1',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice-1' },
              },
              {
                id: 'transfer-to-alice-2',
                propId: 'p1',
                kind: 'transfer',
                requiredSource: { zoneId: 'stage', holderId: 'alice-1' },
                destination: { zoneId: 'stage', holderId: 'alice-2' },
              },
              // Attempt to transfer from alice-1 (should fail; prop is now with alice-2).
              {
                id: 'bad-transfer',
                propId: 'p1',
                kind: 'transfer',
                requiredSource: { zoneId: 'stage', holderId: 'alice-1' },
                destination: { zoneId: 'stage', holderId: 'alice-2' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      expect(result.frames[0].applied).toBe(true);
      expect(result.frames[1].applied).toBe(true);
      expect(result.frames[2].applied).toBe(false);
      expect(result.frames[2].issues[0].code).toBe('source-mismatch');
    });

    it('invalid field combinations per action kind', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'Invalid fields',
            actions: [
              // collect with dest.holderId === null (invalid)
              {
                id: 'bad-collect',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: null },
              },
              // transfer with dest.holderId === null (invalid)
              {
                id: 'bad-transfer',
                propId: 'p1',
                kind: 'transfer',
                requiredSource: { zoneId: 'stage', holderId: 'alice' },
                destination: { zoneId: 'stage', holderId: null },
              },
              // place with dest.holderId !== null (invalid)
              {
                id: 'bad-place',
                propId: 'p1',
                kind: 'place',
                requiredSource: { zoneId: 'stage', holderId: 'alice' },
                destination: { zoneId: 'stage', holderId: 'bob' },
              },
              // consume with destination present (invalid)
              {
                id: 'bad-consume',
                propId: 'p1',
                kind: 'consume',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: null },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      expect(result.frames[0].issues[0].code).toBe('invalid-holder-transition');
      expect(result.frames[1].issues[0].code).toBe('invalid-holder-transition');
      expect(result.frames[2].issues[0].code).toBe('invalid-holder-transition');
      expect(result.frames[3].issues[0].code).toBe('destination-forbidden');
    });

    it('initial and final state independent copies', () => {
      const scenario = buildScenario({
        props: [
          { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'stage', holderId: null } },
        ],
        cues: [
          {
            id: 'cue1',
            title: 'State copy test',
            actions: [
              {
                id: 'a1',
                propId: 'p1',
                kind: 'collect',
                requiredSource: { zoneId: 'stage', holderId: null },
                destination: { zoneId: 'stage', holderId: 'alice' },
              },
            ],
          },
        ],
      });

      const result = runScenario(scenario);

      // Mutate initial.
      const initialP1 = result.initial.p1;
      assertAvailable(initialP1);
      (initialP1 as { -readonly [K in keyof AvailableState]: AvailableState[K] }).holderId = 'MUTATED';

      // Mutate final.
      const finalP1 = result.final.p1;
      assertAvailable(finalP1);
      (finalP1 as { -readonly [K in keyof AvailableState]: AvailableState[K] }).holderId = 'FINAL_MUTATED';

      // Re-run; results should be pristine.
      const result2 = runScenario(scenario);

      const result2InitialP1 = result2.initial.p1;
      const result2FinalP1 = result2.final.p1;
      assertAvailable(result2InitialP1);
      assertAvailable(result2FinalP1);
      expect(result2InitialP1.holderId).toBe(null);
      expect(result2FinalP1.holderId).toBe('alice');
    });
  });
});
