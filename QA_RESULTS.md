# Ghostlight — checks actually run

What has been executed against `main`, with the real numbers. Anything not listed was not run.
These are correctness checks on the implementation; **none of them is evidence that the tool is
useful to a stage manager.**

Last updated 2026-11-10, after K1, K2 and the responsive half of K6 landed. The `tests/e2e/` harness and this file are reviewer-authored; the
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
| Unit and acceptance tests | `npm test` | **227 passed, 0 failed** — 31 engine, 134 domain acceptance, 13 persistence, 44 action-form helper, 5 import guard |
| Production build | `npm run build` | built, 46 modules |
| Project-page build | `npx vite build --base=/ghostlight/` | emits `/ghostlight/assets/…` |
| End-to-end and accessibility | `npm run test:e2e` | **17 passed, 0 failed** |
| Same, with every known failure fatal | `npm run test:e2e -- --strict` | **17 passed, 0 failed** |
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

### Accessibility, as measured

`tests/e2e/axe-baseline.json` and `tests/e2e/known-failures.json` are both **empty**, and
`--strict` passes, so there is no recorded accessibility debt and no ledgered failing test.

The baseline previously held 33 violations over four screens. While clearing them the scan was
widened to **two colour schemes × three demo scenes × three views**, which found **79** contrast
failures rather than 32: the dark scheme put pale text on hard-coded light surfaces at 1.15:1, and
used `--plum` as text at 3.69:1. That sweep now reports **0**.

Colour is handled with role tokens — `--button-bg/-fg`, `--surface-error/-warning/-success`,
`--header-bg/-fg`, `--heading-text`, `--secondary-bg/-fg`, `--badge-fg` and `--success-text`,
`--warning-text`, `--error-text`, `--uncertain-text` — so a contrast fix happens once per role
rather than once per selector. The vivid status colours remain for fills and borders, where they
are not carrying text.

**The committed harness still scans one scheme, one demo, four screens.** The wider sweep was a
one-off script and is not in the repository, so CI would not catch a dark-scheme regression. That
gap is real and is not claimed otherwise.

## Known failures and debt

| Item | Owner | Where |
|---|---|---|
| CSV export for the reports does not exist | Kiro K6 | `ops/kiro-briefs/K6.md` |
| Dev dependencies carry 2 critical and 1 high advisory — `vitest` ≤4.0.0-beta.19, `tinypool` ≤2.1.1, `vite` ≤6.4.3 | Kiro K9 | this file |
| The committed a11y scan covers one colour scheme and one demo | reviewer | this file |

Closed on 2026-11-10, by the reviewer rather than by Kiro (see the README's authorship table): the
delayed `FileReader` import race, the 33 accessibility violations, and the Reports 390 px overflow.

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
