import { useState } from 'react';
import {
  addAction, addCue, addEntity, addProp, canAddAction, canAddCue, canAddEntity, canAddProp,
  moveAction, moveCue, removeAction, removeCue, removeEntity, removeProp,
  renameEntity, setPropInitial, updateAction, updateCue, updateProp, updateScene,
} from '../domain/edit';
import { ACTION_VERBS } from '../domain/engine';
import type { Action, ActionKind, Position, RunResult, Scenario } from '../domain/types';
import { ACTION_KINDS } from '../domain/types';
import { SeverityBadge } from './Findings';

export interface SceneEditorProps {
  scenario: Scenario;
  run: RunResult;
  onChange: (scenario: Scenario) => void;
  onFocusStep: (actionId: string) => void;
}

const NOT_RECORDED = '__not-recorded__';
const NO_HOLDER = '__no-holder__';

const KIND_HINT: Record<ActionKind, string> = {
  place: 'Set the piece down in an area. No one is holding it afterwards.',
  collect: 'Someone picks the piece up. It stays in the same area, now in their hands.',
  transfer: 'A handoff from one person to another.',
  carryOff: 'The person carrying it moves to another area.',
  consume: 'The piece is used up. It cannot come back in this run.',
  replenish: 'Bring a separate new instance into the scene. It does not revive a used-up one.',
};

export function SceneEditor({ scenario, run, onChange, onFocusStep }: SceneEditorProps) {
  const [blocked, setBlocked] = useState<string | null>(null);

  const zoneOptions = scenario.zones.map(zone => <option key={zone.id} value={zone.id}>{zone.name}</option>);
  const holderOptions = scenario.holders.map(holder => <option key={holder.id} value={holder.id}>{holder.name}</option>);

  const positionEditor = (
    label: string, idBase: string, value: Position | undefined, holderMode: 'free' | 'none',
    onPosition: (next: Position) => void,
  ) => (
    <>
      <label htmlFor={`${idBase}-zone`}>
        {label} — area
        <select
          id={`${idBase}-zone`}
          value={value?.zoneId ?? scenario.zones[0]?.id ?? ''}
          onChange={event => onPosition({ zoneId: event.target.value, holderId: value?.holderId ?? null })}
        >
          {zoneOptions}
        </select>
      </label>
      <label htmlFor={`${idBase}-holder`}>
        {label} — held by
        <select
          id={`${idBase}-holder`}
          value={value?.holderId ?? NO_HOLDER}
          disabled={holderMode === 'none'}
          onChange={event => onPosition({
            zoneId: value?.zoneId ?? scenario.zones[0]?.id ?? '',
            holderId: event.target.value === NO_HOLDER ? null : event.target.value,
          })}
        >
          <option value={NO_HOLDER}>No one (on a surface)</option>
          {holderOptions}
        </select>
      </label>
    </>
  );

  const actionCard = (cueId: string, action: Action, index: number, total: number) => {
    const frame = run.frames.find(entry => entry.actionId === action.id);
    const base = `action-${action.id}`;
    const patch = (changes: Partial<Omit<Action, 'id'>>) => onChange(updateAction(scenario, cueId, action.id, changes));
    return (
      <div className="action-card" key={action.id}>
        <div className="row">
          <strong style={{ fontSize: '0.85rem' }}>Step {index + 1}</strong>
          {frame?.issues.map(issue => <SeverityBadge key={issue.id} severity={issue.severity} />)}
          {frame && frame.issues.length === 0 ? <span className="badge ok"><span aria-hidden="true">✓</span>Checks out</span> : null}
          <span className="spacer" style={{ flex: '1 1 auto' }} />
          <button type="button" className="icon" title="Move this step earlier" aria-label={`Move step ${index + 1} earlier`}
            disabled={index === 0} onClick={() => onChange(moveAction(scenario, cueId, action.id, -1))}>↑</button>
          <button type="button" className="icon" title="Move this step later" aria-label={`Move step ${index + 1} later`}
            disabled={index === total - 1} onClick={() => onChange(moveAction(scenario, cueId, action.id, 1))}>↓</button>
          {frame ? <button type="button" onClick={() => onFocusStep(action.id)}>Show in run-through</button> : null}
          <button type="button" className="danger" onClick={() => onChange(removeAction(scenario, cueId, action.id))}>Remove step</button>
        </div>
        <div className="fields">
          <label htmlFor={`${base}-kind`}>
            What happens
            <select id={`${base}-kind`} value={action.kind} onChange={event => patch({ kind: event.target.value as ActionKind })}>
              {ACTION_KINDS.map(kind => <option key={kind} value={kind}>{ACTION_VERBS[kind]}</option>)}
            </select>
          </label>
          <label htmlFor={`${base}-prop`}>
            Physical instance
            <select id={`${base}-prop`} value={action.propId} onChange={event => patch({ propId: event.target.value })}>
              {scenario.props.map(prop => <option key={prop.id} value={prop.id}>{prop.name} — {prop.kind}</option>)}
            </select>
          </label>
          <label htmlFor={`${base}-source-mode`}>
            Required source (from the run sheet)
            <select
              id={`${base}-source-mode`}
              value={action.requiredSource ? 'recorded' : NOT_RECORDED}
              onChange={event => patch({
                requiredSource: event.target.value === NOT_RECORDED
                  ? null
                  : { zoneId: scenario.zones[0]?.id ?? '', holderId: null },
              })}
            >
              <option value={NOT_RECORDED}>Not recorded</option>
              <option value="recorded">Recorded below</option>
            </select>
          </label>
          {action.requiredSource
            ? positionEditor('Required source', `${base}-source`, action.requiredSource, 'free',
              next => patch({ requiredSource: next }))
            : null}
          {action.kind === 'consume'
            ? null
            : positionEditor('Ends up at', `${base}-dest`, action.destination, action.kind === 'place' ? 'none' : 'free',
              next => patch({ destination: next }))}
        </div>
        <p className="muted" style={{ marginTop: '0.35rem' }}>{KIND_HINT[action.kind]}</p>
        <label htmlFor={`${base}-note`}>
          Note (optional)
          <input id={`${base}-note`} type="text" maxLength={500} value={action.note ?? ''} onChange={event => patch({ note: event.target.value })} />
        </label>
      </div>
    );
  };

  return (
    <div>
      <section className="panel">
        <h2>Scene</h2>
        <div className="fields">
          <label htmlFor="scene-title">
            Title
            <input id="scene-title" type="text" maxLength={120} value={scenario.title}
              onChange={event => onChange(updateScene(scenario, { title: event.target.value }))} />
          </label>
        </div>
        <label htmlFor="scene-description">
          Description — say here if the scene is synthetic or anonymised
          <textarea id="scene-description" maxLength={1000} value={scenario.description ?? ''}
            onChange={event => onChange(updateScene(scenario, { description: event.target.value }))} />
        </label>
      </section>

      {blocked ? <p className="finding error" role="status">{blocked}</p> : null}

      <div className="columns">
        {(['zones', 'holders'] as const).map(collection => (
          <section className="panel" key={collection}>
            <header>
              <h2>{collection === 'zones' ? 'Areas' : 'Runners and actors'}</h2>
              <button type="button" disabled={!canAddEntity(scenario, collection)}
                onClick={() => { setBlocked(null); onChange(addEntity(scenario, collection).scenario); }}>
                Add {collection === 'zones' ? 'area' : 'runner'}
              </button>
            </header>
            <div className="stack">
              {scenario[collection].map(entity => (
                <div className="row" key={entity.id}>
                  <label htmlFor={`entity-${entity.id}`} style={{ flex: '1 1 10rem' }}>
                    {entity.id}
                    <input id={`entity-${entity.id}`} type="text" maxLength={80} value={entity.name}
                      onChange={event => onChange(renameEntity(scenario, collection, entity.id, event.target.value))} />
                  </label>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      const result = removeEntity(scenario, collection, entity.id);
                      if (result.blockedBy.length > 0) {
                        setBlocked(`${entity.name} is still used by: ${result.blockedBy.join('; ')}. Change those first.`);
                      } else {
                        setBlocked(null);
                        onChange(result.scenario);
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="panel">
        <header>
          <h2>Physical instances</h2>
          <button type="button" disabled={!canAddProp(scenario)} onClick={() => onChange(addProp(scenario).scenario)}>Add instance</button>
        </header>
        <p className="muted">
          Two identical-looking pieces are two instances. Keep them separate, or a cue that needs one will be
          checked against the other.
        </p>
        <div className="stack">
          {scenario.props.map(prop => (
            <div className="cue-card" key={prop.id}>
              <div className="fields">
                <label htmlFor={`prop-${prop.id}-name`}>
                  Name <span className="muted">({prop.id})</span>
                  <input id={`prop-${prop.id}-name`} type="text" maxLength={80} value={prop.name}
                    onChange={event => onChange(updateProp(scenario, prop.id, { name: event.target.value }))} />
                </label>
                <label htmlFor={`prop-${prop.id}-kind`}>
                  Kind
                  <input id={`prop-${prop.id}-kind`} type="text" maxLength={80} value={prop.kind}
                    onChange={event => onChange(updateProp(scenario, prop.id, { kind: event.target.value }))} />
                </label>
                <label htmlFor={`prop-${prop.id}-status`}>
                  At the top of the scene
                  <select id={`prop-${prop.id}-status`} value={prop.initial.status}
                    onChange={event => onChange(setPropInitial(scenario, prop.id, { ...prop.initial, status: event.target.value as 'available' | 'unknown' | 'absent' }))}>
                    <option value="available">In a known position</option>
                    <option value="unknown">Starting position not recorded</option>
                    <option value="absent">Not in the scene yet</option>
                  </select>
                </label>
                {prop.initial.status === 'available' ? (
                  <>
                    <label htmlFor={`prop-${prop.id}-zone`}>
                      Area
                      <select id={`prop-${prop.id}-zone`} value={prop.initial.zoneId ?? ''}
                        onChange={event => onChange(setPropInitial(scenario, prop.id, { ...prop.initial, zoneId: event.target.value }))}>
                        {zoneOptions}
                      </select>
                    </label>
                    <label htmlFor={`prop-${prop.id}-holder`}>
                      Held by
                      <select id={`prop-${prop.id}-holder`} value={prop.initial.holderId ?? NO_HOLDER}
                        onChange={event => onChange(setPropInitial(scenario, prop.id, {
                          ...prop.initial,
                          holderId: event.target.value === NO_HOLDER ? null : event.target.value,
                        }))}>
                        <option value={NO_HOLDER}>No one (on a surface)</option>
                        {holderOptions}
                      </select>
                    </label>
                  </>
                ) : null}
              </div>
              <div className="row" style={{ marginTop: '0.4rem' }}>
                <button type="button" className="danger" onClick={() => onChange(removeProp(scenario, prop.id))}>
                  Remove instance and its steps
                </button>
              </div>
            </div>
          ))}
          {scenario.props.length === 0 ? <p className="muted">No instances yet. Add one before writing cues.</p> : null}
        </div>
      </section>

      <section className="panel">
        <header>
          <h2>Cues, in order</h2>
          <button type="button" disabled={!canAddCue(scenario)} onClick={() => onChange(addCue(scenario).scenario)}>Add cue</button>
        </header>
        <p className="muted">Reordering cues or steps changes what the replay checks. Requirements stay exactly as written.</p>
        <div className="stack">
          {scenario.cues.map((cue, cueIndex) => (
            <div className="cue-card" key={cue.id}>
              <div className="row">
                <label htmlFor={`cue-${cue.id}-title`} style={{ flex: '1 1 14rem' }}>
                  Cue {cueIndex + 1} title <span className="muted">({cue.id})</span>
                  <input id={`cue-${cue.id}-title`} type="text" maxLength={120} value={cue.title}
                    onChange={event => onChange(updateCue(scenario, cue.id, { title: event.target.value }))} />
                </label>
                <button type="button" className="icon" aria-label={`Move cue ${cueIndex + 1} earlier`} title="Move this cue earlier"
                  disabled={cueIndex === 0} onClick={() => onChange(moveCue(scenario, cue.id, -1))}>↑</button>
                <button type="button" className="icon" aria-label={`Move cue ${cueIndex + 1} later`} title="Move this cue later"
                  disabled={cueIndex === scenario.cues.length - 1} onClick={() => onChange(moveCue(scenario, cue.id, 1))}>↓</button>
                <button type="button" disabled={!canAddAction(cue) || scenario.props.length === 0}
                  onClick={() => onChange(addAction(scenario, cue.id).scenario)}>Add step</button>
                <button type="button" className="danger" onClick={() => onChange(removeCue(scenario, cue.id))}>Remove cue</button>
              </div>
              {cue.actions.length === 0
                ? <p className="muted">No steps in this cue yet.</p>
                : cue.actions.map((action, index) => actionCard(cue.id, action, index, cue.actions.length))}
            </div>
          ))}
          {scenario.cues.length === 0 ? <p className="muted">No cues yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
