import { describeAction, makeLabels } from '../domain/engine';
import type { Issue, RunResult, Scenario } from '../domain/types';

const SEVERITY_LABEL = { error: 'Problem', uncertain: 'Not enough information' } as const;

export function SeverityBadge({ severity }: { severity: Issue['severity'] }) {
  return (
    <span className={`badge ${severity}`}>
      <span aria-hidden="true">{severity === 'error' ? '▲' : '?'}</span>
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

export interface FindingListProps {
  scenario: Scenario;
  run: RunResult;
  issues: Issue[];
  onGoToStep: (actionId: string) => void;
  emptyMessage: string;
}

/**
 * Each finding states the condition that failed and, where there is one, the earlier step that
 * caused it. Causes are always earlier in the plan: nothing is explained by a later cue.
 */
export function FindingList({ scenario, run, issues, onGoToStep, emptyMessage }: FindingListProps) {
  const labels = makeLabels(scenario);
  if (issues.length === 0) return <p className="muted">{emptyMessage}</p>;
  return (
    <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {issues.map(issue => {
        const frame = run.frames.find(entry => entry.actionId === issue.actionId);
        const cueNumber = frame ? frame.cueIndex + 1 : null;
        const cueTitle = frame ? scenario.cues[frame.cueIndex]?.title : undefined;
        const cause = issue.cause ? run.frames.find(entry => entry.actionId === issue.cause!.actionId) : undefined;
        return (
          <li key={issue.id} className={`finding ${issue.severity}`}>
            <div className="row">
              <SeverityBadge severity={issue.severity} />
              <span className="muted">
                {cueNumber ? `Cue ${cueNumber}${cueTitle ? ` — ${cueTitle}` : ''}, step ${frame!.actionIndex + 1}` : 'This scene'}
                {' · '}
                {labels.prop(issue.propId)}
              </span>
              <span className="badge plain" title="Finding code used in the CSV export">{issue.code}</span>
            </div>
            <h3>{issue.message}</h3>
            <p className="suggestion">{issue.suggestion}</p>
            <p className="trace">
              {cause
                ? `Caused by cue ${cause.cueIndex + 1}, step ${cause.actionIndex + 1}: ${describeAction(cause.action, labels)}.`
                : 'Traced back to the recorded starting state of this instance.'}
            </p>
            <div className="row">
              {frame ? <button type="button" onClick={() => onGoToStep(issue.actionId)}>Show this step</button> : null}
              {cause ? <button type="button" onClick={() => onGoToStep(cause.actionId)}>Show the cause</button> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
