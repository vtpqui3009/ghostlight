import { describe, it, expect } from 'vitest';
import { parseScenario, parseScenarioJson } from '../../src/domain/schema';
import { presetReport, runnerReport, resetReport } from '../../src/domain/report';
import {
  addZone, deleteZone, deleteCue,
  updateProp, updateZone, updateHolder, updateCue, updateAction, addAction, moveAction, moveCue,
  retargetReferences, wouldLeaveNoZones, checkBlockDeletion,
} from '../../src/domain/edit';
import type { Scenario, Action, Cue } from '../../src/domain/types';
import { runScenario } from '../../src/domain/engine';

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
    if (result.success) throw new Error('Expected rejection for sparse props');
    expect(result.errors.some(e => e.includes('props[1]') && e.includes('missing own entry'))).toBe(true);
  });

  it('sparse zones array fails', () => {
    const s = makeS();
    (s as { zones: unknown }).zones = Array(1);
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for sparse zones');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('sparse holders array fails', () => {
    const s = makeS();
    (s as { holders: unknown }).holders = Array(1);
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for sparse holders');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('sparse cues array fails', () => {
    const s = makeS();
    (s as { cues: unknown }).cues = Array(1);
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for sparse cues');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('sparse actions in a cue fails', () => {
    const s = makeS();
    s.cues.push({ id: 'c1', title: 'Cue 1', actions: Array(1) as unknown as Action[] });
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for sparse actions');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('parser: own fields vs inherited fields (A18)', () => {
  it('inherited required fields fail', () => {
    const s = makeS();
    const proto = Object.create(s);
    const result = parseScenario(proto);
    if (result.success) throw new Error('Expected rejection for inherited required fields');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('inherited optional description is stripped', () => {
    const s = makeS();
    const proto = { description: 'Inherited' };
    Object.setPrototypeOf(s, proto);
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(result.data.description).toBeUndefined();
  });

  it('available prop with inherited REQUIRED holderId fails', () => {
    const s = makeS();
    const initialProto = { holderId: null };
    const initial: Record<string, unknown> = Object.create(initialProto);
    initial.status = 'available';
    initial.zoneId = 'L';
    const propData: Record<string, unknown> = {
      id: 'p1',
      name: 'Prop1',
      kind: 'test',
      initial,
    };
    s.props.push(propData as unknown as { id: string; name: string; kind: string; initial: { status: 'available'; zoneId: string; holderId: string | null } });
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for inherited required holderId');
    expect(result.errors.some(e => e.includes('props[1].initial.holderId'))).toBe(true);
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
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(result.data.props.some(p => p.id === 'toString')).toBe(true);
  });

  it('__proto__ as ID fails', () => {
    const s = makeS();
    s.props.push({ id: '__proto__', name: 'P', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for __proto__ ID');
    expect(result.errors.some(e => e.includes('props[1].id'))).toBe(true);
  });

  it('constructor as ID fails', () => {
    const s = makeS();
    s.props.push({ id: 'constructor', name: 'P', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for constructor ID');
    expect(result.errors.some(e => e.includes('props[1].id'))).toBe(true);
  });

  it('prototype as ID fails', () => {
    const s = makeS();
    s.props.push({ id: 'prototype', name: 'P', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for prototype ID');
    expect(result.errors.some(e => e.includes('props[1].id'))).toBe(true);
  });

  it('duplicate action IDs across cues fail', () => {
    const s = makeSWithAll();
    s.props.push({ id: 'p1', name: 'Prop1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    s.cues.push(
      { id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] },
      { id: 'c2', title: 'Cue 2', actions: [{ id: 'a1', propId: 'p1', kind: 'place', requiredSource: { zoneId: 'L', holderId: 'A' }, destination: { zoneId: 'R', holderId: null } }] }
    );
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for duplicate action IDs');
    expect(result.errors.join(' ')).toContain('unique');
  });

  it('missing referenced prop fails', () => {
    const s = makeSWithAll();
    s.cues.push({ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'missing', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] });
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for missing prop reference');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('explicit holderId null is accepted', () => {
    const s = makeS();
    s.props.push({ id: 'p1', name: 'Prop1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(result.data.props[0].initial.holderId).toBeNull();
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
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(result.data.title).toBe('Review');
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
    if (result.success) throw new Error('Expected rejection for oversized JSON');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('parser: collection and ID boundaries (A14)', () => {
  it('max zones (6) succeeds', () => {
    const s = makeS();
    s.zones = [
      { id: 'z0', name: 'Zone 0' },
      { id: 'z1', name: 'Zone 1' },
      { id: 'z2', name: 'Zone 2' },
      { id: 'z3', name: 'Zone 3' },
      { id: 'z4', name: 'Zone 4' },
      { id: 'z5', name: 'Zone 5' },
    ];
    expect(s.zones.length).toBe(6);
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(result.data.zones.length).toBe(6);
  });

  it('max zones + 1 (7) fails', () => {
    const s = makeS();
    s.zones = [
      { id: 'z0', name: 'Zone 0' },
      { id: 'z1', name: 'Zone 1' },
      { id: 'z2', name: 'Zone 2' },
      { id: 'z3', name: 'Zone 3' },
      { id: 'z4', name: 'Zone 4' },
      { id: 'z5', name: 'Zone 5' },
      { id: 'z6', name: 'Zone 6' },
    ];
    expect(s.zones.length).toBe(7);
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for 7 zones');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('max holders (12) succeeds', () => {
    const s = makeS();
    for (let i = 0; i < 12; i++) s.holders.push({ id: `h${i}`, name: `Holder ${i}` });
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(result.data.holders.length).toBe(12);
  });

  it('max holders + 1 (13) fails', () => {
    const s = makeS();
    for (let i = 0; i < 13; i++) s.holders.push({ id: `h${i}`, name: `Holder ${i}` });
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for 13 holders');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('max props (12) succeeds', () => {
    const s = makeSWithAll();
    for (let i = 0; i < 12; i++) s.props.push({ id: `p${i}`, name: `Prop ${i}`, kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(result.data.props.length).toBe(12);
  });

  it('max props + 1 (13) fails', () => {
    const s = makeSWithAll();
    for (let i = 0; i < 13; i++) s.props.push({ id: `p${i}`, name: `Prop ${i}`, kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for 13 props');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('max cues (40) succeeds', () => {
    const s = makeS();
    for (let i = 0; i < 40; i++) s.cues.push({ id: `c${i}`, title: `Cue ${i}`, actions: [] });
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(result.data.cues.length).toBe(40);
  });

  it('max cues + 1 (41) fails', () => {
    const s = makeS();
    for (let i = 0; i < 41; i++) s.cues.push({ id: `c${i}`, title: `Cue ${i}`, actions: [] });
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for 41 cues');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('64-char ID succeeds', () => {
    const s = makeS();
    const longId = 'a'.repeat(64);
    s.zones.push({ id: longId, name: 'Long' });
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(result.data.zones.some(z => z.id === longId)).toBe(true);
  });

  it('65-char ID fails', () => {
    const s = makeS();
    const longId = 'a'.repeat(65);
    s.zones.push({ id: longId, name: 'Long' });
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for 65-char ID');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('empty scene is valid', () => {
    const s = makeS();
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(result.data.zones.length).toBe(1);
  });

  it('zero zones is invalid', () => {
    const s = makeS();
    s.zones = [];
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for zero zones');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('error cap at 30', () => {
    const s = makeS();
    // Add 12 malformed props to generate field errors without collection overflow
    const malformedProps: unknown[] = [];
    for (let i = 0; i < 12; i++) {
      malformedProps.push({
        id: '',
        name: '',
        kind: '',
        initial: { status: 'invalid' },
      });
    }
    s.props = malformedProps as typeof s.props;
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for malformed props');
    expect(result.errors.length).toBe(30);
  });
});

describe('parser: owned normalization and round trip (A13/A15)', () => {
  it('extra keys stripped, empty note preserved', () => {
    const s = makeSWithAll();
    const rawProp = { id: 'p1', name: 'Prop1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null }, extraKey: 'bad' } as unknown;
    s.props.push(rawProp as { id: string; name: string; kind: string; initial: { status: 'available'; zoneId: string; holderId: string | null } });
    s.cues.push({
      id: 'c1',
      title: 'Cue 1',
      actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' }, note: '' }],
    });
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect((result.data.props[0] as unknown as { extraKey?: string }).extraKey).toBeUndefined();
    expect(result.data.cues[0].actions[0].note).toBe('');
  });

  it('original unchanged after parse', () => {
    const s = makeSWithAll();
    s.props.push({ id: 'p1', name: 'Prop1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    const snapshot = JSON.parse(JSON.stringify(s));
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(JSON.stringify(s)).toBe(JSON.stringify(snapshot));
    // Mutate original
    s.props[0].initial.zoneId = 'R';
    expect(result.data.props[0].initial.zoneId).toBe('L');
    // Mutate normalized
    result.data.props[0].name = 'Changed';
    expect(s.props[0].name).toBe('Prop1');
  });

  it('parse->serialize->parse preserves IDs and order', () => {
    const s = makeSWithAll();
    s.props.push({ id: 'p1', name: 'Prop1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    const json = JSON.stringify(result.data);
    const reparsed = parseScenarioJson(json);
    if (!reparsed.success) throw new Error(reparsed.errors.join('; '));
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
    if (!block) throw new Error('Expected block for deleting referenced prop');
    expect(block.reason).toContain('referenced');
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
    if (!block) throw new Error('Expected block for deleting referenced zone');
    expect(block.reason).toContain('referenced');
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
    if (!block) throw new Error('Expected block for deleting referenced zone');
    expect(block.reason).toContain('referenced');
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
    if (!block) throw new Error('Expected block for deleting referenced holder');
    expect(block.reason).toContain('referenced');
  });

  it('cannot delete last zone', () => {
    const s = makeS();
    expect(wouldLeaveNoZones('L', s)).toBe(true);
    const result = deleteZone(s, 'L');
    if (!result.blocked) throw new Error('Expected block for deleting last zone');
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
    if (result.blocked) throw new Error(result.reason);
    // After retargeting, both initial and actions should reference R
    expect(result.result.props[0].initial.zoneId).toBe('R');
    expect(result.result.cues[0].actions[0].requiredSource?.zoneId).toBe('R');
    expect(result.result.cues[0].actions[0].destination?.zoneId).toBe('R');
  });
});

describe('edit: preserve structural validity and identity (A18)', () => {
  it('add duplicate ID fails', () => {
    const s = makeS();
    const result = addZone(s, 'L', 'Duplicate');
    if (!result.blocked) throw new Error('Expected block for duplicate zone ID');
    expect(result.reason).toContain('already exists');
  });

  it('add beyond limit fails', () => {
    const s = makeS();
    s.zones = [
      { id: 'z0', name: 'Zone 0' },
      { id: 'z1', name: 'Zone 1' },
      { id: 'z2', name: 'Zone 2' },
      { id: 'z3', name: 'Zone 3' },
      { id: 'z4', name: 'Zone 4' },
      { id: 'z5', name: 'Zone 5' },
    ];
    const result = addZone(s, 'new', 'New');
    if (!result.blocked) throw new Error('Expected block for exceeding zone limit');
    expect(result.reason).toContain('limit');
  });

  it('update preserves IDs', () => {
    const s = makeS();
    s.props.push({ id: 'p1', name: 'Old', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } });
    const result = updateProp(s, 'p1', { name: 'New' });
    if (result.blocked) throw new Error(result.reason);
    expect(result.result.props[0].id).toBe('p1');
    expect(result.result.props[0].name).toBe('New');
  });

  it('delete cue removes only its actions', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [
        { id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } },
        { id: 'p2', name: 'P2', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } },
      ],
      cues: [
        { id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] },
        { id: 'c2', title: 'Cue 2', actions: [{ id: 'a2', propId: 'p2', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] },
      ],
    };
    const result = deleteCue(s, 'c1');
    if (result.blocked) throw new Error(result.reason);
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

    const result = moveCue(s, 'c1', 0);
    if (result.blocked) throw new Error(result.reason);
    // Result should be a new object
    expect(result.result).not.toBe(s);
    expect(result.result.cues[0].id).toBe('c1');
    expect(result.result.cues[1].id).toBe('c2');
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
    if (result.blocked) throw new Error(result.reason);
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
    if (!result.blocked) throw new Error('Expected block for duplicate action ID');
    expect(result.reason).toContain('already exists');
  });
});

describe('parser: table-driven collection defect regressions', () => {
  const S = (): Record<string, unknown> => ({ version: 1, title: 'Review', zones: [{ id: 'L', name: 'Left' }], holders: [], props: [], cues: [] });

  it('missing zones fails', () => {
    const s = S();
    delete s.zones;
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for missing zones');
    expect(result.errors.some(e => e.includes('zones') && e.includes('missing required field'))).toBe(true);
  });

  it.each([
    ['zones'],
    ['holders'],
    ['props'],
    ['cues'],
  ])('null %s fails', (key) => {
    const s = S();
    s[key] = null;
    const result = parseScenario(s);
    if (result.success) throw new Error(`Expected rejection for null ${key}`);
    expect(result.errors.some(e => e.includes(key) && e.includes('expected an array'))).toBe(true);
  });

  it.each([
    ['zones'],
    ['holders'],
    ['props'],
    ['cues'],
  ])('undefined %s fails', (key) => {
    const s = S();
    s[key] = undefined;
    const result = parseScenario(s);
    if (result.success) throw new Error(`Expected rejection for undefined ${key}`);
    expect(result.errors.some(e => e.includes(key) && e.includes('missing required field'))).toBe(true);
  });

  it.each([
    ['zones'],
    ['holders'],
    ['props'],
    ['cues'],
  ])('object %s fails', (key) => {
    const s = S();
    s[key] = {};
    const result = parseScenario(s);
    if (result.success) throw new Error(`Expected rejection for object ${key}`);
    expect(result.errors.some(e => e.includes(key) && e.includes('expected an array'))).toBe(true);
  });

  it('missing holders fails', () => {
    const s = S();
    delete s.holders;
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for missing holders');
    expect(result.errors.some(e => e.includes('holders') && e.includes('missing required field'))).toBe(true);
  });

  it('missing props fails', () => {
    const s = S();
    delete s.props;
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for missing props');
    expect(result.errors.some(e => e.includes('props') && e.includes('missing required field'))).toBe(true);
  });

  it('missing cues fails', () => {
    const s = S();
    delete s.cues;
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for missing cues');
    expect(result.errors.some(e => e.includes('cues') && e.includes('missing required field'))).toBe(true);
  });

  it('cue with missing actions fails', () => {
    const s = S();
    s.cues = [{ id: 'c1', title: 'Cue 1' }];
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for missing actions');
    expect(result.errors.some(e => e.includes('cues[1].actions') && e.includes('missing required field'))).toBe(true);
  });

  it('cue with null actions fails', () => {
    const s = S();
    s.cues = [{ id: 'c1', title: 'Cue 1', actions: null }];
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for null actions');
    expect(result.errors.some(e => e.includes('cues[1].actions') && e.includes('expected an array'))).toBe(true);
  });

  it('cue with object actions fails', () => {
    const s = S();
    s.cues = [{ id: 'c1', title: 'Cue 1', actions: {} }];
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for object actions');
    expect(result.errors.some(e => e.includes('cues[1].actions') && e.includes('expected an array'))).toBe(true);
  });

  it('cue with inherited actions containing invalid action fails', () => {
    const s = S();
    s.props = [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }];
    const actionsProto = [{ id: 'a1', propId: 'missing', kind: 'bogus', requiredSource: { zoneId: 'L', holderId: null } }];
    const cue: Record<string, unknown> = { id: 'c1', title: 'Cue 1' };
    Object.setPrototypeOf(cue, { actions: actionsProto });
    s.cues = [cue];
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for inherited actions with invalid content');
    expect(result.errors.some(e => e.includes('actions') && e.includes('missing required field'))).toBe(true);
  });

  it('empty own cue actions succeed', () => {
    const s = S();
    s.cues = [{ id: 'c1', title: 'Cue 1', actions: [] }];
    const snapshot = JSON.stringify(s);
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(result.data.cues[0].actions).toEqual([]);
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it.each([
    ['zones', 'zones'],
    ['holders', 'holders'],
    ['props', 'props'],
    ['cues', 'cues'],
  ])('sparse %s array fails', (key, path) => {
    const s = S();
    s[key] = Array(1);
    const result = parseScenario(s);
    if (result.success) throw new Error(`Expected rejection for sparse ${key}`);
    expect(result.errors.some(e => e.includes(`${path}[1]`) && e.includes('missing own entry'))).toBe(true);
  });

  it('sparse actions array fails', () => {
    const s = S();
    s.cues = [{ id: 'c1', title: 'Cue 1', actions: Array(1) }];
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for sparse actions');
    expect(result.errors.some(e => e.includes('actions[1]') && e.includes('missing own entry'))).toBe(true);
  });

  it.each([
    ['zones', [{ id: 'Z', name: 'Proto' }], 'zones[1]'],
    ['holders', [{ id: 'H', name: 'Proto' }], 'holders[1]'],
    ['props', [{ id: 'P', name: 'Proto', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }], 'props[1]'],
    ['cues', [{ id: 'C', title: 'Proto', actions: [] }], 'cues[1]'],
  ])('inherited %s numeric index fails', (key, protoElement, errorPath) => {
    const s = S();
    const proto = protoElement;
    const arr: unknown[] = [undefined];
    Object.setPrototypeOf(arr, proto);
    delete arr[0];
    s[key] = arr;
    const result = parseScenario(s);
    if (result.success) throw new Error(`Expected rejection for inherited ${key} index`);
    expect(result.errors.some(e => e.includes(errorPath) && e.includes('missing own entry'))).toBe(true);
  });

  it('inherited actions numeric index fails', () => {
    const s = S();
    s.props = [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }];
    const actionsProto = [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null } }];
    const actionsArr: unknown[] = [undefined];
    Object.setPrototypeOf(actionsArr, actionsProto);
    delete actionsArr[0];
    s.cues = [{ id: 'c1', title: 'Cue 1', actions: actionsArr }];
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for inherited actions index');
    expect(result.errors.some(e => e.includes('actions[1]') && e.includes('missing own entry'))).toBe(true);
  });

  it('own note/destination undefined omitted from normalized output', () => {
    const s = S();
    s.props = [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }];
    const action: Record<string, unknown> = { id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, note: undefined, destination: undefined };
    s.cues = [{ id: 'c1', title: 'Cue 1', actions: [action] }];
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(Object.hasOwn(result.data.cues[0].actions[0], 'note')).toBe(false);
    expect(Object.hasOwn(result.data.cues[0].actions[0], 'destination')).toBe(false);
  });

  it('inherited note/destination ignored on valid action', () => {
    const s = S();
    s.props = [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }];
    const actionProto = { note: 99, destination: 'invalid' };
    const action: Record<string, unknown> = { id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null } };
    Object.setPrototypeOf(action, actionProto);
    s.cues = [{ id: 'c1', title: 'Cue 1', actions: [action] }];
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(Object.hasOwn(result.data.cues[0].actions[0], 'note')).toBe(false);
    expect(Object.hasOwn(result.data.cues[0].actions[0], 'destination')).toBe(false);
  });

  it('own empty note retained', () => {
    const s = S();
    s.props = [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }];
    s.cues = [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, note: '' }] }];
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(result.data.cues[0].actions[0].note).toBe('');
  });

  it('own invalid note fails', () => {
    const s = S();
    s.props = [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }];
    s.cues = [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, note: 'x'.repeat(501) }] }];
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for oversized note');
    expect(result.errors.some(e => e.includes('note') && e.includes('500 characters'))).toBe(true);
  });

  it('own invalid destination fails', () => {
    const s = S();
    s.props = [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }];
    s.cues = [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: 'invalid' }] }];
    const result = parseScenario(s);
    if (result.success) throw new Error('Expected rejection for invalid destination');
    expect(result.errors.some(e => e.includes('destination'))).toBe(true);
  });

  it('valid input produces owned normalized output', () => {
    const s = S();
    s.props = [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }];
    s.cues = [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: null } }] }];
    const snapshot = JSON.stringify(s);
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(JSON.stringify(s)).toBe(snapshot);
    result.data.props[0].name = 'Changed';
    expect((s.props as Array<{ name: string }>)[0].name).toBe('P1');
  });

  it('root optional description own undefined omitted', () => {
    const s = S();
    s.description = undefined;
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(Object.hasOwn(result.data, 'description')).toBe(false);
  });

  it('root optional description inherited invalid omitted', () => {
    const s = S();
    const proto = { description: 12345 };
    Object.setPrototypeOf(s, proto);
    const result = parseScenario(s);
    if (!result.success) throw new Error(result.errors.join('; '));
    expect(Object.hasOwn(result.data, 'description')).toBe(false);
  });
});

describe('edit: updateAction optional destination/note ownership', () => {
  it('update action with no existing note succeeds', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] }],
    };
    const result = updateAction(s, 'c1', 'a1', { kind: 'place' });
    if (result.blocked) throw new Error(result.reason);
    expect(result.result.cues[0].actions[0].kind).toBe('place');
  });

  it('update transfer to consume clears destination with own undefined', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }, { id: 'B', name: 'Bob' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: 'A' } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'transfer', requiredSource: { zoneId: 'L', holderId: 'A' }, destination: { zoneId: 'L', holderId: 'B' } }] }],
    };
    const snapshot = JSON.stringify(s);
    const result = updateAction(s, 'c1', 'a1', { kind: 'consume', destination: undefined });
    if (result.blocked) throw new Error(result.reason);
    expect(JSON.stringify(s)).toBe(snapshot);
    expect(Object.hasOwn(result.result.cues[0].actions[0], 'destination')).toBe(false);
    expect(result.result.cues[0].actions[0].kind).toBe('consume');
    const runResult = runScenario(result.result);
    expect(runResult.frames.length).toBe(1);
    expect(runResult.frames[0].applied).toBe(true);
    expect(runResult.final.p1.status).toBe('consumed');
    expect(runResult.issues.length).toBe(0);
  });

  it('omitted destination retains old value', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] }],
    };
    const result = updateAction(s, 'c1', 'a1', { kind: 'collect' });
    if (result.blocked) throw new Error(result.reason);
    expect(result.result.cues[0].actions[0].destination).toEqual({ zoneId: 'L', holderId: 'A' });
  });

  it('inherited destination retains old value', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] }],
    };
    const proto = { destination: { zoneId: 'invalid', holderId: null } };
    const updates: Partial<Action> = { kind: 'collect' };
    Object.setPrototypeOf(updates, proto);
    const result = updateAction(s, 'c1', 'a1', updates);
    if (result.blocked) throw new Error(result.reason);
    expect(result.result.cues[0].actions[0].destination).toEqual({ zoneId: 'L', holderId: 'A' });
  });

  it('own note undefined clears existing note', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' }, note: 'old note' }] }],
    };
    const result = updateAction(s, 'c1', 'a1', { note: undefined });
    if (result.blocked) throw new Error(result.reason);
    expect(Object.hasOwn(result.result.cues[0].actions[0], 'note')).toBe(false);
  });

  it('note empty string preserved', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' }, note: 'old' }] }],
    };
    const result = updateAction(s, 'c1', 'a1', { note: '' });
    if (result.blocked) throw new Error(result.reason);
    expect(result.result.cues[0].actions[0].note).toBe('');
  });

  it('own replacement destination copied independently', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }, { id: 'R', name: 'Right' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'carryOff', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] }],
    };
    const newDest = { zoneId: 'R', holderId: 'A' };
    const result = updateAction(s, 'c1', 'a1', { destination: newDest });
    if (result.blocked) throw new Error(result.reason);
    expect(result.result.cues[0].actions[0].destination).toEqual({ zoneId: 'R', holderId: 'A' });
    expect(result.result.cues[0].actions[0].destination).not.toBe(newDest);
  });

  it('requiredSource remains authored', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: 'A' } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'place', requiredSource: { zoneId: 'L', holderId: 'A' }, destination: { zoneId: 'L', holderId: null } }] }],
    };
    const result = updateAction(s, 'c1', 'a1', { note: 'updated' });
    if (result.blocked) throw new Error(result.reason);
    expect(result.result.cues[0].actions[0].requiredSource).toEqual({ zoneId: 'L', holderId: 'A' });
  });
});

describe('edit: moveAction integer/range validation', () => {
  it('moveAction NaN rejected unchanged', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }, { id: 'a2', propId: 'p1', kind: 'place', requiredSource: { zoneId: 'L', holderId: 'A' }, destination: { zoneId: 'L', holderId: null } }] }],
    };
    const snapshot = JSON.stringify(s);
    const result = moveAction(s, 'c1', 'a1', NaN);
    if (!result.blocked) throw new Error('Expected block for NaN index');
    expect(result.reason).toContain('integer');
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it('moveAction 0.5 rejected unchanged', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }, { id: 'a2', propId: 'p1', kind: 'place', requiredSource: { zoneId: 'L', holderId: 'A' }, destination: { zoneId: 'L', holderId: null } }] }],
    };
    const snapshot = JSON.stringify(s);
    const result = moveAction(s, 'c1', 'a1', 0.5);
    if (!result.blocked) throw new Error('Expected block for fractional index');
    expect(result.reason).toContain('integer');
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it('moveAction valid reorder changes action order', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }, { id: 'a2', propId: 'p1', kind: 'place', requiredSource: { zoneId: 'L', holderId: 'A' }, destination: { zoneId: 'L', holderId: null } }] }],
    };
    const result = moveAction(s, 'c1', 'a1', 1);
    if (result.blocked) throw new Error(result.reason);
    expect(result.result.cues[0].actions[0].id).toBe('a2');
    expect(result.result.cues[0].actions[1].id).toBe('a1');
  });

  it('moveAction invalid scene no-op rejected', () => {
    const s: Scenario = {
      version: 1,
      title: '',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: null } }] }],
    };
    const result = moveAction(s, 'c1', 'a1', 0);
    if (!result.blocked) throw new Error('Expected block for invalid scene');
    expect(result.reason).toContain('invalid scene');
  });

  it('moveAction valid no-op returns owned normalized copy', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] }],
    };
    const result = moveAction(s, 'c1', 'a1', 0);
    if (result.blocked) throw new Error(result.reason);
    expect(result.result).not.toBe(s);
    expect(result.result.cues).not.toBe(s.cues);
    expect(result.result.cues[0].actions[0].id).toBe('a1');
  });
});

describe('edit: update helpers reject own differing ID', () => {
  it.each([
    ['Prop', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateProp(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [], props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }], cues: [] }), 'p1'],
    ['Zone', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateZone(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'z1', name: 'Zone 1' }], holders: [], props: [], cues: [] }), 'z1'],
    ['Holder', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateHolder(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [{ id: 'h1', name: 'Holder 1' }], props: [], cues: [] }), 'h1'],
    ['Cue', (s: Scenario, id: string, updates: Partial<{ id: string; title: string }>) => updateCue(s, id, updates as Partial<Cue>), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [], props: [], cues: [{ id: 'c1', title: 'Cue 1', actions: [] }] }), 'c1'],
  ])('update%s undefined ID rejected', (_entity, updateFn, scenarioFn, entityId) => {
    const s = scenarioFn();
    const snapshot = JSON.stringify(s);
    const result = updateFn(s, entityId, { id: undefined });
    if (!result.blocked) throw new Error(`Expected block for undefined ${name} ID`);
    expect(result.reason).toContain('Cannot change');
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it.each([
    ['Prop', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateProp(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [], props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }], cues: [] }), 'p1'],
    ['Zone', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateZone(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'z1', name: 'Zone 1' }], holders: [], props: [], cues: [] }), 'z1'],
    ['Holder', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateHolder(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [{ id: 'h1', name: 'Holder 1' }], props: [], cues: [] }), 'h1'],
    ['Cue', (s: Scenario, id: string, updates: Partial<{ id: string; title: string }>) => updateCue(s, id, updates as Partial<Cue>), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [], props: [], cues: [{ id: 'c1', title: 'Cue 1', actions: [] }] }), 'c1'],
  ])('update%s empty ID rejected', (_entity, updateFn, scenarioFn, entityId) => {
    const s = scenarioFn();
    const snapshot = JSON.stringify(s);
    const result = updateFn(s, entityId, { id: '' });
    if (!result.blocked) throw new Error(`Expected block for empty ${name} ID`);
    expect(result.reason).toContain('Cannot change');
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it.each([
    ['Prop', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateProp(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [], props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }], cues: [] }), 'p1'],
    ['Zone', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateZone(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'z1', name: 'Zone 1' }], holders: [], props: [], cues: [] }), 'z1'],
    ['Holder', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateHolder(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [{ id: 'h1', name: 'Holder 1' }], props: [], cues: [] }), 'h1'],
    ['Cue', (s: Scenario, id: string, updates: Partial<{ id: string; title: string }>) => updateCue(s, id, updates as Partial<Cue>), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [], props: [], cues: [{ id: 'c1', title: 'Cue 1', actions: [] }] }), 'c1'],
  ])('update%s different ID rejected', (_entity, updateFn, scenarioFn, entityId) => {
    const s = scenarioFn();
    const snapshot = JSON.stringify(s);
    const result = updateFn(s, entityId, { id: 'different' });
    if (!result.blocked) throw new Error(`Expected block for different ${name} ID`);
    expect(result.reason).toContain('Cannot change');
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it.each([
    ['Prop', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateProp(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [], props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }], cues: [] }), 'p1'],
    ['Zone', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateZone(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'z1', name: 'Zone 1' }], holders: [], props: [], cues: [] }), 'z1'],
    ['Holder', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateHolder(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [{ id: 'h1', name: 'Holder 1' }], props: [], cues: [] }), 'h1'],
    ['Cue', (s: Scenario, id: string, updates: Partial<{ id: string; title: string }>) => updateCue(s, id, updates as Partial<Cue>), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [], props: [], cues: [{ id: 'c1', title: 'Cue 1', actions: [] }] }), 'c1'],
  ])('update%s same ID succeeds', (_entity, updateFn, scenarioFn, entityId) => {
    const s = scenarioFn();
    const result = updateFn(s, entityId, { id: entityId, name: 'Updated' } as { id: string; name?: string; title?: string });
    if (result.blocked) throw new Error(result.reason);
    expect(result.result).toBeDefined();
  });

  it.each([
    ['Prop', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateProp(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [], props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }], cues: [] }), 'p1'],
    ['Zone', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateZone(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'z1', name: 'Zone 1' }], holders: [], props: [], cues: [] }), 'z1'],
    ['Holder', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateHolder(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [{ id: 'h1', name: 'Holder 1' }], props: [], cues: [] }), 'h1'],
    ['Cue', (s: Scenario, id: string, updates: Partial<{ id: string; title: string }>) => updateCue(s, id, updates as Partial<Cue>), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [], props: [], cues: [{ id: 'c1', title: 'Cue 1', actions: [] }] }), 'c1'],
  ])('update%s omitted ID succeeds', (_entity, updateFn, scenarioFn, entityId) => {
    const s = scenarioFn();
    const result = updateFn(s, entityId, { name: 'Updated' });
    if (result.blocked) throw new Error(result.reason);
    expect(result.result).toBeDefined();
  });

  it.each([
    ['Prop', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateProp(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [], props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }], cues: [] }), 'p1'],
    ['Zone', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateZone(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'z1', name: 'Zone 1' }], holders: [], props: [], cues: [] }), 'z1'],
    ['Holder', (s: Scenario, id: string, updates: Partial<{ id: string; name: string }>) => updateHolder(s, id, updates), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [{ id: 'h1', name: 'Holder 1' }], props: [], cues: [] }), 'h1'],
    ['Cue', (s: Scenario, id: string, updates: Partial<{ id: string; title: string }>) => updateCue(s, id, updates as Partial<Cue>), (): Scenario => ({ version: 1, title: 'Test', zones: [{ id: 'L', name: 'Left' }], holders: [], props: [], cues: [{ id: 'c1', title: 'Cue 1', actions: [] }] }), 'c1'],
  ])('update%s inherited differing ID ignored', (_entity, updateFn, scenarioFn, entityId) => {
    const s = scenarioFn();
    const proto = { id: 'inherited-different' };
    const updates: Partial<{ id: string; name: string }> = { name: 'Updated' };
    Object.setPrototypeOf(updates, proto);
    const result = updateFn(s, entityId, updates);
    if (result.blocked) throw new Error(result.reason);
    expect(result.result).toBeDefined();
  });

  it('updateAction undefined ID rejected', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] }],
    };
    const snapshot = JSON.stringify(s);
    const result = updateAction(s, 'c1', 'a1', { id: undefined });
    if (!result.blocked) throw new Error('Expected block for undefined action ID');
    expect(result.reason).toContain('Cannot change');
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it('updateAction empty ID rejected', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] }],
    };
    const snapshot = JSON.stringify(s);
    const result = updateAction(s, 'c1', 'a1', { id: '' });
    if (!result.blocked) throw new Error('Expected block for empty action ID');
    expect(result.reason).toContain('Cannot change');
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it('updateAction different ID rejected', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] }],
    };
    const snapshot = JSON.stringify(s);
    const result = updateAction(s, 'c1', 'a1', { id: 'different' });
    if (!result.blocked) throw new Error('Expected block for different action ID');
    expect(result.reason).toContain('Cannot change');
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it('updateAction same ID succeeds', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] }],
    };
    const result = updateAction(s, 'c1', 'a1', { id: 'a1', note: 'test' });
    if (result.blocked) throw new Error(result.reason);
    expect(result.result.cues[0].actions[0].id).toBe('a1');
  });

  it('updateAction omitted ID succeeds', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] }],
    };
    const result = updateAction(s, 'c1', 'a1', { note: 'test' });
    if (result.blocked) throw new Error(result.reason);
    expect(result.result.cues[0].actions[0].id).toBe('a1');
  });

  it('updateAction inherited differing ID ignored', () => {
    const s: Scenario = {
      version: 1,
      title: 'Test',
      zones: [{ id: 'L', name: 'Left' }],
      holders: [{ id: 'A', name: 'Alice' }],
      props: [{ id: 'p1', name: 'P1', kind: 'test', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'Cue 1', actions: [{ id: 'a1', propId: 'p1', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } }] }],
    };
    const proto = { id: 'inherited-different' };
    const updates: Partial<Action> = { note: 'test' };
    Object.setPrototypeOf(updates, proto);
    const result = updateAction(s, 'c1', 'a1', updates);
    if (result.blocked) throw new Error(result.reason);
    expect(result.result.cues[0].actions[0].id).toBe('a1');
  });
});