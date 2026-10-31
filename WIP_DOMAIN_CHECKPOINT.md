# Ghostlight domain draft — NOT ACCEPTED

Prepared by Codex, 2026-10-31 14:26 UTC. This document reports actual native Kiro work and independent QA. It is not application implementation or a claim of completed MVP.

## Safe and draft checkpoints

The accepted WIP remains `d8a1a611cb9a704bc2052917dca8ad0fe1c5e25a` on `codex/ghostlight-kiro-cloud-wip-20261031`, draft PR #1. It passed lint, typecheck, 31 engine tests and the compilation-stub build at 13:28 UTC. The application interface is still a stub. Main remains `1a2f9521111f0ba67a085474a441f26a61d709b9`.

This separate `codex/ghostlight-domain-draft-20261031` snapshot preserves later unaccepted Kiro changes to schema/types/edit/report and a 52-test acceptance file. Its ancestor `e3879beb9dd1075c31ca8f2c8aec8015d6bb6812` preserved an earlier failing draft. Do not merge or deploy this branch as a working product.

## Actual authorship and attempts

- Native Kiro CLI 2.37.0, minimax-m2.5, fixed the earlier 22 compiler errors in report/edit/types. Native lint/typecheck and the original 31 tests passed before the new acceptance test file was added.
- Kiro wrote `tests/domain/acceptance.test.ts` (672 lines). Its first actual run at 14:11 UTC had 39 passes and 13 failures. Independent review found both real parser defects and incorrect test fixtures/oracles; these were not treated as reasons to weaken the contract.
- A fresh bounded native MiniMax context then partially hardened schema and cue reordering. Independent review caught regressions; corrections were sent back to Kiro. No Codex application/test logic was substituted. Codex subsequently removed trailing spaces from three blank schema lines solely to pass the checkpoint whitespace check; no logic changed.
- Inference was paused at freshly reported estimated **KIRO FREE 48.29/50**, reset date 2026-11-01. The remaining estimate was 1.71, not a claim of exhausted quota. The remaining multi-step fixes/UI phase could not be safely bounded within that balance. No upgrade, purchase, paid allowance, overage enablement or billing change occurred. Recheck entitlement and available free quota before resuming any model request.
- All native writers and the read-only usage observer exited normally. Raw native transcripts/auth runtime stay outside Git. The last proposed removal of the unused schema array helper and the earlier moveAction fix were cancelled before execution; do not assume they applied.

## Independent checks on this exact source draft

Run at 14:24 UTC, after all writers stopped:

| Command | Actual outcome |
|---|---|
| `npm run lint` | Exit 1: 14 errors (unused schema helper; acceptance-test unused declarations and forbidden require). |
| `npm run typecheck` | Exit 1: 38 diagnostics (2 in schema; 36 in acceptance tests). |
| `npm test` | Exit 1: 83 total, **76 passed / 7 failed**. All 31 engine tests passed; acceptance suite 45 passed / 7 failed. |
| Production build / browser QA | NOT RUN for this failing draft; typecheck already blocks build. Full UI does not exist. |

The seven test failures currently comprise a brittle sparse-error wording assertion, three forbidden-ID fixtures incorrectly assigning an extra scene.id, a six-zone fixture that actually creates seven zones, a copy-ownership test that reparses an undeclared mutated zone, and a CommonJS require import failure. Fix these oracles; preserve correct parser rejection behavior. Passing 76 tests does not establish complete domain acceptance.

## Remaining concrete defects

1. **Malformed required collections can throw.** Own holders/props/cues set to null, undefined or an object reach unchecked normalization. Missing/null/object cue.actions also throws. Every required collection needs own presence, array validation and bounded failure; normalize only validated data.
2. **Inherited cue actions bypass validation.** A cue inheriting an action with a missing prop and bogus kind currently parses successfully and copies it. Require own actions and validate before copying.
3. **Ordinary action edits can fail without notes.** updateAction creates own note:undefined while schema now rejects it. Restore consistent omitted/undefined optional-field handling.
4. **Explicit destination clearing remains broken.** Updating to consume with destination:undefined retains the previous destination and causes destination-forbidden replay. Distinguish omitted update from explicit removal.
5. **Action reorder fixes remain unapplied.** NaN and fractional indexes can reorder; a no-op can bypass parser validation. Cue reordering now checks integer indexes and validates no-op scenes, but action reordering still needs the equivalent contract.
6. **Explicit empty-ID changes are silently accepted** by updateProp/Zone/Holder/Cue/Action. Reject any supplied ID different from the stable existing ID.
7. **Compiler/test cleanup remains.** Remove the unused schema array helper; properly narrow optional destination when copying; correct test fixtures, ESM imports and discriminated-union guards without weakening compiler/lint rules or deleting meaningful checks.

Independent isolated probes did confirm partial progress: sparse arrays/inherited numeric entries reject; inherited description/destination are ignored; inherited position fields and missing requiredSource reject; cue reorder validates indexes and no-op scenes. Report probes from the earlier pass confirmed scenario order, full copied causes, terminal consumed replacement and initially-absent removal behavior. These observations do not override the defects above.

## Resume scope

Kiro remains primary code/spec/test author; Codex owns orchestration, independent QA and checkpoints. Resume only with freshly verified free quota or verified awarded promotional credits. No new purchase/upgrade/paid allowance. Use a bounded capable native model for a narrow repair; avoid repeating unchanged compiler loops. Current private runtime holds a detailed original review brief and exact diagnostics.

After domain repairs pass independent review, build the real editable Halloween interface, ghost-required versus modeled-before comparison, ordered timeline/causal navigation, synthetic demos, practical reports, validated import/export and recoverable persistence. Then run actual browser, keyboard, reduced-motion, responsive/reflow and print QA. No live-tracking or real-user-validation claim.

Chromium 154 and runtime Playwright 1.62 were verified locally; ten concrete browser oracles were prepared outside the repo, all NOT RUN. Private ClaudeKit Library materialization remains blocked after two supported download failures; no archive/skills were installed or applied here. Do not upload licensed material or raw auth transcripts.
