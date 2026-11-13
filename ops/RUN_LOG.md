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

## 2026-11-10 — run 7 (interactive): realign the plan around the verified rules

The owner confirmed the Kiro credits from a dashboard screenshot: bonus pool `kiroween-2026` at
**0 / 4000 used, 52 days left**, next to a Kiro Free allowance at 44.65 / 50 that resets 12-01. So
the hackathon budget is intact and untouched — and the free allowance is nearly gone, so the work
should be spent against the bonus pool. **U8 is done**, not pending.

- **A dated schedule to 2026-12-04** is now in `docs/SUBMISSION_ROADMAP.md`, split into the owner's
  Kiro sessions, the owner's away-from-keyboard work, and the automated run's work. The ordering
  follows what the criteria actually reward: the repository going public and lining up the two
  interviews are week 1 because they have the longest lead time, and K4 and K5 come before the
  prettier work because three beats of the video cannot be filmed without them.
- **C12 done** — `docs/kiro-writeup.md`. This is a required submission field and the place
  Technological Implementation is actually scored, so it answers Devpost's published question list
  in order. Everything that has not happened is a `TO FILL` block rather than a sentence written as
  if it had: MCP, custom agents, Kiro powers, PBT, the hook trigger, and the user sessions. It also
  carries a "what Kiro got wrong" section, which is the most useful part — the non-converging Haiku
  writer, the self-referential test that proved itself right, and the refusal to relax the compiler.
- **C7 done** — `docs/user-research/`. Protocol, plain-language consent, a 45-minute session guide
  and a findings template whose first section is counter-evidence. The guide deliberately runs a
  no-demo baseline and a paper control before the tool is ever mentioned, so the reaction has
  something to be measured against, and it separates instruction time from task time.
- **C6 revised.** The first draft spent 0:25 of 2:50 on "how Kiro built this" — written before the
  rules were read. Kiro usage is scored through the separate written write-up; the video is scored
  on Presentation. The Kiro section is now 0:10 and the reclaimed time went to who the tool is for
  and the honest limit. K10 was added to its pre-shoot checklist, because Presentation rewards a
  presentation that is "creative and memorable".

Nothing in `src/` was touched. Remaining for the reviewer: C8 competitor comparison template, C9
submission description, C13 blog and social drafts.

## 2026-11-10 — run 8 (interactive): the reviewer's lane is finished

**Section C of the roadmap has no TODO left.** Everything that does not require Kiro, a browser
recording, a real stage manager, or the owner's own voice is now drafted and in the repository.

- **C8** `docs/competitor-comparison.md` — the claim split into its three separately testable parts,
  the same five bundled scenarios to run against CueCall, DigiScript and Standby, and a results
  table that is honestly full of NOT RUN. It carries two rules that matter: only use access you are
  entitled to, and "not visible in the public docs" is not the same as "the product cannot do it".
  If a competitor turns out to do all three parts, the instruction is to say so and narrow the claim.
- **C9** `docs/submission.md` — the Devpost form fields, the bonus-prize tick list, and the full
  description. `TO FILL` on the app URL, the video, the comparison paragraph and the user sessions.
- **C13** `docs/blog-post.md` — a complete blog draft to be rewritten in the owner's own words. The
  **social post is deliberately not drafted**: that prize is judged on "original thoughts vs AI
  writing", so the file gives the constraints and the raw material and stops there. Drafting it
  would have actively lost the prize.

Verified after all of it: `npm run check` green, **227/227 tests**, production build, and
`npm run test:e2e -- --strict` **17 passed, 0 failed**. Nothing in `src/` was touched.

### What is left, and who owns it

Everything remaining needs either Kiro, a camera, a person, or the owner's own words:

- **Kiro**: K4, K5, K3, K10, K7, K11, K12, K8, K6's CSV half, K9.
- **Owner, away from the keyboard**: make the repository public and check the About sidebar; enable
  Pages; run the two interviews; run the competitor comparison; record and upload the video;
  publish the blog and social posts; answer the bonus-prize questions; submit.

The daily run's standing instruction now applies: with section C empty it should review whatever
Kiro has produced, sharpen the next brief, re-run the checks, and say it is waiting on the owner.

## 2026-11-10 — run 9 (interactive, owner-directed): K4 and K5

The owner asked for K4 and K5 and offered to send a Kiro key. **Kiro cannot run from this
container regardless of any key**, and that was checked rather than assumed: `kiro` and `kiro-cli`
are not installed; the `kiro-cli` package on npm is version **0.0.1**, which is not the official
CLI (the real one is 2.37.0) and was not installed; and `app.kiro.dev` and `kiro.dev` are both
unreachable (000) because the `ghostlight` environment allows only the two Devpost hosts. Kiro also
authenticates through a Builder ID browser flow, not an API key. The owner was told not to send one.

So K4 and K5 were implemented by the reviewer, under the same explicit direction as K1 and K2, and
are named in the README's authorship table.

### K4 — the cause is now a control

`src/ui/StageView.tsx` rendered the cause as inert text with raw ids —
"Earlier action a1 in cue cue-1". It is now a button that names the cue and what the action does in
words — *Cue "Act 1 Scene 1" — Actor A collects Sealed Letter (letter-A)* — and selecting it jumps
to that step. An `initial` cause has nowhere to jump to, so it says plainly that the starting
declaration is where to look rather than pretending to be a link.

The union narrowing had to move out of the JSX to typecheck cleanly; the cause and fix nodes are
built above the `return`.

### K5 — the guided fix

`src/domain/guidedFix.ts`, deliberately narrow. Two unambiguous cases:

- zones agree and only the holder differs → insert a **handoff** from the planned holder to the
  required one, immediately before the failing step;
- zones differ and neither side has a holder → insert a **move**.

Everything else returns advice in words and **no apply button**. Consumed reuse gets a specific
sentence naming the replenish step and a second instance, because there is no edit that fixes it.

The invariant that matters: a fix changes the **plan**, never the authored `requiredSource`. A fix
that edited the requirement would silence the finding by destroying the thing that makes the check
mean anything. `tests/domain/guidedFix.test.ts` asserts it directly, along with insertion position,
a clean re-run afterwards, id collision avoidance, and that the original scene object is untouched.

### Verified

`npm run check` green — **235/235 tests**. `npm run test:e2e -- --strict` — **20 passed, 0 failed**,
including three new tests for this beat: the cause names its cue and jumps to the right earlier
step, the fix is described before it is applied and the re-run is clean, and a consumed instance is
refused an apply button. The widened contrast sweep still reports **0** across two schemes, three
demos and three views.

One of those three tests failed first because **my assertion was wrong, not the app**: I expected
the cause of the carryOff mismatch to be the carryOff, when it is the earlier `collect` that put
the letter in Actor A's hands. The app was right.

### Noticed, not fixed

The selected timeline row is painted mint green even when it is the failing step, so a red error
sits on a green background. It reads as "this one is fine". Pre-existing, not introduced here, and
it belongs with **K10** or **K7**.

### Bonus prize

The owner did not register for Kiroween 2025, so **Best Ghost of Kiroween Past is not available**.
Removed from the submission checklist rather than left as an open question.

## 2026-11-10 — run 10 (scheduled, automated): the harness was lying by omission

**24 days to the deadline.** Section C had no TODO left, so this run followed the standing
instruction — review, re-verify, sharpen the brief, report — and Step 2 turned up something real.

First, a gap in this log: the three commits before this one (`73c2578`, `f7e32bd`, `95eff47`, the
Kiro session how-to and its two corrections) came from an interactive session that never wrote its
own entry. Recorded here so the history is continuous. No `src/` changes since run 9, so **the
owner has not run a Kiro session yet.**

### Step 0 and Step 2 — verified, not assumed

`git push --dry-run origin main` → `Everything up-to-date`, exit 0. Write access proven without
creating a probe branch.

From a clean `npm ci`: `npm run check` **green — 235/235 tests**, production build, 48 modules.
`npm run test:e2e -- --strict` → **20 passed, 0 failed** on the harness as committed.

And that last number was the problem.

### The finding — 19 contrast failures the harness could not see

Chasing run 9's parked note ("the selected timeline row is painted mint green even when it is the
failing step"), I read the CSS, then measured computed styles out of a real Chromium page, then ran
axe-core over three demos × three views × two schemes with a failing row selected:

| Scope | `color-contrast` nodes |
|---|---|
| Committed harness, one demo, row selected | **1** light, **6** dark |
| Wider sweep, 3 demos × 3 views × 2 schemes | **19** — every one on the stage view, all with a row selected |

Worst measured ratios: **3.91:1** (`#5a5a5a` on `#7ed4ad`) in light, **1.91:1** (`#e8e5dc` on
`#5eb88f`) in dark. First screen, reports and editor are clean in **both** schemes.

Cause: `.action-item.selected` in `src/styles.css` sets `background: var(--mint)` and **no
foreground**, so the row's text keeps the colour it had against parchment. The same class of bug
K2 already fixed everywhere else with role tokens.

**Why no scan caught it: nothing in this app is painted mint until a timeline row is clicked, and
no scan had ever clicked one.** The committed harness also ran the light scheme only. Run 5's
widened sweep — the source of the "0 contrast failures across two schemes" figure repeated in the
roadmap and in `docs/KIROWEEN_REQUIREMENTS.md` — was a one-off script that was never committed, and
it shared the same blind spot. That 0 was honestly measured and still wrong about the app. **The
claim is corrected in both documents and in `QA_RESULTS.md` rather than quietly dropped.**

### What I did and did not do about it

The fix is in `src/styles.css`, which is **Kiro's**. I did not touch it. **K2 is reopened** for it
in `ops/kiro-briefs/K2.md`, with the measured numbers, the one-line cause, the token-pair shape of
the fix, and the note that the same rule paints a *rejected* step green — so the failing step reads
as the passing one. That part overlaps K10 and the brief says so.

The harness gap is **mine**, and it is closed (added as roadmap **C14**):

- `tests/e2e/lib/page.mjs` — a `colorScheme` argument and a `selectFailingAction` helper.
- `tests/e2e/specs/accessibility.spec.mjs` — **9 scans, up from 4**: the four originals, a selected
  failing row in both schemes, and dark-scheme runs of the first screen, reports and editor.
- A bootstrap bug fixed on the way: `--record` asserted a baseline entry already existed before it
  would record one, so a newly added screen could never be recorded at all.

Verified after the change: `npm run test:e2e -- --record` → 25 passed; plain `npm run test:e2e` →
**25 passed, 0 failed** (green on written-down debt, which is what CI runs); `--strict` → **23
passed, 2 failed**, failing on exactly the two selected-row scans and nothing else. The ledger
behaves as designed in all three modes.

**I added C14 beyond the original section C.** The contract says not to invent scope, and this is me
saying plainly that I did: a harness reporting green over a live WCAG AA failure on the main view is
not honest evidence, and making the claim reproducible is the job this run exists to do. Object if
you disagree — it is confined to `tests/e2e/`.

### Second finding — the ghost does not render

`src/ui/StageView.tsx` emits glyph classes `required | planned | match | mismatch | other`.
`src/styles.css` defines `.prop-glyph.ghost` and `.prop-glyph.solid`, which **match nothing**, and
has no rule for `required`, `planned` or `other` — so three of the five types paint as a plain white
box. Confirmed in the browser: `prop-glyph planned` computes to `rgb(255, 255, 255)`.

So the ghost-versus-solid visual language — the thing the Costume Contest entry is built on —
exists in the stylesheet and is applied to nothing. It survives only in the word labels, which is
why 235 tests and nine axe scans all pass over it: the information is present, the visual language
is not. **Anywhere this repository says "ghost versus solid already exists", it is true of the CSS
and false of the screen.** Not fixed here; it is `src/`. It makes K10 materially bigger and
undercuts K3's premise, and both briefs now say so.

### Step 4 — the brief queue

`ops/kiro-brief.md` was still carrying the **completed K1 brief** with 2026-11-10-morning numbers
(222 tests, 14 passed / 1 failed, 33 axe violations, a 73 px overflow) — a Kiro session opening it
today would have started from a task already done and baselines that had all moved. Rewritten to
point at **K8** with today's verified numbers.

Two briefs that the roadmap claimed existed did not exist. Written:

- **`K11.md`** — property-based testing. This is **not new scope**: `.kiro/specs/ghostlight/tasks.md`
  §2.6 and `design.md` line 235 already specify `tests/pbt/*.test.ts` with fast-check and name the
  seven properties. Verified today: `tests/pbt/` does not exist and `fast-check` is not a
  dependency. Kiro wrote the spec; Kiro should close it. The brief leans hard on reporting a
  negative result honestly if the properties all hold first time.
- **`K10.md`** — the haunting interface, now carrying the dead-CSS finding above.

**K12 is deliberately left unbriefed** — which of MCP, custom agents, Crew or powers is worth using
depends on what the first sessions teach, and a brief written now would be a guess. The roadmap no
longer claims otherwise.

Queue is now **K8 → K2 (reopened) → K11 → K10 → K3 → K7 → K6 CSV → K12 → K9**. K2's reopened part
goes ahead of K11 because it is a live AA failure on the main view and is roughly one token pair.
K8 stays first: it is ten minutes, costs no code, and the how-to's reasoning for it still holds.

One thing checked so it does not mislead during K8: the hook script prints
`[ghostlight hook] NOT RUN — dependencies not installed` when `node_modules` is absent. **That
message is itself proof the hook fired.** The brief now says so, with `npm ci` first.

### Blocked, and on whom

Still **nothing from the owner's lane**: repository private, no Pages, no public URL, no video, no
user sessions, no competitor comparison, **and no Kiro session since 2026-11-01**. Potential Impact
is 20% of the score and is currently zero evidence.

Inside week 1 the two long-lead items are **U1 (make the repository public)** and **U4 (line up two
stage managers)**. U4 has the longest lead time of anything left and cannot be compressed later.

Also noted, not acted on: `origin/ops/push-probe-20261110` from run 2 is **still on the remote**.
Deleting a remote branch is the owner's call, so it is flagged rather than removed.

## 2026-11-11 — run 11 (scheduled, automated): a flaky strict scan

Days left: **23** to 2026-12-04 14:00 PST. Step 0: `git push --dry-run origin main` succeeded.

### What ran

`npm ci`, `npm run check`: lint, typecheck and build pass; **235 tests passed**; build 48 modules.
`npm run test:e2e`: **25 passed, 0 failed**. `--strict`: **23 passed, 2 failed**, the two selected-row
contrast scans (K2) and nothing else. `npm audit --omit=dev`: 0 vulnerabilities. No Kiro commits
since run 10; `src/` untouched. All section-C items were already DONE, so no new C-item was started.

### Finding: the strict scan was non-deterministic — reviewer-authored harness bug

The first strict run today reported 24 passed / 1 failed ("baselined violation is fixed") and a dark
count of 4 or 6 on later runs, against an unchanged build. Cause: `.action-item` has
`transition: background 0.2s`, and `selectFailingAction` scanned immediately after the click, so axe
read a half-blended background. Fix, in `tests/e2e/lib/page.mjs` (reviewer-authored): wait for
`document.getAnimations()` to finish before returning. Verified: 5 consecutive `--strict` runs all
gave 23 passed / 2 failed with exactly 1 light and 6 dark nodes. Without the fix the counts varied
across 4 runs. This means the light-scheme "fixed" reading seen earlier today was an artefact, not a K2 fix.

### Brief and records

`ops/kiro-brief.md` still points at K8 and is dated today; nothing in it needed changing. Roadmap
state table re-dated; its figures are unchanged.

### Blocked, and on whom

Unchanged, all the owner's: private repository, no Pages/public URL, no video, no user sessions, no
competitor comparison, and still no Kiro session (K8 is the next one). U1 and U4 remain the
long-lead items. `origin/ops/push-probe-20261110` is still on the remote; deleting it is the owner's call.

## 2026-11-12 — run 12 (scheduled, automated): the deploy path, loaded for the first time

Days left: **22** to 2026-12-04 14:00 PST. Step 0: `git fetch`, `git pull --ff-only`, then
`git push --dry-run origin main` → `Everything up-to-date`, exit 0. Write access proven, no probe
branch created.

### What ran

`npm ci`, then `npm run check`: lint, strict typecheck and build pass — production build **48
modules**; **235 tests passed** (31 engine, 134 acceptance, 13 persistence, 44 action-form, 8
guided-fix, 5 import-guard). `npm run test:e2e`: **25 passed, 0 failed**. `--strict`: **23 passed,
2 failed**, the two selected-row contrast scans (K2) and nothing else. `npm audit --omit=dev`: **0
vulnerabilities**. Every figure identical to run 11.

**The strict suite is now stable.** Run 11 fixed its non-determinism by waiting on
`document.getAnimations()`; six consecutive `--strict` runs today all gave 23/2 with the same 1
light and 6 dark nodes. That fix holds.

**CI on `main` is green** — checked through the Actions API, not assumed: run 15 on c39ca9d,
conclusion `success`. All 15 runs to date are CI; `pages.yml` has **never executed**.

No Kiro commits since run 10, and **no Kiro session since 2026-11-01**. `src/` and `.kiro/`
untouched by me, as the provenance rule requires. Section C had no TODO left, so this run reviewed,
re-verified, and closed a gap in my own lane.

### Finding — the deploy path had never been loaded, and it was one character from silent failure

`.github/workflows/pages.yml` builds with `--base="/${{ github.event.repository.name }}/"`, because
a Pages project page is served from `/<repo>/`. That the build *emits* those paths was already in
`QA_RESULTS.md`. What had never happened is anyone **loading the result in a browser** — and the
workflow is `workflow_dispatch`-only by design, so **its first real execution would have been on
publication day**, which is the owner's U2 moment.

Two things made this worth a run rather than a glance:

1. **The main harness could not have caught it.** `tests/e2e/lib/server.mjs` falls back to
   `index.html` for any unknown path — correct for testing client-side behaviour, and here it would
   hand a 404'd `/assets/index.js` the HTML document and let a wrong base path look like a pass.
2. **A wrong base is silent.** If the repository name resolved empty the base would be `//`, and
   `//assets/index.js` is a protocol-relative URL to a host called `assets`. **The vite build still
   succeeds.** Only a browser sees it.

So, as roadmap **C15**, `tests/e2e/verify-pages-build.mjs` (reviewer-authored, header says so): it
runs the workflow's exact build into a temp directory — leaving `dist/` alone for the other specs —
and serves it the way Pages does, with nothing outside the prefix and a 404 that stays a 404.

**Result: 11 of 11 checks pass.** Build succeeds; both local asset references start with
`/ghostlight/`; no protocol-relative URL; `GET /ghostlight/` → 200; the app mounts and renders
`"Ghostlight"`; the "Missing Handoff" demo loads and renders `.app-main`; **0 console errors, 0
uncaught errors, 0 failed or 4xx/5xx requests, 0 requests escaping the prefix** (6 requests, all
under `/ghostlight/`).

**I verified the check has teeth rather than assuming it.** At `--base=//` it fails 5 of 11 and
exits 1: `ERR_NAME_NOT_RESOLVED` on both assets, `#root h1` never appears, blank page. That is the
negative control, and it is the reason `pages.yml` gained a step that fails the job loudly if the
repository name resolves empty instead of publishing a dead page.

**What this does not prove**, and the records say so: Pages being enabled, `actions/deploy-pages`
itself, the published URL, or HTTPS. It proves the uploaded artefact is a working bundle at the
right path. If the published page is blank, suspect configuration, not the build.

A bug of my own, found and fixed on the way: when the app failed to boot, the scene check reported
`FAIL … — .app-main rendered`, because the detail string read the wrong variable. A harness that
prints a false reason under a correct verdict is the kind of thing this project exists not to do.

### Also corrected — `QA_RESULTS.md` had drifted

Found while recording today's numbers, all in my lane:

- The browser section still said **"Fifteen tests over three specs"**; it is **25 over five**, and
  the accessibility line still said four screens rather than **9 scans**.
- The production build was recorded at **46 modules**; it is **48**.
- Worst of the three: the 390 px section still called the Reports table's **73 px overflow** "the
  one known failure, written down in `known-failures.json`" — it was **fixed on 2026-11-10** and
  that file is empty, which the same document said two paragraphs later. A reader would have hit a
  flat contradiction.

Also cleared a stale parenthetical in `tests/e2e/README.md` claiming `QA_RESULTS.md` "does not
exist yet".

### Brief and records

`ops/kiro-brief.md` still points at **K8** and its numbers are still correct; re-dated to today,
with an explicit note that no Kiro session has run in between, plus the green CI line. Roadmap state
table re-dated and given the Pages row; **C15** recorded, and **U2** now notes the bundle is
pre-verified and that Pages on a private repository needs a paid plan, so U1 comes first.

Queue unchanged: **K8 → K2 (reopened) → K11 → K10 → K3 → K7 → K6 CSV → K12 → K9**.

### Blocked, and on whom

Unchanged, and all the owner's: repository **private**, no Pages, no public URL, no video, no user
sessions, no competitor comparison, and **still no Kiro session** — K8 is ten minutes and closes a
line that has read NOT VERIFIED since 2026-10-31. Potential Impact is 20% of the score and remains
at zero evidence.

**Week 1 of the roadmap's schedule ends 2026-11-16 and none of its owner items have started.** U1
(public) and U4 (two stage managers) are the long-lead items; U4 cannot be compressed later, and
nothing in my lane can substitute for it. `origin/ops/push-probe-20261110` is still on the remote;
deleting it remains the owner's call.

## 2026-11-13 — schedule stopped, work handed to Kiro (interactive, owner-directed)

The owner asked for the code to be merged, the schedule stopped, and everything remaining noted so
the rest can be delegated to Kiro.

- **Schedule stopped.** `trig_012WDrc1gUfyZWx4aLW8uidw` is **disabled**, not deleted, so it can be
  re-enabled. The 2026-11-13 child session (`session_01MHgzFB4DigPJGf7WJk3A8A`) had already finished
  and was idle, so no cloud session is writing to the repository.
- **Merge.** `main` already carried every reviewer commit. Branch contents were compared rather than
  trusted by ancestry: `codex/ghostlight-claudekit-review-20261031` shows "unmerged" only because its
  one commit was cherry-picked; the file it adds is byte-identical in `main`. The other two `codex/*`
  branches and `ops/push-probe-20261110` are fully contained.
- **`claude/read-repo-continue-lwbi83` was deliberately not merged.** A trial merge today conflicts
  in **10 files**, including the Kiro-authored `src/domain/engine.ts`,
  `.kiro/specs/ghostlight/design.md` and `.kiro/specs/ghostlight/tasks.md`. It is a second,
  independent implementation of the same app. Merging it would wreck the tree and erase the Kiro
  provenance the project is built on, which is the reason the Kiro lineage was chosen as `main` on
  2026-11-10. This is a decision, not an omission, and it is recorded in the handoff.
- **Verified from a clean `npm ci`:** `npm run check` green — lint, strict typecheck, **235 tests**,
  production build **48 modules**. `npm run test:e2e -- --strict` — **23 passed, 2 failed**, both the
  selected-row contrast: 1 node in the light scheme, 6 in the dark. That is the reopened K2 and is
  the first thing a Kiro session should fix after K8.
- **Written:** `docs/HANDOFF_TO_KIRO.md` — the single list of what remains, with the Kiro queue in
  order, the owner-only items, every `TO FILL` placeholder, the cautions, and the branch status. The
  run contract now carries a STOPPED banner; the README and roadmap point at the handoff.
- **Could not do:** delete `origin/ops/push-probe-20261110`. This session's GitHub grant allows
  creating and updating refs but not deleting them. The owner must remove it.

Nothing in `src/` was touched.
