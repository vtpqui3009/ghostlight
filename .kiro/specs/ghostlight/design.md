# Ghostlight design

## Provenance

Authored by **Kiro** (native Kiro CLI, primary writer) on 2026-10-31 during task T1, revised after independent T1 review. This is the first Kiro-authored design. It implements the [requirements](requirements.md) and is normative for the transition contract. Codex preparation referenced in the requirements is not design evidence; its caveats remain intact.

## Overview

Ghostlight is a pure, deterministic replay engine plus a theatrical editor UI. The engine takes an authored `Scenario` (stable IDs, ordered cues/actions, independent source/holder requirements) and produces a `RunResult` of ordered frames, each recording the before/after state and any issue. The UI compares the required position (ghost) against the modeled pre-action position (solid) and lets the user edit the plan, follow causes, and print reports.

A strict separation holds throughout: **authored requirements** (`requiredSource`, `destination` on each action) come from the run-sheet and are never derived from state; **modeled state** is computed by replay only. The engine checks whether an authored source **matches** the modeled state; it never fills the source from the state.

## Architecture

### Source map

```
src/
  domain/
    types.ts        # discriminated state types, Scenario, RunResult, Issue, Cause
    schema.ts       # structural parser: parseScenario(object), parseScenarioJson(string), LIMITS
    engine.ts       # pure replay: runScenario(scenario) -> RunResult  (NEW)
    ids.ts          # stable ID validation + own-key-safe dictionary helpers (NEW)
    report.ts       # preset/runner/reset report derivation (NEW)
    edit.ts         # safe edits: add/remove/reorder, reference-guarded deletion (NEW)
  persistence/
    store.ts        # localStorage load/save with recoverable errors (NEW)
  ui/
    App.tsx         # layout + state wiring (NEW; T2 stub, T3 full)
    StageView.tsx   # ghost/solid comparison (NEW)
    Timeline.tsx    # ordered cues/actions, keyboard nav (NEW)
    Editor.tsx      # scene/cue/action editing (NEW)
    Reports.tsx     # preset/runner/reset, print views (NEW)
    ImportExport.tsx# JSON import/export (NEW)
    a11y.tsx         # focus, reduced-motion, announcements (NEW)
  main.tsx          # bootstrap (exists; imports App once it exists)
  styles.css        # (NEW; T2 stub, T3 full)
tests/
  domain/*.test.ts  # A01-A18 + invariants + parser (NEW)
  pbt/*.test.ts     # property-based tests (NEW)
  e2e/*.spec.ts     # Playwright browser tests (NEW)
playwright.config.ts# (NEW; needed for T2 test:e2e wiring and T3 e2e)
```

The domain layer has no UI or storage imports and is fully unit/property-testable in Node. The engine is a pure function; `runScenario` is the single entry point for replay.

## Components and Interfaces

### Interfaces (contracts)

- `parseScenarioJson(json: string): ParseResult` — JSON-string boundary; byte-limit then `JSON.parse` then `parseScenario`.
- `parseScenario(value: unknown): ParseResult` — direct-object boundary; structural validation + owned normalized copy (no transition-table enforcement).
- `runScenario(scenario: Scenario): RunResult` — pure replay; assumes a structurally validated `Scenario` (parser output) as its precondition; never freezes or mutates caller-owned input; fresh per-frame copies.
- `presetReport(scenario)`, `runnerReport(scenario, run)`, `resetReport(scenario, run)` — derived views.
- `edit.ts`: `addProp/addZone/...`, `updateProp/...`, `moveCue/moveAction`, `deleteProp/deleteZone/deleteHolder` (reference-guarded; returns either a blocked-result listing references or an atomic retarget result).

## Data Models

### Computed prop state (discriminated union)

This enforces the state-shape contract: `available` always has a position; the others never do.

```ts
type AvailableState = { status: 'available'; zoneId: string; holderId: string | null; lastChange?: Cause };
type UnknownState  = { status: 'unknown';  lastChange?: Cause };
type AbsentState   = { status: 'absent';   lastChange?: Cause };
type ConsumedState  = { status: 'consumed'; lastChange?: Cause };
type PropState = AvailableState | UnknownState | AbsentState | ConsumedState;
```

State and cause dictionaries used during replay are **own-key-safe** (`Map<string, PropState>` or `Object.create(null)`-based), so an allowed ID such as `toString` never collides with an inherited property.

Initial state is derived from each prop's `initial`: `available` → `{ status:'available', zoneId, holderId }`; `unknown` → `{ status:'unknown' }`; `absent` → `{ status:'absent' }`. `consumed` is never an initial state; it only arises from a `consume` action.

### Cause (three-way)

A cause is one of three distinguishable kinds, used only for state/mismatch rejections (never for action-shape/holder rejections):

```ts
type Cause =
  | { kind: 'initial'; propId: string }                     // no successful action touched this instance
  | { kind: 'action'; ref: TraceRef };                       // last earlier successful action on this instance
```

An issue whose rejection is an action-shape/holder-rule failure has **no cause** (`cause` is absent). An initial-state cause references the prop's initial declaration; an earlier-action cause references the prior applied frame. The three are distinguishable in data (absent vs `{kind:'initial'}` vs `{kind:'action',ref}`), in issue text, and in the UI.

### Core types

- `Position { zoneId: string; holderId: string | null }` — `holderId` is always explicit; an omitted holder field is structurally invalid.
- `Scenario { version:1; title; description?; zones: NamedEntity[]; holders: NamedEntity[]; props: Prop[]; cues: Cue[] }`.
- `Action { id; propId; kind: ActionKind; requiredSource: Position | null; destination?: Position; note? }`.
- `TraceRef { cueId: string; actionId: string; cueIndex: number; actionIndex: number }`.
- `Issue { id; code; severity: 'error'|'uncertain'; message; suggestion; propId; cueId; actionId; cause?: Cause }`. Issue IDs are **stable and independent of frame order**: derived from the action's stable ID (one issue per rejected action, e.g. `issue::<actionId>`), so renaming/reordering cues does not change which issue an action produces.
- `Frame { index; cueIndex; actionIndex; cueId; actionId; action: Action; before: StateMap; after: StateMap; issues: Issue[]; applied: boolean }`. The emitted `action` is an independent copy of the action payload.
- `RunResult { initial: StateMap; final: StateMap; frames: Frame[]; issues: Issue[] }`. `initial` and `final` are independent copies (not aliases of each other or of any frame's map).

### The transition table (normative)

Notation: `src` = the action's `requiredSource`; `dst` = the action's `destination`. "Match" means `src.zoneId === cur.zoneId && src.holderId === cur.holderId` with explicit `null === null` (never `null === undefined`).

| Kind | `src` | `dst` | Pre-state | Holder transition | Zone rule | Post-state | Reject (semantic) when |
|---|---|---|---|---|---|---|---|
| `place` | required, non-null, **`holderId` non-null**, must match | required, `holderId === null` | available | holder → none | any declared zone | available `{dst.zone, null}` | `src` null or `holderId` null; `dst` missing or `holderId` non-null; pre-state not available; `src` mismatch |
| `collect` | required, non-null, **`holderId === null`**, must match | required, `holderId` non-null (declared holder) | available | none → holder | any declared zone | available `{dst.zone, dst.holder}` | `src` null or `holderId` non-null; `dst` missing or `holderId` null; pre-state not available; `src` mismatch |
| `transfer` | required, non-null, **`holderId` non-null**, must match | required, `holderId` non-null, **`!== src.holderId`** | available | holder → different holder | any declared zone | available `{dst.zone, dst.holder}` | `src` null or `holderId` null; `dst` missing/`null`/`=== src.holderId`; pre-state not available; `src` mismatch |
| `carryOff` | required, non-null, **`holderId` non-null**, must match | required, **`holderId === src.holderId`** | available | holder → same holder | **`dst.zoneId !== src.zoneId`** (relocates) | available `{dst.zone, src.holder}` | `src` null or `holderId` null; `dst` missing/`null`/`holderId !== src.holderId`/`zoneId === src.zoneId`; pre-state not available; `src` mismatch |
| `consume` | required, non-null, must match (**holder may be `null` or non-null**) | forbidden (absent) | available | any available → consumed | n/a | `consumed` | `src` null; `dst` present; pre-state not available; `src` mismatch |
| `replenish` | forbidden (`null`) | required, explicit `holderId` (`null` or declared holder) | absent | absent → available | any declared zone | available `{dst.zone, dst.holder}` | `src` non-null; `dst` missing; pre-state not `absent` |

Holder-transition summary (the four moving kinds are non-overlapping by holder change): `collect` null→holder; `transfer` holder→different holder; `place` holder→none; `carryOff` holder→same holder (relocates, custody retained). `consume` is any-available→terminal; `replenish` is absent→available.

### Why these choices
- **`null` never bypasses custody**: a `null` source is only accepted for `replenish` (no custody to check — the instance is absent). For the other five kinds a `null` source is a semantic rejection with an actionable error, never a silent skip.
- **No silent no-op moves**: each movement has explicit holder and zone rules. `place` rejects a `null` source holder (you cannot place something already at rest); `carryOff` requires a zone change (an equal-zone carry is a no-move and is rejected). `collect`/`transfer` always change the holder, so they can never be a no-op. No movement is silently inferred from an identical source and destination.
- **`carryOff` retains custody**: the destination holder equals the source holder, so the physical instance and its known holder are preserved while the zone changes (typically offstage). A handoff while relocating is `transfer`; putting down is `place`.
- **Non-overlapping kinds**: each moving operation has a distinct holder transition, so mislabeling (e.g. `collect` from a held prop) is caught structurally with a clear "use transfer" suggestion, independent of the state match.

## Engine: pure replay

`runScenario(scenario): RunResult` is a pure function. Its input precondition is a **structurally validated** `Scenario` (as produced by the parser); it does not re-parse or re-validate structure.

1. Build the initial `StateMap` (own-key-safe) from props. Treat input as read-only — never freeze or mutate it.
2. Maintain a per-prop "last successful cause": the `Cause` (`{kind:'action',ref}` or `{kind:'initial',propId}`) of the most recent applied frame on that prop.
3. Iterate cues in order, then actions in order. For each action at global frame index `i`: snapshot `before` (fresh own-key-safe copy); evaluate per the two-step order below; on success produce `after` (fresh copy, only the acted prop changed), update the per-prop cause, `applied: true`, `issues: []`; on rejection `after` equals `before` (fresh copy), `applied: false`, `issues: [issue]`, state and per-prop cause unchanged. Emit a `Frame` whose `action` is an independent copy.
4. Return `{ initial: independentCopy, final: independentCopy(lastState), frames, issues }`. `final` is a fresh copy, not an alias of the last frame's `after`.

### Evaluation order (per action) — two steps
1. **Action shape/holder rules only (no cause)**: check `src`/`dst` presence and the holder-transition/zone rules per kind (table "Reject" column, shape portion). A failure here is an `error` with **no cause** (the action is malformed for its kind); state is unchanged. This step never inspects modeled state, so it cannot need a cause.
2. **State and mismatch (with cause)**: look up the prop's current state:
   - `unknown` → `uncertain` `unknown-state`; cause = per-prop cause (`{kind:'initial'}` if untouched, else `{kind:'action',ref}`); unchanged.
   - `absent` → `error` `absent-before-replenish`; cause = `{kind:'initial',propId}`; unchanged.
   - `consumed` → `error` `consumed-reuse`; cause = the consume action (`{kind:'action',ref}`); unchanged.
   - `available` but `src` mismatch → `error` `source-mismatch`; cause = per-prop cause (initial or earlier action); unchanged.
   - `available` and matches → apply the transition.
3. `replenish` uses a different step-2 check: success only when pre-state is `absent`; `available` → `already-available`; `consumed` → `consumed-no-replenish`; `unknown` → `unknown-no-replenish`. No source match is attempted (`src` must be `null`).

### Causal cause selection
- The per-prop cause starts as `{kind:'initial',propId}` and is updated to `{kind:'action',ref}` only when a frame on that prop is applied. Selection is therefore O(1) per action.
- Rejected actions never update the per-prop cause, so they never become causes for later actions (A12). Initial-state and earlier-action causes are distinguishable by kind; the issue message also labels them ("from its initial declared state" vs "after action X in cue Y").
- Causal links are rendered in the UI only when meaningful: an earlier-action cause links to that frame; an initial-state cause links to the prop's initial-state card; a no-cause (shape) rejection renders no link.

### Immutability
- The engine never mutates or freezes caller-owned input. It copies on read: `initial`, `final`, and each frame's `before`/`after` are independent own-key-safe copies with no shared references (A11). Mutating one output snapshot (including `final`) does not affect another or a later frame (A15). The emitted `Frame.action` is an independent copy; nested `Cause`/`TraceRef` values are value-copied.
- Repeated runs on the same input produce structurally equal `RunResult`s (A11). (Tests may freeze their *own* input copy to verify non-mutation; the engine itself does not freeze.)

## IDs and references

- **Stable IDs**: prop, zone, holder, cue, and action IDs are immutable across edits/reordering. Renaming a cue or reordering actions changes outcomes via order, never via ID rewrite (A05, A06). The global frame index is a function of (cue order, action order); IDs stay fixed. Issue IDs derive from the action's stable ID, so they are frame-order-independent.
- **ID rules** (parser): `^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$`; forbidden `__proto__`, `constructor`, `prototype`. IDs are unique within their collection (action IDs unique across the whole scene). IDs are plain strings validated before use as keys; the own-key-safe dictionaries make even `toString`-like IDs safe.
- **References**: an action's `propId` and any `zoneId`/`holderId` in a position must reference existing declared entities. The parser validates on import; the editor guards on edit.

## Parser and import boundary

Two boundaries, kept separate (A18):

### `parseScenarioJson(json)` — JSON string boundary
- Enforce the UTF-8 byte limit (`LIMITS.jsonBytes = 200_000`) **before** `JSON.parse`, using `TextEncoder().encode(json).length` (byte count, not string length — A14). On throw return a single clear error. The caller never replaces state on failure (A16).

### `parseScenario(value)` — direct-object boundary
- Structural validation only (types, IDs, references, field presence, limits); it does **not** enforce the transition table, so structural parsing and semantic replay rejection stay explicit and separate.
- A `Position` must have a `zoneId` (existing zone) and an explicit `holderId` (`string` existing holder or `null`); an omitted `holderId` is structurally rejected (A09).
- Defends against **ordinary JSON-derived data** including sparse arrays (holes treated as missing/invalid) and inherited enumerable properties (only own, explicitly-named keys are read). It does **not** guarantee handling arbitrary accessor properties or Proxy objects — those are outside the ordinary-data boundary and are documented as unsupported, not claimed as passed (A18).
- Returns an **owned normalized copy** that copies only declared fields and strips arbitrary/prototype-related keys (A15). Mutating the original nested arrays/positions or the normalized result does not cross the boundary. Bounded error list (cap 30) with path-prefixed messages.

### Collection limits (`LIMITS`)
`props: 12`, `zones: 6`, `holders: 12`, `cues: 40`, `actionsPerCue: 12`, `jsonBytes: 200_000`. At-limit and above-limit inputs produce exactly documented boundaries without crashing (A14). Empty holders and empty cues are allowed where the schema permits; an empty scene yields a useful empty UI.

## Persistence and recovery

- **Save**: serialize the current `Scenario` to `localStorage` under a fixed key. On quota/permission failure, report a save error and do **not** mark state as saved (no false "saved" — A16). The in-memory scene is never destroyed by a save failure.
- **Load**: on startup, attempt to read and `parseScenarioJson`. valid → restore; corrupt/parse error → recoverable error, offer "start fresh" without overwriting the failed blob until the user confirms; unsupported version → recoverable error with the detected version; storage read denied/unavailable → recoverable error; the app still starts with the demo or an empty scene.
- Saved data is a single normalized `Scenario`; nothing else (no engine state) is persisted, so a fresh replay always recomputes deterministically.

## Edits and reference integrity

- **Add/edit**: create/edit props, zones, holders, cues, actions with stable IDs (new IDs generated by the editor, validated against the same ID rules). Editing recomputes the `RunResult`, warnings, stage view, reports, and preserves the selected position where possible.
- **Reorder**: cues and actions reorder via explicit moves; IDs unchanged; the engine recomputes order-dependent results (A05, A06).
- **Delete (reference-guarded)**: deleting a referenced prop/zone/holder is **blocked** with a list of referencing actions and a clear message. The user must explicitly remove/retarget references first, or the editor offers an explicit atomic "delete and retarget to …" action. Dangling references never persist (A18). Deleting a cue/action simply removes it; derived results recompute.
- After any edit, the timeline, stage view, warnings, reports, and selected step refresh. Mid-run playback pauses/updates predictably; no stale results.

## Reports

All reports are derived views over `Scenario` + `RunResult`; they contain no state the engine does not already compute.
- **Preset report**: for each prop, its initial status and (if available) initial zone/holder; unknown/absent labeled. Matches the declared initial state.
- **Runner report**: the ordered run-sheet — for each cue, its ordered actions with authored `requiredSource`/`destination` and kind; alongside, any issue for that action. A rejected action is shown as a warning/issue, never as a completed move (A17).
- **Reset report**: final versus initial, **truthful per initial status** (no invented initial location):
  - initially `available` at X → finally `available` at Y: return-to instruction (to X).
  - finally `consumed` (any initial status — `available`→consume, or `absent`→replenish→consume): replace with a new instance (new ID) — never resurrection and never omitted from the report (A03).
  - initially `absent` → finally `available`: removal-from-show instruction (it was not initially present; no invented initial location).
  - initially `absent` → finally `absent`: no action.
  - initially `unknown` → finally any: labeled uncertain; verify and return/remove as appropriate; no invented location.
- Print views are static, ordered, labeled, with page breaks and warnings; they do not rely on background color alone.

## UI design

### Layout
- **Header**: title, "planned state" label, save status, import/export.
- **Main**: responsive three-region layout — timeline (ordered cues/actions), stage view (ghost/solid), details/reports. On narrow screens these stack; essential actions remain reachable.
- **Empty/error states**: no scene → "Load demo / Import / Start empty"; valid empty scene → "Add a prop and a cue to begin"; errors render inline with recovery actions.

### Stage view (ghost vs solid)
- Zones are labeled regions. For the selected step, each prop shows two glyphs when it has both a required and a modeled position: **ghost** (required, translucent outline, "required" label + prop ID + name) and **solid** (modeled pre-action, filled, "planned" label + prop ID + name). Coincident → a single aligned glyph with a "match" text indicator; differing → both glyphs with a "mismatch" text indicator (never color alone). The post-action `after` position is available on demand and labeled "after", never confused with the requirement. Long labels and dense/overlapping props stay legible; IDs and names are always text.

### Timeline and navigation
- Cues in order; each expands to its ordered actions. Selecting an action selects its frame and updates the stage view to that frame's `before` (pre-action) state plus the action's `requiredSource` (ghost). Keyboard: Tab between regions; arrow keys navigate/reorder; Enter selects; Space toggles expand; shortcuts for add/delete/reorder. Focus visible; restored after dialogs and reordering.

### Causal links
- A rejected action's issue shows its cause only when meaningful: an earlier-action cause links to that frame; an initial-state cause links to the prop's initial-state card; a no-cause (shape) rejection shows no link. Following a link updates the stage view and timeline selection without losing the user's place.

### Editor
- Inline forms for props (id, name, kind, initial status/position), zones, holders, cues (title, reorder), actions (kind, propId, requiredSource, destination, note, reorder). Field errors are associated with their inputs and announced. Deletion is reference-guarded.

## Correctness Properties

- **Single custody**: at all times each available prop has exactly one (zone, holder); `transfer` moves custody without duplicating.
- **Terminal consumption**: once `consumed`, an instance cannot transition to any other state in the same run; `replenish` only takes `absent→available` and never revives a consumed ID.
- **Determinism**: identical input yields identical `RunResult` across runs; the engine is a pure function of its input and never mutates or freezes caller-owned input.
- **Causal ordering**: every state/mismatch cause is no-cause, initial-state, or an earlier successful same-prop action; never future, cross-prop, or rejected.
- **Immutable rejection**: a rejected action leaves the state map unchanged; the next valid action still applies against the unchanged state; output maps are independent (no aliasing, including `final`).
- **State-shape contract**: `available` always has a zone + explicit holder; `unknown`/`absent`/`consumed` never carry a position; `consumed` only arises from `consume`.
- **Own-key-safe**: state/cause dictionaries never collide with inherited properties for any allowed ID.

## Error Handling

Issue codes (machine-readable) and severities:
- `uncertain` severity: `unknown-state` (source cannot be matched because the instance is unknown).
- `error` severity: `source-mismatch`, `absent-before-replenish`, `consumed-reuse`, `consumed-no-replenish`, `already-available`, `unknown-no-replenish`, and action-shape codes `source-required`, `destination-required`, `destination-forbidden`, `invalid-holder-transition`, `no-move` (carryOff equal zone).
- Every issue carries an actionable `suggestion` (e.g. "use transfer for a handoff", "add a missing transfer before this cue", "replenish before using this instance", "add a new physical instance with a different ID", "declare an initial position for this instance").
- Action-shape/holder rejections have **no cause**; state/mismatch rejections cite an initial-state or earlier-action cause. Issue IDs are stable and frame-order-independent (`issue::<actionId>`).
- Structural (parser) errors are path-prefixed and bounded (cap 30); the current scene is retained on import failure. Semantic (engine) rejections are `applied: false` with the issue and unchanged before/after. The parser is structural; the engine is semantic; the two rejection kinds stay explicit and separate. No operation teleports an instance.

## Testing Strategy

- **Unit tests (Vitest)** — one synthetic fixture per acceptance criterion with a **hand-calculated** expected outcome (the specific frames, applied flags, final states, issues, and causes relevant to that criterion — not necessarily a full `RunResult`), written independently of the engine; plus state-shape invariant tests and parser boundary tests (A13, A14, A15, A18 direct-object).
- **Property-based tests (fast-check)** — single custody, terminal consumption, new-instance replenishment, deterministic ordering, immutable rejection, causal ordering. Each property records its seed and minimized counterexamples; counterexamples are reproducible.
- **Browser tests (Playwright)** — full workflow (load demo → replay → inspect mismatch → follow cause → edit → rerun → export → reopen); ghost/solid visibility and labels; causal navigation; editing/reordering refresh; import/export round trip; persistence recovery; keyboard/focus; reduced-motion static equivalent; responsive (320/375/desktop) and 200%/400% zoom; print views; real error/empty states.
- **Evidence**: record actual commands, versions, exit codes, failing cases, fixes, and limitations in QA documentation **after** execution. A plan, scaffold, or written test is not a passing result.

## Open decisions recorded
- `carryOff` retains the holder and requires a zone change; a handoff while relocating is `transfer`, putting down is `place`.
- `consume` may target a resting or held prop (source holder may be `null` or non-null); only the source must match.
- `replenish` destination holder may be `null` (appears at rest) or a declared holder (appears in hand).
- Deletion of referenced entities is blocked-with-explanation (default) or an explicit atomic retarget; dangling references are never permitted.
- The parser is structural; the engine is semantic. The transition table is enforced by the engine, not the parser, so the two rejection kinds stay explicit and separate.
- "Offline" means local computation once assets are loaded via the dev/preview server or a built bundle; cold-offline reopening is not claimed unless separately implemented and tested.
