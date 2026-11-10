# Ghostlight — checks actually run

What has been executed against `main`, with the real numbers. Anything not listed was not run.
These are correctness checks on the implementation; **none of them is evidence that the tool is
useful to a stage manager.**

Last updated 2026-11-10. The `tests/e2e/` harness and this file are reviewer-authored; the
application and its domain, UI and persistence tests are Kiro's. See `ops/daily-run.md` for the
provenance rule and `KIRO_SESSION_EVIDENCE.md` for what Kiro actually did.

## Reproducing all of it

```bash
npm ci
npm run check      # lint, strict typecheck, unit tests, production build
npm run build && npm run test:e2e
```

CI runs exactly these on every push and pull request: `.github/workflows/ci.yml`.

## Automated — 2026-11-10, from a clean `npm ci`

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | clean |
| Types | `npm run typecheck` (`tsc -b`, strict) | clean |
| Unit and acceptance tests | `npm test` | **222 passed, 0 failed** — 31 engine, 134 domain acceptance, 13 persistence, 44 action-form helper |
| Production build | `npm run build` | built, 46 modules |
| Project-page build | `npx vite build --base=/ghostlight/` | emits `/ghostlight/assets/…` |
| End-to-end and accessibility | `npm run test:e2e` | **14 passed, 1 known failure**, exit 0 |
| Runtime dependencies | `npm audit --omit=dev` | **0 vulnerabilities** |
| All dependencies | `npm audit` | 12 (9 moderate, 1 high, 2 critical) — all dev-only, see below |

## Browser checks — Chromium, via `tests/e2e/`

Fifteen tests over three specs, driven against the production build in `dist/`, not a dev server.

- **Smoke**: the build boots with no console or uncaught page errors; the honesty subtitle is on the
  first screen; the empty state offers all six demo scenes; a demo loads and the timeline renders
  its cues; stage, reports and editor all render; selecting a failing action keeps the app alive and
  reports a verdict.
- **Responsive, 390 px**: no horizontal overflow on the first screen, stage or editor. **Reports
  overflows by 73 px** — `table.report-table`. This is the one known failure, written down in
  `tests/e2e/known-failures.json` and owned by Kiro item K6.
- **Accessibility**: axe-core 4.14.0 over four screens under `wcag2a`, `wcag2aa`, `wcag21a`,
  `wcag21aa` and `best-practice`.

### Accessibility debt, as measured

| Screen | Violations |
|---|---|
| First screen | `color-contrast` ×3, `landmark-one-main` ×1, `region` ×2 |
| Stage view | `color-contrast` ×5, `label-content-name-mismatch` ×4 |
| Reports view | `color-contrast` ×6, `label-content-name-mismatch` ×4 |
| Editor view | `color-contrast` ×18, `label-content-name-mismatch` ×4 |

All of it is open and owned by **Kiro item K2**. The counts in `tests/e2e/axe-baseline.json` are
written by `--record` straight from the scan, never typed in by hand. The baseline is a ledger, not
a silencer: a rule that is not baselined fails the run, a baselined rule that gains nodes fails the
run, and `--strict` fails on anything at all.

`label-content-name-mismatch` is on the timeline's `role="treeitem"` cue headers and action rows:
the accessible name does not contain the visible text, so a speech-input user cannot say what they
see.

## Known failures and debt

| Item | Owner | Where |
|---|---|---|
| Reports table overflows 390 px by 73 px | Kiro K6 | `tests/e2e/known-failures.json` |
| 33 accessibility violations across four screens | Kiro K2 | `tests/e2e/axe-baseline.json` |
| Delayed `FileReader` import race — a read completing after a draft opens replaces the scene | Kiro K1 | `docs/handoff/ACTIONFORM_CHECKPOINT.md` |
| Dev dependencies carry 2 critical and 1 high advisory — `vitest` ≤4.0.0-beta.19, `tinypool` ≤2.1.1, `vite` ≤6.4.3 | Kiro K9 | this file |

Nothing ships to the browser from the advisory set: `npm audit --omit=dev` is clean, and all four
packages are build and test tooling. Dependency modernisation has been open since 2026-10-31, when
npm reported the selected ESLint version unsupported.

## What these checks do **not** show

- **No user validation.** No stage manager or ASM has used this. Every user gate in
  `GHOSTLIGHT_VALIDATION_PLAN.md` is still NOT RUN.
- **No executed competitor comparison.** CueCall, DigiScript and Standby were read about in the
  research pass only.
- **Native Kiro hook triggering is NOT VERIFIED.** A hook was written and manually invoked; an
  automatic trigger has never been observed. `KIRO_SESSION_EVIDENCE.md` records this explicitly.
- Chromium only. No Firefox, no WebKit, no real mobile device, no screen reader, no 200%/400% zoom,
  no 320 px, no print check. axe catches a subset of accessibility problems; a clean axe run is not
  an accessible product.
- The A01–A18 acceptance matrix from `KIRO_CODING_HANDOFF.md` is not claimed to pass in full.
- The engine models a plan. It cannot tell you whether the real objects are where the plan says.
