import type { Scenario } from '../domain/types';

export const validControlDemo: Scenario = {
  version: 1,
  title: 'Valid Control — Four Clean Steps',
  description: 'letter-A: collect from L/none to L/Actor-A, transfer to L/Actor-B, carry to R/Actor-B, place at R/none. No issues expected.',
  zones: [
    { id: 'L', name: 'Left Stage' },
    { id: 'R', name: 'Right Stage' },
  ],
  holders: [
    { id: 'Actor-A', name: 'Actor A' },
    { id: 'Actor-B', name: 'Actor B' },
  ],
  props: [
    { id: 'letter-A', name: 'Sealed Letter', kind: 'envelope', initial: { status: 'available', zoneId: 'L', holderId: null } },
  ],
  cues: [
    {
      id: 'cue-1', title: 'Act 1 Scene 1',
      actions: [
        { id: 'a1', propId: 'letter-A', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'Actor-A' } },
      ],
    },
    {
      id: 'cue-2', title: 'Act 1 Scene 2',
      actions: [
        { id: 'a2', propId: 'letter-A', kind: 'transfer', requiredSource: { zoneId: 'L', holderId: 'Actor-A' }, destination: { zoneId: 'L', holderId: 'Actor-B' } },
      ],
    },
    {
      id: 'cue-3', title: 'Act 1 Scene 3',
      actions: [
        { id: 'a3', propId: 'letter-A', kind: 'carryOff', requiredSource: { zoneId: 'L', holderId: 'Actor-B' }, destination: { zoneId: 'R', holderId: 'Actor-B' } },
      ],
    },
    {
      id: 'cue-4', title: 'Act 1 Scene 4',
      actions: [
        { id: 'a4', propId: 'letter-A', kind: 'place', requiredSource: { zoneId: 'R', holderId: 'Actor-B' }, destination: { zoneId: 'R', holderId: null } },
      ],
    },
  ],
};

export const missingHandoffDemo: Scenario = {
  version: 1,
  title: 'Missing Handoff — Wrong Holder',
  description: 'letter-A: Actor-A collects, but carry requires Actor-B. Missing transfer causes the carry to fail.',
  zones: [
    { id: 'L', name: 'Left Stage' },
    { id: 'R', name: 'Right Stage' },
  ],
  holders: [
    { id: 'Actor-A', name: 'Actor A' },
    { id: 'Actor-B', name: 'Actor B' },
  ],
  props: [
    { id: 'letter-A', name: 'Sealed Letter', kind: 'envelope', initial: { status: 'available', zoneId: 'L', holderId: null } },
  ],
  cues: [
    {
      id: 'cue-1', title: 'Act 1 Scene 1',
      actions: [
        { id: 'a1', propId: 'letter-A', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'Actor-A' } },
      ],
    },
    {
      id: 'cue-2', title: 'Act 1 Scene 2 — Carry Offstage',
      actions: [
        { id: 'a2', propId: 'letter-A', kind: 'carryOff', requiredSource: { zoneId: 'L', holderId: 'Actor-B' }, destination: { zoneId: 'R', holderId: 'Actor-B' }, note: 'Missing transfer from Actor-A to Actor-B' },
      ],
    },
  ],
};

export const consumedReuseDemo: Scenario = {
  version: 1,
  title: 'Consumed Reuse — Terminal State',
  description: 'seal-A is consumed, then reused (rejected). seal-B is replenished and used successfully.',
  zones: [
    { id: 'Stage', name: 'Main Stage' },
    { id: 'Wings', name: 'Backstage Wings' },
  ],
  holders: [
    { id: 'Actor-A', name: 'Actor A' },
  ],
  props: [
    { id: 'seal-A', name: 'Wax Seal Copy A', kind: 'seal', initial: { status: 'available', zoneId: 'Stage', holderId: null } },
    { id: 'seal-B', name: 'Wax Seal Copy B', kind: 'seal', initial: { status: 'absent' } },
  ],
  cues: [
    {
      id: 'cue-1', title: 'Scene 1 — Consume A',
      actions: [
        { id: 'a1', propId: 'seal-A', kind: 'collect', requiredSource: { zoneId: 'Stage', holderId: null }, destination: { zoneId: 'Stage', holderId: 'Actor-A' } },
        { id: 'a2', propId: 'seal-A', kind: 'consume', requiredSource: { zoneId: 'Stage', holderId: 'Actor-A' } },
      ],
    },
    {
      id: 'cue-2', title: 'Scene 2 — Attempt Reuse A',
      actions: [
        { id: 'a3', propId: 'seal-A', kind: 'collect', requiredSource: { zoneId: 'Stage', holderId: null }, destination: { zoneId: 'Stage', holderId: 'Actor-A' }, note: 'Reusing consumed seal-A (will fail)' },
      ],
    },
    {
      id: 'cue-3', title: 'Scene 3 — Replenish B',
      actions: [
        { id: 'a4', propId: 'seal-B', kind: 'replenish', requiredSource: null, destination: { zoneId: 'Wings', holderId: null } },
      ],
    },
    {
      id: 'cue-4', title: 'Scene 4 — Use B',
      actions: [
        { id: 'a5', propId: 'seal-B', kind: 'collect', requiredSource: { zoneId: 'Wings', holderId: null }, destination: { zoneId: 'Stage', holderId: 'Actor-A' } },
      ],
    },
  ],
};

export const duplicateIdentityDemo: Scenario = {
  version: 1,
  title: 'Duplicate Names — Distinct IDs',
  description: 'letter-A and letter-B have the same display name but are distinct physical instances.',
  zones: [
    { id: 'L', name: 'Left Stage' },
    { id: 'R', name: 'Right Stage' },
  ],
  holders: [
    { id: 'Actor-A', name: 'Actor A' },
  ],
  props: [
    { id: 'letter-A', name: 'Sealed Letter', kind: 'envelope', initial: { status: 'available', zoneId: 'L', holderId: null } },
    { id: 'letter-B', name: 'Sealed Letter', kind: 'envelope', initial: { status: 'available', zoneId: 'L', holderId: null } },
  ],
  cues: [
    {
      id: 'cue-1', title: 'Scene 1 — Collect letter-A',
      actions: [
        { id: 'a1', propId: 'letter-A', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'Actor-A' } },
      ],
    },
    {
      id: 'cue-2', title: 'Scene 2 — Carry letter-A Away',
      actions: [
        { id: 'a2', propId: 'letter-A', kind: 'carryOff', requiredSource: { zoneId: 'L', holderId: 'Actor-A' }, destination: { zoneId: 'R', holderId: 'Actor-A' } },
      ],
    },
    {
      id: 'cue-3', title: 'Scene 3 — Collect letter-B (Still at L)',
      actions: [
        { id: 'a3', propId: 'letter-B', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'Actor-A' } },
      ],
    },
  ],
};

export const reorderedCuesDemo: Scenario = {
  version: 1,
  title: 'Reordering Example — Order Matters',
  description: 'key-A: collect by Actor-B depends on place by Actor-A. Swapping the order causes the collect to fail.',
  zones: [
    { id: 'L', name: 'Left Stage' },
    { id: 'R', name: 'Right Stage' },
  ],
  holders: [
    { id: 'Actor-A', name: 'Actor A' },
    { id: 'Actor-B', name: 'Actor B' },
  ],
  props: [
    { id: 'key-A', name: 'Brass Key', kind: 'key', initial: { status: 'available', zoneId: 'R', holderId: 'Actor-A' } },
  ],
  cues: [
    {
      id: 'cue-1', title: 'Cue 1 — Actor-A Carries Key',
      actions: [
        { id: 'a1', propId: 'key-A', kind: 'carryOff', requiredSource: { zoneId: 'R', holderId: 'Actor-A' }, destination: { zoneId: 'L', holderId: 'Actor-A' } },
      ],
    },
    {
      id: 'cue-2', title: 'Cue 2 — Actor-A Places Key',
      actions: [
        { id: 'a2', propId: 'key-A', kind: 'place', requiredSource: { zoneId: 'L', holderId: 'Actor-A' }, destination: { zoneId: 'L', holderId: null } },
      ],
    },
    {
      id: 'cue-3', title: 'Cue 3 — Actor-B Collects Key',
      actions: [
        { id: 'a3', propId: 'key-A', kind: 'collect', requiredSource: { zoneId: 'L', holderId: null }, destination: { zoneId: 'L', holderId: 'Actor-B' }, note: 'Depends on earlier place. Swap cues 2 and 3 to see failure.' },
      ],
    },
  ],
};

export const unknownStartDemo: Scenario = {
  version: 1,
  title: 'Unknown Start — Unresolvable Location',
  description: 'ring-A has an unknown initial state. Attempts to use it are uncertain, not fabricated or passed.',
  zones: [
    { id: 'Stage', name: 'Main Stage' },
  ],
  holders: [
    { id: 'Actor-A', name: 'Actor A' },
  ],
  props: [
    { id: 'ring-A', name: 'Gold Ring', kind: 'ring', initial: { status: 'unknown' } },
  ],
  cues: [
    {
      id: 'cue-1', title: 'Scene 1 — Attempt Collect',
      actions: [
        { id: 'a1', propId: 'ring-A', kind: 'collect', requiredSource: { zoneId: 'Stage', holderId: null }, destination: { zoneId: 'Stage', holderId: 'Actor-A' }, note: 'Unknown start: this will be uncertain, not a clean pass.' },
      ],
    },
  ],
};

export const DEMO_SCENARIOS: Array<{ id: string; title: string; scenario: Scenario }> = [
  { id: 'valid-control', title: 'Valid Control', scenario: validControlDemo },
  { id: 'missing-handoff', title: 'Missing Handoff', scenario: missingHandoffDemo },
  { id: 'consumed-reuse', title: 'Consumed Reuse', scenario: consumedReuseDemo },
  { id: 'duplicate-identity', title: 'Duplicate Names', scenario: duplicateIdentityDemo },
  { id: 'reordered-cues', title: 'Reordering Example', scenario: reorderedCuesDemo },
  { id: 'unknown-start', title: 'Unknown Start', scenario: unknownStartDemo },
];

export function emptyScenario(): Scenario {
  return {
    version: 1,
    title: 'New Scene',
    zones: [{ id: 'Stage', name: 'Main Stage' }],
    holders: [],
    props: [],
    cues: [],
  };
}
