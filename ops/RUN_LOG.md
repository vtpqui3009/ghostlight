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
