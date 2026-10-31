export const ACTION_KINDS = ['place', 'collect', 'transfer', 'carryOff', 'consume', 'replenish'] as const;
export type ActionKind = (typeof ACTION_KINDS)[number];

export interface Position { zoneId: string; holderId: string | null }

export interface InitialState { status: 'available' | 'unknown' | 'absent'; zoneId?: string; holderId?: string | null }

export interface Prop { id: string; name: string; kind: string; initial: InitialState }

export interface Zone { id: string; name: string }

export interface Holder { id: string; name: string }

export interface Action { id: string; propId: string; kind: ActionKind; requiredSource: Position | null; destination?: Position; note?: string }

export interface Cue { id: string; title: string; actions: Action[] }

export interface NamedEntity { id: string; name: string }

export interface Scenario { version: 1; title: string; description?: string; zones: Zone[]; holders: Holder[]; props: Prop[]; cues: Cue[] }

export interface TraceRef { cueId: string; actionId: string; cueIndex: number; actionIndex: number }

// Discriminated union for propstate
export type AvailableState = { status: 'available'; zoneId: string; holderId: string | null; lastChange?: TraceRef };
export type UnknownState = { status: 'unknown'; lastChange?: TraceRef };
export type AbsentState = { status: 'absent'; lastChange?: TraceRef };
export type ConsumedState = { status: 'consumed'; lastChange?: TraceRef };
export type PropState = AvailableState | UnknownState | AbsentState | ConsumedState;

export type StateMap = Record<string, PropState>;

export type Cause = { kind: 'initial'; propId: string } | { kind: 'action'; ref: TraceRef };

export interface Issue {
  id: string;
  code: string;
  severity: 'error' | 'uncertain';
  message: string;
  suggestion: string;
  propId: string;
  cueId: string;
  actionId: string;
  cause?: Cause;
}

export interface Frame {
  index: number;
  cueIndex: number;
  actionIndex: number;
  cueId: string;
  actionId: string;
  action: Action;
  before: StateMap;
  after: StateMap;
  issues: Issue[];
  applied: boolean;
}

export interface RunResult {
  initial: StateMap;
  final: StateMap;
  frames: Frame[];
  issues: Issue[];
}

export type ParseResult = { success: true; data: Scenario } | { success: false; errors: string[] };
