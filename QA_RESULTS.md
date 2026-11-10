# Ghostlight — checks actually run

What has been executed against `main`, with the real numbers. Anything not listed was not run.
These are correctness checks on the implementation; **none of them is evidence that the tool is
useful to a stage manager.**

Last updated 2026-11-10, after the scheme-and-selection harness gap was closed and K2 was partly reopened. The `tests/e2e/` harness and this file are reviewer-authored; the
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
| Unit and acceptance tests | `npm test` | **235 passed, 0 failed** — 31 engine, 134 domain acceptance, 13 persistence, 44 action-form helper, 5 import guard, 8 guided fix |
| Production build | `npm run build` | built, 46 modules |
| Project-page build | `npx vite build --base=/ghostlight/` | emits `/ghostlight/assets/…` |
| End-to-end and accessibility | `npm run test:e2e` | **25 passed, 0 failed** — green on written-down debt |
| Same, with every known failure fatal | `npm run test:e2e -- --strict` | **23 passed, 2 failed** — the selected-row contrast, and nothing else |
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

`tests/e2e/known-failures.json` is **empty**. `tests/e2e/axe-baseline.json` holds exactly one rule
on two screens, recorded from a real scan today and described below.

The baseline previously held 33 violations over four screens. Clearing them went through role
tokens — `--button-bg/-fg`, `--surface-error/-warning/-success`, `--header-bg/-fg`,
`--heading-text`, `--secondary-bg/-fg`, `--badge-fg` and `--success-text`, `--warning-text`,
`--error-text`, `--uncertain-text` — so a contrast fix happens once per role rather than once per
selector. The vivid status colours remain for fills and borders, where they are not carrying text.

### Correction, 2026-11-10 — the earlier "0 across two schemes" figure does not hold

A previous run widened the scan by hand to two colour schemes × three demos × three views, found 79
contrast failures, fixed them, and recorded the sweep as reporting **0**. That 0 was measured, but
the sweep was blind in a specific way: **nothing in this app is painted mint until a timeline row is
clicked**, and no scan had ever clicked one.

Re-measured today with axe-core 4.14.0, with a failing row selected:

| Scope | `color-contrast` nodes |
|---|---|
| Committed harness, one demo, failing row selected | **1** light, **6** dark |
| Reviewer sweep, 3 demos × 3 views × 2 schemes | **19** — all on the stage view, all with a row selected |

`.action-item.selected` sets `background: var(--mint)` and no foreground, so the row's text keeps
the colour it had against parchment: 3.91:1 in light, 1.91:1 in dark where `--mint` is re-tinted.
The first screen, reports and editor are clean in **both** schemes. The same rule also paints a
*rejected* step green, so the failing step reads as a passing one — a correctness problem in the
visual language, not a nit.

The fix is in `src/styles.css`, so it is Kiro's: **K2 is reopened** for it, with these numbers, in
`ops/kiro-briefs/K2.md`.

### The gap that hid it is closed

The harness previously scanned one scheme, one demo and four screens, and the wider sweep was a
one-off script that was never committed — so CI could not have caught a dark-scheme regression.
That gap was recorded here rather than papered over, and it is now **fixed**:

- `tests/e2e/lib/page.mjs` takes a `colorScheme` argument and exports `selectFailingAction`.
- `tests/e2e/specs/accessibility.spec.mjs` runs **9** scans, not 4: the four originals, a selected
  failing row in both schemes, and dark-scheme runs of the first screen, reports and editor.
- A bootstrap bug in the harness was fixed on the way — `--record` asserted that a baseline entry
  already existed before it would record one, so a newly added screen could never be recorded.

The claim is now reproducible by anyone who runs `npm run test:e2e -- --strict`. That is the only
kind of accessibility claim this project should make.

### Also found, and not fixed here: the ghost does not render

`src/ui/StageView.tsx` emits glyph classes `required | planned | match | mismatch | other`.
`src/styles.css` defines `.prop-glyph.ghost` and `.prop-glyph.solid`, which match **nothing**, and
has no rule for `required`, `planned` or `other` — so three of the five types paint as a plain white
box. Confirmed in a real browser: `prop-glyph planned` computes to
`background-color: rgb(255, 255, 255)`.

The ghost-versus-solid distinction therefore survives only in the word labels (`REQUIRED:`,
`BEFORE:`, `MATCH:`, `MISMATCH:`) — which is why no test caught it, and why documents saying "ghost
versus solid already exists" are true of the stylesheet and false of the screen. It is `src/`, so it
is Kiro's: owned by **K10**, with K3's premise corrected to match.

## Known failures and debt

| Item | Owner | Where |
|---|---|---|
| CSV export for the reports does not exist | Kiro K6 | `ops/kiro-briefs/K6.md` |
| Dev dependencies carry 2 critical and 1 high advisory — `vitest` ≤4.0.0-beta.19, `tinypool` ≤2.1.1, `vite` ≤6.4.3 | Kiro K9 | this file |
| Selected timeline row: `color-contrast` 1 node light, 6 dark — a rejected step also reads as green | Kiro K2 (reopened) | `ops/kiro-briefs/K2.md`, `tests/e2e/axe-baseline.json` |
| The ghost-versus-solid visual language does not render — `.ghost` / `.solid` match nothing | Kiro K10 | `ops/kiro-briefs/K10.md` |
| ~~The committed a11y scan covers one colour scheme and one demo~~ | reviewer | **closed 2026-11-10** — 9 scans, both schemes, selected row |

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
