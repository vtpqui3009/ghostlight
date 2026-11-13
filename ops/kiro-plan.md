# Kiro plan — what is left to do with Kiro, in order

Written 2026-11-10 by the reviewer (not by Kiro) and confirmed by the owner. **This is the single
entry point.** It is a plan, not evidence: every status below starts at **NOT RUN** and changes only
when a real session has produced a real observation. Nothing here was run by this document.

There is **no calendar** in this plan. It is a dependency order: do the tasks one after another,
and finish when the last one is recorded. The hard stop is the Devpost deadline,
**2026-12-04 14:00 PST** (2026-12-05 05:00 Vietnam time); a task that cannot finish before the last
few days should be dropped and recorded as not done, not rushed.

## Why this plan exists

Technological Implementation is 20% of the score and asks how thoroughly Kiro was used, whether a
**variety** of its tools was used impactfully, and whether there was **experimentation**. Kiro has
not run a session since 2026-11-01, and on 2026-11-10 the reviewer wrote K1, K2, K4, K5 and the
responsive half of K6 in `src/` at the owner's direction (recorded in the README's authorship
table). Every remaining item below goes through Kiro so that the evidence is real.

## Rules that do not bend

- Kiro writes `src/**`, `tests/domain|ui|persistence/**` and `.kiro/**`. The reviewer writes
  `ops/**`, `docs/**`, `tests/e2e/**` and `.github/**` (see `ops/daily-run.md`).
- Never invent `/usage` numbers, transcripts, test results or browser results. Not run = **NOT RUN**.
- Never weaken, skip or delete a test, lint rule or type check to get green.
- No jump scares, no hidden controls. Standing disclaimers stay: planned state, not live tracking,
  not a safety system, no real-user validation.
- Do not grant a whole-tool or whole-folder trust rule. No agent-prompt hooks (`tech.md`).
- One Kiro writer on `main` at a time. Tell the cloud/automated session when you start and stop.

## Run order and why

| # | Task | Surface | Brief | Why here |
|---|---|---|---|---|
| 0 | Install, sign in, verify flags and credits | PowerShell | this file, below | Nothing else can start. |
| 1 | **K8** — does the hook fire by itself? | CLI | [K8](kiro-briefs/K8.md) | Cheapest item, closes a gap open since 2026-10-31, and decides whether K12's second hook can rely on the same mechanism. |
| 2 | **K11** — property-based testing | **IDE** | [K11](kiro-briefs/K11.md) | The submission form asks about PBT by name, and PBT is IDE-only, so this is also the second-surface comparison. Before UI work so the engine is trusted while the UI changes. |
| 3 | **K10** — the haunting interface | CLI | [K10](kiro-briefs/K10.md) | The Costume Contest criterion itself, and the video depends on it. Fixes the mint-on-red selected row. |
| 4 | **K3** then **K7** — list equivalent, empty state | CLI | [K3](kiro-briefs/K3.md), [K7](kiro-briefs/K7.md) | Reuse the restyled regions; K3 first because both touch the first-screen and stage area. |
| 5 | **K6** — CSV export only | CLI | [K6](kiro-briefs/K6.md) | Small, independent. The responsive half is already done. |
| 6 | **K12** — custom agent, second hook, MCP, power decision | CLI (+ Web optional) | [K12](kiro-briefs/K12.md) | Variety and experimentation. After K8 so the hook story is known; after K10 so the Playwright MCP is evaluated on real UI work. |
| 7 | **K9** — dependency advisories | CLI | [K9](kiro-briefs/K9.md) | Last Kiro task: a major `vite`/`vitest` bump can break the suite. Stop and revert if it cannot be made green. |
| 8 | Fill the records | — | this file + `docs/kiro-writeup.md` | Only from what actually happened. |

K1, K2, K4, K5 and the responsive half of K6 are **done by the reviewer**, not Kiro. Do not repeat
them.

## Step 0 — setup on Windows (do once)

Full detail and sources: [`kiro-session-howto.md`](kiro-session-howto.md). In PowerShell:

```powershell
irm https://cli.kiro.dev/install.ps1 | iex     # x86_64 Windows only; use the IDE on ARM64
kiro-cli --version                             # must be 3.0.0 or later; if 2.x run: kiro-cli update
kiro-cli login                                 # choose "Use with Builder ID"
kiro-cli whoami --format json                  # account must not be null
kiro-cli chat --help                           # READ THE FLAGS; the 2.x flags may have changed
```

Then, **inside a chat**, run `/usage`. You want the bonus pool `kiroween-2026` to appear (it showed
0 / 4000 on 2026-11-10, next to Kiro Free at 44.65 / 50). Write down exactly what `/usage` says.
That number is submission evidence; if only Kiro Free shows, check
`app.kiro.dev/settings/account` before spending anything.

For K11 also install the **Kiro IDE** (Windows 10/11, x64 or ARM64) from `kiro.dev` and note its
version. If it cannot be installed, K11 has a stated CLI fallback — see its brief.

Do **not** use `--trust-tools=<everything>` or a whole-folder trust rule. Approve actions one at a
time, or use the narrow custom agent that K12 creates.

## Every session — the same loop

1. `git checkout main; git pull --ff-only; npm ci; npm run check`. Write down the real test count.
   Confirm you start green. (Last recorded: 235 passed at the end of run 9; use whatever you see.)
2. Run `/usage`. **Write down the number and which pool it is.**
3. Open the brief; paste its fenced block into Kiro.
4. When Kiro says it is done, you run, and record the real output of:
   `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and, where Playwright is
   installed, `npm run test:e2e -- --strict`. If this machine has no Playwright, write NOT RUN for
   that line and leave it to CI (`.github/workflows/ci.yml`); do not install a mismatched copy.
5. Run `/usage` again; record the difference.
6. Append an entry to `KIRO_SESSION_EVIDENCE.md` (template below). **Include what failed.**
7. Tell the reviewer/automated session the session is over, so it can re-run the checks
   independently and add an entry to `ops/RUN_LOG.md`.

Do not commit or push until you have looked at the diff. Keep raw transcripts, tokens and device
codes out of the repository.

### Template for `KIRO_SESSION_EVIDENCE.md`

```markdown
## <date> — <task id> (<surface>)

- Kiro surface and version: <kiro-cli --version / IDE version>
- Model and mode: <as shown by Kiro>
- /usage before: <exact text and pool>      /usage after: <exact text and pool>
- Files Kiro wrote or changed: <paths>
- What failed on the way, and how it was resolved: <be specific; do not tidy this away>
- Command results: lint <exit>, typecheck <exit>, tests <passed/total>, build <exit>,
  e2e <passed/failed or NOT RUN>
- What this does NOT show: <limits>
```

## Status table — every cell starts at NOT RUN

Fill a cell only from something observed. "Reviewer re-check" is the independent re-run after the
session, not Kiro's own report.

| Task | Surface | Kiro session run | `/usage` before → after | Own checks (lint / types / tests / build / e2e) | Reviewer re-check | Evidence entry |
|---|---|---|---|---|---|---|
| Step 0 setup | PowerShell | NOT RUN | NOT RUN | n/a | n/a | NOT RUN |
| K8 hook | CLI | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| K11 PBT | IDE | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| K10 haunting UI | CLI | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| K3 list equivalent | CLI | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| K7 empty state | CLI | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| K6 CSV | CLI | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| K12 variety | CLI (+ Web) | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| K9 advisories | CLI | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN |

## Which task answers which Devpost write-up question

The required Kiro write-up (`docs/kiro-writeup.md`) answers a published list of questions. Source:
`docs/KIROWEEN_REQUIREMENTS.md`, read 2026-11-10. **The live Devpost page returned HTTP 403 when
fetched again on 2026-11-10, so re-read Rules and FAQ yourself before submitting.**

| Devpost asks about | Answered by | Honest status today |
|---|---|---|
| Kiro IDE, CLI, Web, Crew — which, and how did they differ? | K11 (IDE) vs every CLI task; optional K12 Web check | CLI only so far. Crew is not planned. |
| Custom agents | K12 experiment 1 | None yet. |
| Agent hooks | K8, K12 experiment 2 | One hook; trigger never observed. |
| Spec-driven development | existing `.kiro/specs/ghostlight/`; K11 extracts properties from it | Done in 2026-10-31 sessions; K11 adds the PBT link. |
| Steering docs | existing `.kiro/steering/`; K10, K12 | Exists; a concrete "steering changed an output" moment is still `TO FILL`. |
| MCP | K12 experiment 3 | None yet. |
| Property-based testing | K11 | None on `main`. |
| Kiro powers | K12 experiment 4 | None; the honest answer may be "considered, not used". |

## Not Kiro work, but on the critical path

None of these can be done by Kiro or by the reviewer. They are the owner's, listed in section A of
[`docs/SUBMISSION_ROADMAP.md`](../docs/SUBMISSION_ROADMAP.md). They matter as much as the tasks
above: Potential Impact is 20% of the score and **currently has no evidence at all**.

- **U1** make the repository public on GitHub; then look at the About sidebar and confirm it shows
  "MIT License". `.kiro/` must stay tracked and out of `.gitignore` (the rules say ignoring it could
  disqualify the submission) — everything K12 adds lives there.
- **U2** enable GitHub Pages so the app has a working URL.
- **U3** record and upload the demo video (public on YouTube, under three minutes).
- **U4** run the two stage-manager sessions (`docs/user-research/`); quote them verbatim, including
  counter-evidence.
- **U5** run the competitor comparison (`docs/competitor-comparison.md`).
- **U6** submit on Devpost before the deadline; no edits are possible after it.

## After the last Kiro session

1. Fill the `TO FILL` blocks of `docs/kiro-writeup.md` **only** from entries in
   `KIRO_SESSION_EVIDENCE.md`. A block that never happened stays a plain statement that it did not.
2. Update the table above and the K-item states in `docs/SUBMISSION_ROADMAP.md` with real results.
3. Point [`kiro-brief.md`](kiro-brief.md) at the first unfinished task.
4. Append a reviewer entry to [`RUN_LOG.md`](RUN_LOG.md) with the independent re-run numbers.
