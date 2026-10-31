# Requirements Document

Ghostlight — a local, planned-state validator for physical-prop plans. Authored by **Kiro** (native Kiro CLI, primary writer) on 2026-10-31 during task T1, revised after independent T1 review.

## Introduction

This is the first meaningful Kiro-authored specification for Ghostlight; it supersedes the Codex-authored placeholder (preserved verbatim in [Historical provenance](#historical-provenance)). Earlier Codex preparation — `WORKFLOW.md`, `KIRO_CODING_HANDOFF.md`, `GHOSTLIGHT_VALIDATION_PLAN.md`, `KIROWEEN_FINAL_REVIEW.md`, `KIROWEEN_RESEARCH_EVIDENCE.md`, `CLOUD_KIRO_READINESS.md`, `BUILD_PROGRESS.md` — is research, orchestration guidance, and a task ledger, **not** Kiro-authored implementation or QA evidence. Its caveats about demand, differentiation, real-user validation, and contest eligibility remain fully intact. No application checks have run; a plan, scaffold, or spec file is not a passing result.

### Scope and non-goals

Ghostlight helps a stage manager or ASM check a physical-prop plan (a run-sheet / preset) before the curtain rises by replaying authored cue actions to model where each physical prop instance is expected to be, then comparing that modeled state against the independently authored source/holder requirement of each cue. It finds plan gaps: missing handoffs, reused consumed instances, duplicate-copy confusion, and cue-order consequences.

Non-goals — hard boundaries:
- Not live tracking, real-time monitoring, or a safety system. It checks a plan; it never observes the field, guarantees safety, or detects actors performing wrong actions.
- Not inventory/QR management, 3D, actor pathfinding, live cue control, LLM script reading, physics simulation, nested containers, or partial liquids.
- Not a claim of real-user validation, market uniqueness, or contest eligibility. Differentiation and demand are unvalidated per the research documents.
- Playback is a synthetic planned-state model, labeled as such. Real run-sheets are not published without permission; demo scenes are owned and clearly marked synthetic.

### Glossary

- **Physical instance ID**: a stable identifier for one physical copy of a prop (e.g. `letter-A`). Two copies with the same name/kind are still distinct IDs.
- **Authored requirement**: a source/holder or destination position entered independently from a run-sheet or by the user. It is never filled from computed state.
- **Modeled (computed) state**: the position/custody of a prop derived by replaying ordered cue actions. Always kept separate from authored requirements.
- **Zone**: a declared named area of the stage or backstage (e.g. left preset, right wing).
- **Holder**: a declared person who can carry a prop. A resting prop has holder `null` (on a surface); a carried prop has a non-null holder ID.
- **Position**: a `{ zoneId, holderId }` pair where `holderId` is an explicit `string` (a holder ID) or `null` (no holder). A position never has an omitted holder field.
- **Ghost**: the required position a cue demands (translucent). **Solid**: the modeled pre-action position the plan produced (filled). The mismatch between them is the core signal.
- **Cue**: an ordered group of one or more actions. **Action**: one transition on one prop instance, ordered within its cue.
- **Cause**: for a state/mismatch rejection, the earlier successful action on the same instance that last changed its state, or the initial state when no such action exists. Shape/holder rejections have no cause.

## Requirements

### FR1 — Physical instance identity and independence
1. Every physical prop is a distinct instance with a stable ID. Same name/kind never merges IDs or redirects a requirement (A04).
2. Authored source/holder requirements and destinations are entered independently and are never auto-filled from computed state. Filling a requirement from the current modeled state would make the check self-fulfilling and is forbidden (A02).
3. Computed state is derived from replay only; it is never an input to authoring.

### FR2 — The six operations and transition contract
1. Exactly six action kinds are modeled: `place`, `collect`, `transfer`, `carryOff`, `consume`, `replenish`.
2. The engine enforces a precise transition table (see design). Each kind fixes when a source is required or forbidden, when a destination is required or forbidden, the required pre-state, and the holder transition.
3. `null` never bypasses a custody check: a `null` source is only valid where the table forbids a source; for the five source-requiring kinds a `null` source is a semantic rejection, not a silent skip.
4. Source match requires both zone and holder to equal the current modeled state; matching only one coordinate never passes (A09). Explicit `null` holder differs from an omitted holder field (the omitted case is structurally rejected).
5. Every rejected action has `applied: false`, a useful error or uncertainty, and leaves the before/after state unchanged (A10).
6. Each movement kind has explicit holder-transition and zone rules; no movement silently infers a no-op. In particular: `place` requires a non-null source holder (you cannot place something already at rest); `collect` requires a `null` source holder; `transfer` requires two distinct non-null holders; `carryOff` retains the same holder and requires the destination zone to differ from the source zone (it actually relocates; an equal-zone carry is rejected as a no move). `consume` may target a resting or held prop (source holder `null` or non-null). `replenish` has no source.

### FR3 — State shapes
1. Computed prop state is one of four shapes, enforced as a discriminated union: `available` (a valid declared zone and an explicit holder `string | null`), `unknown` (no position), `absent` (no position; predeclared, eligible for replenishment), `consumed` (terminal, no position).
2. An `available` state always carries a valid zone and explicit holder. `unknown`, `absent`, and `consumed` never carry an invented position.

### FR4 — Unknown handling
1. An action whose source cannot be matched because the instance is `unknown` reports **uncertainty** (not a fabricated location and not a clean pass) and leaves state unchanged (A07). `replenish` on an `unknown` instance is rejected as an error. All six operations reject an `unknown` instance (none pass).
2. Unknown state is never resolved by inferring a clean state from a requested destination, and an earlier action cannot establish a position for an unknown-start instance (every action requires a known source, which an unknown start lacks). The only way to resolve an `unknown` start is to edit its initial declaration — declare an initial position, or change its initial status to `available` or `absent`.

### FR5 — Consumption and replenishment
1. `consume` is terminal for that instance: a consumed ID never revives in the same run (A03).
2. `replenish` introduces a previously absent instance. It succeeds only when the prop is currently `absent`; it is rejected when the prop is `available`, `unknown`, or `consumed` (A08). Replenishing a different absent ID does not satisfy a requirement still naming a consumed ID (A03).
3. Physical reset instructions never resurrect consumed IDs; a consumed item needs a replacement instance with a new ID.

### FR6 — Causal provenance
1. A state/mismatch or uncertainty issue cites a cause that is one of three distinguishable kinds: **no cause** (the action failed an action-shape/holder-rule check, which is about the action itself, not prior state); **initial-state cause** (no successful action has touched this instance, so its state comes from its initial declaration); or **earlier-action cause** (the last relevant earlier successful action on the same instance) (A02, A12).
2. Causes respect full action order: an earlier-action cause is a frame with a lower global index whose action has the same `propId` and `applied: true`. Future actions, cross-prop actions, and rejected actions are never cited as causes. Rejected actions do not become state-changing causes.
3. Initial-state causes are distinguishable from earlier-action causes (different marker/label). Causal links are rendered only when meaningful: an earlier-action cause links to that frame; an initial-state cause links to the prop's initial-state card; a no-cause (shape) rejection renders no link.
4. Issue IDs are stable and independent of frame order (derived from the action's stable ID, not its position), so renaming/reordering cues does not change which issue an action produces.

### FR7 — Deterministic immutable replay
1. Replay is a pure function of the ordered scenario; the same input yields structurally equal output every time (A11).
2. The engine never mutates caller-owned input and never freezes it. The `initial`, `final`, and each frame's `before`/`after` state maps are independent copies with no shared references; `final` is not an alias of the last frame's `after`. Each frame emits an independent copy of the action payload; nested cause references are value-copied (A11, A15).
3. A rejected action does not poison a later valid action — each action is evaluated against the actual state after prior applied actions.
4. Frames are ordered by cue order then action order; the global frame index is stable for a given scenario shape.

### FR8 — Reports
1. **Preset report** reflects known initial positions (where each prop starts; unknown/absent labeled).
2. **Runner report** reflects ordered authored requirements and warnings (the run-sheet of what each cue demands plus issues), never reporting a rejected action as a completed move.
3. **Reset report** reflects final versus initial planned state truthfully per initial status: a prop that was initially `available` and is now elsewhere gets a return-to instruction; a prop that was initially `absent` and is now `available` gets a removal-from-show instruction (it was not initially present — no invented initial location); any prop that is finally `consumed` — whether it started `available` or was introduced by `replenish` from `absent` — needs a replacement instance with a new ID and must not vanish from the report; an `unknown` start or end is labeled uncertain with no invented location.

### FR9 — Edit and reference integrity
1. Editing, reordering, or deleting cues/actions recomputes derived results (warnings, stage view, reports, selected position) without rewriting authored requirements or stable IDs (A05, A06).
2. Deleting a referenced prop, zone, or holder is blocked with the references explained, or performed as an explicit atomic update that retargets/removes references. Dangling references never persist (A18).
3. Causal order uses action index within a cue in addition to cue index, so reversing actions in the same cue changes outcomes (A06).

### FR10 — Import, export, and persistence
1. Import validates before replacing current work; an invalid import leaves the current scene intact with a clear error (A16).
2. Export and import round-trip preserve identity, order, and authored requirements.
3. Local save is recoverable: corrupt saved data, unsupported version, and storage read/write denial or quota failure are reported without a false "saved" state and without destroying current work (A16).
4. The parser returns an owned normalized copy, strips arbitrary/prototype-related keys, defends against unsafe IDs and HTML-like labels (rendered as text), and enforces collection limits and the UTF-8 byte limit (A13–A15). Its adversarial promise is narrowed to ordinary JSON-derived data, including sparse arrays and inherited enumerable properties; it does not guarantee handling arbitrary accessor properties or Proxy objects. The direct-object parser input boundary is defined separately from JSON string input (A18).
5. State and cause dictionaries used during replay are own-key-safe (e.g. `Map` or `Object.create(null)`), so an allowed ID such as `toString` never collides with an inherited property. The replay engine assumes a structurally validated `Scenario` (as produced by the parser) as its input precondition; it does not re-parse.

### FR11 — Theatrical UI
1. The stage view shows, for the selected step, the **ghost** required position (translucent, labeled "required") and the **solid** modeled pre-action position (filled, labeled "planned"), with each prop's physical instance ID and name shown as text. Color or animation never carries meaning alone.
2. Post-action state is labeled separately so it is not confused with the requirement.
3. Scene, cues, and actions are editable (add, edit, reorder, delete) and edits refresh the stage view, timeline, warnings, reports, and selected position. Playback updates predictably without stale results.
4. A timeline lists cues and their ordered actions; causal links navigate from an issue to its cited earlier action or initial state (rendered only when meaningful).

### FR12 — Accessibility
1. All controls are operable by keyboard, including cue/action reordering, timeline navigation, the editor, dialogs, import/export, and causal links. Focus is visible, focus is restored after dialogs, tab order is logical, controls have accessible names, and field errors are associated.
2. A reduced-motion preference yields a complete static equivalent; pause/step remain available. No flicker, jump scares, or unexpected focus movement.
3. High contrast is maintained; information remains reachable at 200%/400% zoom and at 320/375-pixel mobile and desktop widths, including long labels and dense/empty scenes.
4. A screen-reader-readable list/table contains equivalent state and causal information; live announcements warn when results change without flooding during playback.

### FR13 — Empty and error states
1. A useful empty state covers no scene loaded and a valid empty scene (A14).
2. Real error states cover import failure, save failure, storage denial, corrupt data, and unsupported version, each recoverable without silent replacement or data loss.

### Non-functional requirements
- **Local-first**: React + Vite + TypeScript; small data; no network calls at runtime. The app runs as local computation once assets are loaded (via the dev/preview server or a built bundle). Cold-offline reopening (loading the app with no server and no network at all) is not claimed unless separately implemented and tested.
- **Determinism and purity**: the engine is a pure function; no hidden state, no randomness without a recorded seed.
- **Defensive boundaries**: parser and engine never crash on supported inputs; every invalid case within the supported boundary has a bounded, actionable error.
- **Honest labeling**: all playback is "planned state," never "live tracking" or "real-user validation." No claim of uniqueness or contest eligibility.

## Acceptance criteria

Each criterion is an independent requirement with a small owned synthetic fixture and a hand-calculated oracle (expectations are not derived by calling the engine under test). T2 covers the domain/parser/report/edit criteria; T3 covers persistence/UI criteria. Not every criterion requires a full expected `RunResult` — each asserts the specific outcomes relevant to it. Full transition-table rows are normative in the design.

- **A01 valid control** — `letter-A` starts `L/none`; collect to `L/A`, transfer to `L/B`, carry to `R/B`, place at `R/none`. No issues; exactly four ordered applied frames; final state `R/none`; input untouched.
- **A02 missing handoff** — from A01, omit transfer but keep B as the required holder for carry. Carry is rejected; modeled holder remains A; collect is cited as the cause; required holder remains B. Later actions evaluate against the actual unchanged state.
- **A03 consumed reuse** — consume `seal-A`, then collect/transfer/consume it again; separately replenish initially absent `seal-B`. A stays consumed. B becoming available cannot satisfy an action still referring to A. Retargeting to B with a valid source passes.
- **A04 duplicate identity** — same name/kind for `letter-A` and `letter-B`; A moved away, B remains `L/none`. Collect B succeeds independently; a variant referring to A fails. Names never merge IDs.
- **A05 reordered cues** — `key-A` starts `R/A`; carry to `L/A`, place at `L/none`, then B collects from `L/none`. Swap place and collect: the control passes; the swapped collect fails with cause carry; the subsequent place succeeds. Authored requirements and stable action IDs are unchanged.
- **A06 same-cue order** — put the place/collect pair in one cue, then reverse the actions. Same ordering effect as A05; causal order uses action index, not only cue index.
- **A07 unknown start** — an unknown initial instance, then collect requiring `L/none`. Uncertainty, not a fabricated location or clean pass; unknown state retained; initial-state explanation (not an earlier-action suggestion).
- **A08 absent/replenish** — initially absent B: collect before replenishment (rejected); replenish B with valid destination (succeeds); collect B (succeeds); replenish B again (rejected). Consumed/unknown variants cannot be treated as absent.
- **A09 partial mismatch** — correct zone/wrong holder; correct holder/wrong zone; explicit `holderId: null` versus omitted holder. Each mismatch is visible; missing holder is structurally rejected; no false match from one coordinate.
- **A10 null/illegal fields** — null source on each kind; omitted destination for each kind; forbidden destination on terminal operations; invalid holder changes (including `place` from a `null` source holder and `carryOff` to an equal zone). Each disallowed case fails before mutation with an actionable reason; no operation teleports an instance.
- **A11 immutable deterministic replay** — run repeatedly; attempt to mutate one output snapshot (including `final`); replay an invalid action followed by a valid one. Input unchanged and never frozen by the engine; repeated output structurally equal; `initial`/`final`/frame maps independent with no aliasing; rejection does not poison a later valid action.
- **A12 causal integrity** — interleave two props, include a rejected step and future moves; rename/reorder cues. Every cause is no-cause, initial-state, or an earlier successful same-prop action; never future/cross-prop/rejected; the three cause kinds are distinguishable; initial-state cause stays distinguishable.
- **A13 parser adversaries** — invalid JSON/version/types; duplicate IDs; missing references; unsafe IDs `__proto__`, `constructor`, `prototype`; extra imported keys and HTML-like labels. Clear bounded validation errors; current scene retained on failure; extra keys stripped; labels rendered as text; allowed ID `toString` works without inherited-object lookups.
- **A14 parser boundaries** — each collection at and above its limit; 64/65-character IDs; empty collections where allowed; JSON at/over 200,000 UTF-8 bytes using multibyte text. Exactly documented boundaries; no crash; empty scene has a useful empty UI. Byte count is not confused with string length.
- **A15 owned normalized copy** — parse a valid scene, mutate the original nested arrays/positions, then mutate the normalized result. Mutations do not cross the boundary; no retained arbitrary/prototype-related keys.
- **A16 import/save recovery** — valid round trip; corrupt saved data; unsupported version; storage read/write denial or quota failure; invalid import while editing. Round trip preserves IDs/order/requirements; recoverable errors; no false "saved" state, silent replacement, or destruction of current work. UI covers ghost/solid visibility, keyboard, reduced motion, responsive, print, and real error/empty states.
- **A17 practical reports** — generate reports for A01, A02, A03, and unknown starts. Preset matches initial known positions; runner lists ordered requirements and warnings; reset reflects final state truthfully per initial status (including absent→available as a removal-from-show instruction, never an invented initial location; and absent→replenish→consume as a replace-with-new-ID instruction that does not vanish), replacement, and uncertainty. Rejected actions are never reported as completed moves.
- **A18 reference edits and state shapes** — delete referenced props/zones/holders; exercise every transition result; if supported, call `parseScenario` with sparse arrays or inherited fields. Block deletion with references explained or perform an explicit atomic update; computed states obey the state-shape contract; the direct-object parser input boundary is defined separately from JSON input and narrowed to ordinary data (sparse/inherited), not arbitrary accessor/Proxy shapes; unsupported adversarial cases are documented, not claimed as passed.

## Test plan summary

- **Unit tests (Vitest)** — one synthetic fixture per acceptance criterion with a hand-calculated expected outcome (the specific frames, applied flags, final states, issues, and causes relevant to that criterion, not necessarily a full `RunResult`); plus state-shape invariant tests and parser boundary tests. Expectations are written independently of the engine.
- **Property-based tests (fast-check or equivalent)** — single custody, terminal consumption, new-instance replenishment, deterministic ordering, immutable rejection, and causal ordering. Each property records its seed and any counterexample; counterexamples are reproducible.
- **Browser tests (Playwright)** — full workflow (load demo, replay, inspect mismatch, follow cause, edit, rerun, export, reopen); ghost/solid visibility and labels; causal navigation; editing/reordering refresh; import/export round trip; persistence recovery; keyboard/focus; reduced motion; responsive (320/375/desktop) and 200%/400% zoom; print views.
- **Manual visual/keyboard inspection** paired with the browser assertions, recorded as evidence after execution. No check is claimed to have run before it has.

## Historical provenance

The following is the original Codex-authored placeholder of 2026-10-31, preserved verbatim. It is not Kiro-authored and is superseded by the requirements above.

> # Ghostlight requirements
>
> Provenance: authored by Codex on 2026-10-31 from the user's approved scope. This file has NOT been generated or reviewed by Kiro. Merely placing it here does not establish meaningful Kiro use.
>
> 1. Store independent physical instance IDs and independent cue source/holder requirements.
> 2. Replay ordered transitions immutably; reject invalid transitions without mutating state.
> 3. Report unknown starting state as uncertainty, consumption as terminal for that instance, and replenishment as introducing an absent new instance.
> 4. Explain mismatches with the last relevant earlier action or initial state; never cite future actions.
> 5. Provide editable original scenes, cue replay, required ghost versus modeled solid location, and preset/runner/reset reports.
> 6. Support validated JSON import/export, local save with recovery/error states, accessible responsive interaction and reduced motion.
> 7. Label all playback as planned state, not live physical tracking. Do not claim real-user validation.
>
> Acceptance: missing handoff, consumed reuse, duplicate identity, cue reordering and valid-control examples; generated deterministic invariant tests; browser interaction/accessibility/responsive checks. Results belong in QA documentation after execution.
