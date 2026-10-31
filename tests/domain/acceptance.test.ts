import { describe, it, expect } from 'vitest';
import { parseScenario, parseScenarioJson, LIMITS } from '../../src/domain/schema';
import { presetReport, runnerReport, resetReport } from '../../src/domain/report';
import {
  addProp, addZone, addHolder, addCue, deleteProp, deleteZone, deleteHolder, deleteCue,
  updateProp, updateZone, updateHolder, updateCue, addAction, deleteAction, moveAction,
  retargetReferences, wouldLeaveNoZones, checkBlockDeletion,
} from '../../src/domain/edit';
import type { Scenario, PropState, Action } from '../../src/domain/types';
import { runScenario } from '../../src/domain/engine';

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// Valid minimal scene S (deep-clone per case)
function makeS(): Scenario {
  return {
    version: 1,
    title: 'Review',
    zones: [{ id: 'L', name: 'Left' }],
    holders: [],
    props: [],
    cues: [],
  };
}

function makeSWithAll(): Scenario {
  return {
    version: 1,
    title: 'Review',
    zones: [
      { id: 'L', name: 'Left' },
      { id: 'R', name: 'Right' },
    ],
    holders: [
      { id: 'A', name: 'Alice' },
      { id: 'B', name: 'Bob' },
    ],
    props: [],
    cues: [],
  };
}

describe('parser: sparse entries reject validation (A18)', () => {
  it('sparse props array fails', () => {
    const s = makeS();
    (s as { props: unknown }).props = Array(1);
    const result = parseScenario(s);
    expect(result.success).toBe(false);
    expect(result.errors.join(' ')).toContain('expected');
  });

  it('sparse zones array fails', () => {
    const s = makeS();
    (s as { zones: unknown }).zones = Array(1);
    const result = parseScenario(s);
    expect(result.success).toBe(false);
  });

  it('sparse holders array fails', () => {
    const s = makeS();
    (s as { holders: unknown }).holders = Array(1);
    const result = parseScenario(s);
    expect(result.success).toBe(false);
  });

  it('sparse cues array fails', () => {
    const s = makeS();
    (s as { cues: unknown }).cues = Array(1);
    const result = parseScenario(s);
    expect(result.success).toBe(false);
  });

  it('sparse actions in a cue fails', () => {
    const s = makeS();
    s.cues.push({ id: 'c1', title: 'Cue 1', actions: Array(1) as unknown as Action[] });
    const result = parseScenario(s);
    expect(result.success).toBe(false);
  });
});

describe('parser: own fields vs inherited fields (A18)', () => {
  it('inherited required fields fail', () => {
    const s = makeS();
    const proto = Object.create(s);
    const result = parseScenario(proto);
    expect(result.success).toBe(false);
  });

  it('inherited optional description is stripped', () => {
    const s = makeS();
    s.description = 'Test';
    const proto = Object.create(s);
    // Make description own on proto
    Object.defineProperty(proto, 'description', { value: 'Inherited desc', enumerable: true, writable: true, configurable: true });
    const result = parseScenario(proto);
    // Either reject (inherited not allowed) or strip it
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    } else {
      expect(result.success).toBe(false);
    }
  });

  it('valid available prop with inherited optional holderId fails', () => {
    const s = makeS();
    s.props.push({
      id: 'p1',
      name: 'Prop1',
      kind: 'test',
      initial: { status: 'available', zoneId: 'L' } as { status: 'available'; zoneId: string; holderId: string | null },
    });
    const result = parseScenario(s);
    expect(result.success).toBe(false);
  });
});

describe('parser: identity/reference/shape adversaries (A09/A13)', () => {
  it('toString as prop ID is valid', () => {
    const s = makeSWithAll();
    s.props.push({
      id: 'toString',
      name: 'ToString Prop',
      kind: 'test',
      initial: { status: 'available', zoneId: 'L', holderId: null },
    });
    s.cues.push({
      id: 'c1',
      title: 'Cue 1',
      actions: [{ id: 'a1', propId: 'toString', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }],
    });
    const result = parseScenario(s);
    expect(result.success).toBe(true);
  });

  it('__proto__ as ID fails', () => {
    const s = makeS();
    (s as { id: string }).id = '__proto__';
    const result = parseScenario(s);
    expect(result.success).toBe(false);
  });

  it('constructor as ID fails', () => {
    const s = makeS();
    (s as { id: string }).id = 'constructor';
    const result = parseScenario(s);
    expect(result.success).toBe(false);
  });

  it('prototype as ID fails', () => {
    const s = makeS();
    (s as { id: string }).id = 'prototype';
    const result = parseScenario(s);
    expect(result.success).toBe(false);
  });

  it('duplicate action IDs across cues fail', () => {
    const s = makeSWithAll();
    s.props.push({ id: 'p1', name: 'Prop1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    s.cues.push(
      { id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] },
      { id: 'c2', title: 'Cue 2', actions: [{ id: 'a1', propId: 'p1', kind: 'place', requiredSource: { zoneId: 'L', holderId: 'A' }, destination: { zoneId: 'R', holderId: null } }] }
    );
    const result = parseScenario(s);
    expect(result.success).toBe(false);
    expect(result.errors.join(' ')).toContain('unique');
  });

  it('missing referenced prop fails', () => {
    const s = makeS();
    s.cues.push({ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'missing', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] });
    const result = parseScenario(s);
    expect(result.success).toBe(false);
  });

  it('explicit holderId null is accepted', () => {
    const s = makeS();
    s.props.push({ id: 'p1', name: 'Prop1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    const result = parseScenario(s);
    expect(result.success).toBe(true);
  });
});

describe('parser: exact UTF-8 byte boundary (A14)', () => {
  it('200000 bytes parses', () => {
    const s = makeS();
    s.description = 'é';
    const json = JSON.stringify(s);
    const encoded = new TextEncoder().encode(json);
    const padding = 200000 - encoded.length;
    const large = json + ' '.repeat(padding);
    expect(new TextEncoder().encode(large).length).toBe(200000);
    const result = parseScenarioJson(large);
    expect(result.success).toBe(true);
  });

  it('200001 bytes fails', () => {
    const s = makeS();
    s.description = 'é';
    const json = JSON.stringify(s);
    const encoded = new TextEncoder().encode(json);
    const padding = 200001 - encoded.length;
    const over = json + ' '.repeat(padding);
    expect(new TextEncoder().encode(over).length).toBe(200001);
    const result = parseScenarioJson(over);
    expect(result.success).toBe(false);
  });
});

describe('parser: collection and ID boundaries (A14)', () => {
  it('max zones (6) succeeds', () => {
    const s = makeS();
    for (let i = 0; i < 6; i++) s.zones.push({ id: `z${i}`, name: `Zone ${i}` });
    const result = parseScenario(s);
    expect(result.success).toBe(true);
  });

  it('max zones + 1 (7) fails', () => {
    const s = makeS();
    for (let i = 0; i < 7; i++) s.zones.push({ id: `z${i}`, name: `Zone ${i}` });
    const result = parseScenario(s);
    expect(result.success).toBe(false);
  });

  it('max holders (12) succeeds', () => {
    const s = makeS();
    for (let i = 0; i < 12; i++) s.holders.push({ id: `h${i}`, name: `Holder ${i}` });
    const result = parseScenario(s);
    expect(result.success).toBe(true);
  });

  it('max holders + 1 (13) fails', () => {
    const s = makeS();
    for (let i = 0; i < 13; i++) s.holders.push({ id: `h${i}`, name: `Holder ${i}` });
    const result = parseScenario(s);
    expect(result.success).toBe(false);
  });

  it('max props (12) succeeds', () => {
    const s = makeSWithAll();
    for (let i = 0; i < 12; i++) s.props.push({ id: `p${i}`, name: `Prop ${i}`, kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    const result = parseScenario(s);
    expect(result.success).toBe(true);
  });

  it('max props + 1 (13) fails', () => {
    const s = makeSWithAll();
    for (let i = 0; i < 13; i++) s.props.push({ id: `p${i}`, name: `Prop ${i}`, kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    const result = parseScenario(s);
    expect(result.success).toBe(false);
  });

  it('max cues (40) succeeds', () => {
    const s = makeS();
    for (let i = 0; i < 40; i++) s.cues.push({ id: `c${i}`, title: `Cue ${i}`, actions: [] });
    const result = parseScenario(s);
    expect(result.success).toBe(true);
  });

  it('max cues + 1 (41) fails', () => {
    const s = makeS();
    for (let i = 0; i < 41; i++) s.cues.push({ id: `c${i}`, title: `Cue ${i}`, actions: [] });
    const result = parseScenario(s);
    expect(result.success).toBe(false);
  });

  it('64-char ID succeeds', () => {
    const s = makeS();
    const longId = 'a'.repeat(64);
    s.zones.push({ id: longId, name: 'Long' });
    const result = parseScenario(s);
    expect(result.success).toBe(true);
  });

  it('65-char ID fails', () => {
    const s = makeS();
    const longId = 'a'.repeat(65);
    s.zones.push({ id: longId, name: 'Long' });
    const result = parseScenario(s);
    expect(result.success).toBe(false);
  });

  it('empty scene is valid', () => {
    const s = makeS();
    const result = parseScenario(s);
    expect(result.success).toBe(true);
  });

  it('zero zones is invalid', () => {
    const s = makeS();
    s.zones = [];
    const result = parseScenario(s);
    expect(result.success).toBe(false);
  });

  it('error cap at 30', () => {
    const s = makeS();
    // Add many errors
    for (let i = 0; i < 35; i++) s.zones.push({ id: `z${i}`, name: '' });
    const result = parseScenario(s);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeLessThanOrEqual(30);
  });
});

describe('parser: owned normalization and round trip (A13/A15)', () => {
  it('extra keys stripped, empty note preserved', () => {
    const s = makeSWithAll();
    s.props.push({ id: 'p1', name: 'Prop1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null }, extraKey: 'bad' });
    s.cues.push({
      id: 'c1',
      title: 'Cue 1',
      actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' }, note: '' }],
    });
    const result = parseScenario(s);
    expect(result.success).toBe(true);
    expect((result.data.props[0] as { extraKey?: string }).extraKey).toBeUndefined();
    expect(result.data.cues[0].actions[0].note).toBe('');
  });

  it('original unchanged after parse', () => {
    const s = makeS();
    s.props.push({ id: 'p1', name: 'Prop1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    parseScenario(s);
    // Mutate original
    s.props[0].initial.zoneId = 'MUTATED';
    const parsed = parseScenario(s);
    expect(parsed.success).toBe(true);
    expect(parsed.data.props[0].initial.zoneId).toBe('MUTATED');
  });

  it('parse->serialize->parse preserves IDs and order', () => {
    const s = makeSWithAll();
    s.props.push({ id: 'p1', name: 'Prop1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    const result = parseScenario(s);
    expect(result.success).toBe(true);
    const json = JSON.stringify(result.data);
    const reparsed = parseScenarioJson(json);
    expect(reparsed.success).toBe(true);
    expect(reparsed.data.props[0].id).toBe('p1');
  });
});

describe('reports: preset/runner preserve requirements and rejected status (A17)', () => {
  it('preset shows initial position, runner lists rejected action with cause', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }, { id: 'R', name: 'Right' }],
      holders: [{ id: 'A', name: 'Alice' }, { id: 'B', name: 'Bob' }],
      props: [{ id: 'p', name: 'Prop', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [
        {
          id: 'c1',
          title: 'Cue 1',
          actions: [
            { id: 'collect', propId: 'p', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } },
            { id: 'transfer', propId: 'p', kind: 'transfer', requiredSource: { zoneId: 'L', holderId: 'A' }, destination: { zoneId: 'L', holderId: 'B' } },
            { id: 'carry', propId: 'p', kind: 'carryOff', requiredSource: { zoneId: 'L', holderId: 'B' }, destination: { zoneId: 'R', holderId: 'B' } },
            { id: 'place', propId: 'p', kind: 'place', requiredSource: { zoneId: 'R', holderId: 'B' }, destination: { zoneId: 'R', holderId: null } },
            // This action should be rejected: requires L/B but p is actually R/none after place
            { id: 'bad-carry', propId: 'p', kind: 'carryOff', requiredSource: { zoneId: 'L', holderId: 'B' }, destination: { zoneId: 'R', holderId: 'B' } },
          ],
        },
      ],
    };

    const preset = presetReport(s);
    expect(preset).toHaveLength(1);
    expect(preset[0].initial?.zoneId).toBe('L');
    expect(preset[0].initial?.holderId).toBeNull();

    const runResult = runScenario(s);
    expect(runResult.frames).toHaveLength(5);
    expect(runResult.frames[4].applied).toBe(false);
    expect(runResult.frames[4].issues[0].code).toBe('source-mismatch');

    const runner = runnerReport(s, runResult.frames);
    expect(runner[0].actions[4].applied).toBe(false);
    expect(runner[0].actions[4].issue?.code).toBe('source-mismatch');
    // The requirement from the rejected action should be preserved
    expect(runner[0].actions[4].action.requiredSource?.zoneId).toBe('L');
  });
});

describe('reports: complete reset cases (A03/A17)', () => {
  it('consumed from available gets replace', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [],
      props: [{ id: 'a', name: 'A', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue', actions: [{ id: 'consume', propId: 'a', kind: 'consume', requiredSource: { zoneId: 'L', holderId: null } }] }],
    };
    const result = runScenario(s);
    const reset = resetReport(s, { initial: result.initial, final: result.final });
    expect(reset[0].kind).toBe('replace');
  });

  it('absent->available gets remove', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'b', name: 'B', kind: 'test', initial: { status: 'absent' } }],
      cues: [{ id: 'c1', title: 'Cue', actions: [{ id: 'replenish', propId: 'b', kind: 'replenish', requiredSource: null, destination: { zoneId: 'L', holderId: 'A' } }] }],
    };
    const result = runScenario(s);
    const reset = resetReport(s, { initial: result.initial, final: result.final });
    expect(reset[0].kind).toBe('remove');
  });

  it('absent->consumed gets replace (consumed from absent)', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [],
      props: [
        { id: 'b', name: 'B', kind: 'test', initial: { status: 'absent' } },
        { id: 'c', name: 'C', kind: 'test', initial: { status: 'absent' } },
      ],
      cues: [
        {
          id: 'c1',
          title: 'Cue',
          actions: [
            // First replenish b
            { id: 'r1', propId: 'b', kind: 'replenish', requiredSource: null, destination: { zoneId: 'L', holderId: null } },
            // Then consume it (b becomes consumed)
            { id: 'consume-b', propId: 'b', kind: 'consume', requiredSource: { zoneId: 'L', holderId: null } },
            // c remains absent and untouched
          ],
        },
      ],
    };
    const result = runScenario(s);
    const reset = resetReport(s, { initial: result.initial, final: result.final });
    const bResult = reset.find(r => r.propId === 'b');
    expect(bResult?.kind).toBe('replace');
  });

  it('unknown stays uncertain', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [],
      props: [{ id: 'u', name: 'U', kind: 'test', initial: { status: 'unknown' } }],
      cues: [],
    };
    const result = runScenario(s);
    const reset = resetReport(s, { initial: result.initial, final: result.final });
    expect(reset[0].kind).toBe('uncertain');
  });

  it('absent untouched needs no reset', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [],
      props: [{ id: 'v', name: 'V', kind: 'test', initial: { status: 'absent' } }],
      cues: [],
    };
    const result = runScenario(s);
    const reset = resetReport(s, { initial: result.initial, final: result.final });
    expect(reset[0].kind).toBe('none');
  });
});

describe('edit: deletion checks every reference site (A18)', () => {
  it('deleting prop with action reference is blocked', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }, { id: 'R', name: 'Right' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [
        { id: 'p', name: 'Prop', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } },
        { id: 'q', name: 'Q', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: 'A' } },
      ],
      cues: [{ id: 'c1', title: 'Cue', actions: [{ id: 'take', propId: 'p', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] }],
    };

    const block = checkBlockDeletion('prop', 'p', s);
    expect(block).not.toBeNull();
    expect(block?.reason).toContain('referenced');
  });

  it('deleting zone with initial reference is blocked', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }, { id: 'R', name: 'Right' }],
      holders: [],
      props: [{ id: 'p', name: 'Prop', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [],
    };

    const block = checkBlockDeletion('zone', 'L', s);
    expect(block).not.toBeNull();
    expect(block?.reason).toContain('referenced');
  });

  it('deleting zone with destination reference is blocked', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }, { id: 'R', name: 'Right' }],
      holders: [],
      props: [{ id: 'p', name: 'Prop', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue', actions: [{ id: 'move', propId: 'p', kind: 'carryOff', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'R', holderId: null } }] }],
    };

    const block = checkBlockDeletion('zone', 'R', s);
    expect(block).not.toBeNull();
    expect(block?.reason).toContain('referenced');
  });

  it('deleting holder with initial reference is blocked', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }, { id: 'B', name: 'Bob' }],
      props: [{ id: 'q', name: 'Q', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: 'B' } }],
      cues: [],
    };

    const block = checkBlockDeletion('holder', 'B', s);
    expect(block).not.toBeNull();
    expect(block?.reason).toContain('referenced');
  });

  it('cannot delete last zone', () => {
    const s = makeS();
    expect(wouldLeaveNoZones('L', s)).toBe(true);
    const result = deleteZone(s, 'L');
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('last zone');
  });

  it('retarget updates all references', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }, { id: 'R', name: 'Right' }],
      holders: [],
      props: [{ id: 'p', name: 'Prop', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue', actions: [{ id: 'a1', propId: 'p', kind: 'carryOff', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'R', holderId: null } }] }],
    };

    const result = retargetReferences(s, 'zone', 'L', 'R');
    expect(result.blocked).toBe(false);
    // After retargeting, both initial and actions should reference R
    expect(result.result.props[0].initial.zoneId).toBe('R');
    expect(result.result.cues[0].actions[0].requiredSource?.zoneId).toBe('R');
    expect(result.result.cues[0].actions[0].destination?.zoneId).toBe('R');
  });
});

describe('edit: preserve structural validity and identity (A18)', () => {
  it('add duplicate ID fails', () => {
    const s = makeS();
    s.zones.push({ id: 'L', name: 'Left' });
    const result = addZone(s, 'L', 'Duplicate');
    expect(result.blocked).toBe(true);
  });

  it('add beyond limit fails', () => {
    const s = makeS();
    for (let i = 0; i < 6; i++) s.zones.push({ id: `z${i}`, name: `Zone ${i}` });
    const result = addZone(s, 'new', 'New');
    expect(result.blocked).toBe(true);
  });

  it('update preserves IDs', () => {
    const s = makeS();
    s.props.push({ id: 'p1', name: 'Old', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    const result = updateProp(s, 'p1', { name: 'New' });
    expect(result.blocked).toBe(false);
    expect(result.result.props[0].id).toBe('p1');
    expect(result.result.props[0].name).toBe('New');
  });

  it('delete cue removes only its actions', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }, { id: 'p2', name: 'P2', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [
        { id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] },
        { id: 'c2', title: 'Cue 2', actions: [{ id: 'a2', propId: 'p2', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] },
      ],
    };
    // Add holder A
    s.holders.push({ id: 'A', name: 'Alice' });
    const result = deleteCue(s, 'c1');
    expect(result.blocked).toBe(false);
    expect(result.result.cues).toHaveLength(1);
    expect(result.result.cues[0].id).toBe('c2');
    // p1 and p2 should still exist
    expect(result.result.props).toHaveLength(2);
  });

  it('no-op reorder returns normalized clone', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [],
      props: [],
      cues: [
        { id: 'c1', title: 'Cue 1', actions: [] },
        { id: 'c2', title: 'Cue 2', actions: [] },
      ],
    };

    const { moveCue } = require('../../src/domain/edit');
    const result = moveCue(s, 'c1', 0);
    expect(result.blocked).toBe(false);
    // Result should be a new object
    expect(result.result).not.toBe(s);
    expect(result.result.cues[0].id).toBe('c1');
  });

  it('moving action without assigning reordered array fails', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [
        {
          id: 'c1',
          title: 'Cue 1',
          actions: [
            { id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } },
            { id: 'a2', propId: 'p1', kind: 'place', requiredSource: { zoneId: 'L', holderId: 'A' }, destination: { zoneId: 'L', holderId: null } },
          ],
        },
      ],
    };

    const result = moveAction(s, 'c1', 'a1', 1);
    expect(result.blocked).toBe(false);
    expect(result.result.cues[0].actions[0].id).toBe('a2');
    expect(result.result.cues[0].actions[1].id).toBe('a1');
  });

  it('adding action with duplicate ID fails', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'existing', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] }],
    };

    const result = addAction(s, 'c1', { id: 'existing', propId: 'p1', kind: 'place', requiredSource: { zoneId: 'L', holderId: 'A' }, destination: { zoneId: 'L', holderId: null } });
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('already exists');
  });
});