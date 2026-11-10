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

## 2026-11-10 — run 3 (interactive, owner-directed)

- Days to deadline: 24.
- Branch cleanup asked for by the owner: `ops/push-probe-20261110` **could not be deleted**. Four
  attempts at `git push origin --delete` and `git push origin :refs/heads/...` each ended in
  `send-pack: unexpected disconnect while reading sideband packet` / `the remote end hung up
  unexpectedly`, while ordinary pushes from the same session succeeded minutes earlier. This
  session's GitHub grant appears to allow creating and updating refs but not deleting them, and the
  GitHub MCP server has no branch-deletion tool. The branch is fully contained in `main`
  (`8612e94`), so nothing is lost by removing it; it is left to the owner.
- `docs/KIROWEEN_REQUIREMENTS.md` added in the previous commit; the Devpost tabs are still unread.
  `kiroween.devpost.com` returned `getaddrinfo ENOTFOUND` on five attempts across about forty
  minutes, including after a `ghostlight` environment was created with the host allowed. Tomorrow's
  run inherits that environment, so **C11 should be retried first thing**.
- **C3 done.** `.github/workflows/ci.yml` (check → e2e, Playwright installed with `--no-save`) and
  `.github/workflows/pages.yml` (`workflow_dispatch` only; builds with `--base=/<repo>/` passed on
  the command line so `vite.config.ts` stays untouched).
- To make CI meaningful rather than permanently red, the harness gained
  `tests/e2e/known-failures.json`: a hand-written ledger carrying the one open failure, the Reports
  390 px overflow, with its owner (K6) and reason. Verified both directions — with the ledger the
  run exits 0; with an entry for a test that actually passes it exits 1 and names the entry to
  delete. Nothing was skipped, silenced or weakened, and `--strict` still fails on everything.
- Verified here: `npm run check` green (222/222 tests), `npm run test:e2e` 14 passed / 1 known
  failure / exit 0, and `npx vite build --base=/ghostlight/` emits `/ghostlight/assets/...`.
- Blocked on the owner, unchanged: repository private, Pages not enabled, no video, no user
  sessions, no executed competitor comparison, and **no Kiro session has run since 2026-11-01** —
  every K-item is still waiting.

## 2026-11-10 — run 4 (interactive, owner-directed): the Kiro queue

The owner asked for "the Kiro part". Kiro cannot be driven from this container — the CLI is not
installed here and the Builder ID login lives on the owner's machine — and under the provenance rule
the reviewer does not author `src/`. So this run did the part that is the reviewer's: it read the
code and turned every remaining K-item into a brief with measured evidence.

- Added `ops/kiro-briefs/` with K2, K3, K4, K5, K6, K7, K8, K9 and a README giving the run order,
  each with a block to paste straight into Kiro, acceptance checks and a "must not change" list.
- **Reading the source corrected three items that had been scoped from assumption:**
  - **K4 is small.** The causal trace is already computed *and already printed* —
    `src/ui/StageView.tsx` around line 112 renders "Cause: Earlier action a1 in cue cue-1". It is
    inert text using raw ids; the work is making it navigable, not building causality.
  - **K3 is small.** Ghost versus solid already exists with word labels, `REQUIRED:` and `BEFORE:`,
    typed `'required' | 'planned' | 'match' | 'mismatch'`. The missing piece is only the plain list
    equivalent that defaults under `prefers-reduced-motion`.
  - **K6 is half done.** `window.print()` and an `@media print` block already exist. CSV export does
    not exist anywhere in `src/`. So K6 is the 390 px overflow plus CSV, not "build the reports".
- **K2 now names three causes rather than 33 nodes:** the empty-state branch of `src/App.tsx`
  renders outside `<main>`, so the first screen has no landmark; contrast is a token problem on
  `.small` and `--text-mid`/`--text-light`, not 32 separate selectors; and the two
  `label-content-name-mismatch` strings are a singular/plural slip ("1 action" versus "N actions")
  and an `aria-label` that omits the visible `ID: … • code` line, both in `src/ui/Timeline.tsx`.
- `docs/SUBMISSION_ROADMAP.md` section B rewritten with the corrected scope and links; the Step 4
  contract now says to refresh an existing brief rather than write one from scratch.
- No application source was touched. `npm run check` green (222/222), `npm run test:e2e` 14 passed
  with the one ledgered failure, exit 0.
- Still blocked on the owner, unchanged: repository private, Pages not enabled, no video, no user
  sessions, no competitor comparison, and **no Kiro session since 2026-11-01**.

## 2026-11-10 — run 5 (interactive, owner-directed): K1, K2 and half of K6 in `src/`

The owner instructed the reviewer to write application source directly, after being told that it
weakens the Kiro-authorship evidence the lineage choice exists to protect. That instruction is
recorded in `docs/SUBMISSION_ROADMAP.md` decision 6, the exception clause in `ops/daily-run.md`,
and an authorship table in `README.md` naming every file. It does not carry over to later runs.

### K1 — the delayed-import race

`src/ui/importGuard.ts` (new) takes a **getter**, not a boolean, so the decision is made when the
file read completes rather than when it started. `src/App.tsx` holds the draft flag in a ref and
wires the guard; `src/ui/ImportExport.tsx` calls the newest `onImport` instead of the one its
render captured.

Proven both ways, which is the part that matters: `tests/e2e/specs/import-race.spec.mjs` drives a
controlled `FileReader` that holds its completion. With the fix both tests pass. With `src/`
reverted — and the build genuinely rebuilt, which the first attempt at this check got wrong — both
fail with the reported symptom, "the held read replaced the scene even though a draft was open".

That reverted run also exposed a **mirror-image defect the original brief only half described**:
the old code did not merely let through imports that should have been blocked, it also *wrongly
blocked* a read that completed after a deliberate Cancel. Both directions are now covered.

`tests/ui/importGuard.test.ts` adds 5 unit tests for the late-binding property itself.

### K2 — accessibility

Three causes, as the brief predicted: the empty state rendered outside `<main>`; contrast was one
token pair repeated 32 times (`#ffffff` on `#d97832`, measured 3.14:1); and two `aria-label`
strings in `Timeline.tsx` contradicted their visible text — a singular/plural slip and a label that
omitted the visible `ID: … • code` line. Both labels were removed so the visible text *is* the
accessible name, with the status added as `sr-only` text rather than a parallel sentence.

Then the scan was widened to **two colour schemes × three demos × three views**, which found
**79** contrast failures where the committed baseline had seen 32. The dark scheme was badly
broken: hard-coded light surfaces (`#fef4e6`, `#fce8e8`, `#e8f5ea`) kept their light values under
`prefers-color-scheme: dark`, giving 1.15:1, and `--plum` was used as body text at 3.69:1. Fixed
with role tokens rather than per-selector patches. The sweep now reports **0**.

### K6 — the responsive half

Each report table now sits in a `.table-scroll` region that is focusable and labelled, so the table
scrolls instead of the page and a keyboard user can still reach it. `known-failures.json` is empty.

### Verified

`npm run check` green: lint, strict typecheck, **227/227 tests**, production build.
`npm run test:e2e -- --strict` — **17 passed, 0 failed**, with an empty `axe-baseline.json`.
Widened contrast sweep: **0** across both schemes, three demos, three views.

The harness caught one of my own regressions on the way: renaming `main.app-main` to a plain `div`
broke three specs that waited on that selector. That is the harness doing its job.

### Still open

CSV export (K6's other half), K4, K5, K3, K7, K8, K9 — all still Kiro's. The committed a11y scan
covers one scheme and one demo, so CI would not catch a dark-scheme regression; that gap is
recorded in `QA_RESULTS.md` rather than papered over. Repository still private, no Pages, no video,
no user sessions, no competitor comparison, and no Kiro session since 2026-11-01.

## 2026-11-10 — run 6 (interactive): the Devpost tabs, read directly at last

`kiroween.devpost.com` became reachable once the proxy picked up the `ghostlight` environment.
**`WebFetch` still fails on it** with `getaddrinfo ENOTFOUND`, because it resolves DNS itself rather
than going through the session proxy; `curl` works. That is the route to use for this host.

All six tabs read: Overview, Rules, Resources, Updates, FAQ, and the tab list itself.
`docs/KIROWEEN_REQUIREMENTS.md` is rewritten from that read and no longer carries the 2026-10-31
"not re-verified" caveats.

### What the read changed

- **Vietnam is not on the excluded list.** The owner is eligible. Teams up to 3; one category only.
- **The judging weights our notes claimed are correct**: five criteria, 20% and 10 points each, after
  a pass/fail Stage One on theme fit and tool use.
- **Technological Implementation is entirely about Kiro**, and specifically rewards "a **variety** of
  Kiro tools used impactfully" and "was there **experimentation**?". We have specs, steering and one
  hook whose automatic trigger has never been observed. Added **K12** for variety, and **K11** for
  property-based testing, which the submission form asks about by name and `main` does not have.
- **A "write-up on how Kiro was used" is a required submission field**, with a published list of
  what judges want covered. That is effectively the marking scheme for 20% of the score and we had
  no deliverable for it. Added **C12**.
- **Costume Contest wants "a haunting user interface … spooky design elements that enhance your
  app's function."** Ghostlight's interface is a restrained parchment-and-plum theatre desk. The
  ghost-versus-solid idea fits the wording exactly; the visual language does not yet. Added **K10**,
  with the research plan's ban on jump scares and hidden controls intact.
- **The licence must be visible in GitHub's About section**, not merely present as a file. U1 now
  says to look at the sidebar after going public.
- **Credits must be redeemed by 2026-12-04** and expire 2026-12-31. Added **U8**.
- **Bonus prizes**: the Blog Prize has **100 winners** paying 2,000 bonus Kiro credits — the cheapest
  prize on the board, and `KIRO_SESSION_EVIDENCE.md` is most of the draft already. Best Demo is
  automatic. Social Blitz is judged on "original thoughts vs AI writing", so the owner must write it.
  Ghost of Kiroween Past needs a fact only the owner has. Added **C13**, **U9**, **U10**.
- Two updates are posted; neither changes anything. Indonesia became eligible on 2026-11-04.

Nothing in `src/` was touched in this run.
