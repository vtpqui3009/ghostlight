import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { initialStateOf, runScenario } from '../src/domain/engine';
import { parseScenario } from '../src/domain/schema';
import type { Action, ActionKind, Scenario, StateMap } from '../src/domain/types';
import { ACTION_KINDS } from '../src/domain/types';

/**
 * Generated checks for the invariants the planning model has to keep. These are properties of
 * the model, not evidence that the model is useful to a stage manager.
 */

const ZONE_IDS = ['left-table', 'stage', 'right-wing'];
const HOLDER_IDS = ['actor-a', 'actor-b'];
const PROP_IDS = ['letter-A', 'letter-B', 'seal-A', 'key-A'];

const position = fc.record({
  zoneId: fc.constantFrom(...ZONE_IDS),
  holderId: fc.constantFrom<string | null>(...HOLDER_IDS, null),
});

const initial = fc.oneof(
  fc.record({ status: fc.constant<'available'>('available'), zoneId: fc.constantFrom(...ZONE_IDS), holderId: fc.constantFrom<string | null>(...HOLDER_IDS, null) }),
  fc.record({ status: fc.constantFrom<'unknown' | 'absent'>('unknown', 'absent') }),
);

const arbScenario: fc.Arbitrary<Scenario> = fc.record({
  propIds: fc.uniqueArray(fc.constantFrom(...PROP_IDS), { minLength: 1, maxLength: PROP_IDS.length }),
  initials: fc.array(initial, { minLength: PROP_IDS.length, maxLength: PROP_IDS.length }),
  cues: fc.array(
    fc.array(
      fc.record({
        propIndex: fc.nat({ max: PROP_IDS.length - 1 }),
        kind: fc.constantFrom<ActionKind>(...ACTION_KINDS),
        requiredSource: fc.option(position, { nil: null }),
        destination: fc.option(position, { nil: undefined }),
      }),
      { minLength: 1, maxLength: 3 },
    ),
    { minLength: 1, maxLength: 6 },
  ),
}).map(({ propIds, initials, cues }) => {
  let counter = 0;
  return {
    version: 1,
    title: 'Generated scene',
    zones: ZONE_IDS.map(id => ({ id, name: id })),
    holders: HOLDER_IDS.map(id => ({ id, name: id })),
    props: propIds.map((id, index) => ({ id, name: id, kind: 'generated', initial: initials[index] })),
    cues: cues.map((actions, cueIndex) => ({
      id: `cue-${cueIndex + 1}`,
      title: `Cue ${cueIndex + 1}`,
      actions: actions.map(({ propIndex, kind, requiredSource, destination }): Action => {
        counter += 1;
        return {
          id: `act-${counter}`,
          propId: propIds[propIndex % propIds.length],
          kind, requiredSource,
          ...(destination ? { destination } : {}),
        };
      }),
    })),
  } satisfies Scenario;
});

const sameState = (a: StateMap, b: StateMap) => expect(a).toStrictEqual(b);

describe('model invariants (generated)', () => {
  it('generated scenes stay inside the import schema', () => {
    fc.assert(fc.property(arbScenario, scenario => {
      const parsed = parseScenario(JSON.parse(JSON.stringify(scenario)));
      expect(parsed.success, parsed.success ? '' : parsed.errors.join('; ')).toBe(true);
    }), { numRuns: 200 });
  });

  it('single custody: an available instance has exactly one zone, and nothing else claims a position', () => {
    fc.assert(fc.property(arbScenario, scenario => {
      const run = runScenario(scenario);
      for (const frame of [...run.frames.map(entry => entry.after), run.initial]) {
        for (const state of Object.values(frame)) {
          if (state.status === 'available') {
            expect(typeof state.zoneId).toBe('string');
            expect(ZONE_IDS).toContain(state.zoneId);
            expect(state.holderId === null || HOLDER_IDS.includes(state.holderId!)).toBe(true);
          } else {
            expect(state.zoneId).toBeUndefined();
          }
        }
      }
    }), { numRuns: 200 });
  });

  it('consumption is terminal: a consumed instance never becomes available again', () => {
    fc.assert(fc.property(arbScenario, scenario => {
      const run = runScenario(scenario);
      const consumed = new Set<string>();
      for (const frame of run.frames) {
        for (const [propId, state] of Object.entries(frame.after)) {
          if (consumed.has(propId)) expect(state.status).toBe('consumed');
          if (state.status === 'consumed') consumed.add(propId);
        }
      }
    }), { numRuns: 200 });
  });

  it('determinism: the same scene replays to the same frames and findings', () => {
    fc.assert(fc.property(arbScenario, scenario => {
      const first = runScenario(scenario);
      const second = runScenario(JSON.parse(JSON.stringify(scenario)) as Scenario);
      expect(JSON.stringify(second)).toBe(JSON.stringify(first));
    }), { numRuns: 200 });
  });

  it('rejected actions leave modelled state untouched', () => {
    fc.assert(fc.property(arbScenario, scenario => {
      const run = runScenario(scenario);
      for (const frame of run.frames) {
        if (!frame.applied) {
          sameState(frame.after, frame.before);
          expect(frame.issues.some(issue => issue.severity === 'error')).toBe(true);
        } else {
          expect(frame.issues.every(issue => issue.severity === 'uncertain')).toBe(true);
        }
      }
    }), { numRuns: 200 });
  });

  it('every finding is attached to its own action, and any cause is a strictly earlier step on the same instance', () => {
    fc.assert(fc.property(arbScenario, scenario => {
      const run = runScenario(scenario);
      const order = new Map(run.frames.map(frame => [frame.actionId, frame.index]));
      for (const frame of run.frames) {
        for (const issue of frame.issues) {
          expect(issue.actionId).toBe(frame.actionId);
          expect(issue.cueId).toBe(frame.cueId);
          if (issue.cause) {
            expect(order.get(issue.cause.actionId)!).toBeLessThan(frame.index);
            const causeFrame = run.frames[order.get(issue.cause.actionId)!];
            expect(causeFrame.action.propId).toBe(issue.propId);
            expect(causeFrame.applied).toBe(true);
          }
        }
      }
    }), { numRuns: 300 });
  });

  it('the initial state only reflects authored starting positions', () => {
    fc.assert(fc.property(arbScenario, scenario => {
      const run = runScenario(scenario);
      sameState(run.initial, initialStateOf(scenario));
      for (const prop of scenario.props) {
        expect(run.initial[prop.id].status).toBe(prop.initial.status);
        expect(run.initial[prop.id].lastChange).toBeUndefined();
      }
    }), { numRuns: 100 });
  });

  it('a scene with no cues reports nothing and ends where it started', () => {
    fc.assert(fc.property(arbScenario, scenario => {
      const run = runScenario({ ...scenario, cues: [] });
      expect(run.issues).toEqual([]);
      sameState(run.final, run.initial);
    }), { numRuns: 50 });
  });
});
