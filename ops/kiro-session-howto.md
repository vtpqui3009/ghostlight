# Running a Kiro session on this project

## First-time setup

Everything in this section marked **verified** comes from `CLOUD_KIRO_READINESS.md`, recorded on
2026-10-31 from a setup that actually worked and authenticated. Everything marked **unverified**
could not be checked from the cloud session, because `cli.kiro.dev` and `kiro.dev` are outside its
network allowlist. Do not treat the unverified parts as instructions — check them against the
official site.

### Two paths

- **Kiro IDE** — the desktop app, from `kiro.dev`. Probably the easier path on Windows, and the
  submission's write-up explicitly asks how the surfaces differed if you tried more than one, so
  using it for at least one task is worth points. *Unverified: the download and install steps.*
- **Kiro CLI** — what this project has used so far, and what every brief is written for.

### Kiro CLI — the verified record

**Verified**, from the 2026-10-31 setup:

- Official installer at `https://cli.kiro.dev/install`. It was downloaded, inspected before running,
  and installed into a user-local bin directory.
- `kiro-cli --version` then reported **2.37.0**.
- The official 2.37.0 **Linux x86_64** archive was independently checked against the HTTPS manifest:
  SHA-256 `79b238338c7d94cf7005f67f3508aa5dd474778157f2a1c8481f47e716433aaf`. The installer enforces
  SHA-256 verification itself.
- Login used `login --license free --use-device-flow`. It printed an official approval URL and a
  code, the browser approval completed, and the session reported `Device authorized` and
  `Logged in successfully`.
- `whoami --format json` then returned an authenticated account with `accountType` and `region`;
  before login the same command returned `account: null`. That is the check for "am I actually
  signed in".
- `/usage` inside the chat reported the plan and credits — at that point `KIRO FREE, 0.33 of 50`.

**Unverified / platform caveat:** that record is **Linux x86_64**. The account screenshot of
2026-11-10 appears to be Windows, where the installer and the SHA-256 will be different. Take the
installer from the official site for your platform; do not reuse the Linux hash above as if it
applied.

### Network hosts Kiro needs

Verified as the set in use on 2026-10-31. Only relevant if you are behind a restrictive firewall:

`cli.kiro.dev`, `prod.download.cli.kiro.dev`, `desktop-release.q.us-east-1.amazonaws.com`,
`oidc.us-east-1.amazonaws.com`, `runtime.us-east-1.kiro.dev`, `management.us-east-1.kiro.dev`,
`q.us-east-1.amazonaws.com`.

### Confirming the credits are visible to the CLI

After login, open a chat and run `/usage`. You are looking for the bonus pool to be visible, not
just the Kiro Free allowance. The 2026-11-10 dashboard showed `kiroween-2026` at 0 / 4000 with 52
days left, next to Kiro Free at 44.65 / 50 resetting 12-01. If `/usage` shows only the free
allowance, check the account page at `app.kiro.dev/settings/account` before spending time on a
session — and **write down what it actually says**, because that number is submission evidence.

The 4,000 `kiroween-2026` credits are **already on the account** — the dashboard showed them at
0 / 4000 used with 52 days left on 2026-11-10. There is nothing further to "apply". They are spent
by doing work in Kiro against this repository.

## Before the session

1. **Pull first.** The cloud session pushes to `main` too, and it has pushed a lot. Start every
   session with:

   ```bash
   git checkout main && git pull --ff-only
   npm ci && npm run check      # confirm you start from green: 235 tests
   ```

2. **Say when you start and stop.** While you have a Kiro session open on `main`, tell the cloud
   session so it does not push underneath you. Two writers on one branch collide. If you would
   rather not coordinate, work on a branch and merge when you are done.

3. **Check `/usage` and write the number down.** Do this *before* the first turn. On 2026-10-31
   this was how the spend was tracked, and it is the evidence the submission's Kiro write-up asks
   for. The account also has a separate Kiro Free allowance that was at 44.65 / 50 and resets on
   12-01, so note **which pool** the number moves.

## The session

Open `ops/kiro-brief.md`, or the specific file under `ops/kiro-briefs/`. Each brief has a fenced
block written to be pasted straight in. It states the goal, the files Kiro may touch, the
acceptance checks and what must not change.

What worked on 2026-10-31, from `KIRO_SESSION_EVIDENCE.md`: **Kiro CLI 2.37.0**, Builder ID login,
`kiro-cli chat --v3 --mode spec` for specification work and `--v3 --mode default` for
implementation, with `--trust-tools=` left **empty** so every tool action is reviewed one at a time.
No whole-tool or whole-folder trust rule was granted then and none is needed now.

**Trying more than one Kiro surface is itself worth points.** The submission's Kiro write-up asks
"Kiro IDE, CLI, Web, Crew? How did they differ, if you tried multiple?" — so far only the CLI has
been used. If you open one of the others for a task, note what was better or worse.

## Finish the session

```bash
npm run lint && npm run typecheck && npm test && npm run build
npm run test:e2e -- --strict     # needs a browser; skip if this machine has no Playwright
git add -A && git commit && git push
```

Then append to `KIRO_SESSION_EVIDENCE.md`: the date, CLI version, model and mode, `/usage` before
and after, which files Kiro wrote, **what failed on the way**, and the final command results. The
failures are the most convincing part of that document — do not tidy them out.

Finally, fill the matching `TO FILL` block in `docs/kiro-writeup.md` while it is fresh.

## Recommended order, and why

| | Item | Why here |
|---|---|---|
| 1 | **K8** — verify the hook actually triggers | Cheapest thing on the list, maybe ten minutes. It closes a gap recorded as **NOT VERIFIED** since 2026-10-31, and it is exactly what Technological Implementation asks about. Either outcome goes in the record. |
| 2 | **K11** — property-based testing | The submission form asks about PBT **by name**. The engine's invariants are already written down in the validation plan, so the specification work is done. |
| 3 | **K10** — the haunting interface | Costume Contest's own wording. This is the category criterion, not optional polish. Also makes the video read as "creative and memorable". While you are in there: the selected timeline row is painted mint green even when it is the failing step, so a red error sits on a green background. |
| 4 | **K3** — the list equivalent | A video beat, and the project has promised a readable alternative since the start. |
| 5 | **K7** — the empty state | The first screen a judge sees. Cheap. |
| 6 | **K6** — the CSV half | Reports already print; CSV does not exist. |
| 7 | **K12** — variety and experimentation | MCP, custom agents, Crew, powers. Do the ones that genuinely help. Do **not** bolt one on for the checklist — the research plan warned against that and a judge can tell. |
| 8 | **K9** — dependency advisories | Last. A major `vite`/`vitest` bump can break the suite, and a red suite in the final week costs more than a dev-only advisory. |

K8 and K11 are first on purpose. The recent `src/` work was done by the reviewer rather than Kiro,
which subtracts on Technological Implementation; these two put genuine, recorded Kiro usage back
into the submission for very little spend.

## Budget

4,000 credits, 0 used. For scale: the 2026-10-31 sessions produced the specs, the engine and 222
tests for about **33 credits** of the free 50. The budget is not the constraint here — time is.
