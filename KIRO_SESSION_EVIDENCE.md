# Actual Kiro work and independent review

Recorded by **Codex**, 2026-10-31. This file summarizes observed native Kiro activity. It is not a reconstructed Kiro transcript. Raw session output stays in the private runtime directory outside Git; only nonsecret observations and short output excerpts appear here. Later sections distinguish historical NOT RUN checks from actual T2 results.

## Environment and authorship

- Baseline: `1a2f9521111f0ba67a085474a441f26a61d709b9`.
- Official Kiro CLI 2.37.0 installed and SHA-256 verified; native Builder ID login completed and native `whoami` reported BuilderId/us-east-1. No account identifiers or credentials are preserved in project evidence.
- Native T1 command: `kiro-cli chat --v3 --mode spec --trust-tools=` with the private runtime selectors documented in `CLOUD_KIRO_READINESS.md`. PTY: 59890. Workspace configuration was reviewed before accepting workspace trust. No trust-all or broad permission rules were used.
- Kiro read the existing project/source/research documents, authored requirements, design, implementation tasks, technical steering, and a local command hook. Codex supplied scope, independent acceptance examples, review findings, and verification; Codex did not write application implementation.
- Kiro preserved the earlier Codex requirements as historical provenance and kept the original Codex product steering.

## Free-only entitlement

The user requires free quota only: no upgrades, purchases, add-ons, overages, billing changes, or paid allowance. On arrival of that instruction, the initial Kiro turn was cancelled and native `/usage` was checked before inference resumed. It reported KIRO FREE, 0.33/50 credits. A later native `/usage` check reported an estimated 15.83/50 credits, reset 2026-11-01. Usage displays are estimates and are recorded as observations, not guaranteed final accounting. Check again between milestones; stop if entitlement is unknown or free quota is exhausted.

## Independent T1 review and Kiro fixes

The independent reviewer first held implementation for concrete contract issues. Kiro revised the specifications to address them:

- Explicit source-holder and zone rules, including `place` and equal-zone `carryOff` rejection.
- Unknown recovery only through correcting the initial declaration; no impossible earlier-action recovery.
- Distinct no-state-cause, initial-state, and earlier-action causes; issue IDs independent of frame order.
- Independent initial/final/frame maps, nested trace values and action payloads; no freezing or mutating caller-owned input.
- Own-key-safe state/cause lookup and a bounded direct-object parser contract; replay expects structurally validated input.
- Truthful reset handling for initially absent instances that become available or are replenished and consumed.
- Separate T2 model/parser/report/edit acceptance from T3 persistence and UI acceptance; each uses its appropriate independent oracle.
- Offline scope limited to local computation after assets load; cold offline reopening is not claimed.

After re-reading the revised requirements, design, tasks, and technical steering, the independent reviewer returned **GO for T2 domain implementation**. This is specification review, not application test evidence.

## Hook checks actually performed

The first hook draft lacked a required name and used a file glob where the supplied official schema required a regular expression. Codex flagged these; Kiro corrected the JSON to include a name, a relative/absolute domain-path regex, and a 30-second timeout. Kiro wrote the referenced report-only shell script. It has no agent prompt and no billing action.

- Native Kiro ran JSON parsing, regex sample checks, `bash -n .kiro/hooks/typecheck-domain.sh`, and a manual invocation.
- Observed output included `JSON OK`, `bash -n OK`, and matching/excluded path samples.
- Manual invocation printed `NOT RUN — dependencies not installed`. This verifies honest skip behavior; it is **not** a passing TypeScript/application check.
- Codex independently parsed the JSON, checked relative/absolute domain matches and exclusion of a UI path, ran shell syntax validation, and observed the same dependency skip. Commands exited 0.
- Native automatic hook discovery/trigger execution remains **NOT VERIFIED** and must be demonstrated during T2. A manually invoked script is not evidence of a native trigger.

## Access limitations and pending work

- Native documentation fetches returned HTTP 403. Further native lookup was stopped; no network policy was changed. Hook schema guidance came from official documentation already supplied by the orchestrator. No bypass or third-party inference routing was added.
- Private ClaudeKit materialization failed twice in the supported Library flow. No archive was obtained or extracted here; no ClaudeKit-assisted workflow is claimed. Details remain outside the repo.
- As of 2026-10-31T12:44:25Z, `git diff --check` passed; tracked application files were unchanged. A targeted scan found no device-approval URL, token-field values, or AWS access-key pattern in project files. This is a bounded check, not a complete secret-audit guarantee.
- Engine, tests, dependencies, UI, persistence, reports, production build, browser QA, and final review still require implementation/verification. No push, merge, deployment, submission, visibility change, purchase, or paid-service enablement occurred.

## T1 handoff checkpoint

At the transition to implementation, native `/usage` reported KIRO FREE, estimated **19.26/50** credits, reset 2026-11-01. Native T1 exited normally (PTY 59890 exit 0). The final minimal spec-heading fixes were applied, but final native spec-format revalidation and automatic hook triggering are deferred; no passing result is claimed for them. Independent semantic review is complete. Prioritize a runnable engine/test slice next.

## T2 implementation in progress — 2026-10-31T13:12Z

The first Auto implementation turn produced no application files after approximately nine minutes of generation. It was cancelled and exited normally before starting the next writer. Native read-only `/usage` reported KIRO FREE, estimated **20.78/50**, reset 2026-11-01. The native model catalog listed Haiku 4.5 at a 0.4 credit multiplier; the next native CLI session uses that model, with no external inference route.

Native writer PTY 44795 uses CLI 2.37.0, `--v3 --mode default --model claude-haiku-4.5 --trust-tools=`. Individual scoped tool actions are reviewed. Kiro authored `src/domain/engine.ts`, `src/domain/ids.ts`, revised domain types, a minimal App/styles/bootstrap, package dependencies/lockfile, and `tests/domain/engine.test.ts`. Codex has not authored application implementation. npm uses `/tmp/ghostlight-npm-cache`.

- Initial dependency installation failed with ERESOLVE. Compatible ESLint/TypeScript ESLint dependencies were revised and installation subsequently added 231 packages. No force/legacy-peer-deps installation was executed. npm reported the selected ESLint 9 version unsupported; dependency modernization remains pending.
- Independent `npm run typecheck` exited 1 with 11 errors in the first engine draft. Kiro is fixing the strict typing and unused values.
- Native `npm test` at 13:10:43 UTC: **22 passed, 1 failed, 23 total**, exit 1. The cause-isolation fixture initially generated no issue.
- Native `npm test` at 13:11:23 UTC: **22 passed, 1 failed, 23 total**, exit 1. The revised fixture exposed an invalid test oracle that mutated and compared the very same object.
- Independent review identified shallow state copies, shared issue causes, and a missing empty-note copy. Kiro revised these; reviewer probes confirm independent state maps, separate rejection causes, retained empty notes, and correct unknown-replenishment severity. An aggregate/frame issue alias and weak ordering/causality test assertions remain and have been sent to Kiro for concrete fixes.
- Test labels in the initial draft do not map to the approved A01–A18 matrix. No claim is made that the complete matrix passes. Parser boundary/recovery, reports, editor, full UI, browser QA and final acceptance remain pending.

This is an in-progress failure checkpoint, not a completed product or green build. The latest account quota observation is 20.78/50; native per-turn estimates have increased since then, so `/usage` must be checked again before the next phase. No billing change or remote publication occurred.

## Engine repair checkpoint — 2026-10-31T13:28Z

Haiku writer PTY 44795 subsequently reached 30 passing tests but still had 17 TypeScript and 18 ESLint errors in the independent 13:16 UTC check. After repeated ineffective targeting of unused parameters, the turn was stopped and exited normally. Native `/usage` then reported KIRO FREE **24.73/50**.

A fresh native Kiro Sonnet 4.5 repair session (PTY 66744) fixed the actual strict errors, retained checks rather than disabling them, added an asserted available-state helper, and strengthened snapshot/causality/order tests. A session-only exact-file write rule was granted for `tests/domain/engine.test.ts`; no entire-tool or folder trust rule was granted. Other scoped writes and shell commands remained individually reviewed.

The new issue-ID reorder fixture first failed because its intended rejection was actually a valid transfer (13:26:33 UTC: 30 passed, 1 failed). Kiro corrected the authored fixture, then native `npm run check` passed. The session exited normally. Native `/usage` reported KIRO FREE **33.22/50**, resetting 2026-11-01.

With the writer stopped, Codex independently ran `npm run check && git diff --check` at 13:28 UTC: **exit 0**; lint PASS, typecheck PASS, **31/31 tests PASS**, and Vite stub production build PASS. The browser is still only a stub, not the requested editable product. Remaining parser/report/editor/property/browser coverage is not certified by this check. Reviewer-noted weak oracles and inaccurate repair suggestions remain follow-up work.

Before the authorized private WIP push, a bounded scan of all 32 candidate project files found no credential assignments, AWS access-key patterns, private-key blocks, device approval URLs, private runtime/database/archive files or symlinks. Native raw transcripts and authentication state remain outside the repo; ClaudeKit materialization never yielded licensed source bytes here. This is a bounded scan and provenance review, not a guarantee that every possible secret pattern has been detected.

The initial unstaged `git diff --check` did not include new untracked source files. After staging, `git diff --cached --check` caught trailing whitespace in the Kiro test file and an extra EOF blank line in `ids.ts`. Codex applied only mechanical trailing-whitespace/EOF normalization to those two files, with no logic or assertion changes; Kiro remains the application/test author. The staged diff was then checked again before committing.

## 2026-11-10 — K8, does the PostFileSave hook fire by itself? (Kiro CLI 3.1.0)

- Surface and version: Kiro CLI **3.1.0** on Windows PowerShell, Node v24.18.0, npm 11.16.0 (via
  `npm.cmd`; `npm.ps1` is blocked by the machine's execution policy). Model and mode: not shown to
  the agent in this session; not recorded.
- `/usage` before and after: **NOT RUN.** `/usage` is a chat slash command and was not reachable
  from the agent's tools in this session. The owner should record the number from the account page
  or a chat window; nothing is guessed here.
- Baseline before any change: `npm ci` exit 0 (232 packages; 12 audit findings, 9 moderate, 1 high,
  2 critical, unchanged from the 2026-11-10 measurement), then `npm run check`: lint exit 0,
  typecheck exit 0, **235/235 tests**, build exit 0.
- Diagnosis, observed: `Get-Command bash` returned **nothing** — there is no `bash` on this
  machine, so the original hook command `bash .kiro/hooks/typecheck-domain.sh` cannot run here.
- Trigger attempts with the **original** hook: the agent appended `// k8-hook-probe` to
  `src/domain/ids.ts` with the append tool, then reverted with the replace tool. **No hook output
  appeared** after either call. The control edit to `src/ui/importGuard.ts` also produced none.
  Because `bash` is absent, "did not fire" and "fired and failed silently" cannot be told apart from
  inside the session. Outcome: **B — no observable trigger**, cause of non-execution at least
  partly environmental.
- Side finding: both edit tools rewrote the line endings of the whole file (`git diff --stat`
  showed 91 insertions and 91 deletions on `src/domain/ids.ts` for a one-line probe). The files had
  no other changes, so each was restored with `git checkout -- <file>`; `git diff -- src` is empty.
  Anyone probing this way on Windows should expect that and check `git diff`.
- Repair (the Windows environment was the demonstrated cause), applied by the agent:
  - `.kiro/hooks/typecheck-domain.mjs` (new): Node script, no shell dependency, same typecheck as
    `npm run typecheck`, report-only (always exit 0), skips truthfully if dependencies are missing.
  - `.kiro/hooks/domain-typecheck.json`: command `bash .kiro/hooks/typecheck-domain.sh` →
    `node .kiro/hooks/typecheck-domain.mjs`; matcher `(^|/)src/domain/.*\.tsx?$` →
    `(^|[/\\])src[/\\]domain[/\\].*\.tsx?$`; timeout 30 → 60. The old `.sh` is left in place,
    unused.
  - Matcher checked in Node against eight path forms: it matches `src/domain/ids.ts`,
    `src\domain\ids.ts` and absolute paths of both styles, and does not match `src/ui/importGuard.ts`,
    `src/domain/notes.md`, `tests/domain/engine.test.ts` or `xsrc/domain/ids.ts`.
  - The new script, run **by hand once**, printed `[ghostlight hook] typecheck PASS` and exited 0.
    That proves the script works; it is **not** evidence of a trigger.
- Retest after the repair: another probe edit of `src/domain/ids.ts` again produced **no visible
  hook output**. Hook definitions are loaded when a session starts, so this session may never have
  loaded the repaired file. The CLI has no `hooks` subcommand (`kiro-cli hooks` is "unrecognized"),
  and `/hooks` could not be run from here. **Whether the repaired hook fires is therefore NOT
  VERIFIED.**
- What the owner still needs to do (about two minutes): start a **new** `kiro-cli chat` session in
  this folder, run `/hooks` and note whether `domain-typecheck` is listed, then ask the agent to
  append `// k8-hook-probe` to `src/domain/ids.ts` and look for `[ghostlight hook]` lines; repeat for
  `src/ui/importGuard.ts` as the control, then `git checkout -- src`. Record the verbatim result here.
- Final checks after the repair: `npm run lint` exit 0; `git diff -- src` empty.
- What this does NOT show: that any hook has ever fired automatically. The only positive facts are
  the missing `bash`, the corrected matcher and a working script.

## 2026-11-10 — K11, property-based testing (Kiro CLI 3.1.0, FALLBACK route, not the IDE)

- Surface: **Kiro CLI 3.1.0, not Kiro IDE.** The brief asked for the IDE's native property-based
  testing workflow, which per <https://kiro.dev/docs/specs/correctness/> exists in the IDE only. The
  IDE could not be driven from this CLI session, so this is the brief's stated fallback: Kiro wrote
  `fast-check` tests by hand. It is real property-based testing, but it is **not Kiro's built-in PBT
  feature**, and no property here was extracted by that feature. The write-up must say so.
- `/usage` before and after: **NOT RUN** (slash command not reachable from the agent's tools).
- Dependency: `fast-check` **4.10.2**, exact (no `^`/`~`), the latest version at the time
  (`npm view fast-check version`). Added with `--save-dev --save-exact`; it is the only dependency
  change (`package.json` +1 line; `package-lock.json` +41 lines).
- File written: `tests/domain/properties.test.ts` (no existing test edited; `src/domain/**`
  untouched, `git diff -- src` empty).
- Oracle: a reference model (`refStep`) written from the transition table in
  `.kiro/specs/ghostlight/design.md`. It never calls `runScenario`. It is itself checked against
  hand-calculated cases (acceptance A01's four-step chain, an omitted handoff, a consumed reuse, an
  unknown start, a malformed `place`).
- Properties (all 300 runs each, seed **20261110**): P1 single custody and state shape (FR3, incl.
  the id `toString`); P2 consumption terminal (FR5.1); P3 replenish only absent→available, never from
  consumed (FR5.2); P4 a rejected action changes nothing and reports one issue; P5 determinism; P6
  purity (deep-frozen input, no mutation, no aliasing between any two snapshots, frame actions are
  copies); P7 causal integrity (earlier, applied, same prop, most recent); P8 authored actions
  reproduced verbatim and in order (FR1.2); P9 differential equality with the reference model, frame
  by frame, including severity and cause; P10 unknown stays uncertain (FR4); P11 props sharing a name
  never merge and declaration order changes nothing (A04); P12 cue reordering changes consequences
  but not authored actions or issue ids (A05/A06); plus a generator-coverage test.
- Result: **15/15 pass** on the first run; no property failed, so **no engine bug was found** and
  there is no counterexample to record. Full `npm run check`: lint exit 0, typecheck exit 0,
  **250/250 tests** (235 before, +15), build exit 0.
- A first-run pass proves little by itself, so the properties were checked for teeth. Eight
  deliberate bugs were injected into a **temporary copy** of the engine (outside the repository,
  removed afterwards; the repository's `src/` was never edited): consumed ids replenishable, carryOff
  allowed within one zone, cause always `initial`, unknown reported as `error`, a rejection that
  leaks a state change, source match ignoring the holder, consume yielding `absent`, and the engine
  mutating its caller's input. **All eight were caught**, each by at least one property (P9 caught
  seven; P2, P3, P4, P6, P7 and P10 each caught at least one). A first mutation script only
  reported counts in a form that could not be read, so it was re-run with JSON output; M1 also failed
  to apply the first time because of an unescaped parenthesis in the pattern.
- Coverage of the generators, measured with the same seed: 300 scenarios, 1476 frames; all six kinds
  both applied and rejected; 882 shape rejections, 395 state rejections; 350 `initial` causes and
  only **45** `action` causes; 51 uncertain; 20 consumed reuses. **Only about 13% of frames (199)
  are applied**, so the deep-chain paths (a cause pointing at an earlier action) are exercised far
  less than the rejection paths. Raising that would need a smarter generator.
- Honest answer to the Devpost question "did PBT catch issues unit tests missed?": **no**, not in this
  run. The properties found nothing new in the engine; the existing 235 example tests and the
  engine itself held up. What they add is evidence across generated inputs for the invariants, and a
  differential check that the engine matches an independent reading of the design table.
- What this does NOT show: that Kiro's native PBT works or what it would have found; any IDE-versus-CLI
  comparison (the IDE was not used); correctness beyond the model's reading of the design table (if
  the table and the requirements disagree, this cannot tell).

## 2026-11-13 — K8 closed, K2 reopened, K10, K3, K7, K6 CSV (Kiro CLI 3.3.0, Windows PowerShell)

- Surface and version: **Kiro CLI 3.3.0**, Node v24.18.0, npm 11.16.0. Model and mode: not shown to
  the agent; not recorded. `/usage` before and after: **NOT RUN** (slash command not reachable from
  the agent's tools). Nothing is guessed.
- Starting point: `main` fast-forwarded to `29b4c0f`; the previous session's uncommitted work was
  stashed and restored (docs conflicts resolved in favour of upstream). Baseline `npm run check`
  green with **250 tests** (235 + 15 property tests from the 2026-11-10 K11 entry above).
- **Playwright** was not installed; added with `npm i --no-save playwright@1.63.0` plus
  `npx playwright install chromium`, so `package.json` and the lockfile are unchanged by it.

### What failed on the way

1. **The strict harness hung forever** (a 15-minute timeout). Cause, found by reading the harness:
   `selectFailingAction` awaits `getAnimations().finished`, and the locally uncommitted CSS had
   `animation: ... infinite` on the ghost glyphs, which never finishes. Not a harness bug. The
   infinite pulse was also a WCAG 2.2.2 problem. Replaced with a single 0.6 s transform-only
   "materialise" that runs once when a step is selected (no opacity or colour change, so contrast is
   identical at every frame) and is removed under `prefers-reduced-motion`.
2. A first K3 type error: `toString: { status: 'absent' }` lost its literal type; fixed with `as const`.
3. A first K6 test failure was **my oracle, not the code**: the honesty line contains a comma, so
   RFC 4180 correctly quotes it. Expected value corrected.
4. A browser check reported 4 running animations under reduced motion. It was sampling within the
   first instant (the 0.01 ms reduced-motion transitions were still settling). Confirmed with a
   probe: **0** animations at 100 ms and later under `reduce`; with motion on, exactly two finite
   ones (a 150 ms transition, the 600 ms one-shot). Check changed to wait 100 ms.

### K8 — does the hook fire by itself? Outcome **B (did not fire), unresolved cause**

- Three fresh `kiro-cli chat --no-interactive --trust-workspace` child sessions each made the agent
  append `// k8-hook-probe` to `src/domain/ids.ts` with its file-write tool. Each edit was confirmed
  in `git diff` and reverted. The edit tool's own event stream shows a completed edit.
- Probe 1: the real hook. `tsconfig.tsbuildinfo` (which `tsc -b` rewrites) did not change, and no
  `[ghostlight hook]` output appears in the stream-json event stream.
- Probes 2 and 3: a temporary hook file with `SessionStart`, `UserPromptSubmit`, `PostToolUse` and
  `PostFileSave` all appending to a marker file. **No marker was written for any of them, not even
  `SessionStart`** (probe 3 used a PATH-free `echo >> "%TEMP%\..."` command). So the failure is not
  specific to PostFileSave, the matcher, or `node`/`bash` resolution.
- Side finding: inside this tool's shell, `cmd` cannot find `where` or `node` even though PATH is
  correct (cause not determined); hook commands run by `cmd /c` could be affected in a similar
  environment. Not shown to be the cause here.
- A hook placed outside a trusted/loaded configuration would also be silent. Docs (updated
  2026-11-12) say hooks activate at session start, and `--trust-workspace` is meant to load them; I
  cannot tell from here whether `--no-interactive` runs honour hooks at all. **NOT VERIFIED either
  way in an interactive session.** The owner can settle it in two minutes: start a normal
  `kiro-cli chat` in this folder, run `/hooks`, then ask the agent to append the probe line.
- Temporary probe hook and marker files were deleted; `domain-typecheck.json` is unchanged by this session.
- What this does NOT show: that the hook never fires interactively.

### K2 reopened and K10 — selected row, ghost and solid

- Files: `src/styles.css`, `src/ui/StageView.tsx`, `src/ui/Timeline.tsx` (status class on the row).
- The selected row is now marked by a neutral surface and a bar, and a rejected or uncertain row keeps
  its own verdict tint, so a failing step no longer sits on success-green.
- The ghost (`required`/`match`/`mismatch`) is dashed and translucent, the solid (`planned`) is
  filled; every glyph type has an applied rule (the earlier `.ghost`/`.solid` dead rules are gone),
  each carries a glyph character as well as its word label, and a pair note in words says where the
  other half is. Dark-scheme tokens set separately.
- `axe-baseline.json` re-recorded by `npm run test:e2e -- --record`: the two selected-row
  `color-contrast` entries are empty (not hand-edited).

### K3 — list equivalent · K7 — first screen · K6 — CSV

- K3: `src/ui/stageModel.ts` is the single derivation; the diagram and `StageList` both render it.
  A Diagram/List toggle (`aria-pressed`) remembers the choice in `sessionStorage`; with no stored
  choice, `prefers-reduced-motion: reduce` defaults to the list. The cause button is unchanged.
- K7: `src/App.tsx` empty state says what the tool does and its limits, offers one first move
  ("Missing Handoff") and a sentence per scene. Scene fixtures and the header subtitle are untouched.
  The "Reordering Example" sentence says it passes as shipped and must be swapped by hand.
- K6 (CSV half): `src/ui/reportCsv.ts` pure functions; one file per report; instance id in every row;
  CSV quoting per RFC 4180; fields starting `=`, `+`, `-`, `@`, tab or CR are prefixed with `'`;
  honesty line first; UTF-8 BOM. Built in the browser, no network request (verified).
- Tests added: `tests/ui/stageModel.test.ts` (11, hand-built frames, includes a prop id `toString`)
  and `tests/ui/reportCsv.test.ts` (14).

### Command results (exit codes observed)

- `npm run lint` 0 · `npm run typecheck` 0 · `npm test` **275/275** · `npm run build` 0.
- `npm run test:e2e -- --strict`: **25 passed, 0 failed**, baseline empty; plain `test:e2e` and
  `--record` also green.
- Out-of-repo browser verification script (not committed; deleted afterwards): **26 checks passed**,
  covering first screen (light and dark, axe clean, no overflow at 390 px), reduced motion renders
  the list, the cause button from the list view, choice remembered, no unstyled glyphs, dashed ghost
  versus solid, three CSV downloads, no network request, axe clean on every new state. Screenshots in
  `docs/media/`.

### What this does NOT show

That hooks fire interactively; any real stage manager's opinion; Kiro's `/usage`; MCP, custom agents,
Crew or powers (K12 not done); dependency advisories (K9 not done). Print output was not visually
inspected. Ghost/solid colours were checked by axe and by eye on two screenshots, not by a colour-blind
reviewer.

## 2026-11-13 — K9, dependency advisories (Kiro CLI 3.3.0)

- Before: `npm audit` 12 findings (9 moderate, 1 high, 2 critical); `npm audit --omit=dev` 0.
- Tried first, in a throwaway copy outside the repo: `vite@8.3.8` + `vitest@5.1.0` (npm's suggestion).
  **Failed**: `ERESOLVE`. Vite 8 needs `@vitejs/plugin-react` 6 and new peer dependencies, and a
  newer `@types/node`; a toolchain migration, not a bump. Abandoned.
- Applied instead: exact `vite@7.3.8` and `vitest@4.1.12` (previously `^5.0.0` and `^1.0.0`;
  `@vitejs/plugin-react` 4.7 supports vite 7). `package.json` and lockfile changed only for these
  and `fast-check`. CI and Pages already use Node 22, which vite 7 supports.
- After: `npm audit` **7 moderate, 0 high, 0 critical**; all seven are `minimatch` under the
  `typescript-eslint` chain (lint tooling, dev only). `npm audit --omit=dev`: 0.
- Results on the real tree after a clean `npm ci`: `npm run check` exit 0 (lint, typecheck,
  **275/275** tests, build); `test:e2e -- --strict` 25 passed, 0 failed; 26 out-of-repo browser checks passed.
- What this does NOT show: that `npm run dev` was exercised by hand; the remaining moderate advisories
  are not fixed (the fix would be a typescript-eslint major).
