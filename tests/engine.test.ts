import { describe, expect, it } from 'vitest';
import { countIssues, describeAction, frameOf, makeLabels, runScenario } from '../src/domain/engine';
import { parseScenario } from '../src/domain/schema';
import {
  consumedReuse, consumedReuseFixed, cueOrder, cueOrderSwapped, demoScenario,
  duplicateCopies, duplicateCopiesWrongInstance, EXAMPLES, missingHandoff, validControl,
} from '../src/domain/samples';
import type { Scenario } from '../src/domain/types';

const codes = (scenario: Scenario) => runScenario(scenario).issues.map(issue => issue.code);
const errors = (scenario: Scenario) => runScenario(scenario).issues.filter(issue => issue.severity === 'error');

describe('example scenes', () => {
  it('every bundled example is schema-valid', () => {
    for (const example of EXAMPLES) {
      const parsed = parseScenario(JSON.parse(JSON.stringify(example.build())));
      expect(parsed.success, `${example.id}: ${parsed.success ? '' : parsed.errors.join('; ')}`).toBe(true);
    }
  });
});

describe('acceptance scenario: valid control', () => {
  it('reports nothing on a complete, correctly recorded chain', () => {
    const run = runScenario(validControl());
    expect(run.issues).toEqual([]);
    expect(run.frames.every(frame => frame.applied)).toBe(true);
    expect(run.final['letter-A']).toEqual({
      status: 'available', zoneId: 'right-table', holderId: null,
      lastChange: { cueId: 'cue-4', actionId: 'a4', cueIndex: 3, actionIndex: 0 },
    });
  });
});

describe('acceptance scenario: missing handoff', () => {
  const scenario = missingHandoff();
  const run = runScenario(scenario);

  it('flags the required source against modelled state', () => {
    expect(codes(scenario)).toEqual(['source-mismatch']);
  });

  it('blames the earlier action that moved the piece, never a later one', () => {
    const issue = run.issues[0];
    expect(issue.cause).toEqual({ cueId: 'cue-1', actionId: 'a2', cueIndex: 0, actionIndex: 1 });
    const cause = frameOf(run, issue.cause);
    expect(cause!.index).toBeLessThan(run.frames.findIndex(frame => frame.actionId === issue.actionId));
  });

  it('does not rewrite the authored requirement to match the model', () => {
    expect(scenario.cues[1].actions[0].requiredSource).toEqual({ zoneId: 'left-table', holderId: null });
    const frame = run.frames.at(-1)!;
    expect(frame.applied).toBe(false);
    expect(frame.after['letter-A']).toEqual(frame.before['letter-A']);
  });
});

describe('acceptance scenario: consumed instance', () => {
  it('refuses to reuse a consumed instance', () => {
    expect(codes(consumedReuse())).toEqual(['consumed-reuse']);
    expect(runScenario(consumedReuse()).final['seal-A'].status).toBe('consumed');
  });

  it('accepts a new physical instance instead', () => {
    const run = runScenario(consumedReuseFixed());
    expect(run.issues).toEqual([]);
    expect(run.final['seal-A'].status).toBe('consumed');
    expect(run.final['seal-B']).toMatchObject({ status: 'available', zoneId: 'left-table', holderId: 'actor-a' });
  });

  it('refuses to revive a consumed instance with replenish', () => {
    const scenario = consumedReuseFixed();
    scenario.cues[1].actions[0] = { ...scenario.cues[1].actions[0], propId: 'seal-A' };
    expect(codes(scenario)).toContain('replenish-consumed');
  });
});

describe('acceptance scenario: identical copies', () => {
  it('keeps copies separate', () => {
    expect(runScenario(duplicateCopies()).issues).toEqual([]);
  });

  it('still rejects the copy that has already left', () => {
    const issues = errors(duplicateCopiesWrongInstance());
    expect(issues.map(issue => issue.code)).toEqual(['source-mismatch']);
    expect(issues[0].propId).toBe('letter-A');
  });
});

describe('acceptance scenario: cue order', () => {
  it('is valid as written and broken when reordered', () => {
    expect(runScenario(cueOrder()).issues).toEqual([]);
    const swapped = errors(cueOrderSwapped());
    expect(swapped.map(issue => issue.code)).toEqual(['source-mismatch']);
    expect(swapped[0].cause).toBeUndefined();
    expect(swapped[0].message).toContain('recorded starting state');
  });
});

describe('unknown starting state', () => {
  it('is uncertainty, not a definite error', () => {
    const run = runScenario(demoScenario());
    const lamp = run.issues.filter(issue => issue.propId === 'lamp-A');
    expect(lamp).toHaveLength(1);
    expect(lamp[0]).toMatchObject({ code: 'unknown-start', severity: 'uncertain' });
    expect(countIssues(run.issues).errors).toBe(0);
  });

  it('carries on from the stated requirement so later cues can still be checked', () => {
    const run = runScenario(demoScenario());
    const frame = run.frames.find(entry => entry.actionId === 'a7')!;
    expect(frame.applied).toBe(true);
    expect(frame.after['lamp-A']).toMatchObject({ status: 'available', zoneId: 'stage', holderId: 'actor-a' });
  });
});

describe('structural guards', () => {
  const single = (overrides: Partial<Scenario['cues'][number]['actions'][number]>): Scenario => ({
    ...validControl(),
    cues: [{ id: 'c', title: 'Test cue', actions: [{ id: 'x', propId: 'letter-A', kind: 'collect', requiredSource: { zoneId: 'left-table', holderId: null }, destination: { zoneId: 'left-table', holderId: 'actor-a' }, ...overrides }] }],
  });

  it('needs a destination where the action moves the piece', () => {
    expect(codes(single({ destination: undefined }))).toEqual(['destination-missing']);
  });

  it('needs a receiving holder for a collect or a handoff', () => {
    expect(codes(single({ destination: { zoneId: 'left-table', holderId: null } }))).toEqual(['holder-missing']);
  });

  it('refuses a place into someone\'s hands', () => {
    expect(codes(single({ kind: 'place', destination: { zoneId: 'left-table', holderId: 'actor-a' } }))).toEqual(['holder-unexpected']);
  });

  it('refuses a handoff to the same holder', () => {
    expect(codes(single({ kind: 'transfer', requiredSource: { zoneId: 'left-table', holderId: 'actor-a' }, destination: { zoneId: 'left-table', holderId: 'actor-a' } }))).toEqual(['transfer-same-holder']);
  });

  it('refuses to use an instance that is not in the scene', () => {
    const scenario = single({ propId: 'seal-B' });
    scenario.props = [...scenario.props, { id: 'seal-B', name: 'Wax seal B', kind: 'Wax seal', initial: { status: 'absent' } }];
    expect(codes(scenario)).toEqual(['absent-instance']);
  });

  it('marks an unrecorded source as uncertain rather than silently passing', () => {
    expect(codes(single({ requiredSource: null }))).toEqual(['source-not-recorded']);
  });

  it('tolerates an action pointing at an unknown prop id without throwing', () => {
    const scenario = single({ propId: 'ghost-of-a-prop' });
    expect(codes(scenario)).toEqual(['unknown-prop']);
  });
});

describe('immutability', () => {
  it('never mutates earlier frames or the initial state', () => {
    const scenario = demoScenario();
    const run = runScenario(scenario);
    expect(Object.isFrozen(run.initial)).toBe(true);
    expect(run.initial['letter-A']).toEqual({ status: 'available', zoneId: 'left-table', holderId: null });
    expect(run.frames[0].before).toBe(run.initial);
    for (const frame of run.frames) {
      expect(Object.isFrozen(frame.before)).toBe(true);
      expect(Object.isFrozen(frame.after)).toBe(true);
    }
  });
});

describe('step descriptions', () => {
  it('reads as plain language, and says so when a destination is missing', () => {
    const scenario = validControl();
    const labels = makeLabels(scenario);
    expect(describeAction(scenario.cues[0].actions[0], labels)).toBe('Actor A (Beatrice) collects Letter A from Left prop table (no holder)');
    expect(describeAction(scenario.cues[1].actions[0], labels)).toBe('Actor A (Beatrice) hands Letter A to Actor B (Lysander)');
    expect(describeAction(scenario.cues[2].actions[0], labels)).toBe('Actor B (Lysander) carries Letter A to Right wing');
    const broken = { ...scenario.cues[2].actions[0], destination: undefined };
    expect(describeAction(broken, labels)).toContain('not recorded');
    expect(describeAction({ ...scenario.cues[0].actions[0], kind: 'consume' as const }, labels)).toBe('Letter A is used up');
  });

  it('names an unknown id rather than hiding it', () => {
    const labels = makeLabels(validControl());
    expect(labels.prop('letter-Z')).toBe('letter-Z');
    expect(labels.holder(null)).toBe('no holder');
  });
});
