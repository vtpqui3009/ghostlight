import type { Scenario, Action, Cause, Frame, TraceRef, PropState } from './types';
import { copyCause, copyAction } from './ids';

export interface PresetReport {
  propId: string;
  propName: string;
  status: 'available' | 'unknown' | 'absent';
  initial?: { zoneId: string; holderId: string | null };
}

export function presetReport(scenario: Scenario): PresetReport[] {
  const result: PresetReport[] = [];
  for (const prop of scenario.props) {
    const initial = prop.initial;
    const report: PresetReport = {
      propId: prop.id,
      propName: prop.name,
      status: initial.status,
    };
    if (initial.status === 'available') {
      report.initial = { zoneId: initial.zoneId!, holderId: initial.holderId! };
    }
    result.push(report);
  }
  return result;
}

export interface RunnerAction {
  cueId: string;
  cueTitle: string;
  action: Action;
  applied: boolean;
  issue?: { code: string; severity: 'error' | 'uncertain'; message: string; suggestion: string };
  cause?: Cause;
}

export interface RunnerCue {
  cueId: string;
  cueTitle: string;
  actions: RunnerAction[];
}

export function runnerReport(scenario: Scenario, frames: Frame[]): RunnerCue[] {
  const cues: RunnerCue[] = [];
  for (const cue of scenario.cues) {
    const cueActions: RunnerAction[] = [];
    for (const frame of frames) {
      if (frame.cueId === cue.id) {
        const issue = frame.issues.length > 0 ? frame.issues[0] : undefined;
        cueActions.push({
          cueId: frame.cueId,
          cueTitle: cue.title,
          action: copyAction(frame.action),
          applied: frame.applied,
          issue: issue ? { code: issue.code, severity: issue.severity, message: issue.message, suggestion: issue.suggestion } : undefined,
          cause: issue?.cause ? copyCause(issue.cause) : undefined,
        });
      }
    }
    cues.push({ cueId: cue.id, cueTitle: cue.title, actions: cueActions });
  }
  return cues;
}

export interface ResetInstruction {
  propId: string;
  propName: string;
  kind: 'return' | 'remove' | 'replace' | 'none' | 'uncertain';
  description: string;
}

export interface RunResultStateMap {
  initial: Record<string, { status: string; zoneId?: string; holderId?: string | null }>;
  final: Record<string, { status: string; zoneId?: string; holderId?: string | null }>;
}

export function resetReport(scenario: Scenario, runResult: { initial: Record<string, PropState>; final: Record<string, PropState> }): ResetInstruction[] {
  const result: ResetInstruction[] = [];
  for (const prop of scenario.props) {
    const initial = runResult.initial[prop.id];
    const finalState = runResult.final[prop.id];
    if (finalState.status === 'consumed') {
      result.push({
        propId: prop.id,
        propName: prop.name,
        kind: 'replace',
        description: `Replace ${prop.name} (${prop.id}) with a new instance; this one was consumed.`,
      });
      continue;
    }
    if (initial.status === 'available' && finalState.status === 'available') {
      const initialPos = initial as { zoneId: string; holderId: string | null };
      const finalPos = finalState as { zoneId: string; holderId: string | null };
      if (initialPos.zoneId === finalPos.zoneId && initialPos.holderId === finalPos.holderId) {
        result.push({
          propId: prop.id,
          propName: prop.name,
          kind: 'none',
          description: `${prop.name} (${prop.id}) is already at its initial location (${initialPos.zoneId}${initialPos.holderId ? ` / ${initialPos.holderId}` : ' (resting)'}) - no action needed.`,
        });
      } else {
        result.push({
          propId: prop.id,
          propName: prop.name,
          kind: 'return',
          description: `Return ${prop.name} (${prop.id}) to initial location: zone ${initialPos.zoneId}${initialPos.holderId ? ` / ${initialPos.holderId}` : ' (resting)'}.`,
        });
      }
    } else if (initial.status === 'available' && finalState.status !== 'consumed') {
      result.push({
        propId: prop.id,
        propName: prop.name,
        kind: 'uncertain',
        description: `${prop.name} (${prop.id}) was initially available at ${initial.zoneId}${initial.holderId ? ` / ${initial.holderId}` : ' (resting)'} but is now ${finalState.status}.`,
      });
    } else if (initial.status === 'absent' && finalState.status === 'available') {
      result.push({
        propId: prop.id,
        propName: prop.name,
        kind: 'remove',
        description: `Remove ${prop.name} (${prop.id}) from the show; it was initially absent and is now available.`,
      });
    } else if (initial.status === 'absent' && finalState.status === 'absent') {
      result.push({
        propId: prop.id,
        propName: prop.name,
        kind: 'none',
        description: `${prop.name} (${prop.id}) was initially absent and remains absent - no action needed.`,
      });
    } else if (initial.status === 'absent' && finalState.status !== 'available' && finalState.status !== 'absent') {
      result.push({
        propId: prop.id,
        propName: prop.name,
        kind: 'uncertain',
        description: `${prop.name} (${prop.id}) was initially absent but is now ${finalState.status}.`,
      });
    } else if (initial.status === 'unknown') {
      if (finalState.status === 'unknown') {
        result.push({
          propId: prop.id,
          propName: prop.name,
          kind: 'uncertain',
          description: `${prop.name} (${prop.id}) has an unknown initial state and remains uncertain. Verify and return/remove as appropriate.`,
        });
      } else {
        result.push({
          propId: prop.id,
          propName: prop.name,
          kind: 'uncertain',
          description: `${prop.name} (${prop.id}) had an unknown initial state but is now ${finalState.status}. Verify and return/remove as appropriate.`,
        });
      }
    }
  }
  return result;
}
