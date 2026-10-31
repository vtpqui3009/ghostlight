# Implementation Plan: Ghostlight

## Provenance

Authored by **Kiro** (native Kiro CLI, primary writer) on 2026-10-31 during task T1, revised after independent T1 review. These tasks implement the [requirements](requirements.md) and [design](design.md). T1 (this spec authoring) is complete; T2/T3 are Kiro implementation tasks; T4 is Codex independent review/QA. No task here is marked done until its acceptance checks actually pass — a written task is not a passing result.

## Overview

T1 authored the requirements, design, and tasks (plus steering and hooks). T2 builds the pure domain layer (model, parser, engine, reports, safe edits) and its tests, adding only minimal compilation stubs where needed. T3 builds the UI, persistence, and integration tests, replacing T2 stubs completely. T4 is Codex independent review/QA.

## Task Dependency Graph

```
T1 (specs) ──► T2 (domain/parser/report/edit + tests) ──► T3 (UI/persistence/integration) ──► T4 (review/QA)
```

T2 depends on T1. T3 depends on T2 (after Codex model review). T4 depends on T3.

## Scope guardrails (apply to every task)

- Write only within the task's allowed paths; do not touch another active writer's paths.
- Keep authored requirements independent of computed state; never fill `requiredSource` from modeled state.
- `null` never bypasses custody; unknown stays uncertain and is resolvable only by editing the initial declaration (not by an earlier action); consumed IDs never revive; replenishment only introduces a predeclared absent instance.
- Every rejected action leaves state unchanged with a useful error or uncertainty; action-shape rejections have no cause, state/mismatch rejections cite an initial-state or earlier-action cause.
- The engine never freezes or mutates caller-owned input; output maps are independent (no aliasing, including `final`).
- Label all playback "planned state"; do not claim real-user validation, uniqueness, or contest eligibility. "Offline" means local computation once assets load; do not claim cold-offline reopening unless implemented and tested.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and (for UI tasks) `npm run build` and the relevant e2e checks; record exact commands, versions, exit codes, failing cases, fixes, and limitations.

## T2 — Domain model, parser, reports, edits, and tests

Owner: Kiro primary writer. Paths: `package.json`, lockfile, `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `tsconfig.json`, `playwright.config.ts`, `src/domain/**`, `src/persistence/**` (interface only if needed for types), minimal `src/App.tsx` + `src/styles.css` stubs, `tests/domain/**`, `tests/pbt/**`, owned fixture paths. Base: T1 checkpoint. Dependencies: T1.

### 2.1 Establish dependencies, tooling, and minimal compilation stubs
- Add and pin exact versions: `react`, `react-dom`, `@vitejs/plugin-react`, `vite`, `typescript`, `vitest`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `globals`, `fast-check`, `@playwright/test`.
- Generate the lockfile. Keep existing scripts (`dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `check`).
- Add `playwright.config.ts` bound to the local preview server (needed so `test:e2e` wiring is valid; e2e specs land in T3).
- Add **minimal** `src/App.tsx` and `src/styles.css` stubs solely so `main.tsx` compiles and `npm run typecheck`/`npm run build` pass on the scaffold. These stubs render nothing meaningful and are **completely replaced in T3**.
- Acceptance: `npm run lint` and `npm run typecheck` exit 0; `npm run build` succeeds against the stub. Record versions and the install command.

### 2.2 State types, IDs, and own-key-safe dictionaries
- Update `src/domain/types.ts` to the discriminated `PropState` union, the three-way `Cause` type, `Scenario`, `Action`, `Frame`, `Issue` (stable, frame-order-independent IDs), `RunResult`.
- Add `src/domain/ids.ts` with the ID rule (`^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$`, forbidden `__proto__`/`constructor`/`prototype`), uniqueness helpers, and own-key-safe dictionary helpers (`Map` or `Object.create(null)`).
- Acceptance: typecheck passes; `available` states always carry a zone and explicit holder; the other three never carry a position; a prop with ID `toString` is safe as a dictionary key.

### 2.3 Replay engine
- Implement `src/domain/engine.ts` `runScenario(scenario): RunResult` as a pure function per the design transition table.
- Two-step evaluation per action: (1) action-shape/holder/zone rules only — no cause; (2) state lookup and source match — with an initial-state or earlier-action cause (or no cause is impossible here).
- Enforce, per kind: required/forbidden `src`, required/forbidden `dst`, holder-transition validity, and zone rules (notably `place` requires a non-null source holder; `carryOff` requires `dst.zoneId !== src.zoneId`). `null` source is a semantic rejection for the five source-requiring kinds.
- Maintain the per-prop last-successful cause (initial-state default); cite it on rejection; rejected actions never become causes.
- Never freeze or mutate caller-owned input. Produce independent own-key-safe `before`/`after` per frame; emit an independent copy of the action payload; `final` is an independent copy, not an alias of the last `after`.
- Acceptance: A01–A12 outcomes pass (see 2.5); repeated runs structurally equal; mutating an output snapshot (including `final`) does not affect others; input untouched and never frozen.

### 2.4 Parser and import boundary
- Extend `src/domain/schema.ts`: keep structural validation only (do not enforce the transition table). Confirm `Position` requires an explicit `holderId`; handle sparse-array holes and inherited enumerable keys (own keys only); keep the owned normalized copy; cap errors at 30.
- Keep `parseScenarioJson` enforcing the UTF-8 byte limit before `JSON.parse`. Document the narrowed adversarial promise: ordinary JSON-derived data (sparse/inherited), not arbitrary accessor/Proxy shapes.
- Add direct-object boundary tests separately from JSON-string tests.
- Acceptance: A13, A14, A15, A18 (direct-object) tests pass; the parser never crashes on supported inputs; extra/prototype keys stripped; `toString` on allowed IDs uses no inherited lookups; accessor/Proxy cases are documented as unsupported, not claimed passed.

### 2.5 Fixtures and unit tests (domain acceptance)
- Add owned synthetic fixtures (clearly marked synthetic) for the domain criteria: A01–A12 (engine/transition/causal), A13–A15 (parser), A17 (reports), A18 (edit/reference + state shapes + direct-object boundary).
- Write `tests/domain/*.test.ts`: for each criterion, assert the **specific outcomes relevant to it** — not a full expected `RunResult` for every case (e.g. A02 asserts the carry is rejected, holder stays A, and collect is the cause). Expectations are written independently of the engine.
- Add state-shape invariant tests.
- Acceptance: A01 valid control; A02 cites collect; A03 keeps A consumed; A04 independent IDs; A05/A06 action-order sensitive; A07 uncertainty with an initial-state (not earlier-action) explanation; A08 rejects double-replenish and unknown/consumed replenish; A09 both coordinates; A10 rejects before mutation including `place`-from-rest and equal-zone `carryOff`; A11 independent maps and no input freeze/mutation; A12 three distinguishable cause kinds, no future/cross-prop/rejected causes.

### 2.6 Property-based tests
- Add `tests/pbt/*.test.ts` with fast-check: single custody, terminal consumption, new-instance replenishment, deterministic ordering, immutable rejection, causal ordering, own-key-safe dictionaries.
- Record seed and minimized counterexamples; make them reproducible.
- Acceptance: each property holds or reports a reproducible counterexample; determinism holds across repeated runs; input is never mutated or frozen by the engine.

### 2.7 Reports and safe edits
- Implement `src/domain/report.ts`: `presetReport`, `runnerReport`, `resetReport` derived from `Scenario`+`RunResult`. Reset is truthful per initial status: absent→available is a removal-from-show instruction (no invented initial location); any finally-consumed prop — including absent→replenish→consume — is a replace-with-new-ID instruction that does not vanish (never resurrection); unknown labeled uncertain.
- Implement `src/domain/edit.ts`: add/edit/reorder cues and actions (stable IDs); reference-guarded deletion of props/zones/holders (block-with-explanation or explicit atomic retarget).
- Add a report test for absent→replenish→consume→finally consumed asserting a replace-with-new-ID instruction is present (it does not vanish from the reset report).
- Acceptance: A17 reports match known initial/final state truthfully; the absent→replenish→consume reset case produces a replace-with-new-ID instruction; rejected actions are not reported as completed moves; deletion of a referenced entity is blocked or atomically retargeted with no dangling references (A18).

### 2.8 T2 verification
- Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Fix failures. Record exact commands, versions, exit codes, and any failing cases plus fixes.
- Acceptance: lint, typecheck, all unit/property tests, and the build pass; evidence recorded. Hand to Codex for independent model review before T3.

## T3 — UI, persistence, and integration

Owner: Kiro primary writer. Paths: `src/**`, `index.html`, `tests/e2e/**`, UI/browser test/config paths; any T2 fixes explicitly recorded. Base: T2 checkpoint (after Codex model review). Dependencies: T2.

### 3.1 App shell (replace stubs)
- Implement `src/ui/App.tsx` and `src/styles.css` **completely replacing** the T2 stubs. Layout: header (title, "planned state" label, save status, import/export), responsive three-region main (timeline / stage view / details+reports) that stacks on narrow screens. Wire `main.tsx`.
- Acceptance: app boots; responsive at 320/375 px and desktop; useful empty state (no scene / empty scene); no stub content remains.

### 3.2 Stage view (ghost vs solid)
- Implement `src/ui/StageView.tsx`: for the selected step, show ghost (required, translucent, "required" label) and solid (modeled pre-action, filled, "planned" label) with prop ID + name as text; mismatch text indicator (not color alone); post-action state labeled "after" and separate.
- Acceptance: ghost/solid are distinct with labels and IDs; color/animation never carry meaning alone; pre-action comparison is used; dense/long-label/overlapping props stay legible.

### 3.3 Timeline, editor, and causal links
- Implement `src/ui/Timeline.tsx` (ordered cues/actions, selection, reordering) and `src/ui/Editor.tsx` (props/zones/holders/cues/actions editing with reference-guarded delete). Causal links render only when meaningful: earlier-action → frame; initial-state → initial-state card; shape rejection → no link.
- Acceptance: editing/reordering/deleting refreshes stage view, warnings, reports, and selected position; IDs stay stable; playback updates predictably with no stale results; deletion is reference-guarded.

### 3.4 Reports, import/export, persistence (persistence/UI acceptance)
- Implement `src/ui/Reports.tsx` (preset/runner/reset print views), `src/ui/ImportExport.tsx` (JSON round trip, validate before replacing), and `src/persistence/store.ts` (localStorage save/load with recoverable errors).
- Acceptance (A16, A17): round trip preserves identity/order/requirements; invalid import retains current work; save failure shows no false "saved"; corrupt/unsupported/denied storage is recoverable without data loss; reports are static, ordered, labeled, printable.

### 3.5 Accessibility
- Implement `src/ui/a11y.tsx`: keyboard operability for all controls (reorder, navigate, editor, dialogs, import/export, causal links), visible focus, focus restoration, logical tab order, accessible names, associated field errors, reduced-motion static equivalent, screen-reader-readable list/table mirror, and non-flooding live announcements.
- Acceptance: all controls operable by keyboard; reduced motion gives a complete static equivalent; no flicker/jump scares/focus jumps.

### 3.6 E2E and build verification
- Add `tests/e2e/*.spec.ts` (Playwright): full workflow, ghost/solid visibility, causal navigation, edit/rerun, import/export round trip, persistence recovery, keyboard/focus, reduced motion, responsive/zoom, print, real error/empty states.
- Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. Fix failures. Record commands, versions, exit codes, failing cases, fixes, limitations.
- Acceptance: all checks pass; evidence recorded. Pair browser assertions with manual visual/keyboard inspection.

## T4 — Independent review and QA (Codex)

Owner: Codex reviewer/QA; fixes by Kiro. Read all implementation; write only QA evidence outside active writer scope. Base: T3 checkpoint. Dependencies: T3.

- Run `npm run check` and `npm run test:e2e`; record exact failures.
- Browser workflow, keyboard, responsive, reduced motion, storage-error and print checks.
- Record reviewed diff, secret scan, `git diff --check`, documented limitations and next action. No remote mutation.
- Acceptance: honest evidence; Kiro fixes connect to observed issues; no claimed check is marked passed before it runs.

## Notes

- All fixtures and demo scenes are owned, synthetic, and clearly labeled. Real run-sheets are not published without permission.
- Hand-calculated oracles are written independently of the engine under test; property tests record seeds and counterexamples.
- T2 stubs are intentionally minimal and must be completely replaced in T3; do not leave stub behavior in the final UI.
