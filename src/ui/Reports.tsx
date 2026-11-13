import type { Scenario, RunResult } from '../domain/types';
import { presetReport, runnerReport, resetReport } from '../domain/report';
import { downloadCsv, formatPosition, presetCsv, resetCsv, runnerCsv } from './reportCsv';

interface ReportsProps {
  scenario: Scenario;
  runResult: RunResult;
}

/** One labelled download per report (K6). Real buttons with names that say what they do. */
function CsvButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="small csv-button" onClick={onClick}>
      {label}
    </button>
  );
}

export function Reports({ scenario, runResult }: ReportsProps) {
  const preset = presetReport(scenario);
  const runner = runnerReport(scenario, runResult.frames);
  const reset = resetReport(scenario, runResult);

  return (
    <div className="card">
      <h2 className="panel-header">Reports</h2>
      <p className="csv-note">
        Each report can be downloaded as its own CSV file for a spreadsheet. The file is built in
        this browser from the plan on screen; nothing is uploaded. Like the screen, it describes the
        planned state, not live tracking.
      </p>
      
      <div className="report-section">
        <h3 className="report-title">Preset Report — Initial Positions</h3>
        <p style={{ marginBottom: '1rem', fontSize: '0.9375rem', color: 'var(--text-mid)' }}>
          Where each prop starts before the show.
        </p>
        <CsvButton label="Download preset report (CSV)" onClick={() => downloadCsv('ghostlight-preset-report.csv', presetCsv(preset))} />
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Preset report table">
        <table className="report-table">
          <thead>
            <tr>
              <th>Prop ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Initial Position</th>
            </tr>
          </thead>
          <tbody>
            {preset.map(p => (
              <tr key={p.propId}>
                <td><code>{p.propId}</code></td>
                <td>{p.propName}</td>
                <td>{p.status}</td>
                <td>
                  {p.status === 'available' && p.initial ? formatPosition(p.initial) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="report-section">
        <h3 className="report-title">Runner Report — Ordered Requirements</h3>
        <p style={{ marginBottom: '1rem', fontSize: '0.9375rem', color: 'var(--text-mid)' }}>
          What each cue demands, with warnings for rejected actions.
        </p>
        <CsvButton label="Download runner report (CSV)" onClick={() => downloadCsv('ghostlight-runner-report.csv', runnerCsv(scenario, runner))} />
        {runner.map(cue => (
          <div key={cue.cueId} style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--heading-text)' }}>{cue.cueTitle}</h4>
            <div className="table-scroll" tabIndex={0} role="region" aria-label={`Runner report for ${cue.cueTitle}`}>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Prop</th>
                  <th>Required Source</th>
                  <th>Destination</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {cue.actions.map(act => {
                  const prop = scenario.props.find(p => p.id === act.action.propId);
                  const isRejected = !act.applied;
                  
                  return (
                    <tr key={act.action.id} className={isRejected ? 'warning-row' : ''}>
                      <td><strong>{act.action.kind}</strong></td>
                      <td>{prop?.name || act.action.propId} (<code>{act.action.propId}</code>)</td>
                      <td>{formatPosition(act.action.requiredSource)}</td>
                      <td>{formatPosition(act.action.destination)}</td>
                      <td>
                        {isRejected && act.issue ? (
                          <div>
                            <div className={`issue-badge ${act.issue.severity}`}>
                              {act.issue.severity === 'error' ? '⚠ Error' : '? Uncertain'}
                            </div>
                            <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem', color: 'var(--text-mid)' }}>
                              {act.issue.message}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--success-text)', fontWeight: 500 }}>✓ Applied</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        ))}
      </div>

      <div className="report-section">
        <h3 className="report-title">Reset Report — Return to Initial State</h3>
        <p style={{ marginBottom: '1rem', fontSize: '0.9375rem', color: 'var(--text-mid)' }}>
          Instructions to reset props after the show, based on initial and final positions.
        </p>
        <CsvButton label="Download reset report (CSV)" onClick={() => downloadCsv('ghostlight-reset-report.csv', resetCsv(reset))} />
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Reset report table">
        <table className="report-table">
          <thead>
            <tr>
              <th>Prop ID</th>
              <th>Name</th>
              <th>Action</th>
              <th>Instructions</th>
            </tr>
          </thead>
          <tbody>
            {reset.map(inst => (
              <tr key={inst.propId} className={inst.kind === 'replace' || inst.kind === 'uncertain' ? 'warning-row' : ''}>
                <td><code>{inst.propId}</code></td>
                <td>{inst.propName}</td>
                <td>
                  <strong style={{ textTransform: 'uppercase' }}>{inst.kind}</strong>
                </td>
                <td>{inst.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--parchment-dark)', borderRadius: '4px' }}>
        <button onClick={() => window.print()} className="secondary">
          Print Reports
        </button>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-mid)', marginTop: '0.5rem' }}>
          Print-friendly view with stable ordering and text warnings.
        </p>
      </div>
    </div>
  );
}
