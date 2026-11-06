import { describe, expect, it } from 'vitest';
import { LIMITS, parseScenario, parseScenarioJson } from '../src/domain/schema';
import { demoScenario, validControl } from '../src/domain/samples';

const plain = (value: unknown) => JSON.parse(JSON.stringify(value));
const fail = (value: unknown) => {
  const result = parseScenario(plain(value));
  if (result.success) throw new Error('expected the import to be rejected');
  return result.errors;
};

describe('import validation', () => {
  it('accepts the bundled scenes and round-trips them', () => {
    const scenario = demoScenario();
    const parsed = parseScenario(plain(scenario));
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toStrictEqual(scenario);
      const again = parseScenario(plain(parsed.data));
      expect(again.success && again.data).toStrictEqual(scenario);
    }
  });

  it('rejects a non-object, the wrong version and a missing title', () => {
    expect(parseScenario('scene')).toMatchObject({ success: false });
    expect(fail({ ...plain(validControl()), version: 2 }).join()).toContain('version');
    expect(fail({ ...plain(validControl()), title: '   ' }).join()).toContain('title');
  });

  it('rejects references to zones, holders and instances that do not exist', () => {
    const scenario = plain(validControl());
    scenario.cues[0].actions[0].requiredSource.zoneId = 'nowhere';
    expect(fail(scenario).join()).toContain('zone does not exist');

    const other = plain(validControl());
    other.cues[0].actions[0].destination.holderId = 'ghost';
    expect(fail(other).join()).toContain('holder');

    const third = plain(validControl());
    third.cues[0].actions[0].propId = 'letter-Z';
    expect(fail(third).join()).toContain('physical prop instance does not exist');
  });

  it('rejects duplicate identifiers, including action ids reused across cues', () => {
    const scenario = plain(validControl());
    scenario.cues[1].actions[0].id = 'a1';
    expect(fail(scenario).join()).toContain('unique');

    const props = plain(validControl());
    props.props = [props.props[0], props.props[0]];
    expect(fail(props).join()).toContain('duplicate identifier');
  });

  it('keeps starting state and position consistent', () => {
    const unknownWithPosition = plain(validControl());
    unknownWithPosition.props[0].initial = { status: 'unknown', zoneId: 'left-table' };
    expect(fail(unknownWithPosition).join()).toContain('must not claim a position');

    const availableWithout = plain(validControl());
    availableWithout.props[0].initial = { status: 'available' };
    expect(fail(availableWithout).join()).toContain('zone does not exist');
  });

  it('refuses prototype-polluting identifiers and never copies unknown keys through', () => {
    const scenario = plain(validControl());
    scenario.props[0].id = '__proto__';
    expect(fail(scenario).join()).toContain('unique identifier');

    const extra = plain(validControl());
    extra.somethingElse = { nested: true };
    extra.cues[0].actions[0].somethingElse = 'dropped';
    const parsed = parseScenario(extra);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect('somethingElse' in parsed.data).toBe(false);
      expect('somethingElse' in parsed.data.cues[0].actions[0]).toBe(false);
    }
  });

  it('holds imports to the documented size limits', () => {
    const scenario = plain(validControl());
    scenario.zones = Array.from({ length: LIMITS.zones + 1 }, (_, index) => ({ id: `z${index}`, name: `Zone ${index}` }));
    expect(fail(scenario).join()).toContain('zones');
  });

  it('reports a damaged file without replacing the current scene', () => {
    expect(parseScenarioJson('{ not json')).toMatchObject({ success: false });
    expect(parseScenarioJson('{ not json')).toMatchObject({ errors: [expect.stringContaining('has not been replaced')] });
    const huge = JSON.stringify({ version: 1, title: 'x'.repeat(LIMITS.jsonBytes) });
    expect(parseScenarioJson(huge)).toMatchObject({ errors: [expect.stringContaining('too large')] });
  });

  it('collects several problems at once instead of stopping at the first', () => {
    const scenario = plain(validControl());
    scenario.title = '';
    scenario.props[0].kind = '';
    expect(fail(scenario).length).toBeGreaterThan(1);
  });
});
