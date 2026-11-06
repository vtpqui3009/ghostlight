# Ghostlight

Ghostlight checks a **physical-prop plan** before the curtain rises. You type in the cues, the
physical instances and what each step requires; Ghostlight replays the plan in order and reports
where the plan contradicts itself — a missing handoff, a reused consumable, the wrong copy of two
identical pieces, a cue that only works in the other order.

**It models planned state only.** It does not observe the real stage, does not know where anything
actually is, and is not a safety system. It has not been tested with stage managers, so its output
is a second read of your own run sheet, nothing more.

## Running it

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run check    # lint, typecheck, unit/property tests, production build
```

Everything stays in the browser: scenes autosave to `localStorage` and are exported by hand as JSON
or CSV. Nothing is uploaded anywhere.

## The model

- **A physical instance is a physical instance.** Two identical letters are `letter-A` and
  `letter-B`. A kind ("Sealed letter") never stands in for an instance.
- **Required source is authored, not derived.** Each step carries the source and holder the run
  sheet states. The replay compares that against modelled state; it never writes modelled state back
  into the requirement, so a scene cannot validate itself by construction.
- **Six step kinds**: place, collect, hand over (transfer), carry off, use up (consume), bring on a
  fresh instance (replenish). Consumption is terminal for that instance in the run; replenish
  introduces a *separate* instance with its own identity and never revives a used-up one.
- **Unknown is uncertainty, not a verdict.** An instance with no recorded starting position produces
  "not enough information", never a problem.
- **A rejected step changes nothing.** State is immutable per step, so later cues are still checked
  against the plan as written, and the ordering of steps inside a cue is explicit — nothing is
  treated as simultaneous.
- **Causes point backwards.** Every finding is traced to the earlier step that moved the instance,
  or to the recorded starting state. Never to a later cue.

Limits per scene: 12 instances, 6 areas, 12 runners, 40 cues, 12 steps per cue, 200 KB on import.

## Layout

| Path | What it holds |
|---|---|
| `src/domain/types.ts` | Scene, state, finding and frame types |
| `src/domain/schema.ts` | Import validation; returns an owned, normalised copy |
| `src/domain/engine.ts` | The deterministic replay and all findings |
| `src/domain/edit.ts` | Immutable scene edits used by the editor |
| `src/domain/reports.ts` | Preset / who-does-what / reset reports and CSV |
| `src/domain/storage.ts` | Local save, recovery and error states |
| `src/domain/samples.ts` | Synthetic example scenes, including the acceptance cases |
| `src/components/` | Stage view, timeline, findings, editor, reports |
| `tests/` | Unit, acceptance and generated property tests |

## Status and evidence

See `QA_RESULTS.md` for the checks that were actually run and what they do not cover, and
`GHOSTLIGHT_VALIDATION_PLAN.md` / `KIROWEEN_FINAL_REVIEW.md` for the research behind the scope —
including the gates that remain NOT RUN. In particular there is still **no user validation** and
**no evidence of Kiro use**; the files under `.kiro/` were written by hand.

Example scenes in the app are invented. Do not paste a real run sheet into a browser you do not
control, and anonymise before sharing one.
