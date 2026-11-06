# Ghostlight design

Provenance: written by hand on 2026-11-06 alongside the implementation. **Not** generated or
reviewed by Kiro. It records the model that `src/domain/` actually implements.

## Separation of concerns

Three things are kept apart on purpose, because collapsing them is what makes a checker useless:

1. **Authored starting state** — `Prop.initial`: a known position, `unknown`, or `absent`.
2. **Authored requirements** — `Action.requiredSource` and `Action.destination`, taken from the run
   sheet. Only an explicit edit changes them (`src/domain/edit.ts`); the replay never writes to them.
3. **Modelled state** — `StateMap`, recomputed from 1 and 2 on every change. Never persisted.

## State

`PropState` is one of: `available` (with `zoneId` and `holderId | null`), `unknown`, `absent`,
`consumed`. Each carries `lastChange`, a `TraceRef` to the step that produced it. The map is frozen
per step, so a frame's `before` and `after` can be compared and kept.

## Step kinds and their conditions

| Kind | Needs a source | Destination | Extra conditions |
|---|---|---|---|
| `place` | no | required, holder must be none | sets the piece down |
| `collect` | yes | required, holder required | stays in its area, now held |
| `transfer` | yes | required, holder required | receiving holder must differ from the source holder |
| `carryOff` | yes | required, holder required | the carrier moves area |
| `consume` | yes | none | terminal for that instance |
| `replenish` | no | required | only from `absent`; never from `consumed` or `available` |

Before any kind-specific check: an unknown instance id, a missing destination, a missing or
forbidden holder, or a self-handoff is an error and the step is rejected.

Then, by current state:

- `consumed` → `consumed-reuse` (or `replenish-consumed`), rejected.
- `absent` and not a replenish → `absent-instance`, rejected.
- `unknown` → `unknown-start`, **uncertain**, and the step is applied from the stated requirement so
  later cues can still be checked.
- `available` and `requiredSource` is null → `source-not-recorded` (uncertain) for the kinds that
  move a piece from somewhere; otherwise silent.
- `available` and the required zone or holder differs → `source-mismatch`, rejected.

A rejected step leaves state identical (`frame.applied === false`), so one fault does not cascade
into a wall of false findings.

## Findings

`Issue` carries a stable `code` (exported in the CSV), a severity of `error` or `uncertain`, a plain
message naming both the requirement and the modelled position, a suggestion, and an optional `cause`
`TraceRef`. The cause is read from `lastChange` on the *before* state, so it is always an earlier
applied step on the same instance, or absent — meaning the recorded starting state. A later cue can
never be cited.

## Determinism

`runScenario` is pure over the scene. The same scene always produces the same frames, in the same
order, with the same findings — asserted in `tests/properties.test.ts`.

## Formats

- **JSON** — the scene exactly as typed (`version: 1`). Imports go through `parseScenario`, which
  validates every field, rejects prototype-polluting ids, enforces the limits, and returns a fresh
  normalised object rather than the caller's. A bad import never replaces the open scene.
- **CSV** — step-by-step, preset and reset tables, with leading `= + - @` neutralised so a cue title
  cannot become a spreadsheet formula.
- **Print** — a print stylesheet drops the controls and keeps the reports legible in black on white.

## Interface

Ghost (dashed, "required here") versus solid (filled, "planned") in the stage diagram, with an
equivalent list table that carries the same information for reduced motion, small screens and print.
Severity is a word and a shape, never colour alone. Every finding opens its failed condition and the
earlier step that caused it, and can jump the timeline to either.
