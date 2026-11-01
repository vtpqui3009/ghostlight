# Ghostlight UI repair and blocked-writer handoff

> **Current status supersedes this historical checkpoint:** [Action-editor WIP and remaining asynchronous import blocker](ACTIONFORM_CHECKPOINT.md), 2026-11-01 02:44 UTC. Source `7a9e2a4` builds; 222 tests/lint/typecheck/build pass. The old missing-form/unused-symbol failures below are resolved. Remaining untouched UI defects still apply. No active Kiro writer; FREE44.65/50, reserve pause.

> **Later evidence, 2026-11-01 02:06 UTC:** two separately authorized post-cooldown requests responded without a new throttle hint. The scoped getter/test repair passes focused tests, strict TS and lint. Full tests pass 178/178, but full lint/typecheck/build retain 16 existing UI errors. Read [the latest verification checkpoint](POST_COOLDOWN_GETTER_REVIEW.md) first; the older status below is historical, not an instruction to repeat the prior recovery attempt.

Original **Codex** review, 2026-11-01 00:58 UTC; diagnosis updated 01:07 UTC. Kiro authored the initial UI draft; Codex independently inspected it and ran the limited probes below. No Codex application/test implementation is substituted for the requested Kiro authoring.

**Product work is paused by native service rate throttling. The local UI draft is unaccepted, uncommitted and unpushed.** This is not a completed product or a voluntary stop after documentation. Preserve the working files; resume implementation only after the bounded native-responsiveness and FREE-entitlement gate below is met.

## Preserved checkpoints and exact scope

- Reviewed domain code: `3d1a7bb0f363ab9ce161a8eb098de08dbfd1fb59`; **165 existing tests, lint, typecheck and stub build passed**. See [domain QA evidence](../qa/NOV01_DOMAIN_REPAIR.md).
- Original handoff documentation: `eda5ca5a463913eaea40eee800e417bc4baf48ce`, committed/pushed with remote identity verified. PR #1's body links the continuation; its head remains the accepted engine baseline `d8a1a611cb9a704bc2052917dca8ad0fe1c5e25a`. Main is preserved.
- The later initial UI exists **only locally** in `/workspace/ghostlight-domain-draft`: `src/App.tsx`, `src/styles.css`, `src/fixtures/demos.ts`, `src/persistence/store.ts`, and `src/ui/Timeline.tsx`, `StageView.tsx`, `Editor.tsx`, `ImportExport.tsx`, `Reports.tsx`. These nine files are not part of a reviewed UI commit. The attempted later Editor/ActionForm repairs produced no file changes.

The initial UI's independent four-check result was: **165 existing tests passed; lint failed with 16 unused-symbol errors; typecheck failed with 16 unused-symbol diagnostics; build failed on those 16 diagnostics.** No new UI test acceptance is established. Do not remove planned functionality merely to silence unused imports and call this a finished UI.

## Why the native writer is paused

After producing the initial draft, the official native Sonnet 4.5 session received an Editor repair request. It produced no output or tool activity for over five minutes. A narrower ActionForm request likewise produced none for over two minutes. Both were cancelled without file changes and that client was closed. A fresh official native Auto session then received the ActionForm request; again there was no output/tool activity for over three minutes. It was cancelled and closed. **No ActionForm write was performed.**

**The earlier terminal-only cause assessment is superseded by non-inference log review.** Logs show HTTP 429 `ThrottlingException`, reason `CREDIT_CONSUMPTION_RATE_EXCEEDED`, a one-hour retry hint and five-minute CLI backoff. See [sanitized evidence and recovery gate](KIRO_THROTTLE_DIAGNOSTIC.md), including the distinction between the detailed title-helper error and authoring retry hints. Monthly quota exhaustion, a general outage, firewall cause or approval rejection is not established. All native writers and the read-only usage observer exited normally. Last verified native usage was **KIRO FREE 25.35/50 used at 2026-11-01 01:06 UTC**, displayed reset **2026-12-01**. No upgrade, purchase, overage, billing change or paid allowance was enabled.

Cleanup was confirmed: native sessions 81795, 10788, 77056 and usage observer 2251 exited 0. The Vite npm session exited 130, its remaining owned process was terminated, and port 5173 had no listener. No writer or preview server is claimed active; no background product coding is continuing. The accepted primary worktree was rechecked clean at `d8a1a61`.

Inference is paused. Do not submit more blind retries, cycle models repeatedly, switch inference backends, or take over product implementation with Codex. Respect the latest retry hint: no inference before **01:52 UTC on November 1**, with no guarantee that throttling ends then. Before resumption, verify current FREE entitlement and establish official native responsiveness through a bounded recovery check with a clear deadline and observable response. A working read-only usage panel alone does not prove that an authoring request will respond. If responsiveness is still unestablished, retain this blocker and checkpoint; do not start a new coding loop. After recovery, use one writer and one small, explicit implementation scope at a time.

## Executed evidence: limited probes, not broad acceptance

### Persistence probe

Codex compiled the stable types/schema and draft store into `/tmp/ghostlight-storage-probe` using installed TypeScript with strict checking, ES2022 and CommonJS, with no repository output. A separate Node process used synthetic adapters, not real user storage:

| Input | Actual result |
|---|---|
| Global `localStorage` getter throws `SecurityError` | All three tested default-storage calls threw outside recovery. |
| Save a scene with empty title | Returned success, performed one write, and failed reload validation. |
| Structurally valid 40-cue × 12-action scene with 500-character notes | Saved **349,193 UTF-8 bytes** and returned success; reload rejected the payload against the **200,000-byte** limit. |
| `DOMException('Storage full', 'QuotaExceededError')` | Misclassified as `storage-denied`. |

### Actual desktop browser inspection

Tools: **Chromium 154**, **Playwright 1.62.1**, viewport **1440×1000**, initial local UI draft. These were targeted failing observations:

- In Valid Control, selecting collect displayed `MATCH`, but not the separate **REQUIRED / BEFORE / AFTER** labels and comparisons.
- The demo selector disappeared after a scene was loaded. Editor → Cues exposed **zero Add Action buttons and zero select controls**. Source inspection and browser inspection found no playback, previous/next or cursor-reset controls.
- A denied global `localStorage` getter produced a blank app, **zero buttons**, and **three “Access blocked” page errors**.
- With saved data `'{broken'`, Start Fresh left the stored bytes unchanged. After reload, **“Storage Error:” returned**. An earlier probe reported `errorReturns: false` because it searched the wrong text; that result was invalid. A corrected focused rerun matched the actual “Storage Error:” label and confirmed `true`.
- The UI incorrectly displayed **Saved** in no-scene and corrupt-data states.

A screenshot is retained privately as `review/browser-initial/valid-control.png`; it is not a remote artifact or proof of other workflows. Broad responsive, keyboard, print, reduced-motion, accessibility and end-to-end acceptance were **not performed**. Keep the [browser QA plan](BROWSER_QA_PLAN.md) as the full remaining oracle list.

## Static findings to carry into the next Kiro scopes

These findings are static review unless corroborated by the executed evidence above:

1. **Persistence boundary:** default `storage=localStorage` is resolved before the protected body. Acquire it inside error handling while retaining injectable adapters. Validate and normalize scene data and the actual serialized UTF-8 size before any write; a successful save/export must reload through the parser. Classify quota failures by error name, not only message text. Retain prior data on validation or write failure.
2. **Usable recovery:** denied storage must leave an in-memory start/import/edit/export/retry route. Start Fresh must actually create a valid empty scene and describe whether stored corruption was retained, removed or replaced. Keep corrupt bytes available for export until an explicit storage operation succeeds; do not silently overwrite them. Saved/dirty/error status must reflect actual state.
3. **Persistent entry points and drafts:** demo/new/import actions must remain available after loading and on first launch. Protect dirty scene/form work during replacement and view changes; failed imports retain it. Use explicit inline choices, not native prompt/confirm dialogs for core workflows.
4. **Real editing:** the initial Editor lists/reorders but lacks action add/edit/delete, action-kind/source/destination controls, rename and prop-initial-state editing. Build labeled inline forms with Save/Cancel, stable IDs, all six action kinds, explicit holder-null and nullable-source handling, validation beside fields and persistent errors. Use domain edit helpers and normalized valid scenes; do not infer requirements from computed replay.
5. **State and playback:** replay and scenario currently update separately, and index-only selection can silently point at a different action after reordering. Derive them consistently; retain selection by stable action ID or explicitly reset it. Add play/pause, previous/next and cursor reset; pause on edits/scene replacement. Cursor reset must not claim to physically reset props.
6. **Comparison and cause:** StageView hides role distinctions behind MATCH/MISMATCH and lacks AFTER. Always show authored REQUIRED and computed BEFORE distinctly, with physical ID, zone and holder; label AFTER separately, including absent/consumed/unknown and null-source cases. Turn actual action causes into navigation to the correct revealed frame and initial causes into accessible initial-declaration navigation; do not invent causes.
7. **Wrong-duplicate demo:** current same-name duplicate example is a valid control. Add a real perturbation: move A away, leave B at the source; a B collect passes, while the otherwise same action naming A fails with the relevant earlier A cause. Matching display names never substitute identities.
8. **Import/export errors:** add file-size precheck, FileReader error/abort handling and persistent associated error messages. Eight-second disappearing errors are insufficient. Check the actual JSON byte boundary, retain current scene/drafts on failure, and disable export truthfully when no scene exists.
9. **Accessible navigation and print:** active views need accessible state; load errors need restrained announcements; do not announce every autoplay frame. Timeline tree roles lack the required keyboard pattern; use semantic disclosures/lists/action buttons or implement the complete pattern. Runner reports need visible cue/action/physical IDs. Print severity text must remain dark and legible when backgrounds are disabled; CSS keys and color alone are not labels.

## Ordered repair plan and acceptance gates

| Order / dependency | Narrow implementation target | Required evidence before moving on |
|---|---|---|
| 0. External writer gate | Respect [cooldown gate](KIRO_THROTTLE_DIAGNOSTIC.md), then current official native responsiveness and FREE allowance; no duplicate writer | Explicit bounded response/recovery evidence. If none, stop inference and retain the blocker rather than another blind attempt. |
| 1. Depends on 0 | First a real action form and integration; then the remaining scene/entity/cue forms | Add/edit/delete a physical action using independently entered kind/source/destination, preserve stable IDs, show field errors, keep draft on failed save and support Save/Cancel without native dialogs. A request must produce an inspectable implementation, not another plan. |
| 2. Depends on 1 | Storage/App recovery, consistent selection, REQUIRED/BEFORE/AFTER, playback and cause links | The four storage probes above pass; denied getter still yields usable UI; corrupt bytes survive until explicit successful recovery; no false Saved. Editing/reorder pauses playback, preserves or resets the right selection, and causes navigate to the real source. |
| 3. Depends on 2 | Owned demos, import/export, report IDs and accessible/print behavior | Wrong-duplicate failure plus valid control; round-trip identity/order/requirements; file-read/size/parse failures retain work; persistent accessible errors and dark print warning text. |
| 4. Depends on working paths | Portable focused UI/persistence tests, then actual browser QA | Run the four project checks separately, then the relevant [browser oracles](BROWSER_QA_PLAN.md). Exercise the reproduced failures first, followed by keyboard, small screens/zoom, reduced motion and reports/print. Record methods and unperformed checks. |
| 5. Depends on review and checks | Separate UI source and original-evidence checkpoints | Review exact diffs, preserve Kiro authorship, record code SHA and real results. Do not promote the local draft or its archive to accepted status because domain tests still pass. |

After a stopped writer, run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` separately and record each exit/result. Do not rerun unchanged broad checks during a blocked response. Do not reopen completed domain repairs absent a concrete regression. No full T2, property-test, complete A01–A18 or product acceptance is implied by the bounded domain checkpoint.

## Optional local source recovery

The checkpoint owner preserved a **local-only** archive:

```text
/workspace/.ghostlight-kiro-runtime/review/UI_DRAFT_20261101.tar.gz
SHA-256 011ad468e4e68fab22f225ce4cba44d807ca1caa38010c75d780513c23ca438c
```

Its recorded contents are only the nine UI source files above and three directories: no authentication state, node_modules, Git metadata or ClaudeKit content. Recorded archive mode is **0600**, size **14,223 bytes**. A limited credential-pattern scan of the nine source files found zero matches; this is not an exhaustive security guarantee. It is an optional recovery aid, not a remote/published artifact. If present, verify its hash and inspect the member list before extracting into a **new separate scratch directory**; compare with current working files before any deliberate restoration. Never extract over a working tree or reset it to make the archive fit. If absent, recover reviewed domain code `3d1a7bb` through authorized repository access and have Kiro rebuild the UI from the canonical requirements, [UI direction](UI_DIRECTION.md) and this failure record. No credentials or purchased content are needed for that handoff.

## Copyable continuation request

```text
Continue Ghostlight only after resolving the documented official native-writer response
blocker. Read START_HERE.md and docs/handoff/UI_REPAIR_REVIEW.md. Preserve reviewed code
3d1a7bb0f363ab9ce161a8eb098de08dbfd1fb59, the separate accepted d8a1a61 engine tree, main,
and all existing local UI changes. Inspect the current state before restoring anything.

Inference is paused: read docs/handoff/KIRO_THROTTLE_DIAGNOSTIC.md and respect the
service cooldown gate first. Then verify FREE entitlement and establish official native
responsiveness with a bounded recovery check. Do not loop blindly, switch backends,
buy allowance or replace Kiro application authorship with Codex. Once responsive,
use one Kiro writer and one small scope: real action/other forms, then storage/App
recovery and comparison/playback/cause wiring, then demos/import/report accessibility,
then portable tests and actual browser QA. Use the exact failing oracles in the review.

After each stopped scope record full tests, lint, typecheck and build independently;
preserve failure evidence and source identity. The 165 existing passing tests are domain
coverage, not UI acceptance. Do not commit/push the unaccepted UI accidentally with docs.
Keep tokens, raw authenticated transcripts and ClaudeKit content out of Git. game-moba is
paused. No merge, deployment, paid usage or continuous-24/7 guarantee is authorized.
Report the concrete recovery outcome or unresolved blocker, accepted checkpoint and next task.
```
