# Kiro brief — current task

Refreshed by the daily run on **2026-11-10**, against numbers it measured the same day. One brief
at a time; the full queue is in [`kiro-briefs/`](kiro-briefs/).

**Start with [`kiro-session-howto.md`](kiro-session-howto.md)** — install, sign-in, what to record.

## Where the project actually stands, verified today

From a clean `npm ci` on 2026-11-10:

| Check | Result |
|---|---|
| `npm run lint` / `typecheck` / `build` | pass — production build, 48 modules |
| `npm test` | **235 passed** (31 engine, 134 acceptance, 13 persistence, 44 action-form, 8 guided-fix, 5 import-guard) |
| `npm run test:e2e` | **25 passed, 0 failed** — green on written-down debt |
| `npm run test:e2e -- --strict` | **23 passed, 2 failed** — both the selected-row contrast below |
| `known-failures.json` | empty |

**K1, K2, K4, K5 and the responsive half of K6 are done** — implemented on 2026-11-10 by the
reviewer, not by Kiro, at the owner's explicit direction, and named in the authorship table in
`README.md`. That direction does not carry over: `src/` is Kiro's again.

## Today's task — K8, and it costs no code

**[K8 — verify the hook actually triggers](kiro-briefs/K8.md).** Ten minutes, no source change, and
it closes a line that has read **NOT VERIFIED** in `KIRO_SESSION_EVIDENCE.md` since 2026-10-31.
`.kiro/hooks/domain-typecheck.json` declares a `PostFileSave` hook on `src/domain/.*\.tsx?$`. The
JSON parses, the regex matches, the script runs. What has never been observed is Kiro firing it by
itself.

1. Save a file under `src/domain/` — whitespace is enough; revert it after.
2. Watch for the hook. Record **verbatim** what appeared.
3. Save a file **outside** `src/domain/` and confirm it does **not** fire.

One thing the daily run checked today so it does not confuse you: the hook script
(`.kiro/hooks/typecheck-domain.sh`) deliberately skips when dependencies are missing and prints

```
[ghostlight hook] NOT RUN — dependencies not installed. Run `npm install` first (T2).
```

**That message is itself proof the hook fired.** Run `npm ci` first and you should instead get
`[ghostlight hook] Running typecheck after a domain-model change...` and a PASS. Either way, a
negative result recorded honestly is worth more than a claim — write down whichever you see.

## Then this, and it is ahead of K11 now

**[K2, reopened — the selected row](kiro-briefs/K2.md#reopened-2026-11-10--the-selected-row-the-first-scan-could-not-see).**
Newly found today, one token pair to fix, and it corrects a claim this repository has been making.

K2 was closed on a scan that reported zero violations. The scan was not lying; the harness never
put the app into the state where the defect lives. **Nothing is painted mint until a timeline row
is clicked**, and the old scans never clicked one — nor did they ever run the dark scheme. Both
gaps are closed now, and with a failing row selected axe-core 4.14.0 measures:

| Scheme | Nodes | Worst ratio |
|---|---|---|
| light | **1** | 3.91:1 — `#5a5a5a` on `#7ed4ad` |
| dark | **6** | 1.91:1 — `#e8e5dc` on `#5eb88f` |

A wider reviewer sweep over three demos, three views and both schemes found **19** nodes of that
rule, **every one of them on the stage view with a row selected**. First screen, reports and editor
are clean in both schemes.

The cause is `.action-item.selected` in `src/styles.css` (~line 342) setting a background and no
foreground — the same class of bug K2 already fixed everywhere else with role tokens. And the same
rule paints a **rejected** step green, so the failing step reads as the passing one.

## The queue after that

Order from [`kiro-session-howto.md`](kiro-session-howto.md), with today's insertion:

**K8 → K2 (reopened) → K11 → K10 → K3 → K7 → K6 CSV → K12 → K9**

K2's reopened part jumps ahead of K11 because it is a live WCAG AA failure on the main view, it is
roughly one token pair, and until it lands the submission cannot honestly claim a clean
accessibility sweep. Every item has a written brief in [`kiro-briefs/`](kiro-briefs/) except **K12**,
which is deliberately unwritten — what to try there depends on what you learn in the first two
sessions.

Two of these are smaller than they look, and one is bigger:

- **[K11](kiro-briefs/K11.md)** is not new scope. `.kiro/specs/ghostlight/tasks.md` section 2.6
  already specifies `tests/pbt/*.test.ts` with fast-check and names the properties. It was never
  implemented. Kiro wrote the spec; Kiro should close it.
- **[K10](kiro-briefs/K10.md)** is bigger than it looked. The ghost-versus-solid visual language
  **does not render at all**: `StageView.tsx` emits `required | planned | match | mismatch | other`
  while the stylesheet defines `.ghost` and `.solid`, which match nothing. Three of the five types
  fall back to a plain white box. Documents in this repository that say "ghost versus solid already
  exists" are true of the CSS and false of the screen.
- **[K3](kiro-briefs/K3.md)** should be re-read against that finding before you start it.

## Every session, without exception

**Before:** `git checkout main && git pull --ff-only`, then `npm ci && npm run check` to confirm you
start from green at 235 tests. Check native `/usage` and **write the number down** — note which
pool it moves, the `kiroween-2026` bonus or the separate Kiro Free allowance.

**After:** `npm run lint && npm run typecheck && npm test && npm run build`, then
`npm run test:e2e -- --strict` if the machine has a browser. Then append to
`KIRO_SESSION_EVIDENCE.md`: date, CLI version, model and mode, `/usage` before and after, which
files Kiro wrote, **what failed on the way**, and the final command results. The failures are the
most convincing part of that file — do not tidy them out. Finally, fill the matching `TO FILL` block
in `docs/kiro-writeup.md` while it is fresh.

**Never:** weaken a test, a lint rule or a type check to get green. Never edit anything under
`tests/e2e/` — it is reviewer-owned, and it is the thing measuring you. If you think a scan is
wrong, say so in the session notes.
