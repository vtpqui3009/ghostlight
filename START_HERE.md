# Start here: Ghostlight

Original handoff documentation by **Codex**, 2026-11-01. This file helps a new agent or human continue the project without the previous chat or a private skill package. Kiro remains the primary author of product specifications, application code, tests, and fixes; this document is orchestration and review, not evidence of Kiro implementation.

**Status snapshot: 2026-11-01 00:32 UTC.** The three bounded domain repair phases passed independent review and are committed as **`3d1a7bb0f363ab9ce161a8eb098de08dbfd1fb59`**. Final checks passed **165/165 tests, lint, typecheck and build**. This is a reviewed domain repair checkpoint, not complete T2 or product acceptance. The UI is still a compilation stub at that commit. A new Kiro UI scope is starting; any later working changes remain unverified until their own checkpoint. See the [November 1 QA record](docs/qa/NOV01_DOMAIN_REPAIR.md).

<!-- CHECKPOINT OWNER: refresh timestamp, exact commit/diff identity, UI/browser results, remaining defects, next task and evidence links after the next writer stops. This document certifies only the bounded domain repair at 3d1a7bb. -->

## Read in this order

1. [Product requirements](.kiro/specs/ghostlight/requirements.md) and [product boundaries](.kiro/steering/product.md): what to build and what not to claim.
2. [Domain design](.kiro/specs/ghostlight/design.md) and [technical conventions](.kiro/steering/tech.md): normative transitions, ownership, parser/replay separation, and report semantics.
3. [Implementation tasks](.kiro/specs/ghostlight/tasks.md), then the next unfinished step below. Task checkboxes and proposed file layouts are plans, not proof of implemented behavior.
4. [Independent acceptance handoff](KIRO_CODING_HANDOFF.md): A01–A18 hand-calculated examples. These are original Codex requirements/oracles; their existence does not mean they passed.
5. [UI direction](docs/handoff/UI_DIRECTION.md) and [browser QA plan](docs/handoff/BROWSER_QA_PLAN.md) when moving into the real interface.

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

The [November 1 QA record](docs/qa/NOV01_DOMAIN_REPAIR.md) preserves the sanitized command history, repair scope, authorship and evidence limits. Exact command outputs remain in the private runtime review ledger; raw authenticated transcripts are not deliverables. Tests/lint/typecheck ran independently, with build afterward, so an early failure did not hide later check outcomes.

Checkpoint sequence: Kiro-authored source/tests were committed first as `3d1a7bb0f363ab9ce161a8eb098de08dbfd1fb59`; these original handoff docs are refreshed separately for the checkpoint owner's review and documentation commit. Remote push/PR status must be recorded only after its actual result. Future UI work needs separate source identity and evidence.

Known coverage limits: generic successful Prop/Zone/Holder/Cue ID-update controls assert a defined result rather than the returned stable ID; valid no-op ownership tests cover outer containers, not all nested positions/actions. Independent code review found no product blocker for this repair scope, but those assertions must not support stronger claims. Generated property tests, the complete A01–A18 matrix, UI, persistence and browser acceptance remain unfinished.

[WORKFLOW.md](WORKFLOW.md), [CLOUD_KIRO_READINESS.md](CLOUD_KIRO_READINESS.md), [KIRO_SESSION_EVIDENCE.md](KIRO_SESSION_EVIDENCE.md), and [DOMAIN_REPAIR_BRIEF.md](docs/handoff/DOMAIN_REPAIR_BRIEF.md) retain useful historical provenance. Their old session IDs, quota figures, pending actions and failures are dated observations, not current instructions to resume an old process. This entry point takes precedence for the status snapshot; newer verified evidence must replace it explicitly.

## Architecture and local commands

Actual inventory at reviewed source `3d1a7bb` (later UI working changes are outside this record):

| Path | Responsibility/status |
|---|---|
| `src/domain/types.ts`, `ids.ts` | Domain shapes, stable identities and copy helpers. |
| `src/domain/schema.ts` | Structural parsing and owned normalized input; bounded collection/optional-field repairs reviewed. |
| `src/domain/engine.ts` | Pure deterministic `runScenario` replay and causal issues. |
| `src/domain/report.ts`, `edit.ts` | Report/reference-edit helpers; reproduced editor safeguards repaired and reviewed. Broader acceptance remains incomplete. |
| `tests/domain/engine.test.ts`, `acceptance.test.ts` | Engine checks and domain acceptance examples; coverage is narrower than the complete matrix. |
| `src/main.tsx`, `App.tsx`, `styles.css` | React/Vite entry and compilation stub. Full UI and persistence are not implemented at this snapshot. |

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

`npm run test:e2e` is declared, but portable project Playwright dependencies/configuration and a working UI have not been established. Do not report it runnable or passing merely because the script exists. The [browser QA plan](docs/handoff/BROWSER_QA_PLAN.md) records historical local Chromium/Playwright availability; recheck the current environment before using it. No browser acceptance has passed at this snapshot.

## Ordered continuation

| Step and dependency | Scope | Acceptance before moving on |
|---|---|---|
| 1. Test-oracle repair — reviewed | `tests/domain/acceptance.test.ts` | Correct declared-ID/collection/inheritance/ownership fixtures, static imports and throwing type guards; Phase 1 results above. Do not reopen passing fixtures without a concrete finding. |
| 2. Parser repair — reviewed; depends on 1 | `src/domain/schema.ts` and focused acceptance cases | Bounded collection and optional-field repairs passed four checks and independent review. Preserve required-source and own-field rules; do not rerun the old repair plan without a new failure. |
| 3. Editor repair — reviewed; depends on 2 | `src/domain/edit.ts` and focused acceptance cases | Optional retain/clear behavior, integer action reorder, validated no-ops and own differing-ID guards passed the scoped checks/review. See coverage qualifications above; no full T2 claim. |
| 4. Real UI and persistence — next product scope; domain repair dependency met | Explicitly assign UI/storage/import/export paths to one Kiro writer | Deliver the full workflows in [UI direction](docs/handoff/UI_DIRECTION.md), using the reviewed domain helpers and original demo data. Include real failure/recovery states, not only a visual scaffold. A new writer is starting; check ownership before launching another. |
| 5. Browser review and fixes — depends on working UI | Reviewer executes; Kiro fixes assigned product/test paths | Execute [browser oracles](docs/handoff/BROWSER_QA_PLAN.md): replay/cause/edit, round trip and failed-import retention, storage failures, keyboard/focus, mobile/zoom, reduced motion and reports/print. Record unperformed checks plainly. |
| 6. Reviewed private checkpoint | Documentation/evidence and authorized private branch/PR | Stop writers, review diffs and provenance, verify checks and credential/proprietary exclusions, update this handoff and record exact commit/PR. Private checkpointing is not deployment or final product acceptance. |

For a bounded failure, send the concrete failing input, expected invariant and observed result to Kiro. One grouped correction followed by checks is the default. Repeated unchanged failures require a new diagnosis, not an unbounded model loop. Use the original [domain repair brief](docs/handoff/DOMAIN_REPAIR_BRIEF.md) as background; its old line numbers and failure counts must be checked against the current tree.

## Authorship, budget and recovery boundaries

The verified native authoring tool in the retained cloud runtime is official **Kiro CLI 2.37.0**. Check the installed binary's `--help` before assuming newer documentation flags. The current supported interactive route is `kiro-cli chat --v3 --mode default --model claude-sonnet-4.5 --trust-tools=`; inspect and approve only task-scoped tools, rather than adding trust-all permissions. A model name being selectable is not proof of free entitlement. Verify the native `/usage` panel at idle before inference; use native `whoami` only as a private sign-in check and do not commit account output. User browser approval may be required if an official session has expired. No headless API entitlement is assumed.

Keep Kiro configuration/data/session directories outside the checkout with owner-only permissions. The retained runtime used separate `XDG_CONFIG_HOME`, `XDG_DATA_HOME` and `KIRO_HOME` locations; those locations are machine-local, not portable credential artifacts. A new agent should re-establish authorized native access, not copy a token database. Raw terminal transcripts are not deliverables.

The effective managed-cloud policy verified on November 1 included these seven explicitly approved Kiro installation/service hosts: `cli.kiro.dev`, `desktop-release.q.us-east-1.amazonaws.com`, `prod.download.cli.kiro.dev`, `oidc.us-east-1.amazonaws.com`, `runtime.us-east-1.kiro.dev`, `management.us-east-1.kiro.dev`, and `q.us-east-1.amazonaws.com`, plus the environment's package-manager preset. This is an observed environment configuration, not a universal firewall recipe or permission to widen access. After a denial, report the exact destination/action and wait for materially relevant authorization or policy evidence; do not switch routes or transfer credentials to bypass it.

- Keep **one native Kiro product writer** at a time. Record its task, allowed paths, base commit, dependencies and acceptance commands. Reviewers may work on separate original handoff documents, but do not race the product writer or substitute their own application/test implementation.
- Use **verified KIRO FREE allowance only**. Native read-only usage showed 0/50 at 2026-11-01 00:03:38 UTC, 5.95/50 before Phase 2, and **19.93/50 used at 00:32 UTC**, with displayed reset date **2026-12-01**. These are recorded estimates, not a promise of current balance. Verify entitlement/remaining free capacity before each inference phase; stop if unknown or insufficient for a bounded task. No purchases, upgrades, overages, paid allowance or billing changes.
- **Private ClaudeKit transfer is BLOCKED and not installed/applied.** The supported materialization attempt failed; no local licensed archive or read skills are claimed. Continue with the original repository guidance. Do not retrieve alternate copies, publish purchased content, or present these original docs as ClaudeKit-derived.
- Secrets, account identifiers, tokens, device-approval codes/URLs, raw authenticated transcripts, private databases, browser profiles and licensed archives stay outside Git. The durable handoff needs none of them. Preserve sanitized command results and authorship, not session secrets.
- On a new machine, use authorized private-repository access and the recorded checkpoint; inspect local changes before checkout/recovery. Install dependencies from the existing lockfile, read this file and the canonical contracts, verify whether a writer is already active, then establish any needed official native authentication without copying credential stores into the repo. Persistent login across environment replacement is not guaranteed.
- Private branches, ordinary commits/pushes and draft PRs have been authorized subject to review. Preserve main. This handoff does not authorize merge, force push, deployment, public visibility/security changes, contest submission, outreach or unrelated project access.
- Cloud tasks can continue independently of the desktop while their runtime is active, but sessions can stop for lifecycle, service, quota, network or user-authorization limits. There is **no guaranteed uninterrupted 24/7 execution or automatic resume**. Preserve a checkpoint and notify the supervising thread of blockers; do not invent a monitoring service.

## Copyable continuation request

```text
Continue Ghostlight UI work from reviewed domain code
3d1a7bb0f363ab9ce161a8eb098de08dbfd1fb59 in the current continuation checkout.
Read START_HERE.md and docs/qa/NOV01_DOMAIN_REPAIR.md,
then the canonical .kiro requirements/design/tasks and the relevant handoff brief. Verify
the actual commit, local changes, active writer and current FREE entitlement before any
model request. Preserve accepted d8a1a611cb9a704bc2052917dca8ad0fe1c5e25a and main.

Kiro is the sole product/spec/test writer; the orchestrator reviews and verifies. Continue
the real UI/persistence/import/export scope, then browser QA, following
docs/handoff/UI_DIRECTION.md and BROWSER_QA_PLAN.md. Do not reopen the completed bounded
domain repair without a new concrete failure. Check for an active UI writer before starting
another. Use one writer, explicit paths, independent oracles and
bounded corrections. After each phase stops, record full tests, lint, typecheck and build
separately, with exact failures and source identity. A passing test count is not full
domain or product acceptance. Refresh START_HERE before checkpointing.

Use free allowance only; no billing changes or alternate inference routing. ClaudeKit
remains blocked/not installed. Keep credentials, raw auth logs and purchased content out
of Git. This task covers Ghostlight; game-moba is paused. Do not merge, deploy, publish
publicly or claim live tracking, real-user validation, finished UI or 24/7 guarantees.
Report the concrete completed checkpoint, remaining work and any actual blocker.
```
