# Running a Kiro session on this project

## First-time setup

Read from the official docs on **2026-11-10**: `kiro.dev/docs/getting-started/installation`,
`kiro.dev/docs/getting-started/authentication`, and the installer scripts at `cli.kiro.dev`.

> **The record in `CLOUD_KIRO_READINESS.md` is now out of date.** It describes Kiro CLI **2.37.0**
> installed on Linux with `login --license free --use-device-flow`. The current line is **3.0.0+**,
> 2.x was the old desktop-app generation, and the login command has changed. Keep that file as the
> historical record of the 2026-10-31 session — do not follow it as instructions.

### Pick a surface

Kiro ships as a desktop **IDE**, a **CLI**, a **web app**, a mobile app, and **Crew**. Your `.kiro`
configuration — the specs, steering and hooks already in this repository — **is shared across all of
them**, so you can switch surfaces without redoing anything.

The submission's Kiro write-up asks "Kiro IDE, CLI, Web, Crew? How did they differ, if you tried
multiple?" Only the CLI has been used so far, so running at least one task on a second surface is
worth real points for very little effort.

### System requirements

- **IDE** — macOS, **Windows 10/11 on x64 or ARM64**, or Linux.
- **CLI** — macOS, **Windows 11 (PowerShell)**, or Linux (glibc 2.34+, or the musl build).

### Install — Windows

Your account screenshot is Windows, so this is the path that applies.

**CLI**, in PowerShell:

```powershell
irm https://cli.kiro.dev/install.ps1 | iex
```

That script reads `prod.download.cli.kiro.dev/stable/latest/manifest.json`, takes the checksum from
it, and installs `kiro-cli-x86_64-pc-windows-msvc.msi`. It is **x86_64 only** — on an ARM64 Windows
machine use the IDE instead.

**IDE**: download the installer from `kiro.dev` and run it.

### Install — macOS or Linux

```bash
curl -fsSL https://cli.kiro.dev/install | bash
```

That script supports Darwin and Linux only; on anything else it stops with "Unsupported operating
system". It verifies SHA-256 itself and installs to `~/.local/bin`, which you may need to add to
`PATH`.

### Confirm the version

```
kiro-cli --version
```

It must report **3.0.0 or later**. If it still shows 2.x you are on the old desktop-app line: run
`kiro-cli update` (twice if the first run does not take), or re-run the install script.

### Sign in

```
kiro-cli login
```

Then choose your sign-in method. **Pick "Use with Builder ID"** — your account page shows
"Signed in with BuilderId", so matching it keeps you on the account that holds the credits. Builder
ID, Google, GitHub and IAM Identity Center all support **device flow**, where the CLI prints a URL
and a one-time code you enter in any browser.

Check it took:

```
kiro-cli whoami --format json
```

Before login this returns `account: null`; after, it returns the account with `accountType` and
`region`.

### Confirm the credits are visible

Start a chat and run `/usage`. You want the **bonus pool** to appear, not just the Kiro Free
allowance. On 2026-11-10 the account page showed `kiroween-2026` at 0 / 4000 with 52 days left,
beside Kiro Free at 44.65 / 50 resetting 12-01. If `/usage` shows only the free allowance, check
`app.kiro.dev/settings/account` before spending time — and **write down exactly what it says**,
because that number is submission evidence.

### Network hosts

Only relevant behind a restrictive firewall. In use on 2026-10-31: `cli.kiro.dev`,
`prod.download.cli.kiro.dev`, `desktop-release.q.us-east-1.amazonaws.com`,
`oidc.us-east-1.amazonaws.com`, `runtime.us-east-1.kiro.dev`, `management.us-east-1.kiro.dev`,
`q.us-east-1.amazonaws.com`.

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

On 2026-10-31, under CLI 2.37.0, the sessions ran as `kiro-cli chat --v3 --mode spec` for
specification work and `--v3 --mode default` for implementation, with `--trust-tools=` left
**empty** so every tool action was reviewed one at a time. **Those flags are from the 2.x line and
may have changed in 3.x** — check `kiro-cli chat --help` once you are installed. The principle
carries over regardless: do not grant a whole-tool or whole-folder trust rule.

If you open a second surface for a task, note what was better or worse — the write-up asks.

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
