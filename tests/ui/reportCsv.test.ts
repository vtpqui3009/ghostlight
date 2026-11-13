// Kiro-authored (K6, 2026-11-13). Expected CSV text is written out by hand.
import { describe, it, expect } from 'vitest';
import type { Scenario } from '../../src/domain/types';
import type { PresetReport, ResetInstruction, RunnerCue } from '../../src/domain/report';
import {
  CSV_HONESTY_LINE, csvField, neutraliseFormula, presetCsv, resetCsv, runnerCsv, formatPosition,
} from '../../src/ui/reportCsv';

describe('csvField — quoting', () => {
  it('leaves a plain field alone', () => {
    expect(csvField('letter-A')).toBe('letter-A');
  });
  it('quotes a comma', () => {
    expect(csvField('Left, upstage')).toBe('"Left, upstage"');
  });
  it('quotes and doubles an embedded double quote', () => {
    expect(csvField('the "real" letter')).toBe('"the ""real"" letter"');
  });
  it('quotes a newline inside a field', () => {
    expect(csvField('line one\nline two')).toBe('"line one\nline two"');
    expect(csvField('a\r\nb')).toBe('"a\r\nb"');
  });
  it('keeps a Unicode label intact', () => {
    expect(csvField('Lá thư niêm phong 👻')).toBe('Lá thư niêm phong 👻');
  });
});

describe('csvField — formula injection', () => {
  it('neutralises a leading =', () => {
    expect(csvField('=HYPERLINK("http://x","y")')).toBe(`"'=HYPERLINK(""http://x"",""y"")"`);
  });
  it('neutralises a leading +, - and @', () => {
    expect(csvField('+1')).toBe("'+1");
    expect(csvField('-2+3')).toBe("'-2+3");
    expect(csvField('@SUM(A1)')).toBe("'@SUM(A1)");
  });
  it('neutralises after leading whitespace, and a leading tab or CR', () => {
    expect(neutraliseFormula('  =1+1')).toBe("'  =1+1");
    expect(neutraliseFormula('\t=1')).toBe("'\t=1");
    expect(neutraliseFormula('\rx')).toBe("'\rx");
  });
  it('does not touch the same characters later in the field', () => {
    expect(csvField('a=b')).toBe('a=b');
    expect(csvField('key-A')).toBe('key-A');
  });
});

describe('report CSVs — rows, order and honesty line', () => {
  const scenario: Scenario = {
    version: 1, title: 't', zones: [{ id: 'L', name: 'Left' }], holders: [{ id: 'A', name: 'Actor A' }],
    props: [
      { id: 'letter-A', name: 'Sealed Letter', kind: 'paper', initial: { status: 'available', zoneId: 'L', holderId: null } },
      { id: 'letter-B', name: 'Sealed Letter', kind: 'paper', initial: { status: 'unknown' } },
    ],
    cues: [],
  };

  it('an empty report is the honesty line and the header only', () => {
    // The honesty line contains a comma ("a plan, not live tracking"), so it is quoted.
    expect(presetCsv([])).toBe(
      `"${CSV_HONESTY_LINE} Preset report: initial positions."\r\nProp ID,Name,Status,Initial position\r\n`,
    );
    expect(resetCsv([])).toBe(
      `"${CSV_HONESTY_LINE} Reset report: return to initial state."\r\nProp ID,Name,Action,Instructions\r\n`,
    );
  });

  it('preset keeps the id on every row and the on-screen order', () => {
    const rows: PresetReport[] = [
      { propId: 'letter-A', propName: 'Sealed Letter', status: 'available', initial: { zoneId: 'L', holderId: null } },
      { propId: 'letter-B', propName: 'Sealed Letter', status: 'unknown' },
    ];
    expect(presetCsv(rows).split('\r\n').slice(2)).toEqual([
      'letter-A,Sealed Letter,available,L (resting)',
      'letter-B,Sealed Letter,unknown,\u2014',
      '',
    ]);
  });

  it('runner lists every action in cue order with result and message', () => {
    const cues: RunnerCue[] = [{
      cueId: 'c1', cueTitle: 'Cue 1, the letter', actions: [
        { cueId: 'c1', cueTitle: 'Cue 1, the letter', applied: true,
          action: { id: 'a1', propId: 'letter-A', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } } },
        { cueId: 'c1', cueTitle: 'Cue 1, the letter', applied: false,
          action: { id: 'a2', propId: 'letter-B', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'A' } },
          issue: { code: 'unknown-state', severity: 'uncertain', message: 'letter-B has an unknown position', suggestion: 's' } },
      ],
    }];
    expect(runnerCsv(scenario, cues).split('\r\n').slice(1)).toEqual([
      'Cue ID,Cue,Action ID,Kind,Prop ID,Prop name,Required source,Destination,Result,Message',
      'c1,"Cue 1, the letter",a1,collect,letter-A,Sealed Letter,L (resting),L / A,Applied,',
      'c1,"Cue 1, the letter",a2,collect,letter-B,Sealed Letter,L (resting),L / A,Uncertain,letter-B has an unknown position',
      '',
    ]);
  });

  it('reset upper-cases the action like the screen does', () => {
    const rows: ResetInstruction[] = [{ propId: 'seal-A', propName: 'Wax Seal', kind: 'replace', description: 'Replace with a new instance' }];
    expect(resetCsv(rows).split('\r\n')[2]).toBe('seal-A,Wax Seal,REPLACE,Replace with a new instance');
  });

  it('formatPosition matches the on-screen text', () => {
    expect(formatPosition({ zoneId: 'L', holderId: 'A' })).toBe('L / A');
    expect(formatPosition({ zoneId: 'L', holderId: null })).toBe('L (resting)');
    expect(formatPosition(null)).toBe('\u2014');
    expect(formatPosition(undefined)).toBe('\u2014');
  });
});
