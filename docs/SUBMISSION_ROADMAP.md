# Ghostlight — submission roadmap

Submission-level plan to the Kiroween deadline. It does **not** replace the task ledger in
[WORKFLOW.md](../WORKFLOW.md), the contracts in [START_HERE.md](../START_HERE.md) or the briefs in
`docs/handoff/`. Those stay canonical for implementation; this file tracks what the *submission*
still needs and who has to do it.

**Deadline: 2026-12-04 14:00 PST = 2026-12-05 05:00 Vietnam time.** The daily run recomputes the
days remaining; do not trust a number written here.

The event's own requirements, and how far each one is met, live in
[docs/KIROWEEN_REQUIREMENTS.md](KIROWEEN_REQUIREMENTS.md). Check against that file, not against
memory of the rules.

## Decisions of 2026-11-10

1. **`main` is the Kiro lineage.** `main` was fast-forwarded to `codex/ghostlight-domain-draft-20261031`
   (260bca4): Kiro-authored engine, domain, UI, 222 tests. All later work lands on `main`.
2. **Kiro stays the primary author of application source and domain tests.** This is the whole point
   of the lineage choice, and the "meaningful Kiro use" criterion depends on it. The automated daily
   run is an orchestrator and reviewer, exactly as Codex was: see [ops/daily-run.md](../ops/daily-run.md).
3. **A Claude-authored reference build exists on branch `claude/read-repo-continue-lwbi83`** (0ca6c42,
   69 tests, axe 0 violations, print/reduced-motion equivalents). It is **reference only**. Its code
   must not be copied into `main` silently; anything adopted from it has to be reimplemented through
   Kiro or recorded explicitly as reviewer-authored.
4. **Branches are consolidated, with one deliberate exception.** Both `codex/ghostlight-domain-draft-20261031`
   and `codex/ghostlight-kiro-cloud-wip-20261031` are fully contained in `main`. The one commit that
   was only on `codex/ghostlight-claudekit-review-20261031` — a 95-line review document — was
   cherry-picked onto `main` as `8016173`. **`claude/read-repo-continue-lwbi83` is deliberately not
   merged:** a trial merge conflicts in 9 files, including the Kiro-authored
   `src/domain/engine.ts`, `.kiro/specs/ghostlight/design.md` and `.kiro/specs/ghostlight/tasks.md`.
   It is a second, independent implementation of the same app, so merging it would both wreck the
   tree and destroy the Kiro provenance that decision 2 exists to protect. Its good ideas are
   already queued as Kiro items K2–K6.
5. **Hosting: GitHub Pages** via Actions. The workflow is prepared in the repository; enabling Pages
   is the owner's action.
6. **Kiro budget changed.** The owner reports ~4,000 credits available on 2026-11-10. The earlier
   free-only 50-credit ceiling and the 5-credit reserve pause no longer govern. Still check native
   `/usage` at the start of each Kiro session and record the observation; do not invent numbers.

## Verified state of `main` — 2026-11-10 (second run of the day)

Re-verified from a clean `npm ci`. Every number below was observed, not estimated.

| Check | Result |
|---|---|
| `npm run lint` / `typecheck` / `build` | pass (production build, 46 modules) |
| `npm test` | 222 passed (31 engine, 134 acceptance, 13 persistence, 44 action-form) |
| `npm run test:e2e` (new, reviewer-authored) | **14 passed, 1 failed** — Playwright 1.63.0, axe-core 4.14.0 |
| axe-core, first screen | **3 violations**: `color-contrast` ×3, `landmark-one-main` ×1, `region` ×2 |
| axe-core, loaded views | stage `color-contrast` ×5; reports ×6; editor ×18; plus `label-content-name-mismatch` ×4 on every loaded view |
| 390 px horizontal overflow | first screen, stage and editor clean; **Reports overflows by 73 px** (`table.report-table`) |
| Open product blocker | delayed `FileReader` import race — `docs/handoff/ACTIONFORM_CHECKPOINT.md` |
| Repository visibility | **private** |
| Public URL, video, user validation, competitor comparison | none |

### Defects the harness found that the hand-run had missed

1. **Reports table overflows a 390 px viewport by 73 px.** A real responsive defect, not an
   accessibility nit. Assigned to **K6**. Previously unrecorded.
2. **`label-content-name-mismatch` ×4 on every loaded view**, on the timeline's `role="treeitem"`
   cue headers and action rows in `src/ui/Timeline.tsx`. Assigned to **K2**. Previously unrecorded.
3. The earlier hand-run's three first-screen violations were reproduced **exactly**, which is what
   validates the harness against that independent observation.

The earlier figure of "3 axe violations" was first-screen only and used axe's default rule set.
The harness scans four screens under `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and
`best-practice`; the project's own landmark promises are best-practice rules, so that tag stays on.

## A. Only the owner can do these

| ID | Task | Done when |
|---|---|---|
| U1 | Make the repository **public** | Public on GitHub, MIT `LICENSE` visible, `.kiro/` present and not ignored. Do it with time to spare, not on the last day. |
| U2 | Enable **GitHub Pages** (Settings → Pages → Build from GitHub Actions) after the deploy workflow lands | The published URL loads the app and is written into `docs/submission.md` |
| U3 | Record and upload the **demo video**, public on YouTube, under three minutes | Link in `docs/submission.md`; follows `docs/demo-script.md`; says on screen that demo scenes are synthetic |
| U4 | **User validation**: two experienced stage managers / ASMs, one anonymised real run sheet, consent recorded | Notes in `docs/user-research/`; quotes recorded verbatim, counter-evidence included. If it does not happen, the submission says so plainly instead of implying it did. |
| U5 | **Competitor comparison executed** against CueCall, DigiScript, Standby with the same five scenarios | `docs/competitor-comparison.md` filled from actual runs, with what could not be accessed stated. Use only access you are entitled to. |
| U6 | **Devpost submission**: Costume Contest, English, judge access notes, team ≤ 3, declare what pre-dated the window | Submitted before 2026-12-04 14:00 PST. All repository commits are inside the window (first commit 2026-10-31); the research documents were written 2026-10-31 and are declared as prior planning material. |
| U7 | Run the **Kiro briefs** in `ops/kiro-brief.md` and record evidence | Each session appends real observations to `KIRO_SESSION_EVIDENCE.md`: `/usage` before and after, model and mode, what Kiro wrote, what failed, what was fixed |

## B. Kiro work — briefs prepared for you, you run them in Kiro

Ordered. The daily run keeps `ops/kiro-brief.md` pointed at the first unfinished one.

| ID | Task | Why it matters |
|---|---|---|
| K1 | **Import race repair** — latest-state import validation; scene and draft unchanged on rejection; regression test | Reproduced product defect; blocks full UI acceptance. Full brief: `docs/handoff/ACTIONFORM_CHECKPOINT.md` |
| K2 | **Accessibility fixes**: the three axe violations, one `main` landmark, all content inside landmarks, contrast to WCAG AA | Design is 20% of judging, and the project promises keyboard/contrast/reduced-motion equivalents |
| K3 | **Stage view**: required *ghost* versus modelled *solid* with physical IDs and words, not colour alone; a list/table equivalent for reduced motion, small screens and print | The category fit and the central demo beat both rest on this |
| K4 | **Findings and causal navigation**: each finding opens its failed condition and jumps to the earlier action that caused it | Requirement 4; "open the cause" is the 1:00–1:45 beat of the video |
| K5 | **Guided fix**: from a finding, insert the missing move or handoff and re-run so the verdict visibly changes | The "fix it and re-run" beat of the video; strongest single demo moment |
| K6 | **Reports**: preset, per-runner and reset, with CSV and a print stylesheet | Requirement 5; the printed sheet is what a crew actually carries |
| K7 | **Empty and error states**, and a prominent "planned state, not live tracking" banner | Honesty requirement 7, and the first screen a judge sees |
| K8 | **Automatic hook triggering verified** in a native Kiro session | Recorded as NOT VERIFIED in `KIRO_SESSION_EVIDENCE.md`; a manual invocation is not evidence of a trigger |

## C. Automated daily run (Claude) — no application source

| ID | Task | Status |
|---|---|---|
| C1 | Consolidate `main`, write this roadmap and the run contract | DONE 2026-11-10 |
| C2 | Committed **end-to-end + axe harness** (`tests/e2e/`, `npm run test:e2e`) so the browser evidence is reproducible from the repository | **DONE 2026-11-10** — 15 tests across smoke, 390 px responsive and axe on four screens; baseline ledger in `tests/e2e/axe-baseline.json`; found 2 previously unrecorded defects. No `playwright.config.*`: see `tests/e2e/README.md` for why. |
| C3 | **CI workflow** (lint, typecheck, tests, build) and the **Pages deploy workflow** with the correct Vite base path | **DONE 2026-11-10** — `.github/workflows/ci.yml` runs check then e2e on every push and pull request, installing Playwright with `--no-save` so `package.json` stays clean. The red `test:e2e` was resolved by adding `tests/e2e/known-failures.json`, a ledger with the same semantics as the axe baseline, so CI is green on written-down debt and red on anything new. `.github/workflows/pages.yml` is **`workflow_dispatch` only**: publishing is the owner's moment, and it builds with `--base=/<repo>/` on the command line rather than editing `vite.config.ts`. |
| C4 | `QA_RESULTS.md` on `main`: only checks actually run, with their real numbers | TODO |
| C5 | `README.md` refresh for a public repository: what it is, scope limits, how to run, who wrote what | TODO |
| C6 | `docs/demo-script.md`: English, timed under 3:00, following the plan's beats | TODO |
| C7 | `docs/user-research/` kit: consent, anonymisation checklist, interview questions, baseline sheet | TODO |
| C8 | `docs/competitor-comparison.md`: matrix and method, marked NOT RUN until U5 happens | TODO |
| C9 | `docs/submission.md`: Devpost draft in English, with placeholders only the owner can fill | TODO |
| C10 | Refresh `ops/kiro-brief.md` every run, and review whatever Kiro produced since the last run | Every run |
| C11 | Finish `docs/KIROWEEN_REQUIREMENTS.md` by reading the Devpost tabs directly | TODO — blocked on the network. `kiroween.devpost.com` returned `getaddrinfo ENOTFOUND` on every attempt on 2026-11-10; the hosts are allowed on the `ghostlight` environment but the proxy had not picked it up. Retry; the tab list and what to look for are at the end of that file. |

## D. Already done

- Research, validation plan and evidence appendix (2026-10-31), caveats intact.
- Kiro T1 specifications and steering, independently reviewed, GO recorded.
- Kiro T2 domain engine, parser, reports, edit layer, persistence and the action editor, with 222
  passing tests, lint, strict typecheck and a production build.
- A Claude-authored reference build on its own branch, with its own QA record.

## Standing limits

No deployment, publication, repository visibility change, account creation, purchase, outreach or
submission happens automatically. Those are the owner's actions, listed in section A.
