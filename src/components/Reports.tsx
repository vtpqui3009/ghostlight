import { SeverityBadge } from './Findings';
import { presetReport, resetReport, runnerReport } from '../domain/reports';
import type { RunResult, Scenario } from '../domain/types';

export interface ReportsProps {
  scenario: Scenario;
  run: RunResult;
  onDownload: (kind: 'run' | 'preset' | 'reset') => void;
}

const ROLE_WORD = { gives: 'hands over', takes: 'receives / collects', does: 'does' } as const;

/** Preset, per-runner and reset lists. These are the sheets a stage manager would print. */
export function Reports({ scenario, run, onDownload }: ReportsProps) {
  const preset = presetReport(scenario);
  const runners = runnerReport(scenario, run);
  const resets = resetReport(scenario, run);

  return (
    <div>
      <section className="panel">
        <header>
          <h2>Preset — before the top of the scene</h2>
          <button type="button" className="no-print" onClick={() => onDownload('preset')}>Download preset CSV</button>
        </header>
        {preset.zones.map(zone => (
          <div key={zone.zoneId}>
            <h3>{zone.zoneName}</h3>
            <ul>
              {zone.items.map(item => (
                <li key={item.propId}>
                  {item.propName} <span className="muted">({item.kind}{item.holderId ? `, held by ${item.holderName}` : ''})</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {preset.unrecorded.length > 0 ? (
          <div>
            <h3>Starting position not recorded</h3>
            <p className="muted">These cannot be checked until someone records where they start.</p>
            <ul>{preset.unrecorded.map(item => <li key={item.propId}>{item.propName} <span className="muted">({item.kind})</span></li>)}</ul>
          </div>
        ) : null}
        {preset.offstage.length > 0 ? (
          <div>
            <h3>Not in the scene at the top</h3>
            <ul>{preset.offstage.map(item => <li key={item.propId}>{item.propName} <span className="muted">({item.kind})</span></li>)}</ul>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <header>
          <h2>Who does what</h2>
          <button type="button" className="no-print" onClick={() => onDownload('run')}>Download step-by-step CSV</button>
        </header>
        {runners.map(runner => (
          <div key={runner.holderId ?? 'crew'}>
            <h3>{runner.holderName}</h3>
            <div className="scroll-x">
              <table>
                <thead>
                  <tr><th scope="col">Cue</th><th scope="col">Role</th><th scope="col">Step</th><th scope="col">Findings</th></tr>
                </thead>
                <tbody>
                  {runner.steps.map(step => (
                    <tr key={`${step.actionId}-${step.role}`}>
                      <td>{step.cueIndex + 1} — {step.cueTitle}</td>
                      <td>{ROLE_WORD[step.role]}</td>
                      <td>{step.text}</td>
                      <td>
                        {step.issues.length === 0
                          ? <span className="muted">—</span>
                          : step.issues.map(issue => <span key={issue.id} style={{ display: 'block' }}><SeverityBadge severity={issue.severity} /> {issue.message}</span>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      <section className="panel">
        <header>
          <h2>Reset — after the scene</h2>
          <button type="button" className="no-print" onClick={() => onDownload('reset')}>Download reset CSV</button>
        </header>
        <div className="scroll-x">
          <table>
            <caption>Comparing the recorded start with where the plan ends.</caption>
            <thead>
              <tr><th scope="col">Instance</th><th scope="col">Started</th><th scope="col">Ends</th><th scope="col">Action needed</th></tr>
            </thead>
            <tbody>
              {resets.map(row => (
                <tr key={row.propId}>
                  <th scope="row">{row.propName} <span className="muted">({row.kind})</span></th>
                  <td>{row.start}</td>
                  <td>{row.end}</td>
                  <td>
                    {row.needsReplacement
                      ? 'Replace with a new instance before the next performance'
                      : row.needsReset ? 'Return to its starting position' : 'Nothing to reset'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
