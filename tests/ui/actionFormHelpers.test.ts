import { describe, it, expect } from 'vitest';
import type { Scenario } from '../../src/domain/types';
import { parseScenario } from '../../src/domain/schema';
import {
  type ActionFormData,
  SENTINEL_UNSELECTED,
  SENTINEL_RESTING,
  encodeHolderId,
  decodeHolderId,
  validateActionForm,
  serializeAction,
  applyActionUpdate,
  checkByteLimit,
} from '../../src/ui/actionFormHelpers';

const baseScenario: Scenario = {
  version: 1,
  title: 'Test Scene',
  zones: [
    { id: 'stage', name: 'Stage' },
    { id: 'backstage', name: 'Backstage' },
  ],
  holders: [
    { id: 'actor-1', name: 'Actor One' },
    { id: 'null', name: 'Literal Null Holder' }, // actual ID "null"
  ],
  props: [
    { id: 'letter', name: 'Letter', kind: 'paper', initial: { status: 'available', zoneId: 'stage', holderId: 'actor-1' } },
    { id: 'sword', name: 'Sword', kind: 'weapon', initial: { status: 'absent' } },
  ],
  cues: [
    { id: 'cue-1', title: 'Cue 1', actions: [] },
  ],
};

describe('actionFormHelpers — holder encoding', () => {
  it('encodes undefined/empty as SENTINEL_UNSELECTED', () => {
    expect(encodeHolderId(undefined)).toBe(SENTINEL_UNSELECTED);
    expect(encodeHolderId('')).toBe(SENTINEL_UNSELECTED);
  });

  it('encodes null (resting) as SENTINEL_RESTING', () => {
    expect(encodeHolderId(null)).toBe(SENTINEL_RESTING);
  });

  it('encodes actual ID "null" as "null"', () => {
    expect(encodeHolderId('null')).toBe('null');
  });

  it('encodes normal IDs unchanged', () => {
    expect(encodeHolderId('actor-1')).toBe('actor-1');
  });

  it('round-trips correctly', () => {
    expect(decodeHolderId(encodeHolderId(undefined))).toBe(undefined);
    expect(decodeHolderId(encodeHolderId(null))).toBe(null);
    expect(decodeHolderId(encodeHolderId('null'))).toBe('null');
    expect(decodeHolderId(encodeHolderId('actor-1'))).toBe('actor-1');
  });
});

describe('actionFormHelpers — validation', () => {
  const baseFormData: ActionFormData = {
    id: 'action-1',
    propId: 'letter',
    kind: 'collect',
    sourceNull: false,
    sourceZoneId: 'stage',
    sourceHolderId: SENTINEL_RESTING,
    destOmitted: false,
    destZoneId: 'backstage',
    destHolderId: 'actor-1',
    noteOmitted: true,
    note: '',
  };

  it('validates a correct collect action', () => {
    const errors = validateActionForm(baseFormData, baseScenario, 'cue-1', false);
    expect(errors).toEqual({});
  });

  it('rejects missing action ID', () => {
    const data = { ...baseFormData, id: '' };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors.id).toContain('required');
  });

  it('rejects duplicate action ID', () => {
    const scenarioWithAction: Scenario = {
      ...baseScenario,
      cues: [{ id: 'cue-1', title: 'Cue 1', actions: [{ id: 'action-1', propId: 'letter', kind: 'collect', requiredSource: { zoneId: 'stage', holderId: null } }] }],
    };
    const errors = validateActionForm(baseFormData, scenarioWithAction, 'cue-1', false);
    expect(errors.id).toContain('already exists');
  });

  it('allows same ID when editing', () => {
    const scenarioWithAction: Scenario = {
      ...baseScenario,
      cues: [{ id: 'cue-1', title: 'Cue 1', actions: [{ id: 'action-1', propId: 'letter', kind: 'collect', requiredSource: { zoneId: 'stage', holderId: null } }] }],
    };
    const errors = validateActionForm(baseFormData, scenarioWithAction, 'cue-1', true);
    expect(errors.id).toBeUndefined();
  });

  it('rejects collect with non-null source holder', () => {
    const data = { ...baseFormData, sourceHolderId: 'actor-1' };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors.requiredSource).toContain('resting source');
  });

  it('rejects place with null source holder', () => {
    const data = { ...baseFormData, kind: 'place' as const, sourceHolderId: SENTINEL_RESTING };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors.requiredSource).toContain('holder source');
  });

  it('rejects transfer with same source and destination holder', () => {
    const data = {
      ...baseFormData,
      kind: 'transfer' as const,
      sourceHolderId: 'actor-1',
      destHolderId: 'actor-1',
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors.destination).toContain('different holder');
  });

  it('rejects carryOff with mismatched holders', () => {
    const data = {
      ...baseFormData,
      kind: 'carryOff' as const,
      sourceHolderId: 'actor-1',
      destHolderId: 'null', // literal ID "null"
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors.destination).toContain('same holder');
  });

  it('rejects carryOff with same zone', () => {
    const data = {
      ...baseFormData,
      kind: 'carryOff' as const,
      sourceZoneId: 'stage',
      sourceHolderId: 'actor-1',
      destZoneId: 'stage',
      destHolderId: 'actor-1',
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors.destination).toContain('zone change');
  });

  it('validates carryOff with zone change and same holder', () => {
    const data = {
      ...baseFormData,
      kind: 'carryOff' as const,
      sourceZoneId: 'stage',
      sourceHolderId: 'actor-1',
      destZoneId: 'backstage',
      destHolderId: 'actor-1',
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors).toEqual({});
  });

  it('rejects consume with destination', () => {
    const data = {
      ...baseFormData,
      kind: 'consume' as const,
      destOmitted: false,
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors.destination).toContain('omit destination');
  });

  it('validates consume with omitted destination', () => {
    const data = {
      ...baseFormData,
      kind: 'consume' as const,
      sourceHolderId: 'actor-1',
      destOmitted: true,
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors).toEqual({});
  });

  it('rejects replenish with non-null source', () => {
    const data = {
      ...baseFormData,
      kind: 'replenish' as const,
      sourceNull: false,
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors.requiredSource).toContain('null source');
  });

  it('validates replenish with null source and destination', () => {
    const data = {
      ...baseFormData,
      kind: 'replenish' as const,
      sourceNull: true,
      destOmitted: false,
      destZoneId: 'stage',
      destHolderId: SENTINEL_RESTING,
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors).toEqual({});
  });

  it('distinguishes literal holder ID "null" from resting', () => {
    // Using literal ID "null" should work
    const dataWithLiteralNull = {
      ...baseFormData,
      kind: 'transfer' as const,
      sourceHolderId: 'actor-1',
      destHolderId: 'null', // literal ID
    };
    const errors1 = validateActionForm(dataWithLiteralNull, baseScenario, 'cue-1', false);
    expect(errors1).toEqual({});

    // Using SENTINEL_RESTING should be rejected for transfer
    const dataWithResting = {
      ...baseFormData,
      kind: 'transfer' as const,
      sourceHolderId: 'actor-1',
      destHolderId: SENTINEL_RESTING,
    };
    const errors2 = validateActionForm(dataWithResting, baseScenario, 'cue-1', false);
    expect(errors2.destination).toContain('holder destination');
  });

  it('validates note length', () => {
    const data = { ...baseFormData, noteOmitted: false, note: 'x'.repeat(501) };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors.note).toContain('500 characters');
  });
});

describe('actionFormHelpers — serialization', () => {
  it('serializes collect action correctly', () => {
    const formData: ActionFormData = {
      id: 'action-1',
      propId: 'letter',
      kind: 'collect',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: SENTINEL_RESTING,
      destOmitted: false,
      destZoneId: 'backstage',
      destHolderId: 'actor-1',
      noteOmitted: true,
      note: '',
    };
    const action = serializeAction(formData);
    expect(action).toEqual({
      id: 'action-1',
      propId: 'letter',
      kind: 'collect',
      requiredSource: { zoneId: 'stage', holderId: null },
      destination: { zoneId: 'backstage', holderId: 'actor-1' },
    });
  });

  it('omits destination when destOmitted is true', () => {
    const formData: ActionFormData = {
      id: 'action-2',
      propId: 'letter',
      kind: 'transfer',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: 'actor-1',
      destOmitted: true,
      destZoneId: '',
      destHolderId: SENTINEL_UNSELECTED,
      noteOmitted: true,
      note: '',
    };
    const action = serializeAction(formData);
    expect(action).toEqual({
      id: 'action-2',
      propId: 'letter',
      kind: 'transfer',
      requiredSource: { zoneId: 'stage', holderId: 'actor-1' },
    });
    expect(Object.prototype.hasOwnProperty.call(action, 'destination')).toBe(false);
  });

  it('omits note when noteOmitted is true', () => {
    const formData: ActionFormData = {
      id: 'action-3',
      propId: 'letter',
      kind: 'collect',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: SENTINEL_RESTING,
      destOmitted: false,
      destZoneId: 'backstage',
      destHolderId: 'actor-1',
      noteOmitted: true,
      note: '',
    };
    const action = serializeAction(formData);
    expect(Object.prototype.hasOwnProperty.call(action, 'note')).toBe(false);
  });

  it('includes note when noteOmitted is false', () => {
    const formData: ActionFormData = {
      id: 'action-4',
      propId: 'letter',
      kind: 'collect',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: SENTINEL_RESTING,
      destOmitted: false,
      destZoneId: 'backstage',
      destHolderId: 'actor-1',
      noteOmitted: false,
      note: 'Test note',
    };
    const action = serializeAction(formData);
    expect(action.note).toBe('Test note');
  });

  it('clears note when noteOmitted changes from false to true', () => {
    const formData: ActionFormData = {
      id: 'action-5',
      propId: 'letter',
      kind: 'collect',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: SENTINEL_RESTING,
      destOmitted: false,
      destZoneId: 'backstage',
      destHolderId: 'actor-1',
      noteOmitted: true,
      note: 'This should not appear',
    };
    const action = serializeAction(formData);
    expect(Object.prototype.hasOwnProperty.call(action, 'note')).toBe(false);
  });

  it('handles literal holder ID "null" correctly', () => {
    const formData: ActionFormData = {
      id: 'action-6',
      propId: 'letter',
      kind: 'transfer',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: 'actor-1',
      destOmitted: false,
      destZoneId: 'backstage',
      destHolderId: 'null', // literal ID
      noteOmitted: true,
      note: '',
    };
    const action = serializeAction(formData);
    expect(action.destination?.holderId).toBe('null');
  });
});

describe('actionFormHelpers — applyActionUpdate', () => {
  it('adds a new action', () => {
    const formData: ActionFormData = {
      id: 'action-new',
      propId: 'letter',
      kind: 'collect',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: SENTINEL_RESTING,
      destOmitted: false,
      destZoneId: 'backstage',
      destHolderId: 'actor-1',
      noteOmitted: true,
      note: '',
    };
    const result = applyActionUpdate(baseScenario, 'cue-1', formData);
    expect(result.blocked).toBe(false);
    if (!result.blocked) {
      const cue = result.result.cues.find(c => c.id === 'cue-1');
      expect(cue?.actions.length).toBe(1);
      expect(cue?.actions[0].id).toBe('action-new');
    }
  });

  it('updates an existing action', () => {
    const scenarioWithAction: Scenario = {
      ...baseScenario,
      cues: [
        {
          id: 'cue-1',
          title: 'Cue 1',
          actions: [
            {
              id: 'action-1',
              propId: 'letter',
              kind: 'collect',
              requiredSource: { zoneId: 'stage', holderId: null },
              destination: { zoneId: 'backstage', holderId: 'actor-1' },
              note: 'Original note',
            },
          ],
        },
      ],
    };
    const formData: ActionFormData = {
      id: 'action-1',
      propId: 'letter',
      kind: 'place',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: 'actor-1',
      destOmitted: false,
      destZoneId: 'backstage',
      destHolderId: SENTINEL_RESTING,
      noteOmitted: true,
      note: '',
    };
    const result = applyActionUpdate(scenarioWithAction, 'cue-1', formData, 'action-1');
    expect(result.blocked).toBe(false);
    if (!result.blocked) {
      const action = result.result.cues[0].actions[0];
      expect(action.kind).toBe('place');
      expect(action.requiredSource?.holderId).toBe('actor-1');
      expect(action.destination?.holderId).toBe(null);
      expect(Object.prototype.hasOwnProperty.call(action, 'note')).toBe(false);
    }
  });

  it('preserves missing-handoff mismatch structurally', () => {
    // Create a transfer with wrong source holder - should be structurally valid, engine rejects
    const formData: ActionFormData = {
      id: 'mismatch-action',
      propId: 'letter',
      kind: 'transfer',
      sourceNull: false,
      sourceZoneId: 'backstage', // letter is on stage with actor-1
      sourceHolderId: 'null', // literal ID "null" holder
      destOmitted: false,
      destZoneId: 'stage',
      destHolderId: 'actor-1',
      noteOmitted: true,
      note: '',
    };
    const result = applyActionUpdate(baseScenario, 'cue-1', formData);
    expect(result.blocked).toBe(false); // structurally valid
    if (!result.blocked) {
      const action = result.result.cues[0].actions[0];
      expect(action.requiredSource?.zoneId).toBe('backstage');
      expect(action.requiredSource?.holderId).toBe('null');
    }
  });
});

describe('actionFormHelpers — byte limit', () => {
  it('accepts scenario under limit', () => {
    const result = checkByteLimit(baseScenario);
    expect(result.ok).toBe(true);
  });

  it('rejects scenario over byte limit', () => {
    const largeScenario: Scenario = {
      ...baseScenario,
      description: 'x'.repeat(200_000),
    };
    const result = checkByteLimit(largeScenario);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('too large');
      expect(result.error).toContain('200000');
    }
  });

  it('counts UTF-8 bytes, not string length', () => {
    const scenarioWithEmoji: Scenario = {
      ...baseScenario,
      title: '🎭'.repeat(50_000), // emoji are multi-byte
    };
    const json = JSON.stringify(scenarioWithEmoji);
    const bytes = new TextEncoder().encode(json).length;
    const stringLength = json.length;
    expect(bytes).toBeGreaterThan(stringLength);
    
    const result = checkByteLimit(scenarioWithEmoji);
    // This should exceed limit due to multi-byte characters
    expect(result.ok).toBe(false);
  });
});

describe('actionFormHelpers — all six kinds', () => {
  it('validates place: holder→none', () => {
    const data: ActionFormData = {
      id: 'place-1',
      propId: 'letter',
      kind: 'place',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: 'actor-1',
      destOmitted: false,
      destZoneId: 'backstage',
      destHolderId: SENTINEL_RESTING,
      noteOmitted: true,
      note: '',
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors).toEqual({});
  });

  it('validates collect: none→holder', () => {
    const data: ActionFormData = {
      id: 'collect-1',
      propId: 'letter',
      kind: 'collect',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: SENTINEL_RESTING,
      destOmitted: false,
      destZoneId: 'backstage',
      destHolderId: 'actor-1',
      noteOmitted: true,
      note: '',
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors).toEqual({});
  });

  it('validates transfer: holder→different holder', () => {
    const data: ActionFormData = {
      id: 'transfer-1',
      propId: 'letter',
      kind: 'transfer',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: 'actor-1',
      destOmitted: false,
      destZoneId: 'stage',
      destHolderId: 'null', // literal ID
      noteOmitted: true,
      note: '',
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors).toEqual({});
  });

  it('validates carryOff: holder→same holder, zone changes', () => {
    const data: ActionFormData = {
      id: 'carry-1',
      propId: 'letter',
      kind: 'carryOff',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: 'actor-1',
      destOmitted: false,
      destZoneId: 'backstage',
      destHolderId: 'actor-1',
      noteOmitted: true,
      note: '',
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors).toEqual({});
  });

  it('validates consume: available→consumed, no destination', () => {
    const data: ActionFormData = {
      id: 'consume-1',
      propId: 'letter',
      kind: 'consume',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: 'actor-1',
      destOmitted: true,
      destZoneId: '',
      destHolderId: SENTINEL_UNSELECTED,
      noteOmitted: true,
      note: '',
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors).toEqual({});
  });

  it('validates replenish: absent→available, null source', () => {
    const data: ActionFormData = {
      id: 'replenish-1',
      propId: 'sword',
      kind: 'replenish',
      sourceNull: true,
      sourceZoneId: '',
      sourceHolderId: SENTINEL_UNSELECTED,
      destOmitted: false,
      destZoneId: 'stage',
      destHolderId: SENTINEL_RESTING,
      noteOmitted: true,
      note: '',
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors).toEqual({});
  });
});


describe('actionFormHelpers — regression: destOmitted for non-consume', () => {
  it('rejects collect with omitted destination', () => {
    const data: ActionFormData = {
      id: 'collect-bad',
      propId: 'letter',
      kind: 'collect',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: SENTINEL_RESTING,
      destOmitted: true,
      destZoneId: '',
      destHolderId: SENTINEL_UNSELECTED,
      noteOmitted: true,
      note: '',
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors.destination).toContain('requires destination');
  });

  it('rejects replenish with omitted destination', () => {
    const data: ActionFormData = {
      id: 'replenish-bad',
      propId: 'sword',
      kind: 'replenish',
      sourceNull: true,
      sourceZoneId: '',
      sourceHolderId: SENTINEL_UNSELECTED,
      destOmitted: true,
      destZoneId: '',
      destHolderId: SENTINEL_UNSELECTED,
      noteOmitted: true,
      note: '',
    };
    const errors = validateActionForm(data, baseScenario, 'cue-1', false);
    expect(errors.destination).toContain('requires destination');
  });
});

describe('actionFormHelpers — update clearing fields', () => {
  it('clears destination when updating to consume', () => {
    const scenarioWithAction: Scenario = {
      ...baseScenario,
      cues: [
        {
          id: 'cue-1',
          title: 'Cue 1',
          actions: [
            {
              id: 'action-1',
              propId: 'letter',
              kind: 'transfer',
              requiredSource: { zoneId: 'stage', holderId: 'actor-1' },
              destination: { zoneId: 'backstage', holderId: 'null' },
              note: 'Original note',
            },
          ],
        },
      ],
    };
    const formData: ActionFormData = {
      id: 'action-1',
      propId: 'letter',
      kind: 'consume',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: 'actor-1',
      destOmitted: true,
      destZoneId: '',
      destHolderId: SENTINEL_UNSELECTED,
      noteOmitted: true,
      note: '',
    };
    const result = applyActionUpdate(scenarioWithAction, 'cue-1', formData, 'action-1');
    expect(result.blocked).toBe(false);
    if (!result.blocked) {
      const action = result.result.cues[0].actions[0];
      expect(action.kind).toBe('consume');
      expect(Object.prototype.hasOwnProperty.call(action, 'destination')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(action, 'note')).toBe(false);
    }
  });
});

describe('actionFormHelpers — action limit', () => {
  it('blocks adding action at limit', () => {
    const scenarioAtLimit: Scenario = {
      ...baseScenario,
      cues: [
        {
          id: 'cue-1',
          title: 'Cue 1',
          actions: Array.from({ length: 12 }, (_, i) => ({
            id: `action-${i}`,
            propId: 'letter',
            kind: 'collect' as const,
            requiredSource: { zoneId: 'stage', holderId: null },
          })),
        },
      ],
    };
    const formData: ActionFormData = {
      id: 'action-new',
      propId: 'letter',
      kind: 'collect',
      sourceNull: false,
      sourceZoneId: 'stage',
      sourceHolderId: SENTINEL_RESTING,
      destOmitted: false,
      destZoneId: 'backstage',
      destHolderId: 'actor-1',
      noteOmitted: true,
      note: '',
    };
    const result = applyActionUpdate(scenarioAtLimit, 'cue-1', formData);
    expect(result.blocked).toBe(true);
    if (result.blocked) {
      expect(result.reason).toContain('12 actions');
    }
  });
});

describe('actionFormHelpers — pretty-print byte limit', () => {
  it('counts pretty-printed UTF-8 bytes', () => {
    const largeScenario: Scenario = {
      ...baseScenario,
      cues: Array.from({ length: 40 }, (_, i) => ({
        id: `cue-${i}`,
        title: `Cue ${i}`,
        actions: Array.from({ length: 12 }, (_, j) => ({
          id: `action-${i}-${j}`,
          propId: 'letter',
          kind: 'collect' as const,
          requiredSource: { zoneId: 'stage', holderId: null },
          destination: { zoneId: 'backstage', holderId: 'actor-1' },
          note: 'x'.repeat(100),
        })),
      })),
    };
    
    const parseResult = parseScenario(largeScenario);
    expect(parseResult.success).toBe(true);
    
    const compact = JSON.stringify(largeScenario);
    const compactBytes = new TextEncoder().encode(compact).length;
    expect(compactBytes).toBeLessThan(200_000);
    
    const pretty = JSON.stringify(largeScenario, null, 2);
    const prettyBytes = new TextEncoder().encode(pretty).length;
    expect(prettyBytes).toBeGreaterThan(200_000);
    
    const result = checkByteLimit(largeScenario);
    expect(result.ok).toBe(false);
  });
});
