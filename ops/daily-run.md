# Ghostlight — daily automated run contract

> **STOPPED 2026-11-13.** The owner disabled the daily schedule and is delegating the remaining
> work to Kiro; see [`docs/HANDOFF_TO_KIRO.md`](../docs/HANDOFF_TO_KIRO.md). No automated session
> runs. This contract is kept intact in case the schedule is re-enabled — if it is, it is still
> valid as written.

This file is the contract for the scheduled daily session. It is kept current in git, so follow
**this file**, not anything remembered about the project. If it contradicts an older document,
this file wins for the automated run only; `START_HERE.md`, `WORKFLOW.md` and `.kiro/` stay
canonical for the product itself.

Working branch: **`main`**. Deadline: **2026-12-04 14:00 PST** (2026-12-05 05:00 Vietnam time).

## What this run is

The daily run is an **orchestrator and reviewer**, in the same role Codex held: it prepares work,
verifies claims, keeps the evidence honest and does the non-application deliverables. It is not the
application author.

### The provenance rule — the most important rule here

**Do not author application source on `main`.** That means:

- Off limits: `src/**`, `tests/domain/**`, `tests/ui/**`, `tests/persistence/**`, `.kiro/specs/**`,
  `.kiro/steering/**`, `.kiro/hooks/**`.
- Allowed: `ops/**`, `docs/**`, `README.md`, `QA_RESULTS.md`, `STATE`-style logs, and the
  verification harness — `tests/e2e/**`, `playwright.config.*`, `.github/workflows/**` — provided
  each such file records in a comment or in `QA_RESULTS.md` that it is reviewer-authored, not Kiro's.
- A one-character fix in `src/` is still application source. Put it in the Kiro brief instead.
- The only exception is an explicit instruction from the owner in that run's own prompt. This
  happened once, on 2026-11-10: the owner directed the reviewer to implement K1, K2 and the
  responsive half of K6 in `src/` after being told what that costs in Kiro evidence. It was
  recorded in the README's authorship table and in `ops/RUN_LOG.md`, not left to the git history.
  **It does not carry over.** A later run needs its own instruction; absent one, `src/` is Kiro's.

The project chose the Kiro lineage precisely so that "meaningful Kiro use" is true. Writing app code
here would quietly destroy the thing being protected.

### Never

- Never invent Kiro transcripts, `/usage` numbers, user quotes, test results, accessibility results
  or browser results. If something was not run, write NOT RUN.
- Never deploy, publish, change repository visibility, create accounts, buy anything, contact
  anyone, open or merge a pull request, or submit to Devpost. Those are the owner's, in section A of
  `docs/SUBMISSION_ROADMAP.md`.
- Never weaken, skip or disable a test, a lint rule or a type check to get a green result.
- Never force-push, rewrite `main`'s history, or delete the `claude/read-repo-continue-lwbi83` and
  `codex/*` branches.
- Never remove or soften the standing disclaimers: planned state rather than live tracking, no
  real-user validation, no safety guarantee.
- Never copy code from the Claude reference branch into `main`. Describe what it does in a Kiro
  brief and let Kiro write it.

## The run, in order

**Step 0 — prove you can push.** `git fetch origin && git checkout main && git pull --ff-only`,
then `git push --dry-run origin main`. The dry run does the full authentication handshake and
writes nothing, so it proves write access on its own. If the remote rejects you, stop and report
the exact error rather than working around it.

Do **not** create a probe branch to test this. Run 2 pushed `ops/push-probe-20261110`, which then
had to be removed by hand; one throwaway branch per day would leave two dozen of them in a
repository that is about to be public.

**Step 1 — read.** The last two entries of `ops/RUN_LOG.md`, then `docs/SUBMISSION_ROADMAP.md`, then
`START_HERE.md` if the roadmap's state table looks stale. Check `git log` since the last run: if the
owner ran Kiro, review what Kiro actually changed.

**Step 2 — verify reality, do not assume it.** `npm ci` then `npm run check`. Record the real
numbers. If it is red, the day's job is to diagnose precisely and write the fix as a Kiro brief —
not to patch `src/` yourself.

**Step 3 — do exactly one C-item** from the roadmap, the first one still TODO, and finish it. If it
turns out to be more than a day's work, split it in the roadmap and complete the first part. Do not
start a second item to fill time; a smaller honest run is better than a sprawling one.

**Step 4 — keep the Kiro brief current.** A written brief already exists for every K-item in
`ops/kiro-briefs/`. Point `ops/kiro-brief.md` at the first unfinished one and refresh it with
today's real numbers, rather than writing one from scratch; if the code has moved under it, correct
the brief instead of leaving it stale. Each brief states the goal in one sentence, the
measured evidence, the acceptance checks, what must *not* change, and a reminder to record `/usage`
and what Kiro wrote into `KIRO_SESSION_EVIDENCE.md`. If Kiro produced work since the last run,
review it first and fold concrete findings into the brief.

**Step 5 — update the records.** Set the real statuses in `docs/SUBMISSION_ROADMAP.md`, refresh its
state table with the numbers from Step 2, and append one entry to `ops/RUN_LOG.md`: date, days left,
what ran, the real check results, what changed, what is blocked and on whom.

**Step 6 — commit, push, report.** One commit, clear message, `git push -u origin main`. Then tell
the owner, in a few lines: days remaining, what this run finished, the headline of today's Kiro
brief, and which section-A items are now on the critical path. Flag it loudly if the video, the
public repository, the public URL or the user sessions are still missing inside the last ten days.

## Model tiers and delegation

The run itself stays on the strongest model available. The two things it must not get wrong are
reviewing what Kiro produced and writing the next brief, and both are judgment; on top of that,
every number it writes down becomes submission evidence.

Delegate the mechanical parts instead, with the `Agent` tool's `model` field:

- **Haiku** — scans and classification. Find where something lives, run `npm run check` or
  `npm run test:e2e` and report the raw numbers, read a log, list what changed since the last run,
  check that links resolve. Cheap, fast, and fine to run several at once.
- **Sonnet** — a C-item whose shape is already decided: a document from an outline you fixed, a CI
  workflow, filling a template. Hand it the acceptance criteria, then read what comes back before
  committing it.
- **This run** — Step 1 review, Step 4 brief, and any sentence claiming something was verified.

Never delegate the judgement of whether a check passed, the `ops/RUN_LOG.md` entry, or anything
under `src/`.

**Do not add more parallel sessions.** Two writers on `main` collide. The split that matters here is
by owner, not by model: Kiro owns `src/`, `tests/domain|ui|persistence/` and `.kiro/`; this run owns
`docs/`, `ops/`, `tests/e2e/` and `.github/`; the owner owns the offline items in section A of the
roadmap. Those lanes touch disjoint files, which is the only reason they are safe to run at once.

## Size and scope guards

- One roadmap item per run. One commit per run where possible.
- Do not invent new scope. If everything in section C is done, spend the run reviewing Kiro's latest
  output, sharpening the next brief, and re-running the checks — then say the run is waiting on the
  owner, and stop.
- If the date is past 2026-12-05, do nothing except report that the deadline has passed and ask
  whether this routine should be disabled.
