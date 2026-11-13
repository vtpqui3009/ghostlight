// Property-based tests for the replay engine.
//
// Authored by Kiro (Kiro CLI 3.1.0) on 2026-11-10 during task K11. The brief asked for Kiro IDE's
// native property-based-testing workflow, which is IDE-only and could not be driven from this CLI
// session. This is therefore the stated FALLBACK: Kiro-written fast-check tests, NOT Kiro's built-in
// PBT feature. The write-up must say so.
//
// Every property traces to a requirement in .kiro/specs/ghostlight/requirements.md (FR*), the
// normative transition table in design.md, or an invariant in .kiro/steering/tech.md.
//
// Oracle independence: expected values come from `refStep` below, a small reference model written
// directly from the design.md transition table. It never calls runScenario. Several properties
// (custody, terminal consumption, rejected-is-unchanged, aliasing) need no model at all.
//
// Seeds: every run uses the fixed SEED below, so a failure reproduces exactly. On failure
// fast-check prints the seed, the shrunk counterexample and the replay path; copy those into a
// comment next to the property (or into a fixture) before touching anything.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { runScenario } from '../../src/domain/engine';
import { ACTION_KINDS } from '../../src/domain/types';
import type { Action, ActionKind, Cue, InitialState, Position, RunResult, Scenario } from '../../src/domain/types';

const SEED = 20261110;
const NUM_RUNS = 300;
const cfg = { seed: SEED, numRuns: NUM_RUNS };

// 'toString' is deliberately a prop id: an allowed id that collides with an Object.prototype name
// (tech.md: own-key-safe dictionaries). All props share one name/kind so identity can only come
// from the id (FR1.1, acceptance A04).
const ZONES = ['z0', 'z1', 'z2'] as const;
const HOLDERS = ['h0', 'h1', 'h2'] as const;
const PROP_IDS = ['letter-A', 'letter-B', 'toString', 'seal-A'] as const;

// ---------------------------------------------------------------------------------------------
// Reference model, written from the design.md transition table (not from engine.ts).
// ---------------------------------------------------------------------------------------------
type MState =
  | { status: 'available'; zoneId: string; holderId: string | null }
  | { status: 'unknown' }
  | { status: 'absent' }
  | { status: 'consumed' };

type RefOutcome =
  | { type: 'ok'; next: MState }
  | { type: 'shape' } // malformed for its kind: no cause, state untouched
  | { type: 'state'; severity: 'error' | 'uncertain' }; // state/mismatch: has a cause, state untouched

function shapeOk(kind: ActionKind, src: Position | null, dst: Position | undefined): boolean {
  switch (kind) {
    case 'place':
      return src !== null && src.holderId !== null && dst !== undefined && dst.holderId === null;
    case 'collect':
      return src !== null && src.holderId === null && dst !== undefined && dst.holderId !== null;
    case 'transfer':
      return (
        src !== null && src.holderId !== null &&
        dst !== undefined && dst.holderId !== null && dst.holderId !== src.holderId
      );
    case 'carryOff':
      return (
        src !== null && src.holderId !== null &&
        dst !== undefined && dst.holderId === src.holderId && dst.zoneId !== src.zoneId
      );
    case 'consume':
      return src !== null && dst === undefined;
    case 'replenish':
      return src === null && dst !== undefined;
  }
}

function refStep(kind: ActionKind, src: Position | null, dst: Position | undefined, st: MState): RefOutcome {
  if (!shapeOk(kind, src, dst)) return { type: 'shape' };

  if (kind === 'replenish') {
    // Only absent -> available. available / unknown / consumed are all errors.
    if (st.status === 'absent') {
      return { type: 'ok', next: { status: 'available', zoneId: dst!.zoneId, holderId: dst!.holderId } };
    }
    return { type: 'state', severity: 'error' };
  }

  if (st.status === 'unknown') return { type: 'state', severity: 'uncertain' }; // FR4
  if (st.status !== 'available') return { type: 'state', severity: 'error' }; // absent / consumed
  if (st.zoneId !== src!.zoneId || st.holderId !== src!.holderId) return { type: 'state', severity: 'error' };

  switch (kind) {
    case 'place':
      return { type: 'ok', next: { status: 'available', zoneId: dst!.zoneId, holderId: null } };
    case 'collect':
    case 'transfer':
      return { type: 'ok', next: { status: 'available', zoneId: dst!.zoneId, holderId: dst!.holderId } };
    case 'carryOff':
      return { type: 'ok', next: { status: 'available', zoneId: dst!.zoneId, holderId: src!.holderId } };
    case 'consume':
      return { type: 'ok', next: { status: 'consumed' } };
  }
  throw new Error('unreachable: replenish handled above');
}

function initialToModel(i: InitialState): MState {
  if (i.status === 'available') return { status: 'available', zoneId: i.zoneId!, holderId: i.holderId ?? null };
  return { status: i.status };
}

// ---------------------------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------------------------
const arbPos: fc.Arbitrary<Position> = fc.record({
  zoneId: fc.constantFrom(...ZONES),
  holderId: fc.constantFrom<string | null>(null, ...HOLDERS),
});

const arbInitial: fc.Arbitrary<InitialState> = fc.oneof(
  { arbitrary: arbPos.map((p): InitialState => ({ status: 'available', zoneId: p.zoneId, holderId: p.holderId })), weight: 5 },
  { arbitrary: fc.constant<InitialState>({ status: 'unknown' }), weight: 1 },
  { arbitrary: fc.constant<InitialState>({ status: 'absent' }), weight: 2 },
);

const arbInitials = fc.tuple(arbInitial, arbInitial, arbInitial, arbInitial);

interface RawStep {
  kind: ActionKind;
  propIdx: number;
  src: Position | null;
  dst: Position | undefined;
  newCue: boolean;
}

// Fully random actions: most are rejected, which is exactly what the rejection properties need.
const arbRawStep: fc.Arbitrary<RawStep> = fc.record({
  kind: fc.constantFrom(...ACTION_KINDS),
  propIdx: fc.integer({ min: 0, max: PROP_IDS.length - 1 }),
  src: fc.option(arbPos, { nil: null }),
  dst: fc.option(arbPos, { nil: undefined }),
  newCue: fc.boolean(),
});

interface GuidedStep {
  kind: ActionKind;
  propIdx: number;
  a: number;
  b: number;
  c: number;
  perturb: 0 | 1 | 2 | 3; // 0 none, 1 wrong zone, 2 wrong holder, 3 drop destination
  newCue: boolean;
}

// Guided actions: aimed at the reference model's current state, so many are accepted and long
// chains of valid moves (and their consequences) are exercised.
const arbGuidedStep: fc.Arbitrary<GuidedStep> = fc.record({
  kind: fc.constantFrom(...ACTION_KINDS),
  propIdx: fc.integer({ min: 0, max: PROP_IDS.length - 1 }),
  a: fc.integer({ min: 0, max: 8 }),
  b: fc.integer({ min: 0, max: 8 }),
  c: fc.integer({ min: 0, max: 8 }),
  perturb: fc.constantFrom<0 | 1 | 2 | 3>(0, 0, 0, 1, 2, 3),
  newCue: fc.boolean(),
});

function makeScenario(initials: readonly InitialState[], steps: RawStep[]): Scenario {
  const cues: Cue[] = [];
  let n = 0;
  for (const s of steps) {
    if (cues.length === 0 || s.newCue) cues.push({ id: `c${cues.length}`, title: `Cue ${cues.length}`, actions: [] });
    const action: Action = {
      id: `a${n++}`,
      propId: PROP_IDS[s.propIdx],
      kind: s.kind,
      requiredSource: s.src ? { zoneId: s.src.zoneId, holderId: s.src.holderId } : null,
      ...(s.dst ? { destination: { zoneId: s.dst.zoneId, holderId: s.dst.holderId } } : {}),
    };
    cues[cues.length - 1].actions.push(action);
  }
  return {
    version: 1,
    title: 'property scenario',
    zones: ZONES.map((id) => ({ id, name: id })),
    holders: HOLDERS.map((id) => ({ id, name: id })),
    props: PROP_IDS.map((id, i) => ({ id, name: 'Prop', kind: 'prop', initial: initials[i] })),
    cues,
  };
}

function buildGuided(initials: readonly InitialState[], steps: GuidedStep[]): Scenario {
  const model: Record<string, MState> = Object.create(null);
  PROP_IDS.forEach((id, i) => { model[id] = initialToModel(initials[i]); });
  const raw: RawStep[] = [];
  for (const s of steps) {
    const propId = PROP_IDS[s.propIdx];
    const cur = model[propId];
    const zi = (k: number) => ZONES[k % ZONES.length];
    const hi = (k: number) => HOLDERS[k % HOLDERS.length];
    let src: Position | null =
      cur.status === 'available'
        ? { zoneId: cur.zoneId, holderId: cur.holderId }
        : { zoneId: zi(s.a), holderId: s.b % 4 === 3 ? null : hi(s.b) };
    if (s.perturb === 1 && src) src = { zoneId: zi(ZONES.indexOf(src.zoneId as (typeof ZONES)[number]) + 1), holderId: src.holderId };
    if (s.perturb === 2 && src) src = { zoneId: src.zoneId, holderId: src.holderId === null ? hi(s.b) : null };
    let dst: Position | undefined;
    switch (s.kind) {
      case 'place':
        dst = { zoneId: zi(s.c), holderId: null };
        break;
      case 'collect':
        dst = { zoneId: zi(s.c), holderId: hi(s.b) };
        break;
      case 'transfer': {
        const from = src?.holderId ? HOLDERS.indexOf(src.holderId as (typeof HOLDERS)[number]) : s.b;
        dst = { zoneId: zi(s.c), holderId: hi(from + 1 + (s.b % 2)) };
        break;
      }
      case 'carryOff': {
        const from = src ? ZONES.indexOf(src.zoneId as (typeof ZONES)[number]) : 0;
        dst = { zoneId: zi(from + 1 + (s.c % 2)), holderId: src ? src.holderId : null };
        break;
      }
      case 'consume':
        dst = undefined;
        break;
      case 'replenish':
        src = null;
        dst = { zoneId: zi(s.c), holderId: s.b % 4 === 3 ? null : hi(s.b) };
        break;
    }
    if (s.perturb === 3) dst = undefined;
    const out = refStep(s.kind, src, dst, cur);
    if (out.type === 'ok') model[propId] = out.next;
    raw.push({ kind: s.kind, propIdx: s.propIdx, src, dst, newCue: s.newCue });
  }
  return makeScenario(initials, raw);
}

const arbRandomScenario = fc
  .tuple(arbInitials, fc.array(arbRawStep, { maxLength: 14 }))
  .map(([i, s]) => makeScenario(i, s));
const arbGuidedScenario = fc
  .tuple(arbInitials, fc.array(arbGuidedStep, { maxLength: 14 }))
  .map(([i, s]) => buildGuided(i, s));
// Either kind of scenario, so every property sees both mostly-rejected and mostly-accepted plans.
const arbScenario: fc.Arbitrary<Scenario> = fc.oneof(arbRandomScenario, arbGuidedScenario);

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------
/** Canonical, prototype-independent form: plain objects with sorted keys (state maps are null-prototype). */
function canon(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canon);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as object).sort()) out[k] = canon((value as Record<string, unknown>)[k]);
    return out;
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as object)) deepFreeze(v);
  }
  return value;
}

function allMaps(r: RunResult): Record<string, unknown>[] {
  return [r.initial, r.final, ...r.frames.flatMap((f) => [f.before, f.after])] as unknown as Record<string, unknown>[];
}

function modelOf(m: unknown): MState {
  return m as MState;
}

// ---------------------------------------------------------------------------------------------
// Self-check of the oracle on a hand-calculated case (so the model is not trusted blindly)
// ---------------------------------------------------------------------------------------------
describe('reference model self-check (hand-calculated, acceptance A01)', () => {
  it('collect -> transfer -> carryOff -> place ends at z1/none, in four applied steps', () => {
    let st: MState = { status: 'available', zoneId: 'z0', holderId: null };
    const steps: [ActionKind, Position, Position][] = [
      ['collect', { zoneId: 'z0', holderId: null }, { zoneId: 'z0', holderId: 'h0' }],
      ['transfer', { zoneId: 'z0', holderId: 'h0' }, { zoneId: 'z0', holderId: 'h1' }],
      ['carryOff', { zoneId: 'z0', holderId: 'h1' }, { zoneId: 'z1', holderId: 'h1' }],
      ['place', { zoneId: 'z1', holderId: 'h1' }, { zoneId: 'z1', holderId: null }],
    ];
    for (const [k, s, d] of steps) {
      const out = refStep(k, s, d, st);
      expect(out.type).toBe('ok');
      if (out.type === 'ok') st = out.next;
    }
    expect(st).toEqual({ status: 'available', zoneId: 'z1', holderId: null });
  });

  it('rejects the omitted-handoff chain and a consumed reuse', () => {
    const rest: MState = { status: 'available', zoneId: 'z0', holderId: 'h0' };
    // carryOff naming h1 while the instance is held by h0: state mismatch, not a shape error.
    expect(refStep('carryOff', { zoneId: 'z0', holderId: 'h1' }, { zoneId: 'z1', holderId: 'h1' }, rest)).toEqual({
      type: 'state',
      severity: 'error',
    });
    expect(refStep('consume', { zoneId: 'z0', holderId: 'h0' }, undefined, { status: 'consumed' })).toEqual({
      type: 'state',
      severity: 'error',
    });
    expect(refStep('collect', { zoneId: 'z0', holderId: null }, { zoneId: 'z0', holderId: 'h0' }, { status: 'unknown' })).toEqual({
      type: 'state',
      severity: 'uncertain',
    });
    expect(refStep('place', null, { zoneId: 'z0', holderId: null }, rest)).toEqual({ type: 'shape' });
  });
});

// ---------------------------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------------------------
describe('generator coverage (a property that never sees an accepted move proves nothing)', () => {
  it('reaches every kind both applied and rejected, shape and state rejections, both cause kinds', () => {
    const scenarios = fc.sample(arbScenario, { seed: SEED, numRuns: NUM_RUNS });
    const applied = new Set<string>();
    const rejected = new Set<string>();
    let shape = 0;
    let stateRej = 0;
    let initialCause = 0;
    let actionCause = 0;
    let uncertain = 0;
    let consumedReuse = 0;
    let total = 0;
    for (const s of scenarios) {
      const r = runScenario(s);
      for (const f of r.frames) {
        total++;
        (f.applied ? applied : rejected).add(f.action.kind);
        const issue = f.issues[0];
        if (!issue) continue;
        if (!issue.cause) shape++;
        else {
          stateRej++;
          if (issue.cause.kind === 'initial') initialCause++;
          else actionCause++;
        }
        if (issue.severity === 'uncertain') uncertain++;
        if (issue.code === 'consumed-reuse') consumedReuse++;
      }
    }
    // Printed so the evidence file can quote real figures rather than assumptions.
    console.info(
      `[K11 coverage seed=${SEED}] scenarios=${scenarios.length} frames=${total} ` +
        `appliedKinds=${applied.size}/6 rejectedKinds=${rejected.size}/6 shape=${shape} state=${stateRej} ` +
        `initialCause=${initialCause} actionCause=${actionCause} uncertain=${uncertain} consumedReuse=${consumedReuse}`,
    );
    expect(applied.size).toBe(ACTION_KINDS.length);
    expect(rejected.size).toBe(ACTION_KINDS.length);
    expect(shape).toBeGreaterThan(0);
    expect(stateRej).toBeGreaterThan(0);
    expect(initialCause).toBeGreaterThan(0);
    expect(actionCause).toBeGreaterThan(0);
    expect(uncertain).toBeGreaterThan(0);
    expect(consumedReuse).toBeGreaterThan(0);
  });
});
describe('engine properties (fast-check, fixed seed)', () => {
  it('P1 single custody and state shape [FR3.1, FR3.2, tech.md own-key-safe]', () => {
    fc.assert(
      fc.property(arbScenario, (scenario) => {
        const r = runScenario(scenario);
        for (const map of allMaps(r)) {
          // Same instance ids every time, including the prototype-colliding 'toString'.
          expect(Object.keys(map).sort()).toEqual([...PROP_IDS].sort());
          for (const id of PROP_IDS) {
            const s = map[id] as Record<string, unknown>;
            expect(['available', 'unknown', 'absent', 'consumed']).toContain(s.status);
            if (s.status === 'available') {
              // Exactly one declared zone and one explicit holder (string or null, never undefined).
              expect(ZONES as readonly unknown[]).toContain(s.zoneId);
              expect(s.holderId === null || (HOLDERS as readonly unknown[]).includes(s.holderId)).toBe(true);
            } else {
              expect('zoneId' in s).toBe(false);
              expect('holderId' in s).toBe(false);
            }
          }
        }
      }),
      cfg,
    );
  });

  it('P2 consumption is terminal [FR5.1]', () => {
    fc.assert(
      fc.property(arbScenario, (scenario) => {
        const r = runScenario(scenario);
        for (const id of PROP_IDS) {
          let consumed = false;
          for (const f of r.frames) {
            if (consumed) expect(modelOf(f.after[id]).status).toBe('consumed');
            if (modelOf(f.after[id]).status === 'consumed') consumed = true;
          }
          if (consumed) expect(modelOf(r.final[id]).status).toBe('consumed');
        }
      }),
      cfg,
    );
  });

  it('P3 replenish only takes absent -> available and never revives a consumed id [FR5.2]', () => {
    fc.assert(
      fc.property(arbScenario, (scenario) => {
        const r = runScenario(scenario);
        for (const f of r.frames) {
          const id = f.action.propId;
          const before = modelOf(f.before[id]).status;
          const after = modelOf(f.after[id]).status;
          if (before === 'consumed') expect(after).toBe('consumed');
          if (before !== 'available' && after === 'available') {
            // The only way into 'available' from a non-available state.
            expect(f.action.kind).toBe('replenish');
            expect(before).toBe('absent');
            expect(f.applied).toBe(true);
          }
          if (f.action.kind === 'replenish' && f.applied) {
            expect(before).toBe('absent');
            expect(after).toBe('available');
          }
        }
      }),
      cfg,
    );
  });

  it('P4 a rejected action changes nothing and reports exactly one issue [FR2, A10, A11]', () => {
    fc.assert(
      fc.property(arbScenario, (scenario) => {
        const r = runScenario(scenario);
        for (const f of r.frames) {
          if (f.applied) {
            expect(f.issues).toHaveLength(0);
          } else {
            expect(canon(f.after)).toEqual(canon(f.before));
            expect(f.issues).toHaveLength(1);
          }
          // Only the acted-on prop may differ between before and after.
          for (const id of PROP_IDS) {
            if (id !== f.action.propId) expect(canon(f.after[id])).toEqual(canon(f.before[id]));
          }
        }
        expect(r.issues.map((i) => i.actionId)).toEqual(r.frames.filter((f) => !f.applied).map((f) => f.actionId));
      }),
      cfg,
    );
  });

  it('P5 replay is deterministic [A11]', () => {
    fc.assert(
      fc.property(arbScenario, (scenario) => {
        expect(canon(runScenario(scenario))).toEqual(canon(runScenario(scenario)));
      }),
      cfg,
    );
  });

  it('P6 purity: frozen input, no mutation, and no aliasing between any two snapshots [tech.md, A11, A15]', () => {
    fc.assert(
      fc.property(arbScenario, fc.nat(), (scenario, pick) => {
        const before = JSON.stringify(scenario);
        const frozen = deepFreeze(JSON.parse(before) as Scenario);
        const r = runScenario(frozen); // must not throw on frozen input
        expect(JSON.stringify(frozen)).toBe(before);

        // Every state map is its own object (initial, final and each before/after).
        const maps = allMaps(r);
        expect(new Set(maps).size).toBe(maps.length);

        // Corrupting one snapshot must not disturb any other.
        const saved = maps.map((m) => JSON.stringify(canon(m)));
        const victim = pick % maps.length;
        for (const id of Object.keys(maps[victim])) {
          (maps[victim][id] as Record<string, unknown>).status = 'consumed';
        }
        maps[victim]['injected'] = { status: 'consumed' };
        maps.forEach((m, i) => {
          if (i !== victim) expect(JSON.stringify(canon(m))).toBe(saved[i]);
        });

        // A frame's action is an independent copy of the authored action.
        const authoredCopy = JSON.parse(before) as Scenario;
        const fresh = runScenario(authoredCopy);
        for (const f of fresh.frames) {
          f.action.propId = 'mutated';
          if (f.action.requiredSource) f.action.requiredSource.zoneId = 'mutated';
          if (f.action.destination) f.action.destination.zoneId = 'mutated';
        }
        expect(JSON.stringify(authoredCopy)).toBe(before);
      }),
      cfg,
    );
  });

  it('P7 causal integrity: causes point to an earlier, successful action on the same prop [A12]', () => {
    fc.assert(
      fc.property(arbScenario, (scenario) => {
        const r = runScenario(scenario);
        for (const f of r.frames) {
          for (const issue of f.issues) {
            expect(issue.propId).toBe(f.action.propId);
            const cause = issue.cause;
            if (!cause) continue;
            if (cause.kind === 'initial') {
              expect(cause.propId).toBe(f.action.propId);
              // Initial is only legitimate when no earlier action on this prop was applied.
              const earlier = r.frames.slice(0, f.index).filter((x) => x.applied && x.action.propId === f.action.propId);
              expect(earlier).toHaveLength(0);
            } else {
              const target = r.frames.find((x) => x.cueId === cause.ref.cueId && x.actionId === cause.ref.actionId);
              expect(target).toBeDefined();
              expect(target!.index).toBeLessThan(f.index); // never a future action
              expect(target!.applied).toBe(true); // never a rejected action
              expect(target!.action.propId).toBe(f.action.propId); // never another prop
              expect(target!.cueIndex).toBe(cause.ref.cueIndex);
              expect(target!.actionIndex).toBe(cause.ref.actionIndex);
              // And it is the MOST RECENT such action.
              const later = r.frames
                .slice(target!.index + 1, f.index)
                .filter((x) => x.applied && x.action.propId === f.action.propId);
              expect(later).toHaveLength(0);
            }
          }
        }
      }),
      cfg,
    );
  });

  it('P8 authored actions are reproduced verbatim, in cue then action order [FR1.2, FR1.3]', () => {
    fc.assert(
      fc.property(arbScenario, (scenario) => {
        const r = runScenario(scenario);
        const authored = scenario.cues.flatMap((c, ci) => c.actions.map((a, ai) => ({ a, c, ci, ai })));
        expect(r.frames).toHaveLength(authored.length);
        authored.forEach(({ a, c, ci, ai }, i) => {
          expect(r.frames[i].cueId).toBe(c.id);
          expect(r.frames[i].actionId).toBe(a.id);
          expect(r.frames[i].cueIndex).toBe(ci);
          expect(r.frames[i].actionIndex).toBe(ai);
          // requiredSource is exactly what was authored, whatever the computed state was.
          expect(canon(r.frames[i].action)).toEqual(canon(a));
        });
      }),
      cfg,
    );
  });

  it('P9 differential: engine equals the independent reference model, frame by frame [FR2, FR4, design table]', () => {
    fc.assert(
      fc.property(arbScenario, (scenario) => {
        const r = runScenario(scenario);
        const model: Record<string, MState> = Object.create(null);
        const lastApplied: Record<string, { cueId: string; actionId: string; cueIndex: number; actionIndex: number } | undefined> =
          Object.create(null);
        for (const p of scenario.props) model[p.id] = initialToModel(p.initial);

        let i = 0;
        scenario.cues.forEach((cue, cueIndex) => {
          cue.actions.forEach((action, actionIndex) => {
            const f = r.frames[i++];
            const out = refStep(action.kind, action.requiredSource, action.destination, model[action.propId]);
            expect(f.applied).toBe(out.type === 'ok');
            if (out.type === 'ok') {
              model[action.propId] = out.next;
              lastApplied[action.propId] = { cueId: cue.id, actionId: action.id, cueIndex, actionIndex };
            } else {
              expect(f.issues).toHaveLength(1);
              const issue = f.issues[0];
              expect(issue.id).toBe(`issue::${action.id}`); // stable, frame-order independent
              if (out.type === 'shape') {
                expect(issue.cause).toBeUndefined(); // action-shape rejections carry no cause
                expect(issue.severity).toBe('error');
              } else {
                expect(issue.severity).toBe(out.severity);
                const last = lastApplied[action.propId];
                expect(canon(issue.cause)).toEqual(
                  canon(last ? { kind: 'action', ref: last } : { kind: 'initial', propId: action.propId }),
                );
              }
            }
            for (const id of PROP_IDS) {
              const m = model[id];
              const got = f.after[id] as unknown as Record<string, unknown>;
              expect(got.status).toBe(m.status);
              if (m.status === 'available') {
                expect(got.zoneId).toBe(m.zoneId);
                expect(got.holderId).toBe(m.holderId);
              }
            }
          });
        });
        for (const id of PROP_IDS) expect(modelOf(r.final[id]).status).toBe(model[id].status);
      }),
      cfg,
    );
  });

  it('P10 an unknown start is never resolved by an action; it stays uncertain [FR4.1, FR4.2, A07]', () => {
    fc.assert(
      fc.property(arbScenario, (scenario) => {
        const r = runScenario(scenario);
        const unknownIds = scenario.props.filter((p) => p.initial.status === 'unknown').map((p) => p.id);
        for (const id of unknownIds) {
          expect(modelOf(r.final[id]).status).toBe('unknown');
          for (const f of r.frames.filter((x) => x.action.propId === id)) {
            expect(f.applied).toBe(false);
            // Shape errors are reported as errors; every well-formed action on it is 'uncertain',
            // except replenish which is rejected as an error.
            const issue = f.issues[0];
            if (issue.cause) expect(issue.severity).toBe(f.action.kind === 'replenish' ? 'error' : 'uncertain');
          }
        }
      }),
      cfg,
    );
  });

  it('P11 identity: props sharing a name never merge, and declaration order changes nothing [FR1.1, A04]', () => {
    fc.assert(
      fc.property(arbScenario, (scenario) => {
        const reversed: Scenario = { ...scenario, props: [...scenario.props].reverse() };
        const a = runScenario(scenario);
        const b = runScenario(reversed);
        expect(canon(b.final)).toEqual(canon(a.final));
        expect(canon(b.frames.map((f) => [f.applied, f.after]))).toEqual(canon(a.frames.map((f) => [f.applied, f.after])));
        expect(canon(b.issues)).toEqual(canon(a.issues));
      }),
      cfg,
    );
  });

  it('P12 reordering cues changes consequences but never the authored actions or their issue ids [A05, A06]', () => {
    fc.assert(
      fc.property(arbScenario, (scenario) => {
        const reordered: Scenario = { ...scenario, cues: [...scenario.cues].reverse() };
        const r = runScenario(reordered);
        const authored = reordered.cues.flatMap((c) => c.actions);
        expect(r.frames.map((f) => f.actionId)).toEqual(authored.map((a) => a.id));
        r.frames.forEach((f, i) => expect(canon(f.action)).toEqual(canon(authored[i])));
        for (const issue of r.issues) expect(issue.id).toBe(`issue::${issue.actionId}`);
      }),
      cfg,
    );
  });
});
