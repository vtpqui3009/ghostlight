# Ghostlight

Ghostlight checks a **physical prop plan** before the curtain rises. You enter the cues, the
physical prop instances and what each step requires; Ghostlight replays the plan in order and
reports where the plan contradicts itself — a missing handoff, a consumable used twice, the wrong
one of two identical copies, a cue that only works in the other order.

**Planned state, not live tracking.** It replays the plan you type in. It does not observe the real
stage, does not know where anything actually is, and is not a safety system. **It has not been
tested with stage managers**, so treat its findings as a second read of your own run sheet. Every
bundled scene is invented for demonstration.

Built for [Kiroween 2026](https://kiroween.devpost.com/), Costume Contest.

## Running it

```bash
npm ci
npm run dev        # http://127.0.0.1:5173
npm run check      # lint, strict typecheck, 297 unit tests, production build
```

Everything stays in the browser: scenes are saved locally and exported by hand as JSON. Nothing is
uploaded anywhere.

**Platform and third-party code (declared for the Official Rules).** A static web app that runs in a
current desktop or mobile browser; no account, backend or paid service. Built new during the
submission period on open-source libraries used under their own licences: React 18, Vite, TypeScript,
Vitest, fast-check, ESLint, axe-core and Playwright (test tooling only), plus the Model Context Protocol SDK, zod and esbuild (development tooling for the optional MCP server only). There is no pre-existing
project code, starter template or third-party data. The scenes are invented by this project.

**Local MCP server for Kiro (optional, development only).** `tools/mcp/` is a read-only
[Model Context Protocol](https://modelcontextprotocol.io) server that lets an agent ask the *real*
engine what a scenario does (`check_scenario`, `explain_issue`, `reports`, `list_demos`, `get_demo`,
and the transition table as a resource). It makes no network request and writes nothing. The built
file is committed at `.kiro/mcp/ghostlight-mcp.mjs` (about 1.6 MB, generated, so it is excluded from
lint; a test fails if it goes stale). To use it from Kiro, copy `.kiro/mcp/mcp.settings.json` to
`.kiro/settings/mcp.json`. Rebuild with `npm run build:mcp`. The running app does not use it.
A copy of the launch config is already committed at `.kiro/settings/mcp.json`; it needs `node` on the PATH.

## The model

- **A physical instance is a physical instance.** Two identical letters are `letter-A` and
  `letter-B`. A kind ("sealed letter") never stands in for an instance.
- **Required source is authored, not derived.** Each step carries the source and holder the run
  sheet states. The replay compares that against modelled state and never writes modelled state back
  into the requirement, so a scene cannot validate itself by construction.
- **Six step kinds**: place, collect, transfer, carry off, consume, replenish. Consumption is
  terminal for that instance in the run; replenish introduces a *separate* instance with its own
  identity and never revives a used-up one.
- **Unknown is uncertainty, not a verdict.** An instance with no recorded starting position
  produces "not enough information", never a problem.
- **A rejected step changes nothing**, so later cues are still checked against the plan as written,
  and the order of steps inside a cue is explicit — nothing is treated as simultaneous.
- **Causes point backwards.** Every finding is traced to the earlier step that moved the instance,
  or to the recorded starting state. Never to a later cue.

## Who wrote what

This matters for the competition, so it is stated plainly rather than implied.

| Part | Author |
|---|---|
| `.kiro/specs`, `.kiro/steering`, `.kiro/hooks` | Kiro |
| `src/**` — engine, parser, reports, editing, persistence, UI | Kiro, except the files listed below |
| `tests/domain/**`, `tests/ui/actionFormHelpers.test.ts`, `tests/persistence/**` — 222 tests | Kiro |
| `tests/e2e/**`, `.github/workflows/**` — verification harness and CI | reviewer (Claude), not Kiro |
| `docs/**`, `ops/**`, the research documents, this file | reviewer and the project owner |

On 2026-11-23 a separate assistant session (not Kiro CLI) edited only these paths: the submission
documents (`docs/submission.md`, `docs/submission-packet.md`, `docs/kiro-writeup.md`,
`docs/KIROWEEN_REQUIREMENTS.md`, `docs/HANDOFF_TO_KIRO.md`, `docs/SUBMISSION_ROADMAP.md`,
`ops/kiro-brief.md`), the two drafts `docs/blog-post.md` and `docs/social-post.md`, `QA_RESULTS.md`,
`KIRO_SESSION_EVIDENCE.md`, and `tests/e2e/verify-pages-build.mjs` (so it runs on Windows). It changed
nothing in `src/`. The only Kiro CLI work that day was the MCP and hook checks recorded in
`KIRO_SESSION_EVIDENCE.md`.

On the same day Kiro CLI (model `claude-sonnet-5.5`, file tools only) wrote K13 "Halloween v2" from the
brief `ops/kiro-briefs/K13.md`: `src/ui/Decor.tsx` (new), the `K13 Halloween v2` section of
`src/styles.css`, and the decoration mounts in `src/App.tsx` and `src/ui/StageView.tsx`. The reviewing
assistant wrote the brief, `tests/e2e/specs/halloween.spec.mjs`, the one-line registration in
`tests/e2e/run.mjs`, and the `testTimeout` in `vitest.config.ts`.

On 2026-11-10 the project owner asked the reviewer to make the following changes in
`src/` directly, rather than through Kiro. They are listed here rather than left to be
inferred from the git history:

| File | Change | Author |
|---|---|---|
| `src/ui/importGuard.ts` (new) | the import guard, as a getter so it reads current state | reviewer |
| `src/App.tsx` | wires that guard, adds the single `main` landmark, status text token | reviewer |
| `src/ui/ImportExport.tsx` | calls the newest `onImport` instead of a captured one | reviewer |
| `src/ui/Timeline.tsx` | removed two `aria-label`s that contradicted the visible text | reviewer |
| `src/ui/Reports.tsx` | focusable scroll regions around the tables, colour tokens | reviewer |
| `src/ui/Editor.tsx` | colour tokens only | reviewer |
| `src/styles.css` | the WCAG AA colour token pass, both schemes | reviewer |
| `tests/ui/importGuard.test.ts` (new) | regression test for the import race | reviewer |
| `src/domain/guidedFix.ts` (new) | the guided fix: when one edit is unambiguous, and what it is | reviewer |
| `src/ui/StageView.tsx` | the cause rendered as a control, and the guided-fix panel | reviewer |
| `tests/domain/guidedFix.test.ts` (new) | 8 tests for the guided fix | reviewer |

Everything else under `src/` — the engine, the parser, the edit layer, persistence, the
action editor and the stage view — is Kiro's, as is every test outside that list.

Kiro CLI 3.3.0 sessions on 2026-11-13 (K3, K6 CSV half, K7, K10, K2 reopened) added or changed these
files; the full account, including what failed, is in `KIRO_SESSION_EVIDENCE.md`:

| File | Change | Author |
|---|---|---|
| `src/ui/stageModel.ts`, `src/ui/stageReading.ts` (new) | one derivation shared by the diagram and the list; diagram/list choice | Kiro |
| `src/ui/StageView.tsx` | renders from the shared model; diagram/list toggle; legend; pair notes | Kiro (on top of the reviewer's cause/fix panel) |
| `src/ui/reportCsv.ts` (new), `src/ui/Reports.tsx` | CSV export, one file per report | Kiro |
| `src/App.tsx` | the first screen: purpose, limits, one first move, a sentence per demo | Kiro |
| `src/styles.css` | haunted-stage visual language, ghost/solid wiring, selected-row tokens | Kiro (on top of the reviewer's token pass) |
| `tests/ui/stageModel.test.ts`, `tests/ui/reportCsv.test.ts`, `tests/domain/properties.test.ts` (new) | 25 + 15 tests | Kiro |
| `tools/mcp/**`, `.kiro/mcp/**`, `tests/mcp/**` (new) | the local read-only MCP server, its generated bundle and 22 tests | Kiro |
| `src/styles.css`, `src/App.tsx` | the haunted-theatre layer and first screen (2026-11-13 pass) | Kiro |

[`KIRO_SESSION_EVIDENCE.md`](KIRO_SESSION_EVIDENCE.md) records the actual native Kiro sessions:
which model and mode, what Kiro wrote, which checks failed on the way, and what was fixed. It is an
honest record, including the parts that are still NOT VERIFIED.

## State of the work

`npm run check` is green: lint, strict TypeScript, **297 passing tests**, production build. The
end-to-end and accessibility harness runs **32 tests** over the production build with an empty axe
baseline and no ledgered failure (`npm run test:e2e -- --strict`; last run 2026-11-28, Windows).
`npm audit --omit=dev` reports 0 vulnerabilities; the 7 moderate advisories that remain are all in
the dev-only lint chain.

Open work, with owners, is in [`docs/SUBMISSION_ROADMAP.md`](docs/SUBMISSION_ROADMAP.md). The
measured state, including what the checks do not show, is in [`QA_RESULTS.md`](QA_RESULTS.md), and
nothing there is rounded in the project's favour.

## Where things are

| Path | What it holds |
|---|---|
| [`docs/HANDOFF_TO_KIRO.md`](docs/HANDOFF_TO_KIRO.md) | **Start here for the remaining work** — what is left, in order, and who owns it |
| [`START_HERE.md`](START_HERE.md) | Continuation order, contracts and the current checkpoint |
| [`docs/SUBMISSION_ROADMAP.md`](docs/SUBMISSION_ROADMAP.md) | What the submission still needs, and who owns each part |
| [`docs/KIROWEEN_REQUIREMENTS.md`](docs/KIROWEEN_REQUIREMENTS.md) | The event's rules and how far each one is met |
| [`QA_RESULTS.md`](QA_RESULTS.md) | Checks actually run, with real numbers and limits |
| [`ops/daily-run.md`](ops/daily-run.md) | Contract for the automated daily session |
| [`tests/e2e/README.md`](tests/e2e/README.md) | The browser harness and its two debt ledgers |
| `GHOSTLIGHT_VALIDATION_PLAN.md`, `KIROWEEN_*.md` | The research behind the scope, in Vietnamese, caveats intact |

## Licence

MIT — see [LICENSE](LICENSE).
