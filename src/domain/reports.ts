import { ACTION_VERBS, actionRunners, describeAction, makeLabels } from './engine';
import type { Issue, PropState, RunResult, Scenario } from './types';

/** Print-friendly reports: what to set before the show, who does what, and what to reset after. */

export interface PresetItem { propId: string; propName: string; kind: string; holderId: string | null; holderName: string }
export interface PresetZone { zoneId: string; zoneName: string; items: PresetItem[] }
export interface PresetReport { zones: PresetZone[]; unrecorded: PresetItem[]; offstage: PresetItem[] }

export function presetReport(scenario: Scenario): PresetReport {
  const labels = makeLabels(scenario);
  const zones: PresetZone[] = scenario.zones.map(zone => ({ zoneId: zone.id, zoneName: zone.name, items: [] }));
  const byZone = new Map(zones.map(zone => [zone.zoneId, zone]));
  const unrecorded: PresetItem[] = [];
  const offstage: PresetItem[] = [];
  for (const prop of scenario.props) {
    const item: PresetItem = {
      propId: prop.id, propName: prop.name, kind: prop.kind,
      holderId: prop.initial.holderId ?? null, holderName: labels.holder(prop.initial.holderId ?? null),
    };
    if (prop.initial.status === 'available') byZone.get(prop.initial.zoneId!)?.items.push(item);
    else if (prop.initial.status === 'unknown') unrecorded.push(item);
    else offstage.push(item);
  }
  return { zones: zones.filter(zone => zone.items.length > 0), unrecorded, offstage };
}

export interface RunnerStep { cueIndex: number; cueTitle: string; actionId: string; text: string; role: 'gives' | 'takes' | 'does'; issues: Issue[] }
export interface RunnerReport { holderId: string | null; holderName: string; steps: RunnerStep[] }

export function runnerReport(scenario: Scenario, run: RunResult): RunnerReport[] {
  const labels = makeLabels(scenario);
  const order = [...scenario.holders.map(holder => holder.id), null];
  const rows = new Map<string | null, RunnerReport>(
    order.map(id => [id, { holderId: id, holderName: id ? labels.holder(id) : 'Unassigned / crew', steps: [] }]),
  );
  for (const frame of run.frames) {
    const cueTitle = scenario.cues[frame.cueIndex]?.title ?? frame.cueId;
    for (const runner of actionRunners(frame.action)) {
      const row = rows.get(runner.holderId) ?? rows.get(null)!;
      row.steps.push({
        cueIndex: frame.cueIndex, cueTitle, actionId: frame.actionId, role: runner.role,
        text: describeAction(frame.action, labels), issues: frame.issues,
      });
    }
  }
  return [...rows.values()].filter(row => row.steps.length > 0);
}

export interface ResetRow {
  propId: string; propName: string; kind: string;
  start: string; end: string; needsReset: boolean; needsReplacement: boolean;
}

/** What has to happen between performances, including consumables that need replacing. */
export function resetReport(scenario: Scenario, run: RunResult): ResetRow[] {
  const labels = makeLabels(scenario);
  const same = (a: PropState | undefined, b: PropState | undefined) =>
    a?.status === b?.status && a?.zoneId === b?.zoneId && (a?.holderId ?? null) === (b?.holderId ?? null);
  return scenario.props.map(prop => {
    const start = run.initial[prop.id];
    const end = run.final[prop.id];
    return {
      propId: prop.id, propName: prop.name, kind: prop.kind,
      start: labels.state(start), end: labels.state(end),
      needsReset: !same(start, end),
      needsReplacement: end?.status === 'consumed',
    };
  });
}

const csvCell = (value: string | number | boolean) => {
  const text = String(value);
  // Guard against spreadsheet formula injection in exported text.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const csv = (rows: (string | number | boolean)[][]) => rows.map(row => row.map(csvCell).join(',')).join('\r\n');

/** One row per planned step, with modelled position before and after and any findings. */
export function runCsv(scenario: Scenario, run: RunResult): string {
  const labels = makeLabels(scenario);
  const rows: (string | number | boolean)[][] = [[
    'step', 'cue_number', 'cue_title', 'action_id', 'action', 'prop_id', 'prop_name',
    'required_source', 'destination', 'planned_before', 'planned_after', 'applied', 'findings', 'note',
  ]];
  for (const frame of run.frames) {
    rows.push([
      frame.index + 1, frame.cueIndex + 1, scenario.cues[frame.cueIndex]?.title ?? frame.cueId,
      frame.actionId, ACTION_VERBS[frame.action.kind], frame.action.propId, labels.prop(frame.action.propId),
      labels.position(frame.action.requiredSource), labels.position(frame.action.destination ?? null),
      labels.state(frame.before[frame.action.propId]), labels.state(frame.after[frame.action.propId]),
      frame.applied ? 'yes' : 'rejected',
      frame.issues.map(issue => `${issue.severity}: ${issue.message}`).join(' | '),
      frame.action.note ?? '',
    ]);
  }
  return csv(rows);
}

export function presetCsv(scenario: Scenario): string {
  const report = presetReport(scenario);
  const rows: (string | number | boolean)[][] = [['zone', 'prop_id', 'prop_name', 'kind', 'holder']];
  for (const zone of report.zones) {
    for (const item of zone.items) rows.push([zone.zoneName, item.propId, item.propName, item.kind, item.holderName]);
  }
  for (const item of report.unrecorded) rows.push(['(starting position not recorded)', item.propId, item.propName, item.kind, item.holderName]);
  for (const item of report.offstage) rows.push(['(not in the scene at the top)', item.propId, item.propName, item.kind, item.holderName]);
  return csv(rows);
}

export function resetCsv(scenario: Scenario, run: RunResult): string {
  const rows: (string | number | boolean)[][] = [['prop_id', 'prop_name', 'kind', 'planned_start', 'planned_end', 'needs_reset', 'needs_replacement']];
  for (const row of resetReport(scenario, run)) {
    rows.push([row.propId, row.propName, row.kind, row.start, row.end, row.needsReset ? 'yes' : 'no', row.needsReplacement ? 'yes' : 'no']);
  }
  return csv(rows);
}
