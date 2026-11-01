# Start here: Ghostlight

Original handoff documentation by **Codex**, 2026-11-01. This file helps a new agent or human continue the project without the previous chat or a private skill package. Kiro remains the primary author of product specifications, application code, tests, and fixes; this document is orchestration and review, not evidence of Kiro implementation.

**Status snapshot: 2026-11-01 01:59 UTC — one Kiro request recovered; local repair remains unaccepted.** Reviewed domain code **`3d1a7bb0f363ab9ce161a8eb098de08dbfd1fb59`** retains its passing **165/165 tests, lint, typecheck and stub-build** evidence. After the documented cooldown, one narrow native Kiro request fixed protected localStorage lookup and added tests. Independent runtime tests pass **13/13**, but the new test file has **three TypeScript errors**; no product-source checkpoint was accepted or pushed. No new throttle/retry hint appeared. See [current getter repair evidence and exact next scope](docs/handoff/POST_COOLDOWN_GETTER_REVIEW.md). The client is closed at the requested verification checkpoint; do not claim a running writer, sustained availability or completed UI. Earlier [throttle evidence](docs/handoff/KIRO_THROTTLE_DIAGNOSTIC.md) and [UI defects](docs/handoff/UI_REPAIR_REVIEW.md) remain relevant history.

<!-- CHECKPOINT OWNER: refresh timestamp, exact commit/diff identity, UI/browser results, remaining defects, next task and evidence links after the next writer stops. This document certifies only the bounded domain repair at 3d1a7bb. -->

## Read in this order

1. [Product requirements](.kiro/specs/ghostlight/requirements.md) and [product boundaries](.kiro/steering/product.md): what to build and what not to claim.
2. [Domain design](.kiro/specs/ghostlight/design.md) and [technical conventions](.kiro/steering/tech.md): normative transitions, ownership, parser/replay separation, and report semantics.
3. [Implementation tasks](.kiro/specs/ghostlight/tasks.md), then the next unfinished step below. Task checkboxes and proposed file layouts are plans, not proof of implemented behavior.
4. [Independent acceptance handoff](KIRO_CODING_HANDOFF.md): A01–A18 hand-calculated examples. These are original Codex requirements/oracles; their existence does not mean they passed.
5. [UI direction](docs/handoff/UI_DIRECTION.md) and [browser QA plan](docs/handoff/BROWSER_QA_PLAN.md) when moving into the real interface.
6. [Latest getter repair verification](docs/handoff/POST_COOLDOWN_GETTER_REVIEW.md), then [rate-throttle diagnosis](docs/handoff/KIRO_THROTTLE_DIAGNOSTIC.md) and [UI repair review](docs/handoff/UI_REPAIR_REVIEW.md): exact draft failures, blocked-writer evidence, optional local recovery and ordered resumption gates.

These are canonical sources; do not create competing copies of their contracts. Current user instructions take precedence over historical execution gates. The user's later build authorization supersedes the validation-only restriction in [the old final review](KIROWEEN_FINAL_REVIEW.md). Its market, usefulness, and eligibility caveats remain valid.

## Confirmed scope and remaining choices

The current user priorities are **intro and Ghostlight**. This checkout and handoff cover Ghostlight only. **game-moba is paused**; do not inspect or change it as part of this task, and do not infer that it is healthy. No other project's status is established here.

Confirmed Ghostlight requirements:

- A polished, original Halloween theatre planning workspace with editable scenes, physical prop instances, cues and actions; useful owned synthetic demos, including a valid control.
- Independently authored required holder/location versus computed **before-action** state. Show the required ghost and computed solid state with physical IDs and text; label after-action state separately.
- Deterministic immutable replay, ordered cues/actions, useful errors and uncertainty, and navigation to the relevant earlier action or initial declaration. Physical duplicates remain distinct; consumed IDs never revive.
- Reference-safe editing, practical preset/runner/physical-reset reports, validated JSON import/export, and recoverable local persistence that retains current work on failure.
- Keyboard access, visible focus, readable alternatives, reduced motion, responsive/reflow checks, and useful empty/error states.

The six-operation contract is settled in the design; do not reopen it casually. Unknown state is resolved by correcting its initial declaration, not by inventing a successful movement. The parser checks structure; replay checks action semantics.

The app models **planned state**. It is not live tracking, automatic stage detection, or a safety system. Synthetic tests are not real-user validation. Local computation after assets load is intended; guaranteed cold-offline reopening is not established.

Implementation choices still needed include component/state organization, stable ID allocation in the editor, concrete demo data, persistence key/version/save timing and recovery interactions, and portable browser-test wiring. Resolve these coherently against the canonical requirements and record material choices. They are not permission to weaken the requirements. Audience demand, differentiation, contest eligibility and real-user usefulness remain unvalidated.

## Checkpoints and actual validation

| Role | Preserved checkpoint | Meaning |
|---|---|---|
| Accepted engine baseline | `d8a1a611cb9a704bc2052917dca8ad0fe1c5e25a`; branch `codex/ghostlight-kiro-cloud-wip-20261031`; [draft PR #1](https://github.com/vtpqui3009/ghostlight/pull/1) | Reviewed engine slice and passing compilation stub. **Not a finished MVP.** |
| Current domain continuation branch | `codex/ghostlight-domain-draft-20261031`; [reviewed code `3d1a7bb`](https://github.com/vtpqui3009/ghostlight/commit/3d1a7bb0f363ab9ce161a8eb098de08dbfd1fb59) | Bounded parser/editor repairs and test corrections are reviewed, committed and pushed. Remote branch identity was verified with `git ls-remote`. Full T2 and UI acceptance remain incomplete. |
| Published original handoff | `eda5ca5a463913eaea40eee800e417bc4baf48ce` | Documentation committed/pushed and remote identity verified. PR #1 body links the continuation, while its head remains `d8a1a61`. |
| Local UI draft and getter repair — unaccepted | Original nine source files plus a new persistence test; [latest evidence](docs/handoff/POST_COOLDOWN_GETTER_REVIEW.md); **no UI commit/push** | Incomplete forms, comparison/recovery/playback and other defects; preserved only in the working tree and optional private source archive. Do not mix into a documentation commit. |
| Historical unaccepted draft | `7760205e0c464e746635b969ecaffcada0bdcd85` | Preserved pre-repair parser/report/editor draft and handoff. Its failures are historical; use the newer code checkpoint for continuation. |
| Original main baseline | `1a2f9521111f0ba67a085474a441f26a61d709b9` | Preserved scaffold baseline; no merge is authorized by this handoff. |

In the current cloud workspace, `/workspace/ghostlight` remains clean at the accepted engine baseline. Continue product work in `/workspace/ghostlight-domain-draft`. These paths are environment conveniences; the commit identities are the durable references. Do not reset or overwrite either tree to recreate this table. Check for active writers and local changes before assigning a new task. PR #1 remains the engine-baseline reference; its head does not include the separate repaired continuation branch.

| UTC checkpoint | Actual checks | Limits of the evidence |
|---|---|---|
| 2026-10-31 13:28; accepted tree rechecked 14:29 | Lint, typecheck, **31 engine tests**, stub production build passed; aggregate command exit 0. | UI is a stub; this does not cover all A01–A18. See [build progress](BUILD_PROGRESS.md) and [Kiro evidence](KIRO_SESSION_EVIDENCE.md). |
| 2026-10-31 14:24; preserved domain draft | Tests: **76/83 passed**, exit 1. Lint: 14 errors, exit 1. Typecheck: 38 diagnostics, exit 1. Build/browser QA not run for that failing draft. | Historical failures, including incorrect test oracles. See [draft checkpoint](WIP_DOMAIN_CHECKPOINT.md). |
| 2026-11-01 00:17; Phase 1, test-file changes only | Independent full tests: **83/83 passed**, exit 0. Lint: exit 1, one existing unused schema helper. Typecheck: exit 1, two schema diagnostics. Build: exit 1 on the same two diagnostics. | Phase 1 review accepted fixture/import/narrowing repairs. Passing tests do not remove known parser/editor defects. No green source/build claim. |
| 2026-11-01 00:22:41; Phase 2 final | Independent **122/122 tests** passed (31 engine + 91 acceptance); lint, typecheck and build each exited 0. | Reviewed bounded parser repair in the intermediate working tree preceding `3d1a7bb`; no separate Phase 2 commit is claimed. |
| 2026-11-01 00:30:48; Phase 3 final | Independent **165/165 tests** passed (31 engine + 134 acceptance); lint, typecheck and build each exited 0. | Reviewed bounded editor repair, subsequently committed with the other repair changes as `3d1a7bb`. Full matrix/property/browser acceptance remains incomplete. |
| 2026-11-01; later initial local UI draft | **165 existing tests passed**; lint failed with 16 unused-symbol errors; typecheck/build failed with 16 unused-symbol diagnostics. Targeted storage and desktop browser probes reproduced failures. | No new UI test acceptance. No broad responsive/keyboard/print/accessibility acceptance. See [exact evidence and corrected probe result](docs/handoff/UI_REPAIR_REVIEW.md). |

The [November 1 QA record](docs/qa/NOV01_DOMAIN_REPAIR.md) preserves the sanitized command history, repair scope, authorship and evidence limits. Exact command outputs remain in the private runtime review ledger; raw authenticated transcripts are not deliverables. Tests/lint/typecheck ran independently, with build afterward, so an early failure did not hide later check outcomes.

Checkpoint sequence: Kiro-authored domain source/tests were committed first as `3d1a7bb0f363ab9ce161a8eb098de08dbfd1fb59`, then original handoff docs as `eda5ca5a463913eaea40eee800e417bc4baf48ce`; both were pushed and remote identity verified. The local UI draft remains uncommitted/unpushed. The blocker/repair documentation was separately committed and pushed as `a8a40de3a8723c7f55b2aa0aa323f70133cbfb8e`; the new rate-throttle diagnosis is an original-doc follow-up, not UI acceptance. Future UI work needs separate source identity and evidence.

Known coverage limits: generic successful Prop/Zone/Holder/Cue ID-update controls assert a defined result rather than the returned stable ID; valid no-op ownership tests cover outer containers, not all nested positions/actions. Independent code review found no product blocker for this repair scope, but those assertions must not support stronger claims. Generated property tests, the complete A01–A18 matrix, UI, persistence and browser acceptance remain unfinished.

[WORKFLOW.md](WORKFLOW.md), [CLOUD_KIRO_READINESS.md](CLOUD_KIRO_READINESS.md), [KIRO_SESSION_EVIDENCE.md](KIRO_SESSION_EVIDENCE.md), and [DOMAIN_REPAIR_BRIEF.md](docs/handoff/DOMAIN_REPAIR_BRIEF.md) retain useful historical provenance. Their old session IDs, quota figures, pending actions and failures are dated observations, not current instructions to resume an old process. This entry point takes precedence for the status snapshot; newer verified evidence must replace it explicitly.

## Architecture and local commands

Accepted inventory at reviewed source `3d1a7bb` (the later unaccepted UI working files are inventoried separately in [UI repair review](docs/handoff/UI_REPAIR_REVIEW.md)):

| Path | Responsibility/status |
|---|---|
| `src/domain/types.ts`, `ids.ts` | Domain shapes, stable identities and copy helpers. |
| `src/domain/schema.ts` | Structural parsing and owned normalized input; bounded collection/optional-field repairs reviewed. |
| `src/domain/engine.ts` | Pure deterministic `runScenario` replay and causal issues. |
| `src/domain/report.ts`, `edit.ts` | Report/reference-edit helpers; reproduced editor safeguards repaired and reviewed. Broader acceptance remains incomplete. |
| `tests/domain/engine.test.ts`, `acceptance.test.ts` | Engine checks and domain acceptance examples; coverage is narrower than the complete matrix. |
| `src/main.tsx`, `App.tsx`, `styles.css` | React/Vite entry and compilation stub at the accepted code commit. The local replacement UI is incomplete and unaccepted. |

The intended data path is validated scene → pure replay → derived reports/UI. Edit candidates must become valid owned scenes before replacement. Persistence/import failures must preserve current in-memory work. Proposed directories in the design are not evidence those modules already exist.

Use Node/npm compatible with the lockfile. The observed development environment used Node **24.19.0** and npm **11.9.0**; no project engine range is declared. Record the actual local versions instead of silently changing dependencies. From the continuation checkout:

```sh
node --version
npm --version
npm ci --cache /tmp/ghostlight-npm-cache
npm run dev
```

`npm ci` installs from the committed lockfile; it already completed successfully for the resumed draft on November 1. Do not repeat it on each edit or rewrite the lockfile as a repair shortcut. `npm run dev` binds to loopback; use the URL printed by Vite. A server opening successfully does not establish product readiness.

Run and record **each** phase check, including failures, after the writer stops:

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

Focused diagnosis: `npm test -- tests/domain/acceptance.test.ts`. The convenience command `npm run check` runs lint → typecheck → tests → build and stops at the first failing stage; it does not replace recording all four outcomes when a phase is expected to fail. Avoid repeating unchanged passing checks. For a successfully built bundle, `npm run preview` serves a local preview.

`npm run test:e2e` is declared, but portable project Playwright dependencies/configuration and a complete working UI have not been established. Do not report it runnable or passing merely because the script exists. Targeted desktop browser inspection has now run and found failures, as recorded in [UI repair review](docs/handoff/UI_REPAIR_REVIEW.md). The broader [browser QA plan](docs/handoff/BROWSER_QA_PLAN.md) remains outstanding; no full browser acceptance has passed.

## Ordered continuation

| Step and dependency | Scope | Acceptance before moving on |
|---|---|---|
| 1. Test-oracle repair — reviewed | `tests/domain/acceptance.test.ts` | Correct declared-ID/collection/inheritance/ownership fixtures, static imports and throwing type guards; Phase 1 results above. Do not reopen passing fixtures without a concrete finding. |
| 2. Parser repair — reviewed; depends on 1 | `src/domain/schema.ts` and focused acceptance cases | Bounded collection and optional-field repairs passed four checks and independent review. Preserve required-source and own-field rules; do not rerun the old repair plan without a new failure. |
| 3. Editor repair — reviewed; depends on 2 | `src/domain/edit.ts` and focused acceptance cases | Optional retain/clear behavior, integer action reorder, validated no-ops and own differing-ID guards passed the scoped checks/review. See coverage qualifications above; no full T2 claim. |
| 4. UI repair — verification pause; domain repair dependency met | First repair the three new test TypeScript errors and test controls in [current scope](docs/handoff/POST_COOLDOWN_GETTER_REVIEW.md); verify FREE before another native request | Follow [ordered UI repairs](docs/handoff/UI_REPAIR_REVIEW.md): real action/other forms; storage/App recovery and state comparison/playback/cause; demos/import/report accessibility; then portable tests/browser QA. All writers are closed. No blind inference retry or Codex implementation substitution. |
| 5. Browser review and fixes — depends on working UI | Reviewer executes; Kiro fixes assigned product/test paths | Execute [browser oracles](docs/handoff/BROWSER_QA_PLAN.md): replay/cause/edit, round trip and failed-import retention, storage failures, keyboard/focus, mobile/zoom, reduced motion and reports/print. Record unperformed checks plainly. |
| 6. Reviewed private checkpoint | Documentation/evidence and authorized private branch/PR | Stop writers, review diffs and provenance, verify checks and credential/proprietary exclusions, update this handoff and record exact commit/PR. Private checkpointing is not deployment or final product acceptance. |

For a bounded implementation failure, send the concrete input, invariant and observed result to Kiro only after responsiveness is established. One grouped correction followed by checks is the default. The earlier native-response blocker had bounded original/narrowed/fresh-client attempts; one post-cooldown request then recovered. Complete the current test-only repair before expanding, and stop on any new retry hint. Use [UI repair review](docs/handoff/UI_REPAIR_REVIEW.md) for current failures and optional source recovery. The old [domain repair brief](docs/handoff/DOMAIN_REPAIR_BRIEF.md) is historical background, not the next task.

## Authorship, budget and recovery boundaries

The verified native authoring tool in the retained cloud runtime is official **Kiro CLI 2.37.0**. Check the installed binary's `--help` before assuming newer documentation flags. The previously working interactive route is `kiro-cli chat --v3 --mode default --model claude-sonnet-4.5 --trust-tools=`; it responded to one post-cooldown narrow request; continued responsiveness is not guaranteed. Inspect and approve only task-scoped tools, rather than adding trust-all permissions. A model name being selectable is not proof of free entitlement or response readiness. Verify native `/usage` at idle and the documented recovery gate before inference; use native `whoami` only as a private sign-in check and do not commit account output. User browser approval may be required if an official session has expired. No headless API entitlement is assumed.

Keep Kiro configuration/data/session directories outside the checkout with owner-only permissions. The retained runtime used separate `XDG_CONFIG_HOME`, `XDG_DATA_HOME` and `KIRO_HOME` locations; those locations are machine-local, not portable credential artifacts. A new agent should re-establish authorized native access, not copy a token database. Raw terminal transcripts are not deliverables.

The effective managed-cloud policy verified on November 1 included these seven explicitly approved Kiro installation/service hosts: `cli.kiro.dev`, `desktop-release.q.us-east-1.amazonaws.com`, `prod.download.cli.kiro.dev`, `oidc.us-east-1.amazonaws.com`, `runtime.us-east-1.kiro.dev`, `management.us-east-1.kiro.dev`, and `q.us-east-1.amazonaws.com`, plus the environment's package-manager preset. This is an observed environment configuration, not a universal firewall recipe or permission to widen access. After a denial, report the exact destination/action and wait for materially relevant authorization or policy evidence; do not switch routes or transfer credentials to bypass it.

- Keep **one native Kiro product writer** at a time. Record its task, allowed paths, base commit, dependencies and acceptance commands. Reviewers may work on separate original handoff documents, but do not race the product writer or substitute their own application/test implementation.
- Use **verified KIRO FREE allowance only**. Last native read-only observation: **26.86/50 used at 2026-11-01 01:57 UTC**, displayed reset **2026-12-01**. Earlier domain-checkpoint usage is retained in its QA record. This estimate is not a promise of current balance; the historical service rate throttle cleared enough for one request, with no new wait hint. Follow the [current verification checkpoint](docs/handoff/POST_COOLDOWN_GETTER_REVIEW.md) and respect any later service retry hint. Verify entitlement/capacity and responsiveness before resumption. No purchases, upgrades, overages, paid allowance or billing changes.
- **Private ClaudeKit transfer is BLOCKED and not installed/applied.** The supported materialization attempt failed; no local licensed archive or read skills are claimed. Continue with the original repository guidance. Do not retrieve alternate copies, publish purchased content, or present these original docs as ClaudeKit-derived.
- Secrets, account identifiers, tokens, device-approval codes/URLs, raw authenticated transcripts, private databases, browser profiles and licensed archives stay outside Git. The durable handoff needs none of them. Preserve sanitized command results and authorship, not session secrets.
- On a new machine, use authorized private-repository access and the recorded checkpoint; inspect local changes before checkout/recovery. Install dependencies from the existing lockfile, read this file and the canonical contracts, verify whether a writer is already active, then establish any needed official native authentication without copying credential stores into the repo. Persistent login across environment replacement is not guaranteed.
- Private branches, ordinary commits/pushes and draft PRs have been authorized subject to review. Preserve main. This handoff does not authorize merge, force push, deployment, public visibility/security changes, contest submission, outreach or unrelated project access.
- Cloud tasks can continue independently of the desktop while their runtime is active, but sessions can stop for lifecycle, service, quota, network or user-authorization limits. There is **no guaranteed uninterrupted 24/7 execution or automatic resume**. Preserve a checkpoint and notify the supervising thread of blockers; do not invent a monitoring service.

## Copyable continuation request

```text
Continue Ghostlight from reviewed domain code 3d1a7bb0f363ab9ce161a8eb098de08dbfd1fb59,
preserving the later unaccepted local UI draft, accepted d8a1a61 engine tree and main.
Read START_HERE.md and docs/handoff/POST_COOLDOWN_GETTER_REVIEW.md before acting. One
post-cooldown native request responded, fixed protected localStorage lookup and added
tests, but its test file has three TypeScript errors. All writers are closed at the
verification checkpoint. Verify FREE allowance before the next small test-only repair;
stop immediately on a new retry hint. Do not loop blindly or switch backends.

Once responsive, keep one Kiro product/spec/test writer; Codex orchestrates/reviews/QA.
Implement real action/other forms, then storage/App recovery and state comparison/
playback/cause, then demos/import/report accessibility, then portable tests/browser QA.
Use the recorded exact failure oracles and canonical .kiro contracts. Preserve authored
requirements, dirty work and corrupt recovery data. Do not delete missing features just
to pass lint. After each stopped scope record tests, lint, typecheck and build separately.
The existing 165 domain tests are not UI acceptance. Refresh evidence/source identity.

No purchases, paid allowance, billing changes, backend bypass or Codex application-code
substitution. ClaudeKit remains blocked/not installed; credentials/raw auth/purchased
content stay outside Git. Optional local archive recovery must use separate scratch,
never overwrite the working tree. game-moba is paused. No merge/deployment or 24/7 promise.
Report the concrete responsiveness outcome or unresolved blocker, accepted checkpoint
and next task. Documentation alone does not complete the product.
```
