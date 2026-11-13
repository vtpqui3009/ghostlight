// Kiro-authored (K6, 2026-11-13). CSV export of the three reports, as pure functions so
// they can be tested without a DOM. The rows and their order are taken from the same
// report functions the on-screen tables use (src/domain/report.ts), and positions are
// formatted by the same `formatPosition`, so the file says what the screen says.
//
// Formula injection: a field whose first non-whitespace character is =, +, - or @, or
// which starts with a tab or carriage return, is prefixed with a single quote ('). A
// spreadsheet then shows it as text instead of evaluating it, and the visible text stays
// readable (the apostrophe is the conventional "treat as text" marker).
//
// Quoting follows RFC 4180: a field containing a comma, a double quote, CR or LF is
// wrapped in double quotes and embedded double quotes are doubled. Records end in CRLF.
import type { Position, Scenario } from '../domain/types';
import type { PresetReport, ResetInstruction, RunnerCue } from '../domain/report';

export const CSV_HONESTY_LINE = 'Ghostlight planned-state report: this is a plan, not live tracking.';

/** Same text as the on-screen report tables. */
export function formatPosition(pos: Position | undefined | null): string {
  if (!pos) return '\u2014';
  return `${pos.zoneId}${pos.holderId ? ` / ${pos.holderId}` : ' (resting)'}`;
}

export function neutraliseFormula(value: string): string {
  return /^(\s*[=+\-@]|[\t\r])/.test(value) ? `'${value}` : value;
}

export function csvField(value: string): string {
  const safe = neutraliseFormula(value);
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function csv(title: string, header: string[], rows: string[][]): string {
  const lines = [[`${CSV_HONESTY_LINE} ${title}`], header, ...rows];
  return lines.map(r => r.map(csvField).join(',')).join('\r\n') + '\r\n';
}

export function presetCsv(rows: PresetReport[]): string {
  return csv('Preset report: initial positions.', ['Prop ID', 'Name', 'Status', 'Initial position'],
    rows.map(p => [
      p.propId,
      p.propName,
      p.status,
      p.status === 'available' && p.initial ? formatPosition(p.initial) : '\u2014',
    ]));
}

export function runnerCsv(scenario: Scenario, cues: RunnerCue[]): string {
  const rows: string[][] = [];
  for (const cue of cues) {
    for (const act of cue.actions) {
      const prop = scenario.props.find(p => p.id === act.action.propId);
      const result = act.applied ? 'Applied' : act.issue?.severity === 'uncertain' ? 'Uncertain' : 'Error';
      rows.push([
        cue.cueId,
        cue.cueTitle,
        act.action.id,
        act.action.kind,
        act.action.propId,
        prop?.name || act.action.propId,
        formatPosition(act.action.requiredSource),
        formatPosition(act.action.destination),
        result,
        !act.applied && act.issue ? act.issue.message : '',
      ]);
    }
  }
  return csv('Runner report: ordered requirements.',
    ['Cue ID', 'Cue', 'Action ID', 'Kind', 'Prop ID', 'Prop name', 'Required source', 'Destination', 'Result', 'Message'],
    rows);
}

export function resetCsv(rows: ResetInstruction[]): string {
  return csv('Reset report: return to initial state.', ['Prop ID', 'Name', 'Action', 'Instructions'],
    rows.map(r => [r.propId, r.propName, r.kind.toUpperCase(), r.description]));
}

/** Browser download of text already in memory. No network request is made. */
export function downloadCsv(filename: string, text: string): void {
  // The BOM lets spreadsheet apps detect UTF-8, so non-ASCII prop names survive.
  const blob = new Blob(['\uFEFF', text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
