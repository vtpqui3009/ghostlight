# Ghostlight end-to-end + accessibility harness

**Provenance: reviewer-authored.** Everything under `tests/e2e/`, plus the `test:e2e` script and
the `**/*.mjs` block in `eslint.config.js`, was written by the automated daily run (Claude) acting
as orchestrator and reviewer — **not** by Kiro. Kiro authors `src/**` and the domain, UI and
persistence tests. See [`ops/daily-run.md`](../../ops/daily-run.md) for the provenance rule and
`ops/RUN_LOG.md` for what has actually been observed. (`QA_RESULTS.md` is roadmap item C4 and does
not exist yet; until it does, the run log is the record.)

This harness exists so that the browser evidence in `ops/RUN_LOG.md` is **reproducible from the
repository** instead of resting on a screenshot somebody took once.

## Running it

```bash
npm ci
npm run build          # the harness tests the production build in dist/, not the dev server
npm run test:e2e
```

Flags:

| Flag | Effect |
|---|---|
| *(none)* | Run every spec. Known accessibility debt is printed but does not fail the run. |
| `--strict` | Fail on **any** accessibility violation, baselined or not. Use this once Kiro item K2 has landed. |
| `--record` | Rewrite `axe-baseline.json` from this run's scan. Never hand-edit the counts; re-record them. |
| `--headed` | Run with a visible browser, for local debugging. |

### Playwright

The harness drives the **`playwright` library directly** rather than `@playwright/test`, and there
is deliberately no `playwright.config.ts`. The cloud container that executes the daily run ships a
preinstalled Playwright (1.63.0) and Chromium; installing a second, differently versioned copy into
`node_modules` would not find that browser. So Playwright is **not** a declared dependency — the
runner resolves whatever the machine provides and **fails loudly** if there is none. It never skips
quietly, because a harness that silently does nothing is worse than no harness.

On a machine without Playwright (a fresh laptop, or CI):

```bash
npm i -D playwright@1.63.0 && npx playwright install chromium
```

If a matching Chromium lives outside the Playwright package, point the harness at it:

```bash
GHOSTLIGHT_CHROMIUM=/opt/pw-browsers/chromium npm run test:e2e
```

`axe-core` **is** a declared devDependency, because it is plain JavaScript injected into the page
and downloads nothing.

## What it covers

| Spec | What it proves |
|---|---|
| `specs/smoke.spec.mjs` | The production build boots with no console or uncaught errors; the honesty subtitle is on the first screen; the empty state offers all six demo scenes; a demo loads and the timeline renders cues; stage, reports and editor all render; selecting a failing action does not break the app. |
| `specs/responsive.spec.mjs` | No horizontal overflow at 390 px on the first screen and in each view, naming the widest offending element when it fails; and whether keyboard focus can reach the timeline. |
| `specs/accessibility.spec.mjs` | axe-core against four screens, under `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` **and `best-practice`**. |

`best-practice` is included on purpose: the project's own promises — one `main` landmark, all
content inside landmarks — are axe best-practice rules rather than WCAG success criteria, and
dropping the tag would have hidden two of the three violations the first hand-run found.

## The baseline is a ledger, not a silencer

`axe-baseline.json` records accessibility debt that already exists in `src/`. The daily run is
forbidden from touching application source, so it records the debt instead of hiding or fixing it.
The rules are arranged so the harness cannot go green by concealing a problem:

- a violation rule **not** in the baseline → **failure** (a new regression);
- a baselined rule with **more** nodes than recorded → **failure** (it got worse);
- a baselined rule at or under its recorded count → printed as `KNOWN DEBT` on every run;
- a baselined rule that has disappeared → printed as `FIXED`, with a note to shrink the baseline.

Every baselined entry is owned by **Kiro item K2**. When K2 lands, empty the arrays and run
`--strict`.

## Current status

`npm run test:e2e` is **red by design**: it fails on one genuine product defect it found on its
first run — the Reports table overflows a 390 px viewport by 73 px. That belongs to Kiro, not to
the reviewer, so it is recorded in `ops/kiro-brief.md` and left failing. Do not silence it, and do
not fix it here; a reviewer-authored patch to `src/` would break the provenance rule the project
depends on.

Because of that, `test:e2e` is intentionally **not** part of `npm run check`.
