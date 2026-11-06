import { describe, expect, it } from 'vitest';
import {
  addAction, addCue, addEntity, addProp, entityUsage, moveAction, moveCue, moveWithin, nextId, removeEntity,
  removeAction, removeCue, removeProp, setPropInitial, updateAction, updateCue, updateScene,
} from '../src/domain/edit';
import { runScenario } from '../src/domain/engine';
import { parseScenario } from '../src/domain/schema';
import { cueOrder, demoScenario, validControl } from '../src/domain/samples';
import type { Scenario } from '../src/domain/types';

const stillValid = (scenario: Scenario) => {
  const parsed = parseScenario(JSON.parse(JSON.stringify(scenario)));
  expect(parsed.success, parsed.success ? '' : parsed.errors.join('; ')).toBe(true);
};

describe('ids', () => {
  it('avoids collisions and strips unsafe characters', () => {
    expect(nextId('cue', ['cue'])).toBe('cue-2');
    expect(nextId('cue', ['cue', 'cue-2'])).toBe('cue-3');
    expect(nextId('a b/c', [])).toBe('a-b-c');
  });
});

describe('reordering', () => {
  it('leaves a list unchanged at the edges and never loses an item', () => {
    expect(moveWithin([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
    expect(moveWithin([1, 2, 3], 2, 1)).toEqual([1, 2, 3]);
    expect(moveWithin([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(moveWithin([1, 2, 3], -1, 1)).toEqual([1, 2, 3]);
  });

  it('changes validation when cues are swapped, without touching the authored requirements', () => {
    const scenario = cueOrder();
    expect(runScenario(scenario).issues).toEqual([]);
    const swapped = moveCue(scenario, 'cue-2', -1);
    expect(swapped.cues.map(cue => cue.id)).toEqual(['cue-2', 'cue-1']);
    expect(runScenario(swapped).issues.map(issue => issue.code)).toEqual(['source-mismatch']);
    expect(swapped.cues[0].actions[0].requiredSource).toEqual(scenario.cues[1].actions[0].requiredSource);
    expect(scenario.cues.map(cue => cue.id)).toEqual(['cue-1', 'cue-2']);
    stillValid(swapped);
  });

  it('reorders steps inside one cue', () => {
    const scenario = demoScenario();
    const moved = moveAction(scenario, 'cue-2', 'a3', -1);
    expect(moved.cues[1].actions.map(action => action.id)).toEqual(['a3', 'a2']);
    stillValid(moved);
  });
});

describe('cues and steps', () => {
  it('adds and removes cues and steps, keeping ids unique', () => {
    const added = addCue(demoScenario());
    expect(added.cueId).toBe('cue-9');
    const withAction = addAction(added.scenario, added.cueId);
    expect(withAction.actionId).toBe('act-12');
    stillValid(withAction.scenario);
    const second = addAction(withAction.scenario, added.cueId);
    expect(second.actionId).toBe('act-13');
    stillValid(second.scenario);
    expect(removeAction(second.scenario, added.cueId, 'act-12').cues.at(-1)!.actions.map(a => a.id)).toEqual(['act-13']);
    expect(removeCue(second.scenario, added.cueId).cues).toHaveLength(8);
  });

  it('keeps a consume step free of a destination and a place step free of a holder', () => {
    const scenario = validControl();
    const consumed = updateAction(scenario, 'cue-1', 'a1', { kind: 'consume' });
    expect(consumed.cues[0].actions[0].destination).toBeUndefined();
    const placed = updateAction(consumed, 'cue-1', 'a1', { kind: 'place' });
    expect(placed.cues[0].actions[0].destination).toEqual({ zoneId: 'left-table', holderId: null });
    const withHolder = updateAction(placed, 'cue-1', 'a1', { destination: { zoneId: 'stage', holderId: 'actor-a' } });
    expect(withHolder.cues[0].actions[0].destination).toEqual({ zoneId: 'stage', holderId: null });
    stillValid(withHolder);
  });

  it('drops a blank note and a blank description instead of storing empty text', () => {
    const scenario = updateAction(validControl(), 'cue-1', 'a1', { note: '   ' });
    expect('note' in scenario.cues[0].actions[0]).toBe(false);
    expect('description' in updateScene(scenario, { description: ' ' })).toBe(false);
    stillValid(scenario);
  });

  it('refuses to exceed the documented limits', () => {
    let scenario = validControl();
    for (let i = 0; i < 60; i += 1) scenario = addCue(scenario).scenario;
    expect(scenario.cues).toHaveLength(40);
    expect(addCue(scenario).cueId).toBe('');
    let props = validControl();
    for (let i = 0; i < 20; i += 1) props = addProp(props).scenario;
    expect(props.props).toHaveLength(12);
  });
});

describe('instances', () => {
  it('removes the steps that referenced a deleted instance so the scene stays importable', () => {
    const scenario = removeProp(demoScenario(), 'letter-A');
    expect(scenario.props.map(prop => prop.id)).not.toContain('letter-A');
    expect(scenario.cues.flatMap(cue => cue.actions).some(action => action.propId === 'letter-A')).toBe(false);
    stillValid(scenario);
  });

  it('clears the position when a starting state becomes unknown or absent', () => {
    const unknown = setPropInitial(demoScenario(), 'letter-A', { status: 'unknown', zoneId: 'stage' });
    expect(unknown.props[0].initial).toEqual({ status: 'unknown' });
    const available = setPropInitial(unknown, 'letter-A', { status: 'available' });
    expect(available.props[0].initial).toEqual({ status: 'available', zoneId: 'left-table', holderId: null });
    stillValid(available);
  });

  it('renames a cue without disturbing its steps', () => {
    const scenario = updateCue(validControl(), 'cue-1', { title: 'Act 1 / 4a' });
    expect(scenario.cues[0].title).toBe('Act 1 / 4a');
    expect(scenario.cues[0].actions).toEqual(validControl().cues[0].actions);
  });
});

describe('areas and runners', () => {
  it('adds areas and runners up to the documented limits', () => {
    const scenario = validControl();
    expect(addEntity(scenario, 'holders').id).toBe('holder-4');
    let zones = scenario;
    for (let i = 0; i < 6; i += 1) zones = addEntity(zones, 'zones').scenario;
    expect(zones.zones).toHaveLength(6);
    expect(addEntity(zones, 'zones').id).toBe('');
  });

  it('refuses to remove an area or runner that is still used, and says where', () => {
    const scenario = demoScenario();
    const zone = removeEntity(scenario, 'zones', 'left-table');
    expect(zone.scenario).toBe(scenario);
    expect(zone.blockedBy.join('; ')).toContain('starting position of Letter A');
    expect(entityUsage(scenario, 'holders', 'actor-b').join('; ')).toContain('cue 2');
  });

  it('removes an unused area or runner', () => {
    const scenario = validControl();
    expect(removeEntity(scenario, 'holders', 'asm').scenario.holders.map(h => h.id)).toEqual(['actor-a', 'actor-b']);
    expect(removeEntity(scenario, 'zones', 'store').scenario.zones).toHaveLength(5);
  });

  it('never removes the last area', () => {
    const scenario: Scenario = { ...validControl(), props: [], cues: [], zones: [{ id: 'only', name: 'Only area' }] };
    expect(removeEntity(scenario, 'zones', 'only').blockedBy).toEqual(['a scene needs at least one area']);
  });
});
