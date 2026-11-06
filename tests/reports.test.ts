import { describe, expect, it } from 'vitest';
import { runScenario } from '../src/domain/engine';
import { presetCsv, presetReport, resetCsv, resetReport, runCsv, runnerReport } from '../src/domain/reports';
import { consumedReuseFixed, demoScenario, missingHandoff, validControl } from '../src/domain/samples';

describe('preset report', () => {
  it('groups starting positions and separates what is not recorded', () => {
    const report = presetReport(demoScenario());
    const left = report.zones.find(zone => zone.zoneId === 'left-table')!;
    expect(left.items.map(item => item.propId)).toEqual(['letter-A', 'letter-B', 'seal-A']);
    expect(report.unrecorded.map(item => item.propId)).toEqual(['lamp-A']);
    expect(report.offstage.map(item => item.propId)).toEqual(['seal-B']);
    expect(report.zones.some(zone => zone.items.length === 0)).toBe(false);
  });
});

describe('runner report', () => {
  it('gives each person their own steps in cue order, with both sides of a handoff', () => {
    const scenario = validControl();
    const rows = runnerReport(scenario, runScenario(scenario));
    const a = rows.find(row => row.holderId === 'actor-a')!;
    const b = rows.find(row => row.holderId === 'actor-b')!;
    expect(a.steps.map(step => step.role)).toEqual(['takes', 'gives']);
    expect(b.steps.map(step => step.role)).toEqual(['takes', 'takes', 'does']);
    expect(b.steps.map(step => step.cueIndex)).toEqual([1, 2, 3]);
  });

  it('puts unassigned work under crew and drops people with nothing to do', () => {
    const scenario = consumedReuseFixed();
    const rows = runnerReport(scenario, runScenario(scenario));
    expect(rows.find(row => row.holderId === null)!.steps).toHaveLength(2);
    expect(rows.find(row => row.holderId === 'actor-b')).toBeUndefined();
  });

  it('carries the findings of a step to the person who performs it', () => {
    const scenario = missingHandoff();
    const rows = runnerReport(scenario, runScenario(scenario));
    const b = rows.find(row => row.holderId === 'actor-b')!;
    expect(b.steps[0].issues.map(issue => issue.code)).toEqual(['source-mismatch']);
  });
});

describe('reset report', () => {
  it('marks what moved and what has to be replaced', () => {
    const scenario = demoScenario();
    const rows = resetReport(scenario, runScenario(scenario));
    const byId = new Map(rows.map(row => [row.propId, row]));
    expect(byId.get('letter-A')).toMatchObject({ needsReset: true, needsReplacement: false });
    expect(byId.get('seal-A')).toMatchObject({ needsReset: true, needsReplacement: true });
    expect(byId.get('letter-B')!.needsReset).toBe(true);
    expect(byId.get('lamp-A')!.start).toContain('not recorded');
  });

  it('reports nothing to reset when the plan ends where it began', () => {
    const scenario = { ...validControl(), cues: [] };
    expect(resetReport(scenario, runScenario(scenario)).every(row => !row.needsReset)).toBe(true);
  });
});

describe('csv export', () => {
  const scenario = missingHandoff();
  const run = runScenario(scenario);

  it('writes one row per planned step with before and after positions', () => {
    const lines = runCsv(scenario, run).split('\r\n');
    expect(lines).toHaveLength(run.frames.length + 1);
    expect(lines[0]).toContain('planned_before,planned_after,applied,findings');
    expect(lines.at(-1)).toContain('rejected');
  });

  it('quotes separators and neutralises spreadsheet formulas', () => {
    const risky = { ...scenario, cues: [{ ...scenario.cues[0], title: '=cmd|"x",y' }] };
    const line = runCsv(risky, runScenario(risky)).split('\r\n')[1];
    expect(line).toContain('"\'=cmd|""x"",y"');
  });

  it('exports preset and reset tables', () => {
    expect(presetCsv(demoScenario()).split('\r\n')[0]).toBe('zone,prop_id,prop_name,kind,holder');
    expect(resetCsv(scenario, run)).toContain('needs_replacement');
  });
});
