// Kiro-authored (K12, 2026-11-13). Hand-calculated oracles for the MCP tool logic. The
// expected values come from reading the demo fixtures in src/fixtures/demos.ts and the
// transition table in .kiro/specs/ghostlight/design.md, not from running the handlers.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  HONESTY, checkScenario, explainIssue, extractTransitionTable, getDemo, listDemos, reports,
} from '../../tools/mcp/handlers';
import {
  validControlDemo, missingHandoffDemo, consumedReuseDemo,
} from '../../src/fixtures/demos';

const j = (s: unknown) => JSON.stringify(s);

describe('check_scenario', () => {
  it('Valid Control: four applied steps, no issue, the letter ends resting on Right Stage', () => {
    const r = checkScenario(j(validControlDemo));
    if (!r.ok) throw new Error('expected success');
    expect(r.clean).toBe(true);
    expect(r.counts).toEqual({ actions: 4, applied: 4, rejected: 0, uncertain: 0 });
    expect(r.actions.map(a => [a.kind, a.applied])).toEqual([
      ['collect', true], ['transfer', true], ['carryOff', true], ['place', true],
    ]);
    expect(r.finalState['letter-A']).toEqual({ status: 'available', zoneId: 'R', holderId: null });
  });

  it('Missing Handoff: the carry is rejected, its cause is the collect, and the holder is unchanged', () => {
    const r = checkScenario(j(missingHandoffDemo));
    if (!r.ok) throw new Error('expected success');
    expect(r.clean).toBe(false);
    expect(r.counts).toEqual({ actions: 2, applied: 1, rejected: 1, uncertain: 0 });
    const carry = r.actions[1];
    expect(carry.actionId).toBe('a2');
    expect(carry.applied).toBe(false);
    expect(carry.issue?.severity).toBe('error');
    expect(carry.issue?.cause).toEqual({ kind: 'action', cueId: 'cue-1', actionId: 'a1' });
    // The rejection leaves the plan where it was: still with Actor-A, never Actor-B.
    expect(r.finalState['letter-A']).toEqual({ status: 'available', zoneId: 'L', holderId: 'Actor-A' });
  });

  it('Consumed Reuse: a consumed id never revives, and the replenished one is a different id', () => {
    const r = checkScenario(j(consumedReuseDemo));
    if (!r.ok) throw new Error('expected success');
    expect(r.counts).toEqual({ actions: 5, applied: 4, rejected: 1, uncertain: 0 });
    const reuse = r.actions.find(a => a.actionId === 'a3');
    expect(reuse?.applied).toBe(false);
    expect(reuse?.issue?.cause).toEqual({ kind: 'action', cueId: 'cue-1', actionId: 'a2' });
    expect(r.finalState['seal-A']).toEqual({ status: 'consumed' });
    expect(r.finalState['seal-B']).toEqual({ status: 'available', zoneId: 'Stage', holderId: 'Actor-A' });
  });

  it('an id such as toString is safe', () => {
    const scene = {
      version: 1, title: 'odd ids',
      zones: [{ id: 'L', name: 'Left' }], holders: [{ id: 'A', name: 'Actor A' }],
      props: [{ id: 'toString', name: 'Odd', kind: 'x', initial: { status: 'available', zoneId: 'L', holderId: null } }],
      cues: [{ id: 'c1', title: 'one', actions: [
        { id: 'a1', propId: 'toString', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } },
      ] }],
    };
    const r = checkScenario(j(scene));
    if (!r.ok) throw new Error(`expected success: ${JSON.stringify(r)}`);
    expect(r.clean).toBe(true);
    expect(r.finalState['toString']).toEqual({ status: 'available', zoneId: 'L', holderId: 'A' });
  });

  it('bad input returns a clean failure, never a throw', () => {
    for (const bad of ['{nope', '', '[]', 'null', 42, undefined]) {
      const r = checkScenario(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.errors.length).toBeGreaterThan(0);
        expect(r.note).toBe(HONESTY);
      }
    }
  });

  it('rejects JSON over 200,000 bytes, counting bytes not characters', () => {
    const big = checkScenario('"' + 'x'.repeat(200_001) + '"');
    expect(big.ok).toBe(false);
    if (!big.ok) expect(big.errors.join(' ')).toMatch(/too large/i);
    // 70,000 three-byte characters is 210,000 bytes but only 70,000 characters.
    const multibyte = checkScenario('"' + '\u20AC'.repeat(70_000) + '"');
    expect(multibyte.ok).toBe(false);
    if (!multibyte.ok) expect(multibyte.errors.join(' ')).toMatch(/too large/i);
  });

  it('is deterministic and does not depend on call order', () => {
    const first = checkScenario(j(missingHandoffDemo));
    checkScenario(j(consumedReuseDemo));
    expect(checkScenario(j(missingHandoffDemo))).toEqual(first);
  });
});

describe('explain_issue', () => {
  it('Missing Handoff a2: names the holder mismatch and describes, but does not apply, a handoff', () => {
    const r = explainIssue(j(missingHandoffDemo), 'a2');
    if (!r.ok) throw new Error('expected success');
    expect(r.verdict).toBe(
      'Does not agree: Sealed Letter (letter-A) is required at Left Stage / Actor B, but before this step the plan has it at Left Stage / Actor A.',
    );
    expect(r.issue?.cause).toEqual({ kind: 'action', cueId: 'cue-1', actionId: 'a1' });
    expect(r.fix?.kind).toBe('guided');
    if (r.fix?.kind === 'guided') {
      expect(r.fix.applied).toBe(false);
      expect(r.fix.cueId).toBe('cue-2');
      expect(r.fix.action.kind).toBe('transfer');
    }
  });

  it('a clean action has no issue and no fix', () => {
    const r = explainIssue(j(missingHandoffDemo), 'a1');
    if (!r.ok) throw new Error('expected success');
    expect(r.issue).toBeNull();
    expect(r.fix).toBeNull();
    expect(r.applied).toBe(true);
  });

  it('a consumed instance is told what to do instead, never given an edit that revives it', () => {
    const r = explainIssue(j(consumedReuseDemo), 'a3');
    if (!r.ok) throw new Error('expected success');
    expect(r.fix?.kind).toBe('none');
  });

  it('an unknown action id lists the known ones', () => {
    const r = explainIssue(j(missingHandoffDemo), 'zzz');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain('Known ids: a1, a2');
    expect(explainIssue(j(missingHandoffDemo), 7).ok).toBe(false);
  });
});

describe('reports', () => {
  it('preset lists each instance with its authored start', () => {
    const r = reports(j(missingHandoffDemo), 'preset');
    if (!r.ok) throw new Error('expected success');
    expect(r.rows).toEqual([
      { propId: 'letter-A', propName: 'Sealed Letter', status: 'available', initial: { zoneId: 'L', holderId: null } },
    ]);
  });

  it('runner has one entry per cue, in order, and marks the rejected action', () => {
    const r = reports(j(missingHandoffDemo), 'runner');
    if (!r.ok || r.kind !== 'runner') throw new Error('expected runner rows');
    const rows = r.rows as Array<{ cueId: string; actions: Array<{ applied: boolean }> }>;
    expect(rows.map(c => c.cueId)).toEqual(['cue-1', 'cue-2']);
    expect(rows[1].actions[0].applied).toBe(false);
  });

  it('reset replaces a consumed instance rather than returning it', () => {
    const r = reports(j(consumedReuseDemo), 'reset');
    if (!r.ok) throw new Error('expected success');
    const rows = r.rows as Array<{ propId: string; kind: string }>;
    expect(rows.find(x => x.propId === 'seal-A')?.kind).toBe('replace');
  });

  it('an unknown kind is refused', () => {
    expect(reports(j(missingHandoffDemo), 'nope').ok).toBe(false);
  });
});

describe('demos', () => {
  it('lists the six bundled scenes in order', () => {
    const r = listDemos();
    expect(r.demos.map(d => d.id)).toEqual([
      'valid-control', 'missing-handoff', 'consumed-reuse', 'duplicate-identity', 'reordered-cues', 'unknown-start',
    ]);
  });

  it('get_demo returns an independent copy', () => {
    const a = getDemo('missing-handoff');
    if (!a.ok || !('scenario' in a)) throw new Error('expected a scenario');
    a.scenario.cues[0].title = 'changed';
    const b = getDemo('missing-handoff');
    if (!b.ok || !('scenario' in b)) throw new Error('expected a scenario');
    expect(b.scenario.cues[0].title).toBe('Act 1 Scene 1');
    expect(getDemo('nope').ok).toBe(false);
  });

  it('a demo round-trips through check_scenario', () => {
    const d = getDemo('valid-control');
    if (!d.ok || !('scenario' in d)) throw new Error('expected a scenario');
    const r = checkScenario(j(d.scenario));
    expect(r.ok && r.clean).toBe(true);
  });
});

describe('honesty and the spec resource', () => {
  it('every kind of answer says planned state, not live tracking', () => {
    const answers = [
      checkScenario(j(validControlDemo)), checkScenario('{'), explainIssue(j(missingHandoffDemo), 'a2'),
      reports(j(missingHandoffDemo), 'preset'), listDemos(), getDemo('valid-control'), getDemo('x'),
    ];
    for (const a of answers) expect(a.note).toMatch(/not live tracking/);
  });

  it('extracts the normative transition table and stops before the next section', () => {
    const md = readFileSync(resolve(__dirname, '../../.kiro/specs/ghostlight/design.md'), 'utf8');
    const table = extractTransitionTable(md);
    expect(table.startsWith('### The transition table (normative)')).toBe(true);
    expect(table).toContain('| Kind |');
    for (const kind of ['place', 'collect', 'transfer', 'carryOff', 'consume', 'replenish']) {
      expect(table).toContain(`\`${kind}\``);
    }
    expect(table).not.toContain('### Why these choices');
    expect(extractTransitionTable('# nothing here')).toMatch(/not found/);
  });
});
