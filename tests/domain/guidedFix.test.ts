// Reviewer-authored (Claude), not Kiro — see README "Who wrote what".
// Covers the guided fix: the two unambiguous cases, the cases that must NOT get an edit,
// and the invariant that a fix changes the plan rather than the authored requirement.

import { describe, expect, it } from 'vitest';
import { runScenario } from '../../src/domain/engine';
import { applyFix, isGuidedFix, suggestFix } from '../../src/domain/guidedFix';
import { DEMO_SCENARIOS } from '../../src/fixtures/demos';
import type { Frame, Scenario } from '../../src/domain/types';

const demo = (id: string): Scenario => {
  const found = DEMO_SCENARIOS.find(entry => entry.id === id);
  if (!found) throw new Error(`no demo ${id}; have ${DEMO_SCENARIOS.map(d => d.id).join(', ')}`);
  return JSON.parse(JSON.stringify(found.scenario)) as Scenario;
};

const firstError = (scenario: Scenario): Frame => {
  const run = runScenario(scenario);
  const frame = run.frames.find(f => f.issues.some(i => i.severity === 'error'));
  if (!frame) throw new Error('expected an error frame');
  return frame;
};

const errorCount = (scenario: Scenario) =>
  runScenario(scenario).issues.filter(i => i.severity === 'error').length;

describe('guided fix — the missing handoff', () => {
  const scenario = demo('missing-handoff');

  it('offers exactly one edit and says what it will do', () => {
    const outcome = suggestFix(scenario, firstError(scenario));
    expect(isGuidedFix(outcome)).toBe(true);
    if (!isGuidedFix(outcome)) return;
    expect(outcome.action.kind).toBe('transfer');
    expect(outcome.description).toContain('handoff');
    // The description must name the cue and the position, not just an id.
    expect(outcome.description).toMatch(/cue "/);
  });

  it('inserts immediately before the failing step', () => {
    const frame = firstError(scenario);
    const outcome = suggestFix(scenario, frame);
    if (!isGuidedFix(outcome)) throw new Error('expected a fix');
    const applied = applyFix(scenario, outcome);
    expect(applied.blocked).toBe(false);
    if (applied.blocked) return;
    const cue = applied.result.cues.find(c => c.id === frame.cueId)!;
    expect(cue.actions[outcome.index].id).toBe(outcome.action.id);
    expect(cue.actions[outcome.index + 1].id).toBe(frame.actionId);
  });

  it('makes the scene replay clean, because the plan changed', () => {
    expect(errorCount(scenario)).toBeGreaterThan(0);
    const outcome = suggestFix(scenario, firstError(scenario));
    if (!isGuidedFix(outcome)) throw new Error('expected a fix');
    const applied = applyFix(scenario, outcome);
    if (applied.blocked) throw new Error(applied.reason);
    expect(errorCount(applied.result)).toBe(0);
  });

  it('never rewrites the authored requiredSource of the failing step', () => {
    const frame = firstError(scenario);
    const before = JSON.stringify(
      scenario.cues.find(c => c.id === frame.cueId)!.actions.find(a => a.id === frame.actionId)!.requiredSource,
    );
    const outcome = suggestFix(scenario, frame);
    if (!isGuidedFix(outcome)) throw new Error('expected a fix');
    const applied = applyFix(scenario, outcome);
    if (applied.blocked) throw new Error(applied.reason);
    const after = JSON.stringify(
      applied.result.cues.find(c => c.id === frame.cueId)!.actions.find(a => a.id === frame.actionId)!.requiredSource,
    );
    expect(after).toBe(before);
  });

  it('leaves the original scene untouched', () => {
    const snapshot = JSON.stringify(scenario);
    const outcome = suggestFix(scenario, firstError(scenario));
    if (isGuidedFix(outcome)) applyFix(scenario, outcome);
    expect(JSON.stringify(scenario)).toBe(snapshot);
  });
});

describe('guided fix — where there must be no edit', () => {
  it('refuses to invent a fix for a consumed instance, and names the step instead', () => {
    const scenario = demo('consumed-reuse');
    const outcome = suggestFix(scenario, firstError(scenario));
    expect(isGuidedFix(outcome)).toBe(false);
    expect(outcome).not.toBeNull();
    if (outcome && !isGuidedFix(outcome)) {
      expect(outcome.advice).toMatch(/replenish/i);
      expect(outcome.advice).toMatch(/separate instance|second physical/i);
    }
  });

  it('offers nothing at all on a frame with no error', () => {
    const scenario = demo('valid-control');
    const run = runScenario(scenario);
    expect(run.issues.filter(i => i.severity === 'error')).toHaveLength(0);
    for (const frame of run.frames) {
      expect(suggestFix(scenario, frame)).toBeNull();
    }
  });
});

describe('guided fix — generated ids', () => {
  it('does not collide with an existing action id', () => {
    const scenario = demo('missing-handoff');
    const outcome = suggestFix(scenario, firstError(scenario));
    if (!isGuidedFix(outcome)) throw new Error('expected a fix');
    const existing = scenario.cues.flatMap(c => c.actions.map(a => a.id));
    expect(existing).not.toContain(outcome.action.id);
  });
});
