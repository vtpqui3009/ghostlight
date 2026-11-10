# Ghostlight — automated run log

Append-only. One entry per scheduled daily run, newest at the bottom. Numbers here are results that
were actually observed; anything not run is written as NOT RUN.

## 2026-11-10 — setup run (interactive, not scheduled)

- Days to deadline: 24.
- `main` fast-forwarded from `1a2f952` (scaffold) to `260bca4`, the Kiro lineage previously on
  `codex/ghostlight-domain-draft-20261031`. Nothing was rewritten or deleted; the Claude reference
  build stays on `claude/read-repo-continue-lwbi83` and the `codex/*` branches are untouched.
- Verified on `main` with a clean `npm ci`: `npm run check` → lint pass, strict typecheck pass,
  **222/222 tests pass**, Vite production build pass (46 modules).
- Independent browser observation of the production build, Chromium via Playwright: the app loads,
  demo scenes load, timeline and reports render, mobile 390 px has 0 px horizontal overflow.
  axe-core 4.14 on the first screen reported **3 violations**: `color-contrast` (3 nodes),
  `landmark-one-main` (1), `region` (2). Screenshots were kept outside the repository.
- Added `docs/SUBMISSION_ROADMAP.md`, `ops/daily-run.md`, this log, and the first Kiro brief.
- Owner reports ~4,000 Kiro credits available, so the earlier free-only ceiling and the 5-credit
  reserve pause no longer apply. The last recorded native `/usage` is still 44.65/50 of 2026-11-01;
  that is historical and must be re-checked in the next Kiro session, not assumed.
- Blocked on the owner: repository is still private; no public URL, no video, no user sessions, no
  executed competitor comparison.

## 2026-11-10 — run 2 (fired by hand; also a setup verification)

- Days to deadline: **24** (deadline 2026-12-04 14:00 PST).
- Step 0 passed. Write access to `main` was proved by pushing a throwaway ref
  (`ops/push-probe-20261110`) and it succeeded. **Deleting** that ref was then refused with
  `HTTP 403` on every attempt: this session's GitHub token may create and update refs but not
  delete them. The probe branch is therefore still on the remote and is **the owner's to delete**;
  it points at `main` and is harmless. Future runs should not repeat the probe — a dry-run push is
  enough, and the end-of-run push proves it anyway.

### Setup verification finding — keep this, do not rediscover it

A **trigger-fired fresh session in the Default environment cannot do this run.** Such a session has
no `create_session`, no `add_repo` and no GitHub access to this repository, so it cannot obtain the
code it is supposed to orchestrate. The scheduled routine must therefore be **dispatched from a
session that already holds the repository**, not left to do the work in the session the trigger
creates. Today's run was fired by hand from a session that already had the repository attached,
which is why it worked.

### Verified, from a clean `npm ci`

- `npm run check` → lint pass, strict typecheck pass, **222/222 tests pass**, production build pass
  (46 modules, 211.52 kB JS / 10.75 kB CSS). Identical to run 1.
- `npm ci` re-verified after the dependency change; lockfile is in sync.

### C2 completed — committed end-to-end and axe harness

`tests/e2e/` plus `npm run test:e2e`, reviewer-authored and labelled as such in every file.
**15 tests: 14 passed, 1 failed.** Playwright 1.63.0 (preinstalled in the container, not installed
by this run), axe-core 4.14.0 (added as the only new devDependency — plain JS, downloads nothing).
There is deliberately **no `playwright.config.*`** and Playwright is deliberately **not** a declared
dependency; the reasons are written down in `tests/e2e/README.md`.

The harness reproduced run 1's hand-observed first-screen axe result **exactly** — `color-contrast`
×3, `landmark-one-main` ×1, `region` ×2 — which is what validates it against that independent
observation. It then found **two defects the hand-run had missed**:

1. **Reports table overflows a 390 px viewport by 73 px** (`table.report-table`). First screen,
   stage and editor are clean. Assigned to **K6**.
2. **`label-content-name-mismatch` ×4 on every loaded view**, on the timeline's `role="treeitem"`
   cue headers and action rows in `src/ui/Timeline.tsx`. Assigned to **K2**.

Full observed axe counts: first screen `color-contrast` ×3, `landmark-one-main` ×1, `region` ×2;
stage `color-contrast` ×5 and `label-content-name-mismatch` ×4; reports ×6 and ×4; editor ×18 and
×4. Recorded by `--record` straight from the scan into `tests/e2e/axe-baseline.json`, never typed
in by hand.

`npm run test:e2e` is **red on purpose** and was left red. The one failure is the Reports overflow,
which lives in `src/` and so belongs to Kiro under the provenance rule. Nothing was skipped,
silenced or weakened to get a green number, and `test:e2e` is not part of `npm run check`, which
stays green. The axe baseline is a printed ledger, not a silencer: a new rule fails the run, a
baselined rule that gains nodes fails the run, and `--strict` fails on anything at all.

`eslint.config.js` gained an `**/*.mjs` block so the harness files are linted rather than ignored;
`npm run lint` is clean. No file under `src/`, `tests/domain/`, `tests/ui/`, `tests/persistence/`
or `.kiro/` was touched.

### Kiro

No Kiro work has landed since run 1 — `git log` shows no commits after `8612e94`, so there was
nothing of Kiro's to review. `ops/kiro-brief.md` still holds **K1** (the delayed-import race),
which is still the first unfinished K-item; its paste block is unchanged, and the surrounding
sections now carry today's real numbers, the "known failures you are not fixing today" table, and
sharper K2 guidance. The last recorded native `/usage` is still 44.65/50 from 2026-11-01, which is
historical and must be re-checked in the next Kiro session, not assumed.

### Blocked on the owner

- **U1 repository is still private**, U2 Pages not enabled, **U3 no video**, **U4 no user
  sessions**, U5 no executed competitor comparison, U6 not submitted to Devpost.
- **U7**: K1 has not been run in Kiro yet. Everything in section B is still waiting on a Kiro
  session.
- Delete the leftover `ops/push-probe-20261110` branch; this session cannot.
