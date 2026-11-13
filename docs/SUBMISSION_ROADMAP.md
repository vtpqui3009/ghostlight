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
6. **2026-11-10, later the same day: the owner directed the reviewer to write `src/` directly**,
   after being told that doing so weakens the "meaningful Kiro use" evidence that decision 2 and
   decision 3 exist to protect. K1, K2 and the responsive half of K6 were implemented by the
   reviewer under that instruction. Exactly which files is recorded in the README's authorship
   table, not left to the git history. The remaining K-items are still Kiro's unless the owner says
   otherwise.
7. **Kiro budget changed.** The owner reports ~4,000 credits available on 2026-11-10. The earlier
   free-only 50-credit ceiling and the 5-credit reserve pause no longer govern. Still check native
   `/usage` at the start of each Kiro session and record the observation; do not invent numbers.

## Verified state of `main` — 2026-11-12 (latest automated run)

Re-verified from a clean `npm ci`. Every number below was observed today, not estimated or carried
forward.

| Check | Result |
|---|---|
| `npm run lint` / `typecheck` / `build` | pass (production build, 48 modules) |
| `npm test` | **235 passed** (31 engine, 134 acceptance, 13 persistence, 44 action-form, 8 guided-fix, 5 import-guard) |
| `npm run test:e2e` | **25 passed, 0 failed** — green on written-down debt |
| `npm run test:e2e -- --strict` | **23 passed, 2 failed** — the selected-row contrast below, and nothing else |
| axe-core, 7 clean screens | **0 violations** — first screen, stage, reports, editor (light); first screen, reports, editor (dark) |
| axe-core, selected failing row | **`color-contrast` 1 node light, 6 nodes dark** — newly found, see below |
| 390 px horizontal overflow | **clean on all four views**, both schemes |
| `known-failures.json` | **empty** |
| Pages project-page build, loaded in a browser | **11 checks passed** — `node tests/e2e/verify-pages-build.mjs`; boots and loads a scene from `/ghostlight/`, 0 console errors, 0 failed requests |
| Dev-only advisories | 12 (9 moderate, 1 high, 2 critical); `npm audit --omit=dev` clean — K9 |
| Repository visibility | **private** |
| Public URL, video, user validation, competitor comparison | none |

### Correction — "0 contrast failures across two schemes" was wrong

An earlier run recorded a widened sweep reporting **0** contrast failures across two schemes, three
demos and three views, and that figure was repeated in this file and in
`docs/KIROWEEN_REQUIREMENTS.md`. **It does not hold.** Re-measured today with axe-core 4.14.0:

| Scope | `color-contrast` nodes |
|---|---|
| Committed harness, one demo, failing row selected | **1** light, **6** dark |
| Reviewer sweep: 3 demos × 3 views × 2 schemes | **19** — every one on the stage view with a row selected |

The earlier sweep was not dishonest, it was blind in a specific way: **nothing in this app is
painted mint until a timeline row is clicked**, and no scan had ever clicked one. `.action-item.selected`
sets `background: var(--mint)` with no paired foreground, so the row's own text keeps the colour it
had against parchment — 3.91:1 in light, and 1.91:1 in dark where `--mint` is re-tinted. First
screen, reports and editor are clean in both schemes.

Two consequences, both acted on today:

1. The fix is `src/styles.css`, so it is **Kiro's**. **K2 is reopened** for it, with the measured
   numbers, in [`ops/kiro-briefs/K2.md`](../ops/kiro-briefs/K2.md).
2. The harness gap is the reviewer's, and it is closed — C14 below. The claim is now reproducible
   by anyone who runs `npm run test:e2e -- --strict`, which is the only kind of claim this project
   should be making.

### Also found: the ghost does not render

`src/ui/StageView.tsx` emits glyph classes `required | planned | match | mismatch | other`.
`src/styles.css` defines `.prop-glyph.ghost` and `.prop-glyph.solid`, which **match nothing**, and
has no rule for `required`, `planned` or `other` — so three of the five types render as a plain
white box. Confirmed in a real browser: a `prop-glyph planned` element computes to
`background-color: rgb(255, 255, 255)`.

The ghost-versus-solid distinction survives only in the word labels (`REQUIRED:`, `BEFORE:`,
`MATCH:`, `MISMATCH:`), which is why no test caught it — the information is present, the visual
language is not. **Anywhere this repository says "ghost versus solid already exists", read it as
true of the stylesheet and false of the screen.** It makes K10 bigger than it looked and K3's
premise shaky; both briefs now say so.

### Defects the harness found that the hand-run had missed

1. **Reports table overflowed a 390 px viewport by 73 px.** Fixed 2026-11-10 (K6's responsive half).
2. **`label-content-name-mismatch` ×4 on every loaded view.** Fixed 2026-11-10 (K2).
3. The earlier hand-run's three first-screen violations were reproduced **exactly**, which is what
   validated the harness against an independent observation.
4. **The selected-row contrast above** — found only once the harness learned to click a row.

> **2026-11-13 — automation stopped, work handed to Kiro.** The scheduled daily run is disabled and no
> cloud session writes to the repository. The consolidated list of what remains, in order, is in
> [`HANDOFF_TO_KIRO.md`](HANDOFF_TO_KIRO.md); this file stays as the detailed record.

## Schedule to the deadline

24 days from 2026-11-10 to **2026-12-04 14:00 PST**. The budget is 4,000 untouched Kiro credits.
Dates are suggestions; the ordering is not — it follows what the five criteria actually reward and
what blocks what.

| Week | Kiro (owner, in Kiro) | Owner, away from the keyboard | Automated run / reviewer |
|---|---|---|---|
| **1 — Nov 10–16** | K4 cause navigation, K5 guided fix. These unblock three beats of the video. | **Make the repo public (U1)** and check the About sidebar shows MIT. Enable Pages (U2). **Line up the two stage managers (U4)** — this has the longest lead time of anything left. | C12 Kiro write-up draft, C7 interview kit, revise C6 so the video stops spending 25s on Kiro. |
| **2 — Nov 17–23** | K3 list equivalent, K10 the haunting interface, K7 empty state. | **Run the two interviews.** Run the competitor comparison (U5) against CueCall, DigiScript, Standby with the same five scenarios. | C8 comparison template, C9 submission description, C13 blog and social drafts. |
| **3 — Nov 24–30** | K11 property-based testing, K8 verify the hook actually triggers, K12 whichever of MCP / custom agents / Crew / powers genuinely helps. K6 CSV. | **Record and upload the video (U3).** Publish the blog post and the social post (U10). | Fold the interview findings into the description honestly, including anything that contradicts the idea. Re-run every check. |
| **4 — Dec 1–4** | K9 dependency advisories, only if the suite stays green. Nothing else new. | **Submit on Devpost (U6)** with days to spare — no edits are possible after the deadline. Answer the bonus-prize questions (U9). | Final conformance pass against `docs/KIROWEEN_REQUIREMENTS.md`. Freeze. |

### Why this order

- **The repository going public and the interviews are week 1** because they have the longest lead
  time and everything else can proceed around them. Potential Impact is 20% and is currently zero.
- **K4 and K5 come before the prettier work** because three beats of the demo script cannot be
  filmed without them, and the video gates Presentation.
- **K11 and K12 are real work, not box-ticking.** Technological Implementation asks about variety
  and experimentation by name, and the submission form asks about property-based testing
  specifically. But the research plan's warning stands: do not add an MCP server or a power purely
  to have used one.
- **Nothing new lands in week 4.** A broken suite in the final days costs more than any feature.

### Credit budget

4,000 credits, 0 used. The 2026-10-31 sessions spent about 33 credits of the free 50 to produce the
specs, the engine and 222 tests — so the remaining work is well within budget. Check `/usage` at the
start and end of every session and record both numbers; the budget is not the constraint, but the
evidence is worth having.

## A. Only the owner can do these

| ID | Task | Done when |
|---|---|---|
| U1 | Make the repository **public** | Public on **GitHub** (GitLab and Bitbucket are rejected). The licence must be "detectable and visible at the top of the repository page (in the About section)" — after going public, **look at the About sidebar and confirm GitHub shows "MIT License"**; a `LICENSE` file that GitHub fails to detect does not satisfy this. `.kiro/` present and not in `.gitignore` — the rules say ignoring it "could disqualify your submission". |
| U2 | Enable **GitHub Pages** (Settings → Pages → Build from GitHub Actions) after the deploy workflow lands | The published URL loads the app and is written into `docs/submission.md`. The bundle the workflow uploads is **pre-verified** as of 2026-11-12 — see C15 — so if the published page is blank, suspect Pages configuration rather than the build. Note Pages on a **private** repository needs a paid plan, so U1 comes first. |
| U3 | Record and upload the **demo video**, public on YouTube, under three minutes | Link in `docs/submission.md`; follows `docs/demo-script.md`; says on screen that demo scenes are synthetic |
| U4 | **User validation**: two experienced stage managers / ASMs, one anonymised real run sheet, consent recorded | Notes in `docs/user-research/`; quotes recorded verbatim, counter-evidence included. If it does not happen, the submission says so plainly instead of implying it did. |
| U5 | **Competitor comparison executed** against CueCall, DigiScript, Standby with the same five scenarios | `docs/competitor-comparison.md` filled from actual runs, with what could not be accessed stated. Use only access you are entitled to. |
| U6 | **Devpost submission**: Costume Contest, English, judge access notes, team ≤ 3, declare what pre-dated the window | Submitted before 2026-12-04 14:00 PST. All repository commits are inside the window (first commit 2026-10-31); the research documents were written 2026-10-31 and are declared as prior planning material. |
| U7 | Run the **Kiro briefs** in `ops/kiro-brief.md` and record evidence | Each session appends real observations to `KIRO_SESSION_EVIDENCE.md`: `/usage` before and after, model and mode, what Kiro wrote, what failed, what was fixed |
| U8 | ~~Redeem the Kiro credits~~ | **DONE 2026-11-10** — dashboard shows `kiroween-2026` bonus credits at **0 / 4000 used, 52 days left**. The separate Kiro Free allowance is at 44.65 / 50 and resets 12-01, so spend the bonus pool, not the free one. |
| U9 | Answer two bonus-prize questions only you can | (a) Did you register for **Kiroween 2025**? If so, claim Best Ghost of Kiroween Past — it is verified against their records. (b) Are you a student, or a startup founder? Each has its own bonus prize and its own evidence requirements. |
| U10 | Publish the **blog post** and the **social post** | Blog: any third-party platform, during the submission period, mentioning Kiroween 2026 — **100 winners get 2,000 bonus Kiro credits**. Social: a public post beginning with `#KiroweenHackathon26`, judged on "original thoughts vs AI writing", so write it yourself. Drafts are C13. |

## B. Kiro work — briefs prepared for you, you run them in Kiro

Every item below has a written brief in [`ops/kiro-briefs/`](../ops/kiro-briefs/) **except K12**,
which is deliberately unwritten — what is worth trying there depends on what the first sessions
teach you. Each brief carries measured evidence and a block to paste straight into Kiro.
`ops/kiro-brief.md` always points at the first unfinished one. Current run order, from
[`ops/kiro-session-howto.md`](../ops/kiro-session-howto.md) with the 2026-11-10 insertion of the
reopened K2: **K8 → K2 (reopened) → K11 → K10 → K3 → K7 → K6 CSV → K12 → K9**.

Three of these were scoped wrongly before the code was read on 2026-11-10, and are smaller than
they looked. That is recorded here so the credits are not spent rebuilding what exists.

| ID | Task | State and why it matters |
|---|---|---|
| K1 | **Import race repair** | **DONE 2026-11-10 — by the reviewer, not Kiro.** `src/ui/importGuard.ts` takes a getter so the decision is made when the read completes. Proven both ways: with the fix the controlled delayed-read test passes; with `src/` reverted it fails with the reported symptom. A second, mirror-image bug surfaced — the old code also *wrongly blocked* an import that completed after a deliberate Cancel; both directions are now covered. |
| K2 | **Accessibility** | **MOSTLY DONE 2026-11-10 — by the reviewer, not Kiro. REOPENED the same day for one part.** The original 33 violations are fixed with role tokens (`--button-*`, `--surface-*`, `--header-*`, `--heading-text`, `--secondary-*`, `--badge-fg`, `--*-text`) rather than per-selector patches; the widened scan had found 79 where the baseline saw 32, because the dark scheme kept hard-coded light surfaces and used `--plum` as text. **Reopened:** with a failing timeline row selected, axe measures `color-contrast` **1 node light, 6 dark** — `.action-item.selected` sets a background and no foreground. No scan had ever clicked a row. One token pair to fix, and the same rule paints a *rejected* step green. [`K2.md`](../ops/kiro-briefs/K2.md) |
| K4 | **Make the cause navigable** | **DONE 2026-11-10 — by the reviewer, not Kiro.** The cause is now a real button naming its cue and what the action does in words — "Cue “Act 1 Scene 1” — Actor A collects Sealed Letter (letter-A)" — and selecting it jumps to that step. An `initial` cause says plainly that the starting declaration is where to look. Original note: **smaller than it looked.** The cause is already computed *and already printed* in `StageView.tsx` — "Earlier action a1 in cue cue-1". It is just inert and uses raw ids. [`K4.md`](../ops/kiro-briefs/K4.md) |
| K5 | **Guided fix** — offer the one unambiguous edit, apply it, replay | **DONE 2026-11-10 — by the reviewer, not Kiro.** `src/domain/guidedFix.ts` handles exactly two unambiguous cases: zones agree and only the holder differs (insert a handoff), and zones differ with no holder either side (insert a move). Everything else, consumed reuse included, gets advice in words and **no apply button**. The edit always changes the plan and never the authored `requiredSource` — there is a test asserting that. Original note: Deliberately narrow: holder-only and zone-only mismatches, nothing else. [`K5.md`](../ops/kiro-briefs/K5.md) |
| K3 | **List equivalent and reduced motion** | **Re-read the brief before starting — its premise moved.** The word labels (`REQUIRED:` / `BEFORE:`) do exist, but ghost-versus-solid as a *visual* distinction does not render at all (see the state section above), so "it already exists" is true only of the CSS. What is missing is still the plain list carrying the same facts, defaulting on `prefers-reduced-motion`. [`K3.md`](../ops/kiro-briefs/K3.md) |
| K6 | **Reports: 390 px overflow and CSV** | **Half done 2026-11-10 — by the reviewer.** The 73 px overflow is fixed: each table sits in a focusable, labelled scroll region, so `known-failures.json` is now empty. **CSV export is still open and still Kiro's.** [`K6.md`](../ops/kiro-briefs/K6.md) |
| K7 | **Empty state and first screen** | The honesty subtitle is already there and smoke-tested; the empty state itself is seven bare buttons under "No Scene Loaded". Do K2 first — it rewrites the same region. [`K7.md`](../ops/kiro-briefs/K7.md) |
| K8 | **Automatic hook triggering verified** in a native Kiro session | Recorded as NOT VERIFIED since 2026-10-31; a manual invocation is not evidence of a trigger. Cheap, and it is exactly what Technological Implementation asks about. [`K8.md`](../ops/kiro-briefs/K8.md) |
| K10 | **A haunting interface** — the category's actual wording | **Bigger than it looked, and now briefed.** Costume Contest asks for "a haunting user interface that's polished and unforgettable … spooky design elements that **enhance your app's function**". The ghost-versus-solid idea is exactly that — and it **does not currently render**: `.prop-glyph.ghost` and `.prop-glyph.solid` match nothing the component emits, and `required`, `planned` and `other` have no rule at all, so they paint as plain white boxes. This is the chosen category's own criterion, so it is not optional polish. Still no jump scares and no hidden controls. [`K10.md`](../ops/kiro-briefs/K10.md) |
| K11 | **Property-based testing, through Kiro** | **Not new scope — an unfinished Kiro task, now briefed.** `.kiro/specs/ghostlight/tasks.md` §2.6 and `design.md` line 235 already specify `tests/pbt/*.test.ts` with fast-check and name the properties: single custody, terminal consumption, new-instance replenishment, deterministic ordering, immutable rejection, causal ordering, own-key-safe dictionaries. Verified 2026-11-10: `tests/pbt/` does not exist and `fast-check` is not a dependency. The submission's write-up asks about PBT by name. [`K11.md`](../ops/kiro-briefs/K11.md) |
| K12 | **Variety and experimentation with Kiro tools** | **Deliberately not briefed.** Technological Implementation (20%) rewards "a **variety** of Kiro tools used impactfully" and asks "was there **experimentation**?". Today: specs, steering, one hook whose automatic trigger has never been observed (K8). Untouched: MCP, custom agents, Kiro Crew, Kiro powers. A brief written now would be a guess — decide after the first two sessions, and record what each tool actually changed. Do not bolt one on for a checklist. |
| K9 | **Dependency advisories** — `vitest` ≤4.0.0-beta.19 and `tinypool` ≤2.1.1 critical, `vite` ≤6.4.3 high | All dev-only — `npm audit --omit=dev` is clean — but a public repository shows them. Last, because a major bump can break the 222 Kiro-authored tests. [`K9.md`](../ops/kiro-briefs/K9.md) |

## C. Automated daily run (Claude) — no application source

| ID | Task | Status |
|---|---|---|
| C1 | Consolidate `main`, write this roadmap and the run contract | DONE 2026-11-10 |
| C2 | Committed **end-to-end + axe harness** (`tests/e2e/`, `npm run test:e2e`) so the browser evidence is reproducible from the repository | **DONE 2026-11-10** — 15 tests across smoke, 390 px responsive and axe on four screens; baseline ledger in `tests/e2e/axe-baseline.json`; found 2 previously unrecorded defects. No `playwright.config.*`: see `tests/e2e/README.md` for why. |
| C3 | **CI workflow** (lint, typecheck, tests, build) and the **Pages deploy workflow** with the correct Vite base path | **DONE 2026-11-10** — `.github/workflows/ci.yml` runs check then e2e on every push and pull request, installing Playwright with `--no-save` so `package.json` stays clean. The red `test:e2e` was resolved by adding `tests/e2e/known-failures.json`, a ledger with the same semantics as the axe baseline, so CI is green on written-down debt and red on anything new. `.github/workflows/pages.yml` is **`workflow_dispatch` only**: publishing is the owner's moment, and it builds with `--base=/<repo>/` on the command line rather than editing `vite.config.ts`. |
| C4 | `QA_RESULTS.md` on `main`: only checks actually run, with their real numbers | **DONE 2026-11-10** — real numbers, the accessibility debt per screen, the four open items with owners, and an explicit list of what the checks do not show. |
| C5 | `README.md` refresh for a public repository: what it is, scope limits, how to run, who wrote what | **DONE 2026-11-10** — written for a reader who is not the project, with a table stating plainly which paths are Kiro's and which are the reviewer's. |
| C6 | `docs/demo-script.md`: English, timed under 3:00, following the plan's beats | **DONE 2026-11-10, revised the same day after the rules were read** — the Kiro section shrank from 0:25 to 0:10 because Kiro usage is scored through the separate written write-up, not the video; the time went back to who the tool is for. Also **DONE 2026-11-10** — includes a "before you can shoot this" table mapping four beats to the K-items they depend on, so the video is not filmed against a build that cannot show them. Shooting order: K1 → K2 → K4 → K5 → K3 → K6, then record. |
| C7 | `docs/user-research/` kit: consent, anonymisation checklist, interview questions, baseline sheet | **DONE 2026-11-10** — protocol, plain-language consent, a 45-minute session guide with a no-demo baseline section and a paper control, and a findings template that puts counter-evidence first. |
| C8 | `docs/competitor-comparison.md`: matrix and method, marked NOT RUN until U5 happens | **DONE 2026-11-10** — the claim split into its three testable parts, the same five scenarios to run against each tool, a results table full of NOT RUN, and the rule that "not visible in the public docs" is not the same as "the product cannot do it". |
| C9 | `docs/submission.md`: Devpost draft in English, with placeholders only the owner can fill | **DONE 2026-11-10** — form fields, the bonus-prize tick list, and the description. `TO FILL` for the app URL, the video, the comparison paragraph and the user sessions. |
| C10 | Refresh `ops/kiro-brief.md` every run, and review whatever Kiro produced since the last run | Every run |
| C11 | Finish `docs/KIROWEEN_REQUIREMENTS.md` by reading the Devpost tabs directly | **DONE 2026-11-10** — all six tabs read directly once the proxy picked up the `ghostlight` environment. `WebFetch` still fails on this host because it resolves DNS itself; `curl` through the session proxy works, which is how the pages were fetched. |
| C12 | Draft the **"how Kiro was used" write-up**, a required submission field | **DONE 2026-11-10** — `docs/kiro-writeup.md`, answering Devpost's published question list in order, with `TO FILL` blocks for everything that has not happened and a "what Kiro got wrong" section. Original note — the site lists exactly what it wants covered (IDE/CLI/Web/Crew, custom agents, hooks, spec-driven development, steering, MCP, PBT, powers). `KIRO_SESSION_EVIDENCE.md` already answers several honestly. Leave placeholders for what has not happened rather than filling them in. |
| C13 | Draft the **blog post** and the **social post** | **DONE 2026-11-10** — `docs/blog-post.md`. The blog post is a full draft to rewrite in your own words; the social post is deliberately **not** drafted, only its constraints and raw material, because that prize is judged on "original thoughts vs AI writing". Original note — the blog prize has 100 winners and pays 2,000 bonus Kiro credits, so it is the cheapest prize on the board. The social post is judged on "original thoughts vs AI writing": draft a skeleton and facts, and let the owner write it in their own voice. |
| C15 | **Verify the Pages project-page build in a browser** before publication day | **DONE 2026-11-12** — `pages.yml` builds with `--base="/<repo>/"` and nothing had ever loaded the result; the workflow is `workflow_dispatch`-only, so its first real run would have been the owner's U2 moment. `tests/e2e/verify-pages-build.mjs` runs that build and serves it as Pages does — nothing outside the prefix, and a 404 is a 404, with **no `index.html` fallback**, which the main harness's server does have and which would have masked a wrong base. **11 checks pass**: correct asset paths, 200, the app mounts, the demo scene renders, 0 console errors, 0 failed requests, 0 requests escaping the prefix. Confirmed to have teeth — at `--base=//` it fails 5 and exits non-zero, which is the empty-repository-name case where **the vite build still succeeds** and the page loads blank. `pages.yml` gained a step that fails loudly on that rather than publishing a dead page. **Added beyond the original section C**, like C14, and for the same reason: an unexercised deploy path is not evidence. |
| C14 | **Close the harness's scheme-and-selection blind spot** so the accessibility claim is reproducible | **DONE 2026-11-10** — the four original axe scans ran the light scheme only and never selected a timeline row, which hid 19 real `color-contrast` nodes. `tests/e2e/lib/page.mjs` gained a `colorScheme` argument and a `selectFailingAction` helper; `tests/e2e/specs/accessibility.spec.mjs` went from 4 scans to **9** — a selected failing row in both schemes, plus dark-scheme runs of the first screen, reports and editor. A bootstrap bug was fixed on the way: `--record` asserted a baseline entry existed before it could record one, so a newly added screen could never be recorded. The debt is recorded in `axe-baseline.json` from a real scan and owned by the reopened K2. **This item was added beyond the original section C**, during Step 2 of the run contract: the harness exists to make these claims reproducible and it was reporting green over a live AA failure. |

## D. Already done

- Research, validation plan and evidence appendix (2026-10-31), caveats intact.
- Kiro T1 specifications and steering, independently reviewed, GO recorded.
- Kiro T2 domain engine, parser, reports, edit layer, persistence and the action editor, with 222
  passing tests, lint, strict typecheck and a production build.
- A Claude-authored reference build on its own branch, with its own QA record.

## Standing limits

No deployment, publication, repository visibility change, account creation, purchase, outreach or
submission happens automatically. Those are the owner's actions, listed in section A.
