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
npm run check      # lint, strict typecheck, 222 unit tests, production build
```

Everything stays in the browser: scenes are saved locally and exported by hand as JSON. Nothing is
uploaded anywhere.

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
| `src/**` — engine, parser, reports, editing, persistence, UI | Kiro |
| `tests/domain/**`, `tests/ui/**`, `tests/persistence/**` — 222 tests | Kiro |
| `tests/e2e/**`, `.github/workflows/**` — verification harness and CI | reviewer (Claude), not Kiro |
| `docs/**`, `ops/**`, the research documents, this file | reviewer and the project owner |

[`KIRO_SESSION_EVIDENCE.md`](KIRO_SESSION_EVIDENCE.md) records the actual native Kiro sessions:
which model and mode, what Kiro wrote, which checks failed on the way, and what was fixed. It is an
honest record, including the parts that are still NOT VERIFIED.

## State of the work

`npm run check` is green: lint, strict TypeScript, **222 passing tests**, production build. The
end-to-end and accessibility harness runs 15 tests over the production build; one is a written-down
known failure.

Open work, with owners, is in [`docs/SUBMISSION_ROADMAP.md`](docs/SUBMISSION_ROADMAP.md). The
measured state — accessibility debt, the open import race, dependency advisories — is in
[`QA_RESULTS.md`](QA_RESULTS.md), and nothing there is rounded in the project's favour.

## Where things are

| Path | What it holds |
|---|---|
| [`START_HERE.md`](START_HERE.md) | Continuation order, contracts and the current checkpoint |
| [`docs/SUBMISSION_ROADMAP.md`](docs/SUBMISSION_ROADMAP.md) | What the submission still needs, and who owns each part |
| [`docs/KIROWEEN_REQUIREMENTS.md`](docs/KIROWEEN_REQUIREMENTS.md) | The event's rules and how far each one is met |
| [`QA_RESULTS.md`](QA_RESULTS.md) | Checks actually run, with real numbers and limits |
| [`ops/daily-run.md`](ops/daily-run.md) | Contract for the automated daily session |
| [`tests/e2e/README.md`](tests/e2e/README.md) | The browser harness and its two debt ledgers |
| `GHOSTLIGHT_VALIDATION_PLAN.md`, `KIROWEEN_*.md` | The research behind the scope, in Vietnamese, caveats intact |

## Licence

MIT — see [LICENSE](LICENSE).
