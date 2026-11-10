# Ghostlight — submission roadmap

Submission-level plan to the Kiroween deadline. It does **not** replace the task ledger in
[WORKFLOW.md](../WORKFLOW.md), the contracts in [START_HERE.md](../START_HERE.md) or the briefs in
`docs/handoff/`. Those stay canonical for implementation; this file tracks what the *submission*
still needs and who has to do it.

**Deadline: 2026-12-04 14:00 PST = 2026-12-05 05:00 Vietnam time.** The daily run recomputes the
days remaining; do not trust a number written here.

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
4. **Hosting: GitHub Pages** via Actions. The workflow is prepared in the repository; enabling Pages
   is the owner's action.
5. **Kiro budget changed.** The owner reports ~4,000 credits available on 2026-11-10. The earlier
   free-only 50-credit ceiling and the 5-credit reserve pause no longer govern. Still check native
   `/usage` at the start of each Kiro session and record the observation; do not invent numbers.

## Verified state of `main` — 2026-11-10

| Check | Result |
|---|---|
| `npm run lint` / `typecheck` / `build` | pass |
| `npm test` | 222 passed (31 engine, 134 acceptance, 13 persistence, 44 action-form) |
| axe-core on the first screen | **3 violations**: color-contrast ×3, landmark-one-main, region |
| Open product blocker | delayed `FileReader` import race — `docs/handoff/ACTIONFORM_CHECKPOINT.md` |
| Repository visibility | **private** |
| Public URL, video, user validation, competitor comparison | none |

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
| C2 | Committed **end-to-end + axe harness** (`tests/e2e/`, Playwright config, `npm run test:e2e`) so the browser evidence is reproducible from the repository | TODO |
| C3 | **CI workflow** (lint, typecheck, tests, build) and the **Pages deploy workflow** with the correct Vite base path | TODO |
| C4 | `QA_RESULTS.md` on `main`: only checks actually run, with their real numbers | TODO |
| C5 | `README.md` refresh for a public repository: what it is, scope limits, how to run, who wrote what | TODO |
| C6 | `docs/demo-script.md`: English, timed under 3:00, following the plan's beats | TODO |
| C7 | `docs/user-research/` kit: consent, anonymisation checklist, interview questions, baseline sheet | TODO |
| C8 | `docs/competitor-comparison.md`: matrix and method, marked NOT RUN until U5 happens | TODO |
| C9 | `docs/submission.md`: Devpost draft in English, with placeholders only the owner can fill | TODO |
| C10 | Refresh `ops/kiro-brief.md` every run, and review whatever Kiro produced since the last run | Every run |

## D. Already done

- Research, validation plan and evidence appendix (2026-10-31), caveats intact.
- Kiro T1 specifications and steering, independently reviewed, GO recorded.
- Kiro T2 domain engine, parser, reports, edit layer, persistence and the action editor, with 222
  passing tests, lint, strict typecheck and a production build.
- A Claude-authored reference build on its own branch, with its own QA record.

## Standing limits

No deployment, publication, repository visibility change, account creation, purchase, outreach or
submission happens automatically. Those are the owner's actions, listed in section A.
