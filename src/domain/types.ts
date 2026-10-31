export const ACTION_KINDS = ['place', 'collect', 'transfer', 'carryOff', 'consume', 'replenish'] as const;
export type ActionKind = (typeof ACTION_KINDS)[number];
export interface Position { zoneId: string; holderId: string | null }
export interface InitialState { status: 'available' | 'unknown' | 'absent'; zoneId?: string; holderId?: string | null }
export interface Prop { id: string; name: string; kind: string; initial: InitialState }
export interface Action { id: string; propId: string; kind: ActionKind; requiredSource: Position | null; destination?: Position; note?: string }
export interface Cue { id: string; title: string; actions: Action[] }
export interface NamedEntity { id: string; name: string }
export interface Scenario { version: 1; title: string; description?: string; zones: NamedEntity[]; holders: NamedEntity[]; props: Prop[]; cues: Cue[] }
export interface TraceRef { cueId: string; actionId: string; cueIndex: number; actionIndex: number }
export interface PropState { status: 'available' | 'unknown' | 'absent' | 'consumed'; zoneId?: string; holderId?: string | null; lastChange?: TraceRef }
export type StateMap = Record<string, PropState>;
export interface Issue { id: string; code: string; severity: 'error' | 'uncertain'; message: string; suggestion: string; propId: string; cueId: string; actionId: string; cause?: TraceRef }
export interface Frame { index: number; cueIndex: number; actionIndex: number; cueId: string; actionId: string; action: Action; before: StateMap; after: StateMap; issues: Issue[]; applied: boolean }
export interface RunResult { initial: StateMap; final: StateMap; frames: Frame[]; issues: Issue[] }
export type ParseResult = { success: true; data: Scenario } | { success: false; errors: string[] };
