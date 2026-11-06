import type { Action, Cue, Position, Scenario } from './types';

/**
 * Synthetic example scenes. Every scene here is invented for testing and demonstration:
 * none of it is a real production's run sheet.
 */

const SYNTHETIC = 'Synthetic demonstration scene. Planned state only — Ghostlight does not track the real stage.';

export const ZONES = [
  { id: 'left-table', name: 'Left prop table' },
  { id: 'right-table', name: 'Right prop table' },
  { id: 'stage', name: 'Stage' },
  { id: 'left-wing', name: 'Left wing' },
  { id: 'right-wing', name: 'Right wing' },
  { id: 'store', name: 'Prop store' },
];

export const HOLDERS = [
  { id: 'actor-a', name: 'Actor A (Beatrice)' },
  { id: 'actor-b', name: 'Actor B (Lysander)' },
  { id: 'asm', name: 'ASM (stage right)' },
];

const at = (zoneId: string, holderId: string | null = null): Position => ({ zoneId, holderId });

const action = (
  id: string, propId: string, kind: Action['kind'],
  requiredSource: Position | null, destination?: Position, note?: string,
): Action => ({ id, propId, kind, requiredSource, ...(destination ? { destination } : {}), ...(note ? { note } : {}) });

const cue = (id: string, title: string, actions: Action[]): Cue => ({ id, title, actions });

const PROPS = {
  letterA: { id: 'letter-A', name: 'Letter A', kind: 'Sealed letter', initial: { status: 'available' as const, zoneId: 'left-table', holderId: null } },
  letterB: { id: 'letter-B', name: 'Letter B', kind: 'Sealed letter', initial: { status: 'available' as const, zoneId: 'left-table', holderId: null } },
  sealA: { id: 'seal-A', name: 'Wax seal A', kind: 'Wax seal (consumable)', initial: { status: 'available' as const, zoneId: 'left-table', holderId: null } },
  sealB: { id: 'seal-B', name: 'Wax seal B', kind: 'Wax seal (consumable)', initial: { status: 'absent' as const } },
  keyA: { id: 'key-A', name: 'Key A', kind: 'Brass key', initial: { status: 'available' as const, zoneId: 'right-table', holderId: null } },
  lampA: { id: 'lamp-A', name: 'Ghost lamp', kind: 'Practical lamp', initial: { status: 'unknown' as const } },
};

const base = (title: string, props: Scenario['props'], cues: Cue[], description = SYNTHETIC): Scenario => ({
  version: 1, title, description, zones: ZONES, holders: HOLDERS, props, cues,
});

/** The run sheet as it should read: Actor A collects, hands to Actor B, who carries it off and sets it. */
export const validControl = (): Scenario => base('Valid handoff chain (control)', [PROPS.letterA], [
  cue('cue-1', 'Act 1 / 4 — letter discovered', [
    action('a1', 'letter-A', 'collect', at('left-table'), at('left-table', 'actor-a'), 'Beatrice lifts the letter from the table.'),
  ]),
  cue('cue-2', 'Act 1 / 7 — the handoff', [
    action('a2', 'letter-A', 'transfer', at('left-table', 'actor-a'), at('left-table', 'actor-b')),
  ]),
  cue('cue-3', 'Act 1 / 9 — exit stage right', [
    action('a3', 'letter-A', 'carryOff', at('left-table', 'actor-b'), at('right-wing', 'actor-b')),
  ]),
  cue('cue-4', 'Act 1 / 12 — reset to right table', [
    action('a4', 'letter-A', 'place', at('right-wing', 'actor-b'), at('right-table')),
  ]),
]);

/** Actor A carries the letter off; a later cue still expects it on the left table. */
export const missingHandoff = (): Scenario => base('Missing handoff', [PROPS.letterA], [
  cue('cue-1', 'Act 1 / 4 — letter discovered', [
    action('a1', 'letter-A', 'collect', at('left-table'), at('left-table', 'actor-a')),
    action('a2', 'letter-A', 'carryOff', at('left-table', 'actor-a'), at('right-wing', 'actor-a')),
  ]),
  cue('cue-2', 'Act 1 / 9 — Lysander takes the letter', [
    action('a3', 'letter-A', 'collect', at('left-table'), at('left-table', 'actor-b'), 'Run sheet says: from the left prop table.'),
  ]),
]);

/** A consumable is used up and then required again; the fix is a new instance, not a reset. */
export const consumedReuse = (): Scenario => base('Reused consumable', [PROPS.sealA, PROPS.sealB], [
  cue('cue-1', 'Act 1 / 6 — the seal is broken', [
    action('a1', 'seal-A', 'consume', at('left-table')),
  ]),
  cue('cue-2', 'Act 2 / 3 — the seal is needed again', [
    action('a2', 'seal-A', 'collect', at('left-table'), at('left-table', 'actor-a')),
  ]),
]);

/** The same scene repaired: a second physical seal is brought on and used. */
export const consumedReuseFixed = (): Scenario => base('Reused consumable (repaired)', [PROPS.sealA, PROPS.sealB], [
  cue('cue-1', 'Act 1 / 6 — the seal is broken', [
    action('a1', 'seal-A', 'consume', at('left-table')),
  ]),
  cue('cue-2', 'Interval — ASM presets a fresh seal', [
    action('a2', 'seal-B', 'replenish', null, at('left-table'), 'New physical instance, not a revived seal-A.'),
  ]),
  cue('cue-3', 'Act 2 / 3 — the seal is needed again', [
    action('a3', 'seal-B', 'collect', at('left-table'), at('left-table', 'actor-a')),
  ]),
]);

/** Two identical-looking letters: moving copy A must not satisfy a cue that needs copy B. */
export const duplicateCopies = (): Scenario => base('Two identical letters', [PROPS.letterA, PROPS.letterB], [
  cue('cue-1', 'Act 1 / 4 — Beatrice takes one letter', [
    action('a1', 'letter-A', 'collect', at('left-table'), at('left-table', 'actor-a')),
    action('a2', 'letter-A', 'carryOff', at('left-table', 'actor-a'), at('right-wing', 'actor-a')),
  ]),
  cue('cue-2', 'Act 1 / 9 — Lysander takes the other letter', [
    action('a3', 'letter-B', 'collect', at('left-table'), at('left-table', 'actor-b')),
  ]),
]);

/** The same scene pointed at the copy that already left: a real mismatch. */
export const duplicateCopiesWrongInstance = (): Scenario => {
  const scenario = duplicateCopies();
  return {
    ...scenario,
    title: 'Two identical letters (wrong copy requested)',
    cues: scenario.cues.map(entry => entry.id !== 'cue-2' ? entry : {
      ...entry,
      actions: [action('a3', 'letter-A', 'collect', at('left-table'), at('left-table', 'actor-b'))],
    }),
  };
};

/** Valid in this order; swapping the two cues breaks the recorded source requirement. */
export const cueOrder = (): Scenario => base('Cue order matters', [PROPS.keyA], [
  cue('cue-1', 'Act 1 / 2 — ASM presets the key stage left', [
    action('a1', 'key-A', 'place', at('right-table'), at('left-table')),
  ]),
  cue('cue-2', 'Act 1 / 5 — Lysander collects the key', [
    action('a2', 'key-A', 'collect', at('left-table'), at('left-table', 'actor-b')),
  ]),
]);

export const cueOrderSwapped = (): Scenario => {
  const scenario = cueOrder();
  return { ...scenario, title: 'Cue order matters (swapped)', cues: [scenario.cues[1], scenario.cues[0]] };
};

/** The scene the app opens with: a full valid run, one consumable, and one unrecorded start. */
export const demoScenario = (): Scenario => base(
  "The Lamplighter's Letter (synthetic)",
  [PROPS.letterA, PROPS.letterB, PROPS.sealA, PROPS.sealB, PROPS.keyA, PROPS.lampA],
  [
    cue('cue-1', 'Act 1 / 2 — ASM presets the key stage left', [
      action('a1', 'key-A', 'place', at('right-table'), at('left-table'), 'Moved in the preset, before the house opens.'),
    ]),
    cue('cue-2', 'Act 1 / 4 — the letter is discovered', [
      action('a2', 'letter-A', 'collect', at('left-table'), at('left-table', 'actor-a')),
      action('a3', 'key-A', 'collect', at('left-table'), at('left-table', 'actor-b')),
    ]),
    cue('cue-3', 'Act 1 / 6 — the seal is broken', [
      action('a4', 'seal-A', 'consume', at('left-table'), undefined, 'One-use wax seal; cannot be reset.'),
    ]),
    cue('cue-4', 'Act 1 / 7 — the handoff', [
      action('a5', 'letter-A', 'transfer', at('left-table', 'actor-a'), at('left-table', 'actor-b')),
    ]),
    cue('cue-5', 'Act 1 / 9 — exit stage right', [
      action('a6', 'letter-A', 'carryOff', at('left-table', 'actor-b'), at('right-wing', 'actor-b')),
      action('a7', 'lamp-A', 'collect', at('stage'), at('stage', 'actor-a'), 'Starting position of the lamp is not recorded yet.'),
    ]),
    cue('cue-6', 'Interval — ASM presets a fresh seal', [
      action('a8', 'seal-B', 'replenish', null, at('left-table'), 'Second physical seal, new identity.'),
    ]),
    cue('cue-7', 'Act 2 / 3 — the second letter', [
      action('a9', 'letter-B', 'collect', at('left-table'), at('left-table', 'actor-a')),
      action('a10', 'seal-B', 'collect', at('left-table'), at('left-table', 'actor-a')),
    ]),
    cue('cue-8', 'Act 2 / 11 — reset to the right table', [
      action('a11', 'letter-A', 'place', at('right-wing', 'actor-b'), at('right-table')),
    ]),
  ],
);

export const EXAMPLES: { id: string; label: string; summary: string; build: () => Scenario }[] = [
  { id: 'demo', label: "The Lamplighter's Letter", summary: 'Full synthetic scene: valid run, one consumable, one unrecorded start.', build: demoScenario },
  { id: 'valid', label: 'Valid handoff chain (control)', summary: 'Should report nothing. Guards against a checker that always complains.', build: validControl },
  { id: 'missing-handoff', label: 'Missing handoff', summary: 'The letter leaves with Actor A; a later cue still expects it on the table.', build: missingHandoff },
  { id: 'consumed', label: 'Reused consumable', summary: 'A used-up seal is required again.', build: consumedReuse },
  { id: 'consumed-fixed', label: 'Reused consumable (repaired)', summary: 'A new physical seal is brought on instead.', build: consumedReuseFixed },
  { id: 'duplicates', label: 'Two identical letters', summary: 'Copy B still satisfies its cue after copy A has gone.', build: duplicateCopies },
  { id: 'duplicates-wrong', label: 'Two identical letters (wrong copy)', summary: 'The same cue pointed at the copy that already left.', build: duplicateCopiesWrongInstance },
  { id: 'order', label: 'Cue order matters', summary: 'Valid as written.', build: cueOrder },
  { id: 'order-swapped', label: 'Cue order matters (swapped)', summary: 'The same two cues in the other order.', build: cueOrderSwapped },
];
