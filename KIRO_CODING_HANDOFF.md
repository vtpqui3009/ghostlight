# Ghostlight: handoff for the first authentic Kiro coding pass

Prepared by **Codex**, 2026-10-31. This is preparation, not a Kiro transcript, implementation, or test result. All acceptance checks below are **NOT RUN**. Baseline: `1a2f9521111f0ba67a085474a441f26a61d709b9`.

## Scope and current state

Kiro is the primary author of the design, application, tests, and fixes. Codex prepares the environment, orchestrates the native CLI within approved permissions, and independently reviews and verifies results. Later build authorization supersedes the old validation-only execution gates in the research documents; their caveats about usefulness and differentiation remain valid.

Read `.kiro/specs/ghostlight/requirements.md`, `.kiro/steering/product.md`, `src/domain/types.ts`, `src/domain/schema.ts`, `GHOSTLIGHT_VALIDATION_PLAN.md`, and `WORKFLOW.md`. Preserve existing Codex provenance. At the inspected baseline, the scaffold has scripts and configuration but no dependencies/lockfile, replay engine, fixtures, tests, `App`, or styles. It is not runnable yet. This description records the baseline, not a claim about changes made by later Kiro passes.

Build a polished, local React/Vite/TypeScript MVP for checking physical-instance prop plans. Keep independently authored required position/holder separate from computed state. Provide ghost-versus-solid comparison, causal navigation, editable ordered cues, practical preset/runner/reset reports, validated JSON import/export, and recoverable local persistence. Label playback as a synthetic planned-state model; do not claim live tracking or real-user validation.

## Decisions Kiro must make before implementing the engine

The gaps and candidate semantics below are Codex preparation. Kiro must resolve and author the design; this table is not an implemented or Kiro-approved transition contract.

| Area | Existing behavior or gap | Required design decision |
|---|---|---|
| Action preconditions | Parser accepts `requiredSource: null` for every kind; destination is optional for every kind. | Define a transition table for all six kinds. Specify when source/destination must exist and when fields must be absent. Null must never silently bypass custody checks or be filled from replay. Structural parsing versus semantic replay rejection must be explicit. |
| Action meaning | `place`, `collect`, `transfer`, `carryOff`, `consume`, `replenish` are names without an engine contract. | Define holder changes and zone changes; in particular, carrying offstage must retain the physical instance and known custody if that is the chosen model. Reconcile older `handover/reset` terminology with `transfer/replenish`. |
| Consumption/replenishment | Consumption is terminal; props include predeclared absent instances. | Introduce a different absent instance through replenishment. Never revive a consumed ID; reject replenishing an already available or unknown instance. Document whether newly introduced instances are allocated in the editor before replay. |
| Uncertainty | Unknown starts have no position. | A transition requiring a known source must report uncertainty and leave state unchanged. Define any explicit way to resolve unknown state; never infer a clean state merely from a requested destination. |
| State representation | Types allow available state without position and unavailable state with position; import parsing only protects initial states. | Consider discriminated unions or equivalent invariant enforcement so computed available states always have a valid zone and explicit holder, and unknown/absent/consumed states never carry invented positions. |
| Trace semantics | `Issue.cause` is optional; only `lastChange` is modeled. | Define stable issue IDs, initial-state fallback, and the last relevant successful earlier action on the same instance. Use both cue and action order. Rejected actions must not become state-changing causes. |
| Reset reports | No report format exists. | Separate resetting the replay cursor/demo from physical reset instructions. Derive instructions from final versus initial planned state; consumed items need replacement with a different ID, not a return task that resurrects them. |
| Edits and references | Parser validates IDs/references; editor does not exist. | Recompute derived results on edits/reordering. Define deletion behavior that prevents dangling prop/zone/holder references and preserves unrelated work. |

## Acceptance matrix — all NOT RUN

Use small owned synthetic fixtures with stable IDs. Notation: `L/none` means a named left preset zone with `holderId: null`; `L/A` means holder A in that zone. These examples propose transition behavior for Kiro to formalize; no behavior is implemented by this document. Every invalid action must have `applied: false`, a useful error/uncertainty, and an unchanged before/after state.

| ID | Input / perturbation | Oracle |
|---|---|---|
| A01 valid control | `letter-A` starts `L/none`; collect to `L/A`, transfer to `L/B`, carry to `R/B`, place at `R/none`, each with explicitly matching source. | No issues; exactly four ordered applied frames; final state `R/none`; input untouched. |
| A02 missing handoff | From A01, omit transfer but retain B as required holder for carry. | Carry rejected; modeled holder remains A; cite collect as cause; required holder remains B. Subsequent actions are evaluated against the actual unchanged state. |
| A03 consumed reuse | Consume `seal-A`, then collect/transfer/consume it again; separately replenish initially absent `seal-B`. | A stays consumed. B becoming available cannot satisfy an action still referring to A. Retargeting to B with a valid source can pass. |
| A04 duplicate identity | Same name/kind for `letter-A` and `letter-B`; A moved away, B remains `L/none`. Collect B, then variant refers to A. | B succeeds independently; variant A fails. Matching names never merge IDs or redirect requirements. |
| A05 reordered cues | `key-A` starts `R/A`; carry to `L/A`, place at `L/none`, then B collects from `L/none`. Swap place and collect. | Ordered control passes. Swapped collect fails with cause carry; subsequent place succeeds. Keep authored requirements and stable action IDs unchanged. |
| A06 same-cue order | Put the place/collect pair in one cue, then reverse the actions. | Same ordering effect as A05; causal order uses action index, not only cue index. |
| A07 unknown start | Unknown initial instance, then collect requiring `L/none`. | Uncertainty, not a fabricated location or a clean pass; unknown state retained; initial-state explanation. |
| A08 absent/replenish | Initially absent B: collect before replenishment; replenish B with valid destination; collect B; replenish B again. | First collect rejected; first replenishment and matching collect succeed; second replenishment rejected. Consumed/unknown variants cannot be treated as absent. |
| A09 partial mismatch | Correct zone/wrong holder; correct holder/wrong zone; explicit `holderId: null` versus omitted holder. | Each mismatch is visible. Missing holder is structurally rejected. No false match from checking only one coordinate. |
| A10 null/illegal fields | Null source on each kind; omit destination for each kind; add forbidden destination to terminal operations; invalid holder changes. | Follow the authored transition table. Each disallowed case fails before mutation, with an actionable reason. No operation silently teleports an instance. |
| A11 immutable deterministic replay | Deep-freeze valid input; run repeatedly; attempt to modify one output snapshot; replay an invalid action followed by a valid one. | Input unchanged; repeated output structurally equal; past snapshots and unrelated props unaffected; rejection does not poison a later valid action. |
| A12 causal integrity | Interleave two props, include a rejected step and future moves; rename/reorder cues. | Every action cause refers to the same prop and a relevant earlier successful action; no future/cross-prop/rejected cause. Initial-state cause stays distinguishable. |
| A13 parser adversaries | Invalid JSON/version/types; duplicate IDs; missing references; unsafe IDs `__proto__`, `constructor`, `prototype`; extra imported keys and HTML-like labels. | Clear bounded validation errors; current scene retained on failure; extra keys stripped; labels rendered as text. Test allowed ID `toString` without inherited-object lookups. |
| A14 parser boundaries | Each collection at and above its limit; 64/65-character IDs; empty collections where allowed; JSON at/over 200,000 UTF-8 bytes using multibyte text. | Exactly documented boundaries; no crash. Empty scene has useful empty UI. Do not confuse byte count with string length. |
| A15 owned normalized copy | Parse a valid scene, mutate the original nested arrays/positions, then mutate the normalized result. | Mutations do not cross the boundary; no retained arbitrary/prototype-related keys. |
| A16 import/save recovery | Valid round trip; corrupt saved data; unsupported version; storage read/write denial or quota failure; invalid import while editing. | Round trip preserves IDs/order/requirements. Recoverable errors; no false “saved” state, silent replacement, or destruction of current work. |
| A17 practical reports | Generate reports for A01, A02, A03 and unknown starts. | Preset matches initial known positions; runner lists ordered requirements and warnings; reset reflects final state, replacement, and uncertainty. Rejected actions are never reported as completed moves. |
| A18 reference edits and state shapes | Delete referenced props/zones/holders; exercise every transition result; if supported, call `parseScenario` with sparse arrays or inherited fields. | Block deletion with references explained or perform an explicit atomic update. Computed states obey the state-shape contract. Define the direct-object parser input boundary separately from JSON input; do not claim unexecuted adversarial cases passed. |

For generated invariant tests, record seed and counterexample. Cover single custody, terminal consumption, new-instance replenishment, deterministic ordering, immutable rejection, and causal ordering. Use hand-calculated examples as independent oracles; do not derive expectations by calling the engine under test.

## UI and accessibility QA — all NOT RUN

Pair browser assertions with manual visual/keyboard inspection.

- Follow the complete workflow: load demo, replay, inspect mismatch, follow cause, edit the requirement or add the missing transfer, rerun, export and reopen.
- Required translucent ghost and modeled solid prop remain distinct with labels, physical instance IDs, and icons/text; color or animation alone never carries meaning. Use pre-action state for the requirement comparison and label any post-action state separately.
- Editing/reordering/deleting actions refreshes warnings, stage view, reports, and selected timeline position; playback pauses or updates predictably without stale results.
- Operate all controls with keyboard, including cue reordering through buttons, timeline navigation, editor, dialogs, import/export, and causal links. Check visible focus, focus restoration, logical order, accessible names, and associated field errors.
- Reduced-motion preference gives a complete static equivalent; pause/step remains available. Avoid flicker, jump scares, and unexpectedly moving focus.
- Check contrast, zoom/reflow at 200% and 400%, representative 320/375-pixel mobile and desktop widths, long labels, dense scenes, empty scenes, and overlapping props. Essential actions and explanations remain reachable.
- Review live announcements: warn when results change without flooding announcements during playback. A screen-reader-readable list/table contains equivalent state and causal information.
- Check preset/runner/reset print views for labels, stable ordering, page breaks, warnings, and consumption replacement. Do not rely on background color to make a report understandable.

## Coding and evidence checkpoints

1. After approved setup, Kiro reviews this handoff and authors/revises requirements, design, and tasks with honest provenance. Resolve the transition table before core implementation.
2. Kiro establishes dependencies/lockfile, implements parser/engine/fixtures and meaningful tests, then runs checks. Codex independently reviews semantics and counterexamples before UI integration.
3. Kiro builds the editable UI, persistence and reports, then fixes failures from lint, typecheck, unit/property tests, production build, browser interaction, accessibility, and responsive review.
4. Record actual commands, versions, exit codes, failing cases, fixes and limitations in QA evidence. Keep raw authenticated session state outside the repo; review transcripts for sensitive data before adding any excerpts. Do not relabel this document as Kiro-authored.

The user approved official CLI installation and Builder ID device login with session persistence outside the repository, without purchases or paid add-ons. Actual installation and authentication status belongs in the current runtime readiness record; this handoff contains no approval codes, authentication URLs, credentials, or inferred success. Start coding only after the native authenticated session works. Credit-request submission does not demonstrate a credit grant or headless API eligibility. No publishing, pushing, deployment, visibility changes, submission, or unrelated project access is authorized by this handoff.
