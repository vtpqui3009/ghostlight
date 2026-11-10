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

## Verified state of `main` — 2026-11-10 (second run of the day)

Re-verified from a clean `npm ci`. Every number below was observed, not estimated.

| Check | Result |
|---|---|
| `npm run lint` / `typecheck` / `build` | pass (production build, 46 modules) |
| `npm test` | 222 passed (31 engine, 134 acceptance, 13 persistence, 44 action-form) |
| `npm run test:e2e` (new, reviewer-authored) | **14 passed, 1 failed** — Playwright 1.63.0, axe-core 4.14.0 |
| axe-core, first screen | **3 violations**: `color-contrast` ×3, `landmark-one-main` ×1, `region` ×2 |
| axe-core, loaded views | stage `color-contrast` ×5; reports ×6; editor ×18; plus `label-content-name-mismatch` ×4 on every loaded view |
| 390 px horizontal overflow | first screen, stage and editor clean; **Reports overflows by 73 px** (`table.report-table`) |
| Open product blocker | delayed `FileReader` import race — `docs/handoff/ACTIONFORM_CHECKPOINT.md` |
| Repository visibility | **private** |
| Public URL, video, user validation, competitor comparison | none |

### Defects the harness found that the hand-run had missed

1. **Reports table overflows a 390 px viewport by 73 px.** A real responsive defect, not an
   accessibility nit. Assigned to **K6**. Previously unrecorded.
2. **`label-content-name-mismatch` ×4 on every loaded view**, on the timeline's `role="treeitem"`
   cue headers and action rows in `src/ui/Timeline.tsx`. Assigned to **K2**. Previously unrecorded.
3. The earlier hand-run's three first-screen violations were reproduced **exactly**, which is what
   validates the harness against that independent observation.

The earlier figure of "3 axe violations" was first-screen only and used axe's default rule set.
The harness scans four screens under `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and
`best-practice`; the project's own landmark promises are best-practice rules, so that tag stays on.


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
| U2 | Enable **GitHub Pages** (Settings → Pages → Build from GitHub Actions) after the deploy workflow lands | The published URL loads the app and is written into `docs/submission.md` |
| U3 | Record and upload the **demo video**, public on YouTube, under three minutes | Link in `docs/submission.md`; follows `docs/demo-script.md`; says on screen that demo scenes are synthetic |
| U4 | **User validation**: two experienced stage managers / ASMs, one anonymised real run sheet, consent recorded | Notes in `docs/user-research/`; quotes recorded verbatim, counter-evidence included. If it does not happen, the submission says so plainly instead of implying it did. |
| U5 | **Competitor comparison executed** against CueCall, DigiScript, Standby with the same five scenarios | `docs/competitor-comparison.md` filled from actual runs, with what could not be accessed stated. Use only access you are entitled to. |
| U6 | **Devpost submission**: Costume Contest, English, judge access notes, team ≤ 3, declare what pre-dated the window | Submitted before 2026-12-04 14:00 PST. All repository commits are inside the window (first commit 2026-10-31); the research documents were written 2026-10-31 and are declared as prior planning material. |
| U7 | Run the **Kiro briefs** in `ops/kiro-brief.md` and record evidence | Each session appends real observations to `KIRO_SESSION_EVIDENCE.md`: `/usage` before and after, model and mode, what Kiro wrote, what failed, what was fixed |
| U8 | ~~Redeem the Kiro credits~~ | **DONE 2026-11-10** — dashboard shows `kiroween-2026` bonus credits at **0 / 4000 used, 52 days left**. The separate Kiro Free allowance is at 44.65 / 50 and resets 12-01, so spend the bonus pool, not the free one. |
| U9 | Answer two bonus-prize questions only you can | (a) Did you register for **Kiroween 2025**? If so, claim Best Ghost of Kiroween Past — it is verified against their records. (b) Are you a student, or a startup founder? Each has its own bonus prize and its own evidence requirements. |
| U10 | Publish the **blog post** and the **social post** | Blog: any third-party platform, during the submission period, mentioning Kiroween 2026 — **100 winners get 2,000 bonus Kiro credits**. Social: a public post beginning with `#KiroweenHackathon26`, judged on "original thoughts vs AI writing", so write it yourself. Drafts are C13. |

## B. Kiro work — briefs prepared for you, you run them in Kiro

Every item has a written brief in [`ops/kiro-briefs/`](../ops/kiro-briefs/), with measured evidence
and a block to paste straight into Kiro. `ops/kiro-brief.md` always points at the first unfinished
one. Run order: **K1 → K2 → K4 → K5 → K3 → K6 → K7 → K8 → K9**, which is also the order the demo
script needs.

Three of these were scoped wrongly before the code was read on 2026-11-10, and are smaller than
they looked. That is recorded here so the credits are not spent rebuilding what exists.

| ID | Task | State and why it matters |
|---|---|---|
| K1 | **Import race repair** | **DONE 2026-11-10 — by the reviewer, not Kiro.** `src/ui/importGuard.ts` takes a getter so the decision is made when the read completes. Proven both ways: with the fix the controlled delayed-read test passes; with `src/` reverted it fails with the reported symptom. A second, mirror-image bug surfaced — the old code also *wrongly blocked* an import that completed after a deliberate Cancel; both directions are now covered. |
| K2 | **Accessibility** | **DONE 2026-11-10 — by the reviewer, not Kiro.** `npm run test:e2e -- --strict` passes and `axe-baseline.json` is empty. The scan was then widened to two colour schemes, three demos and three views, which found **79** contrast failures where the baseline had seen 32: the dark scheme was badly broken by hard-coded light surfaces and by `--plum` used as text. Now **0**. Fixed with role tokens (`--button-*`, `--surface-*`, `--header-*`, `--heading-text`, `--secondary-*`, `--badge-fg`, `--*-text`) rather than per-selector patches. |
| K4 | **Make the cause navigable** | **Smaller than it looked.** The cause is already computed *and already printed* in `StageView.tsx` — "Earlier action a1 in cue cue-1". It is just inert and uses raw ids. [`K4.md`](../ops/kiro-briefs/K4.md) |
| K5 | **Guided fix** — offer the one unambiguous edit, apply it, replay | The "fix it and re-run" beat; strongest demo moment. Deliberately narrow: holder-only and zone-only mismatches, nothing else. [`K5.md`](../ops/kiro-briefs/K5.md) |
| K3 | **List equivalent and reduced motion** | **Smaller than it looked.** Ghost versus solid already exists with word labels (`REQUIRED:` / `BEFORE:`). What is missing is the plain list carrying the same facts, defaulting on `prefers-reduced-motion`. [`K3.md`](../ops/kiro-briefs/K3.md) |
| K6 | **Reports: 390 px overflow and CSV** | **Half done 2026-11-10 — by the reviewer.** The 73 px overflow is fixed: each table sits in a focusable, labelled scroll region, so `known-failures.json` is now empty. **CSV export is still open and still Kiro's.** [`K6.md`](../ops/kiro-briefs/K6.md) |
| K7 | **Empty state and first screen** | The honesty subtitle is already there and smoke-tested; the empty state itself is seven bare buttons under "No Scene Loaded". Do K2 first — it rewrites the same region. [`K7.md`](../ops/kiro-briefs/K7.md) |
| K8 | **Automatic hook triggering verified** in a native Kiro session | Recorded as NOT VERIFIED since 2026-10-31; a manual invocation is not evidence of a trigger. Cheap, and it is exactly what Technological Implementation asks about. [`K8.md`](../ops/kiro-briefs/K8.md) |
| K10 | **A haunting interface** — the category's actual wording | Costume Contest asks for "a haunting user interface that's polished and unforgettable … spooky design elements that **enhance your app's function**". The ghost-versus-solid idea is exactly that; the current parchment-and-plum visual language is muted. This is the chosen category's own criterion, so it is not optional polish. Still no jump scares and no hidden controls — the research plan rules those out, and so does Design's "intuitive". |
| K11 | **Property-based testing, through Kiro** | The submission's Kiro write-up explicitly asks "did PBT catch any issues you might have missed with unit tests? What kind of requirements did you enable PBT for?" `main` has none. The engine's invariants — single custody, terminal consumption, determinism, backwards-only causes — are textbook PBT material. |
| K12 | **Variety and experimentation with Kiro tools** | Technological Implementation (20%) rewards "a **variety** of Kiro tools used impactfully" and "was there **experimentation**?". Today: specs, steering, one hook whose automatic trigger has never been observed. Untouched: MCP, custom agents, Kiro Crew, Kiro powers. Pick the ones that genuinely help this project and record what each changed — do not bolt on features for a checklist, which the research plan already warned against. |
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
| C8 | `docs/competitor-comparison.md`: matrix and method, marked NOT RUN until U5 happens | TODO |
| C9 | `docs/submission.md`: Devpost draft in English, with placeholders only the owner can fill | TODO |
| C10 | Refresh `ops/kiro-brief.md` every run, and review whatever Kiro produced since the last run | Every run |
| C11 | Finish `docs/KIROWEEN_REQUIREMENTS.md` by reading the Devpost tabs directly | **DONE 2026-11-10** — all six tabs read directly once the proxy picked up the `ghostlight` environment. `WebFetch` still fails on this host because it resolves DNS itself; `curl` through the session proxy works, which is how the pages were fetched. |
| C12 | Draft the **"how Kiro was used" write-up**, a required submission field | **DONE 2026-11-10** — `docs/kiro-writeup.md`, answering Devpost's published question list in order, with `TO FILL` blocks for everything that has not happened and a "what Kiro got wrong" section. Original note — the site lists exactly what it wants covered (IDE/CLI/Web/Crew, custom agents, hooks, spec-driven development, steering, MCP, PBT, powers). `KIRO_SESSION_EVIDENCE.md` already answers several honestly. Leave placeholders for what has not happened rather than filling them in. |
| C13 | Draft the **blog post** and the **social post** | TODO — the blog prize has 100 winners and pays 2,000 bonus Kiro credits, so it is the cheapest prize on the board. The social post is judged on "original thoughts vs AI writing": draft a skeleton and facts, and let the owner write it in their own voice. |

## D. Already done

- Research, validation plan and evidence appendix (2026-10-31), caveats intact.
- Kiro T1 specifications and steering, independently reviewed, GO recorded.
- Kiro T2 domain engine, parser, reports, edit layer, persistence and the action editor, with 222
  passing tests, lint, strict typecheck and a production build.
- A Claude-authored reference build on its own branch, with its own QA record.

## Standing limits

No deployment, publication, repository visibility change, account creation, purchase, outreach or
submission happens automatically. Those are the owner's actions, listed in section A.
