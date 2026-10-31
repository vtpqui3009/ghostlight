# Ghostlight private ClaudeKit integration and repair handoff

Codex independent review, 2026-10-31 15:52 UTC. Application and repository test code were not edited. Kiro was not invoked. This is a bounded integration/diagnosis result, not an accepted domain milestone or completed app.

Reviewed draft: `7760205e0c464e746635b969ecaffcada0bdcd85` on `codex/ghostlight-domain-draft-20261031`. Accepted engine baseline: `d8a1a611cb9a704bc2052917dca8ad0fe1c5e25a`. The checks below ran on separate detached review worktrees before this documentation branch was created. Main and draft PR #1 were not changed.

## Private integration verified

- The selected new environment reported current observations and an enforced network policy containing the newly allowed download domain. The supported Library transfer completed here; local readable bytes were verified, rather than inferring success from the allowlist.
- Archive: `claudekit-private-engineer-v2.20.0-ghostlight-game-moba.zip`, 244,648 bytes; SHA256 `a014bf37238508d21acda60270b1faae646f0acbe96fa6b982a8baaf5acbbbc2`.
- All 143 entries in `SHA256SUMS` and all 140 payload entries in `MANIFEST.json` matched. Extraction rejected traversal/symlink entries. Original payload, attribution and compatibility/private-use notices remain unchanged outside Git.
- Private package: `/workspace/.private/claudekit-ghostlight/package/claudekit-private-engineer-v2.20.0`. Original host adapter: `/workspace/.private/claudekit-ghostlight/adapters/claudekit-ghostlight-review/SKILL.md`.
- The adapter is discoverable through local `.agents/skills/claudekit-ghostlight-review` links in `/workspace/ghostlight` and `/workspace/ghostlight-review`; Git exclusion was verified. No purchased source, archive, helper or adapter is tracked or included in this commit.
- Applied references: ClaudeKit code review (spec compliance/evidence gates), debugging (root-cause reproduction), and test execution/reporting. Other bundled design/React/web-testing references were not activated for this domain-only task. No new stack, dependencies, scripts, hooks or omitted helpers were installed from the kit.
- These paths belong to this selected environment. This does not claim installation in the separately retained authenticated Kiro container. A different consumer must materialize and verify the Library artifact in its own workspace; no authentication is transferred.

The prior private-transfer failure recorded in WORKFLOW.md and WIP_DOMAIN_CHECKPOINT.md is historical and superseded for this selected environment only. Other historical evidence remains unchanged.

## Fresh verification

Node `v24.19.0`, npm `11.9.0`, Vitest `1.6.1`, Vite `5.4.21`. Locked dependencies installed with `npm ci --no-audit --no-fund --cache /workspace/.private/claudekit-ghostlight/npm-cache`, exit 0. An initial install using npm's default cache failed with ENOENT outside the writable workspace; the explicit workspace cache resolved it without changing package manifests or versions. The baseline and draft have identical package/lock files and used the same installed dependencies.

| Source | Command/check | Actual outcome |
|---|---|---|
| Accepted baseline d8a1a61 | `npm run check` | Exit 0: lint, typecheck, **31/31 engine tests**, stub production build passed; test start 15:50:30 UTC. |
| Rejected draft 7760205 | `npm run lint` | Exit 1: **14 errors**, no warnings. |
| Rejected draft 7760205 | `npm run typecheck` | Exit 1: **38 diagnostics** (2 schema, 36 acceptance tests). |
| Rejected draft 7760205 | `npm test` | Exit 1: **76 passed / 7 failed / 83 total**; all 31 engine tests pass, acceptance 45/52; start 15:50:28 UTC. |
| Rejected draft 7760205 | External diagnostic probes, bundled with the installed esbuild and run with Node | Command exit 0 means the probe runner completed: **42 cases, 17 meet their oracle, 25 violate it**. These are diagnostic observations, not 42 passing repository tests. |
| Both source worktrees | `git diff --check` / tracked status | Clean before documentation. No application/test changes. |

Private command logs and the original probe source/output are under `/workspace/.private/claudekit-ghostlight/evidence/`: `baseline-check.log`, `draft-lint.log`, `draft-typecheck.log`, `draft-test.log`, `domain-probes.ts`, `domain-probes.json`, and `acceptance-review.md`. The probe bundle transpiles source for diagnosis; it does not bypass or establish TypeScript acceptance.

The seven failing suite cases are:

1. Sparse props rejects correctly, but the test requires the word `expected` instead of the actual path-specific sparse-entry message (`acceptance.test.ts:51`).
2. `__proto__`, `constructor`, and `prototype` are assigned to an undeclared root `scene.id`, so stripping that extra key correctly succeeds (three cases at lines 137–155).
3. The claimed six-zone fixture contains seven zones because it starts with L (line 212).
4. The ownership test reparses after changing a position to undeclared MUTATED and incorrectly expects success (line 322).
5. The no-op cue test calls CommonJS `require` in the ESM project (line 625).

These fixture/oracle failures must be corrected without weakening the parser. Fixing these seven cases alone will leave the real defects below uncovered.

## Reproduced defects and required repair oracles

Source line references are for draft 7760205. Kiro remains the implementation/test author. This handoff updates the older DOMAIN_REPAIR_BRIEF.md, whose 39/13 test counts and claims that both cue/action reorder protections are missing describe an earlier draft.

### P1: normalization reaches unvalidated required collections

`schema.ts:49–57` returns false for a non-array without adding an error; lines 78–88 replace nullish values with empty arrays for validation, while lines 175–179 map the original raw fields. The direct-object probes show own null/undefined/object holders, props and cues each throw. A missing/null/undefined/object cue.actions also throws. Root missing/inherited collections and malformed zones correctly reject in the sampled cases.

`schema.ts:138–140` validates only own cue actions but never requires their own presence; line 179 later copies raw actions. A cue inheriting an array containing `{id:'a', propId:'missing', kind:'bogus', requiredSource:null}` incorrectly returns success and copies the invalid action. This breaks the engine's validated-input precondition.

Acceptance for each required root collection and cue.actions: missing, inherited-only, own undefined/null/object/scalar, holes and inherited numeric entries must return `success:false`, a nonempty path-specific error list capped at 30, no throw and no mutation. Valid own empty holders/props/cues/actions remain allowed; zones require at least one. Normalize only validated own collections. Ordinary data objects/custom prototypes are in scope; arbitrary getters/Proxy behavior is not added here. Include otherwise-valid control fixtures so unrelated reference failures cannot hide the collection bug.

### P1: ordinary action edits and explicit removal have distinct failures

`edit.ts:418–424` always creates own destination and note. `schema.ts:155–158` rejects undefined values when those fields are own. Three separate runtime observations:

- Editing an otherwise valid moving action that has no note is blocked by the emitted `note:undefined`.
- Editing only the note of an already valid consume action with no destination is blocked by the emitted `destination:undefined`, even when an explicit string note isolates that path.
- Converting a valid carryOff action to consume with `{kind:'consume', destination:undefined}` keeps the previous destination because the update uses value comparison instead of property presence. With `note:''` to avoid the first defect, the edit succeeds structurally but replay rejects the consume as destination-forbidden.

Acceptance must cover all three separately: ordinary edits with omitted note succeed; empty note remains valid; actions legitimately lacking destination remain editable; an omitted destination update retains the old destination; explicit undefined removal removes the own destination key. A consume conversion with a matching source then applies and ends consumed. Assert reparse, authored source/ID preservation and unchanged input as well as replay. Do not relax parser handling of malformed/null position objects just to compensate for editor construction.

### P2: action reorder accepts invalid indexes and bypasses no-op validation

`edit.ts:478–483`: NaN and 0.5 moved a second action to index zero; a no-op returned success for a scene with title empty. Infinity, negative and length indexes rejected in the sample. Cue no-op correctly rejects an empty title; its integer guard at line 451 and parser normalization at line 456 are already implemented.

Acceptance for both APIs: NaN, fractions, positive/negative infinity, negative and length indexes block without mutating order. Invalid no-op scenes block. Valid no-ops strip extras, reparse, and own nested arrays/positions. Valid moves preserve stable IDs and authored requirements. Retain the existing cue fixes; change only remaining defects.

### P2: explicit empty ID changes silently succeed

Truthiness checks at `edit.ts:266`, `285`, `299`, `313`, `415` let all five update APIs accept `{id:''}` while retaining the old ID. All five were reproduced using valid fixtures; the action fixture includes note/destination to avoid masking the ID defect.

Acceptance: omitted and same IDs succeed; different nonempty and empty IDs block specifically as ID changes and leave all references/input unchanged. Require discriminating error assertions, not merely any blocked result. Successful edits must produce valid owned normalized data.

## Test repair gates that prevent a false green result

- The suite never calls updateAction. Add focused cases for every optional-field/edit defect above; passing current tests cannot demonstrate these repairs.
- Replace the permissive inherited-description test at line 91: make required fields own and only the optional description inherited; assert success and absence in output. Add analogous inherited optional note/destination controls. Make the inherited-holder case at line 106 actually inherit holderId:null while keeping status/zone own; require failure and retain explicit-own-null success as control.
- Put forbidden IDs into declared entity/action ID fields, with otherwise valid references. Keep root extra-key stripping and allowed `toString` behavior.
- Build exactly six/seven zones and assert fixture lengths. Start addZone at six, not seven, and do not pre-corrupt the duplicate-input fixture.
- Preserve the first normalized parse, mutate input, then mutate the normalized result to prove two-way nested ownership. A missing-reference scene must continue to fail.
- The current error-cap test creates 36 zones and exits early. Use a within-limit array of malformed props producing over 30 potential field errors, then assert the intended cap. Do not change collection limits.
- Declare holder A in the missing-prop test, so the error proves a missing prop rather than a separate bad holder reference.
- Use static ESM imports and explicit discriminant guards that throw on the wrong ParseResult/EditResult variant. Vitest expect alone does not narrow TypeScript. Remove unused declarations; do not weaken strict types/lint or delete meaningful assertions.

## Existing Kiro worker: resume and stopping boundary

Read this report before the older repair brief. Resume only after independently verifying current free entitlement/quota in the existing authenticated worker. The last historical value is 48.55/50 KIRO FREE; it was not rechecked here and is not a current balance. No Kiro model request, auth transfer, upgrade, purchase, paid allowance or billing change occurred.

Use a bounded repair of schema.ts, edit.ts and acceptance.test.ts first. Keep engine/report semantics and the React/Vite/TypeScript stack. Preserve the accepted baseline separately. Require targeted failing regressions, then lint/typecheck/full tests/build on the repaired exact commit, followed by independent review. No merge or formal approval follows from this report.

Not run in this review: draft production build (already blocked by typecheck), coverage measurement, browser/E2E, keyboard/accessibility, responsive/reflow, storage recovery, print, full A01–A18, or real-user validation. The UI remains the two-element compilation stub. Wider report copy/order/causal oracles, full retarget/deletion path coverage, 12/13 actions-per-cue boundary and meaningful multi-cue round trip remain explicit follow-up acceptance gaps; do not expand this bounded repair into those phases or call them verified.
