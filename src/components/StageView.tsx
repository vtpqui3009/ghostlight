import { makeLabels } from '../domain/engine';
import type { Frame, PropState, Scenario, StateMap } from '../domain/types';

export interface StageViewProps {
  scenario: Scenario;
  state: StateMap;
  frame: Frame | undefined;
  mode: 'diagram' | 'list';
}

const STATUS_WORD: Record<PropState['status'], string> = {
  available: 'in the plan',
  unknown: 'starting position not recorded',
  absent: 'not in the scene',
  consumed: 'used up',
};

/**
 * Ghost versus solid: the dashed ghost is what the selected step *requires*, the solid chip is
 * where the replay says the instance actually is. Both carry words, not just a shape or a colour.
 */
export function StageView({ scenario, state, frame, mode }: StageViewProps) {
  const labels = makeLabels(scenario);
  const focusPropId = frame?.action.propId;
  const required = frame?.action.requiredSource ?? null;
  const offModel = scenario.props
    .map(prop => ({ prop, status: state[prop.id] }))
    .filter(entry => entry.status && entry.status.status !== 'available');

  if (mode === 'list') {
    return (
      <div className="scroll-x">
        <table>
          <caption>Every instance, with the position the plan implies at this step.</caption>
          <thead>
            <tr><th scope="col">Instance</th><th scope="col">Kind</th><th scope="col">Planned position</th><th scope="col">Required by this step</th></tr>
          </thead>
          <tbody>
            {scenario.props.map(prop => {
              const current = state[prop.id];
              const isFocus = prop.id === focusPropId;
              return (
                <tr key={prop.id}>
                  <th scope="row">{prop.name}{isFocus ? ' (this step)' : ''}</th>
                  <td>{prop.kind}</td>
                  <td>{labels.state(current)}</td>
                  <td>{isFocus ? labels.position(required) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="stage-grid">
        {scenario.zones.map(zone => {
          const here = scenario.props.filter(prop => state[prop.id]?.status === 'available' && state[prop.id]?.zoneId === zone.id);
          const ghostHere = required?.zoneId === zone.id && focusPropId;
          return (
            <section className="zone" key={zone.id} aria-label={`${zone.name}: ${here.length} instance${here.length === 1 ? '' : 's'} in the plan`}>
              <h3>{zone.name}</h3>
              <ul>
                {ghostHere ? (
                  <li>
                    <span className="chip ghost">
                      <span className="mark" aria-hidden="true">◇</span>
                      <span className="name">{labels.prop(focusPropId)}</span>
                      <span className="who">required here, {labels.holder(required.holderId)}</span>
                    </span>
                  </li>
                ) : null}
                {here.map(prop => (
                  <li key={prop.id}>
                    <span className={`chip${prop.id === focusPropId ? ' focus' : ''}`}>
                      <span className="mark" aria-hidden="true">◆</span>
                      <span className="name">{prop.name}</span>
                      <span className="who">planned, {labels.holder(state[prop.id]?.holderId)}</span>
                    </span>
                  </li>
                ))}
                {here.length === 0 && !ghostHere ? <li className="muted">Nothing here in the plan.</li> : null}
              </ul>
            </section>
          );
        })}
      </div>
      {offModel.length > 0 ? (
        <section className="panel" style={{ marginTop: '0.5rem', marginBottom: 0 }} aria-label="Instances with no position in the plan">
          <h3>Not on the plan right now</h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="row">
            {offModel.map(({ prop, status }) => (
              <li key={prop.id}>
                <span className={`chip${status!.status === 'consumed' ? ' consumed' : ''}${prop.id === focusPropId ? ' focus' : ''}`}>
                  <span className="mark" aria-hidden="true">{status!.status === 'consumed' ? '✕' : '·'}</span>
                  <span className="name">{prop.name}</span>
                  <span className="who">{STATUS_WORD[status!.status]}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <p className="legend">
        <span><span aria-hidden="true">◆ </span>solid = position the plan implies</span>
        <span><span aria-hidden="true">◇ </span>ghost, dashed = what the selected step requires</span>
        <span><span aria-hidden="true">✕ </span>struck through = used up and gone</span>
      </p>
    </div>
  );
}
