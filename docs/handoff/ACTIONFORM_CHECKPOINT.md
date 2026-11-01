# Ghostlight action editor checkpoint

Original Codex orchestration, independent review and QA evidence, 2026-11-01 02:44 UTC. Product code and committed tests were authored through official Kiro CLI 2.37.0, native `claude-sonnet-4.5`. This document is not a Kiro transcript or full product acceptance.

**Source checkpoint: `7a9e2a48fc27c926dc089e31e868c4c84dc9c70f`, branch `codex/ghostlight-domain-draft-20261031`. Runnable private WIP; one reproduced asynchronous import blocker remains.** The accepted engine sibling `d8a1a611cb9a704bc2052917dca8ad0fe1c5e25a`, reviewed domain code `3d1a7bb0f363ab9ce161a8eb098de08dbfd1fb59`, and main `1a2f9521111f0ba67a085474a441f26a61d709b9` are preserved. PR #1 still references the engine sibling, not this continuation.

## What this checkpoint contains

The 13-file coherent source closure includes the previously local nine-file UI draft, the reviewed storage-getter/test repair, the new `ActionForm` and production `actionFormHelpers`, and 44 helper tests. It is now possible to build and run the real React interface rather than the compilation stub. Existing packages, lockfile, configuration, domain source and domain tests were not changed in this phase.

The action editor supports all six kinds, independently authored source and destination, physical-instance IDs, stable edit IDs, Save/Cancel, persistent field errors, literal holder ID `null` distinct from resting null, add/edit/delete/reorder, and explicit destination/note clearing. It preserves authored replay mismatches. Drafts survive Stage/Reports navigation; hidden controls are excluded from keyboard traversal. Opening another action is blocked until Save/Cancel. Malformed imported consume/replenish actions expose controls needed for correction. The candidate scene's actual indented UTF-8 serialization is checked against 200,000 bytes before replacement.

A minimal App/Editor guard blocks ordinary imports while an action draft exists. **It does not yet close the asynchronous FileReader race below.** Existing scene/entity forms and other UI features are not declared complete by this checkpoint.

## Actual validation

Commands were run independently by Codex against the final stopped writer output, from the continuation checkout. All commands returned exit 0:

| Command | Final result |
|---|---|
| `npm test` | **222/222**: 31 engine, 134 domain acceptance, 13 persistence getter, 44 action-form helper tests |
| `npm run lint` | Pass |
| `npm run typecheck` | Strict TypeScript pass |
| `npm run build` | Vite production bundle built, 46 modules |

The final suite began at 02:38:52 UTC. Earlier in this phase 217 tests passed before regressions were added; the first new pretty-byte fixture failed because its actual 173,515 bytes did not exceed 200,000. A proposed invalid oversized-description shortcut was rejected before execution. Kiro corrected the valid 40-cue × 12-action fixture to use 100-character notes and added parser-success plus compact-under-limit preconditions. The final assertion tests the real indented-byte boundary. Several stale-text file patches failed without applying; the last exact test-only edit used a reviewed native shell script. Codex did not replace Kiro as application/test author.

Independent Chromium 154 / Playwright 1.62.1 probes used isolated synthetic scenes and loopback Vite only. Initial browser failures were preserved, then corrected and retested:

| Actual browser check | Outcome |
|---|---|
| Six legal action kinds, exact exported source/destination and physical IDs | Pass |
| Stable ID edit, intentionally mismatched authored source, unchanged Cancel | Pass |
| Reorder preserves IDs/fields; inline delete changes only its target | Pass |
| Literal holder string `null` versus resting null | Pass |
| Invalid draft retention and associated field errors; empty prop/holder choices | Pass |
| Stage/Reports draft retention and hidden controls excluded across 16 Tab presses per view | Pass |
| Target switch blocked until Cancel; edit legal action ID `new` opens fresh fields | Pass |
| Active cue/action deletion protection through visible controls | Pass |
| Malformed consume/replenish directly corrected; movement missing destination rejected without mutation | Pass |
| Keyboard Save/Cancel, 375-pixel reflow, reduced-motion preference | Focused checks pass; not full accessibility certification |
| Valid compact 141,987-byte scene whose indented output is 200,386 bytes | Save rejected with byte error; scene unchanged |
| Ordinary imports while draft exists in Editor/Stage/Reports | Rejected with clear message; scene/draft unchanged |
| Import after settled Save/Cancel | Pass; no stale form |
| Delayed FileReader completion after a draft opens | **FAIL — remaining blocker** |

No page errors or native dialogs occurred in the final focused cases. An earlier final-probe timeout waiting for an error banner to disappear is inconclusive; it did not inspect the post-Cancel export. The corrected probe checked actual scene content and passed without a retry. This is separate from the deterministically reproduced asynchronous failure.

No full screen-reader, contrast, 200%/400% zoom, 320-pixel, print, portable end-to-end suite, complete A01–A18 matrix, or real-user validation is claimed. Local ephemeral scripts/screenshots remain under private runtime review; sanitized results and reproduction instructions here are the durable evidence.

## Exact remaining blocker and next bounded repair

**Action:** complete a valid JSON file read in `src/ui/ImportExport.tsx` after a draft has opened. **Reason:** `FileReader.onload` captures the old `onImport` callback; its App closure still sees `editorHasDraft=false`. **Status:** reproduced product defect, not a network/permission denial or uncertain write.

Reproduction:

1. Load a scene with an action ID `shared` and no active draft.
2. Start importing a valid replacement scene that reuses the same cue/action IDs, but hold the FileReader completion callback.
3. Open/edit `shared` in the current scene; change its note and retain the draft.
4. Release the original file-read completion. The replacement scene is imported despite the active draft.
5. Save the retained old draft. Its old kind, physical prop, source, destination and note overwrite the imported action.

The final probe changed an imported collect/prop-collect action into the old transfer/prop-transfer draft with note `race retained draft`. No dialog/error prevented it.

Next Kiro scope: make the import replacement decision use **current draft state at completion/commit time**, not a stale render callback. Use a stable callback with current state or an equivalent latest-state reference; preserve parser ownership and the current scene/draft on rejection. Avoid replacing this race with silent draft reset or a global rewrite. Also verify a read started while editing can complete after explicit Save/Cancel using current state. Keep imports possible after deliberate draft resolution.

Acceptance: reproduce the delayed-read sequence with controlled FileReader completion; replacement must be rejected while a draft is active, both scene and draft unchanged. Confirm ordinary imports after Save/Cancel, failed-import retention, and the six-kind editor controls still pass. Add a meaningful regression through Kiro using supported project tooling, then run tests/lint/strict typecheck/build once after final edits. Do not accept the whole UI merely because those checks are green.

After this race, continue the existing canonical UI plan: recoverable storage and honest save state; derived replay selection, separate REQUIRED/BEFORE/AFTER and causal navigation/playback; remaining entity forms, duplicate demo, import read errors/abort/size checks, report/print and full accessibility/browser coverage. See [earlier UI review](UI_REPAIR_REVIEW.md) for concrete untouched defects and [START_HERE](../../START_HERE.md) for contracts and dependencies.

## Budget, provenance and recovery

Last actual native `/usage`: **KIRO FREE 44.65/50**, 2026-11-01 02:38 UTC, displayed reset 2026-12-01. About **5.35 covered credits** remain. Further inference is deliberately paused to preserve the 5-credit safety reserve; no new throttle/retry hint appeared during this phase. This is not a claim that the account is empty or the provider denied the repair. Verify actual fresh free capacity before another phase; do not purchase, upgrade, enable overage, alter billing, use paid allowance or switch inference backends. No guaranteed 24/7 execution or automatic resume is established.

Writer PTY12289 quit normally, exit 0. Browser processes closed after QA; the owned loopback development server was stopped. No active coding or production hosting is claimed. The user's game-moba pause remains in force; this worker did not verify intro or game-moba.

The 13-file source-only local archive `ACTIONFORM_FINAL_WIP_20261101.tar.gz` has SHA-256 `e3d357c9c8f40e25ccfe6b8c6b194e9c6e771aff897b7acc438c75ad358e88ec`, size 23,569 bytes, owner-only. The pre-phase archive remains separately preserved (`d334deebc4ba0206d23ca8a1bf74a2d741c7bfa29b3dca555fe69ef0e14daf91`). Neither contains auth state, raw transcripts, dependencies or licensed skills. Git source commits are the portable checkpoint; local archive paths are optional recovery aids, not a Library backup. Verify hash/member paths and extract to new scratch only.

A limited scan of the intended 13 repository files found no credential/private-key/token/ClaudeKit markers; imports resolve and domain/package/config scope is unchanged. This is a bounded publication check, not proof that arbitrary secrets cannot exist. ClaudeKit is still blocked/not installed, and no purchased contents were copied. All credentials and raw authenticated native logs remain outside Git.

## Copyable next-agent prompt

```text
Continue Ghostlight at WIP source 7a9e2a48fc27c926dc089e31e868c4c84dc9c70f on
codex/ghostlight-domain-draft-20261031. Read START_HERE.md and
docs/handoff/ACTIONFORM_CHECKPOINT.md plus canonical .kiro requirements/design/tasks.
Preserve accepted d8a1a61, reviewed domain 3d1a7bb, main and all archived evidence.
222 tests/lint/typecheck/build pass; focused action editor browser controls pass.
The delayed FileReader stale-callback import race remains reproduced and blocks
full UI acceptance. First verify actual FREE capacity; last 44.65/50 leaves 5.35
and inference was paused to preserve a 5-credit reserve. No active writer is running.
Use Kiro as sole primary app/test coder. Repair only latest-state import completion
validation, preserve scene+draft on rejection, test controlled delayed read and
ordinary Save/Cancel/import, then run all four gates and independent browser review.
No paid allowance/billing changes, alternate backend, raw credentials/proprietary
content, merge/deployment or 24/7 claim. Codex may orchestrate/review/QA. Continue
remaining canonical MVP work after this blocker; game-moba stays paused.
```
