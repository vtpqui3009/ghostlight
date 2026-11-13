# Handoff — everything that remains

Written 2026-11-13, when the owner stopped the automated daily run and decided to delegate the
remaining work to Kiro. This is the single place to start. It does not replace the detail in the
files it links to; it says what is left, in what order, and what to be careful about.

**Deadline: 2026-12-04 14:00 PST = 2026-12-05 05:00 Vietnam time. No edits after it.**
That is **21 days** from 2026-11-13.

## Read this first

1. **No automation is running.** The scheduled daily session was disabled on 2026-11-13
   (`trig_012WDrc1gUfyZWx4aLW8uidw`, disabled, not deleted). No cloud session is writing to the
   repository, so a Kiro session on `main` cannot collide with anything. Nobody pushes between your
   pull and your push unless you do it yourself.
2. **`main` is the only branch that matters and it is complete.** Everything the reviewer sessions
   produced is on it. See [Branches](#branches) for the two that are not and why.
3. **No Kiro session has run since 2026-11-01.** The submission is scored on Kiro usage
   (Technological Implementation, 20%), so the next thing that happens should be a Kiro session,
   not more documents.

## State of `main`

Verified from a clean `npm ci` on 2026-11-13.

| Check | Result |
|---|---|
| `npm run check` — lint, strict typecheck, tests, build | **green**, 235 tests |
| `npm run test:e2e` | green on written-down debt |
| `npm run test:e2e -- --strict` | **fails on exactly 2 tests** — the selected-row contrast, see K2 below |
| CI (`.github/workflows/ci.yml`) | green on `main` as of 2026-11-12 |
| Repository | **private** |
| App URL, demo video, user sessions, competitor comparison | **none exist** |

## The Kiro queue, in order

Every item has a brief with measured evidence and a block to paste into Kiro:
[`ops/kiro-briefs/`](../ops/kiro-briefs/), and [`ops/kiro-brief.md`](../ops/kiro-brief.md) for the
current one. How to install Kiro and run a session: [`ops/kiro-session-howto.md`](../ops/kiro-session-howto.md).

| # | Item | What it is | Cost / note |
|---|---|---|---|
| 1 | **K8** — does the hook actually fire? | Save a file under `src/domain/`, record verbatim whether `.kiro/hooks/domain-typecheck.json` triggers by itself, then save one outside it and confirm it does not. Run `npm ci` first. | ~10 minutes, **no source change.** Closes a line recorded as NOT VERIFIED since 2026-10-31. A negative result recorded honestly is as good as a positive one. |
| 2 | **K2, reopened** — contrast on the selected row | The original 33 violations are fixed. `--strict` still fails 2 tests: nothing is painted mint until a timeline row is clicked, and the first scans never clicked one. Light: 1 node. Dark: 6 nodes, worst on `.selected > .action-label`, `.mismatch > .prop-id`, `.planned > .prop-id`. | Small — roughly one token pair. `K2.md#reopened…`. When fixed, run `npm run test:e2e -- --strict`; it must pass. |
| 3 | **K11** — property-based tests | `.kiro/specs/ghostlight/tasks.md` §2.6 already specifies `tests/pbt/*.test.ts` with fast-check and names the properties. `tests/pbt/` does not exist and `fast-check` is not a dependency. | The submission form asks about PBT **by name**. Report honestly if every property holds first time — do not manufacture a catch. |
| 4 | **K10** — a haunting interface | Costume Contest asks for "a haunting user interface … spooky design elements that enhance your app's function." | **Bigger than first estimated** — see the dead-CSS finding below. |
| 5 | **K3** — list equivalent, reduced motion | A plain list carrying the same facts as the stage diagram, defaulting on `prefers-reduced-motion`. | **Premise changed** — its brief says "ghost versus solid already exists". It exists in the CSS, not on the screen. Re-read before starting. |
| 6 | **K7** — empty state and first screen | Seven bare buttons under "No Scene Loaded". | Cheap. The first screen a judge sees. |
| 7 | **K6, CSV half** | Reports print already; CSV export does not exist anywhere. The 390 px overflow half is done. | |
| 8 | **K12** — variety of Kiro tools | MCP, custom agents, Crew, powers. | **Deliberately not briefed** — which ones are worth using depends on what the first sessions teach. See below. |
| 9 | **K9** — dependency advisories | 2 critical and 1 high advisory in dev tooling (`vitest`, `tinypool`, `vite`). | **Last.** A major bump can break the suite, and a red suite in the final days costs more than a dev-only advisory. `npm audit --omit=dev` is clean. |

### The ghost does not currently render — read before K10 and K3

`src/ui/StageView.tsx` emits five glyph classes: `required`, `planned`, `match`, `mismatch`, `other`.
`src/styles.css` has rules only for `match` and `mismatch`, plus `ghost` and `solid`, which nothing
ever emits. So `required`, `planned` and `other` paint as plain white boxes. The ghost-versus-solid
idea — what the Costume Contest entry is built on — survives only in the text labels `REQUIRED:` and
`BEFORE:`. It passes 235 tests and every axe scan because the *information* is present; the *visual
language* is not. Several documents in this repository say "ghost versus solid already exists". That
was true of the stylesheet and false of the screen.

### On K12

Technological Implementation rewards "a **variety** of Kiro tools used impactfully" and
"experimentation". Today the project has specs, steering and one hook. Pick the tools that
genuinely help this project and record what each changed. Do **not** add an MCP server or a power
purely to have used one — a judge can tell, and `GHOSTLIGHT_VALIDATION_PLAN.md` already warned
against it. If nothing else is genuinely needed for a local-first app with no external data, say so
plainly in the write-up; that is a more honest answer than a token integration.

## What only the owner can do

None of this can be delegated to Kiro.

| ID | Task | Note |
|---|---|---|
| **U1** | Make the repository **public** | GitHub only. After going public, **look at the About sidebar and confirm GitHub shows "MIT License"** — a `LICENSE` file GitHub fails to detect does not satisfy the rule. `/.kiro` must not be in `.gitignore`; the rules say ignoring it "could disqualify your submission". It is not ignored today. **Do this first** — U2 depends on it. |
| **U2** | Enable GitHub Pages | Settings → Pages → Build from **GitHub Actions**, then run the "Deploy to GitHub Pages" workflow by hand (it is `workflow_dispatch` only, on purpose). Pages on a private repository needs a paid plan, so U1 comes first. The bundle has been verified loading under `/ghostlight/`; Pages itself, the published URL and HTTPS have not. |
| **U4** | **Two stage managers / ASMs** | The highest-value hour left. Potential Impact is 20% of the score and currently has **zero** evidence. It has the longest lead time of anything remaining and **cannot be compressed later**. Kit: [`docs/user-research/`](user-research/). |
| **U5** | Run the competitor comparison | [`docs/competitor-comparison.md`](competitor-comparison.md). Only use access you are entitled to. "Not visible in the public docs" is not the same as "the product cannot do it". |
| **U3** | Record and upload the demo video | Under 3:00, **public on YouTube**. Script: [`docs/demo-script.md`](demo-script.md). K4 and K5 are done, so the cause-and-fix beat can be filmed today. The list-view beat needs **K3** and the video reading as "creative and memorable" needs **K10**, so shoot **after both**. |
| **U10** | Blog post and social post | Blog draft: [`docs/blog-post.md`](blog-post.md) — rewrite it in your own words. The social post is deliberately not drafted: it is judged on "original thoughts vs AI writing". Must begin with `#KiroweenHackathon26`. Blog prize: 100 winners, 2,000 bonus Kiro credits each. |
| **U9** | Bonus-prize facts | Kiroween 2025: **not registered**, so Best Ghost of Kiroween Past is out. Still to answer: are you a student (Best Student Project), a startup founder (Best Startup Project)? |
| **U6** | **Submit on Devpost** | Costume Contest, English, one project. Do it days early. Draft: [`docs/submission.md`](submission.md). |

Dates worth putting in a calendar:

| When | What |
|---|---|
| 2026-12-01 12:00 PT | Last day to **request** Kiro credits (already redeemed — nothing to do) |
| 2026-12-01 | Kiro Free allowance resets |
| **2026-12-04** | **Redeem-by date for the bonus credits** (already redeemed), and the **submission deadline, 14:00 PST** |

## Placeholders that still say `TO FILL`

Three files carry `TO FILL` markers rather than invented content. Fill them from real events only.

- [`docs/kiro-writeup.md`](kiro-writeup.md) — **a required submission field**, and where
  Technological Implementation is actually scored. Missing: IDE/Web/Crew usage, a concrete steering
  moment, the hook trigger (K8), PBT (K11), MCP, custom agents, powers, and the user sessions.
- [`docs/submission.md`](submission.md) — app URL, video URL, the comparison paragraph, the user
  sessions, student/startup answers.
- [`docs/blog-post.md`](blog-post.md) — the moments that are genuinely yours.

After every Kiro session, append to [`KIRO_SESSION_EVIDENCE.md`](../KIRO_SESSION_EVIDENCE.md): date,
CLI version, model and mode, `/usage` before and after, files Kiro wrote, **what failed on the way**,
final command results. The failures are the most convincing part.

## Things to be careful about

- **Authorship.** The README's "Who wrote what" table names every `src/` file the reviewer wrote
  directly, on the owner's instruction, on 2026-11-10: K1, K2, K4, K5 and the responsive half of K6.
  That is a subtraction on a criterion that measures Kiro usage directly. If Kiro rewrites any of
  those files, **update the table** so it stays true. Never let it claim Kiro wrote something it did
  not.
- **Do not weaken a check to get green.** Not a test, not a lint rule, not the compiler. The
  harness has two debt ledgers precisely so debt is written down instead of hidden.
- **`requiredSource` is the user's, never the model's.** The guided fix changes the plan and never
  the authored requirement; there is a test asserting it. Any change that fills a requirement in
  from computed state destroys what makes the check meaningful.
- **Keep the honesty limits visible.** Planned state, not live tracking; not a safety system; no
  stage manager has used it. They are on the first screen and in the README. Do not soften them,
  and do not write anything implying user validation that has not happened.
- **Nothing new in the last week.** A broken suite on 2026-12-03 costs more than any feature.
- **Pull before every session.** `git checkout main && git pull --ff-only && npm ci && npm run
  check` — and confirm it is green before changing anything.

## Branches

| Branch | State |
|---|---|
| `main` | Everything. The Kiro lineage plus all reviewer work. |
| `codex/ghostlight-domain-draft-20261031`, `codex/ghostlight-kiro-cloud-wip-20261031` | Fully contained in `main`. |
| `codex/ghostlight-claudekit-review-20261031` | One doc commit, already in `main` with identical content (cherry-picked). |
| `ops/push-probe-20261110` | Fully contained in `main`. **Delete it** — the cloud session cannot (its GitHub grant allows creating refs but not deleting them). GitHub → Branches → trash icon, or `git push origin --delete ops/push-probe-20261110`. |
| `claude/read-repo-continue-lwbi83` | **Deliberately not merged.** A second, independent implementation of the same app. A trial merge on 2026-11-13 conflicts in **10 files**, including the Kiro-authored `src/domain/engine.ts`, `.kiro/specs/ghostlight/design.md` and `.kiro/specs/ghostlight/tasks.md`. Merging it would wreck the tree and erase the Kiro provenance the project is built on. It is kept as a reference; its useful ideas are already queued above. Leave it, or delete it before making the repository public if you would rather judges not see a competing implementation — your call. |

## If you ever want the automation back

The run contract is [`ops/daily-run.md`](../ops/daily-run.md) and is still valid. The schedule is the
disabled trigger above; re-enable it from the scheduled-tasks list, or ask. It fires into the
original cloud conversation (`session_01MHgzFD3NvKqwujrT5B13ib`), which spawns a child session
because a trigger-fired fresh session has no repository access — so **do not archive that
conversation** if you may want the schedule back. It writes `docs/`, `ops/`, `tests/e2e/` and
`.github/` only, never `src/`, and it will say so if it finds the work has run out.
