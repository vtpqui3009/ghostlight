// Kiro-authored (K12, 2026-11-13). The pure logic behind the Ghostlight MCP server.
//
// Why this server exists: earlier sessions produced a test that compared an object with
// itself, and a fixture whose "intended rejection" turned out to be a valid transfer. An MCP
// tool that runs the REAL engine lets an agent check a fixture's verdict before it writes a
// test around it. Nothing here re-implements a rule: every answer comes from src/domain
// (and the shared stage derivation in src/ui/stageModel.ts), so the tool and the app can
// never disagree.
//
// Every function is pure and read-only: no network, no filesystem, no environment, and the
// caller's JSON text is never mutated. A suggested fix is DESCRIBED, never applied.
import { parseScenarioJson } from '../../src/domain/schema';
import { runScenario } from '../../src/domain/engine';
import { presetReport, runnerReport, resetReport } from '../../src/domain/report';
import { isGuidedFix, suggestFix } from '../../src/domain/guidedFix';
import { deriveStageModel, verdictSentence } from '../../src/ui/stageModel';
import { DEMO_SCENARIOS } from '../../src/fixtures/demos';
import type { Cause, PropState, Scenario } from '../../src/domain/types';

export const HONESTY =
  'Planned state, not live tracking: this reads the plan it is given and never sees a real stage. It is not a safety system.';

export type Failure = { ok: false; errors: string[]; note: string };

const fail = (errors: string[]): Failure => ({ ok: false, errors, note: HONESTY });

function load(json: unknown): { ok: true; scenario: Scenario } | Failure {
  if (typeof json !== 'string') return fail(['json: expected the scenario as a JSON string']);
  const parsed = parseScenarioJson(json);
  return parsed.success ? { ok: true, scenario: parsed.data } : fail(parsed.errors);
}

function describeCause(cause: Cause | undefined) {
  if (!cause) return null;
  return cause.kind === 'initial'
    ? { kind: 'initial' as const, propId: cause.propId }
    : { kind: 'action' as const, cueId: cause.ref.cueId, actionId: cause.ref.actionId };
}

function describeState(state: PropState) {
  return state.status === 'available'
    ? { status: state.status, zoneId: state.zoneId, holderId: state.holderId }
    : { status: state.status };
}

/** Replay a scenario and report every action in order. */
export function checkScenario(json: unknown) {
  const loaded = load(json);
  if (!loaded.ok) return loaded;
  const run = runScenario(loaded.scenario);
  const actions = run.frames.map(f => ({
    index: f.index,
    cueId: f.cueId,
    actionId: f.actionId,
    kind: f.action.kind,
    propId: f.action.propId,
    applied: f.applied,
    issue: f.issues[0]
      ? {
          id: f.issues[0].id,
          code: f.issues[0].code,
          severity: f.issues[0].severity,
          message: f.issues[0].message,
          suggestion: f.issues[0].suggestion,
          cause: describeCause(f.issues[0].cause),
        }
      : null,
  }));
  const finalState: Record<string, ReturnType<typeof describeState>> = Object.create(null);
  for (const p of loaded.scenario.props) finalState[p.id] = describeState(run.final[p.id]);
  return {
    ok: true as const,
    title: loaded.scenario.title,
    clean: run.issues.length === 0,
    counts: {
      actions: actions.length,
      applied: actions.filter(a => a.applied).length,
      rejected: actions.filter(a => a.issue?.severity === 'error').length,
      uncertain: actions.filter(a => a.issue?.severity === 'uncertain').length,
    },
    actions,
    finalState,
    note: HONESTY,
  };
}

/** Explain one action: the verdict in words, its cause, and a fix that is described, not applied. */
export function explainIssue(json: unknown, actionId: unknown) {
  const loaded = load(json);
  if (!loaded.ok) return loaded;
  if (typeof actionId !== 'string') return fail(['actionId: expected a string']);
  const run = runScenario(loaded.scenario);
  const frame = run.frames.find(f => f.actionId === actionId);
  if (!frame) {
    return fail([`actionId: no action "${actionId}". Known ids: ${run.frames.map(f => f.actionId).join(', ') || '(none)'}`]);
  }
  const model = deriveStageModel(loaded.scenario, frame);
  const issue = frame.issues[0] ?? null;
  const outcome = suggestFix(loaded.scenario, frame);
  const fix = outcome === null
    ? null
    : isGuidedFix(outcome)
      ? { kind: 'guided' as const, description: outcome.description, cueId: outcome.cueId, index: outcome.index, action: outcome.action, applied: false as const }
      : { kind: 'none' as const, advice: outcome.advice };
  return {
    ok: true as const,
    actionId,
    cueId: frame.cueId,
    applied: frame.applied,
    verdict: verdictSentence(model.subject),
    issue: issue
      ? { id: issue.id, code: issue.code, severity: issue.severity, message: issue.message, suggestion: issue.suggestion, cause: describeCause(issue.cause) }
      : null,
    fix,
    note: HONESTY,
  };
}

export type ReportKind = 'preset' | 'runner' | 'reset';
export const REPORT_KINDS: readonly ReportKind[] = ['preset', 'runner', 'reset'];

/** The three crew reports, from the same functions the app prints. */
export function reports(json: unknown, kind: unknown) {
  const loaded = load(json);
  if (!loaded.ok) return loaded;
  if (typeof kind !== 'string' || !REPORT_KINDS.includes(kind as ReportKind)) {
    return fail([`kind: expected one of ${REPORT_KINDS.join(', ')}`]);
  }
  const run = runScenario(loaded.scenario);
  const rows =
    kind === 'preset' ? presetReport(loaded.scenario)
    : kind === 'runner' ? runnerReport(loaded.scenario, run.frames)
    : resetReport(loaded.scenario, run);
  return { ok: true as const, kind: kind as ReportKind, rows, note: HONESTY };
}

export function listDemos() {
  return { ok: true as const, demos: DEMO_SCENARIOS.map(d => ({ id: d.id, title: d.title })), note: HONESTY };
}

/** A bundled scene as a deep JSON copy, so a caller can edit it and send it to check_scenario. */
export function getDemo(id: unknown) {
  const demo = typeof id === 'string' ? DEMO_SCENARIOS.find(d => d.id === id) : undefined;
  if (!demo) return fail([`id: no demo "${String(id)}". Known ids: ${DEMO_SCENARIOS.map(d => d.id).join(', ')}`]);
  return { ok: true as const, id: demo.id, scenario: JSON.parse(JSON.stringify(demo.scenario)) as Scenario, note: HONESTY };
}

/** Pull the normative transition table out of design.md (the server embeds the file at build time). */
export function extractTransitionTable(markdown: string): string {
  const start = markdown.indexOf('### The transition table (normative)');
  if (start === -1) return 'The transition table section was not found in design.md.';
  const rest = markdown.slice(start + 1);
  const next = rest.search(/\n### /);
  return (next === -1 ? markdown.slice(start) : markdown.slice(start, start + 1 + next)).trim();
}
