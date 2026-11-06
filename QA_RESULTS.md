# Ghostlight — checks actually run

Date: 2026-11-06. Everything below was executed in this repository on this date. Anything not listed
here was not run. These are correctness checks on the implementation; they are **not** evidence that
the tool is useful to a stage manager.

## Automated

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` (eslint 10, typescript-eslint) | clean, 0 findings |
| Types | `tsc -b` under `strict`, `noUnusedLocals`, `noUnusedParameters` | clean |
| Unit + acceptance + property tests | `npm test` (vitest 5) | 69 passed in 6 files, 0 failed |
| Production build | `npm run build` (vite 8) | built; 273 kB JS (83 kB gzip), 8 kB CSS |
| Dependency audit | `npm audit --omit=dev` | 0 vulnerabilities |

### The five acceptance scenarios from the validation plan

All five are in `src/domain/samples.ts` and asserted in `tests/engine.test.ts`:

| Scenario | Expected | Result |
|---|---|---|
| Missing handoff | mismatch reported, traced to the earlier carry-off, requirement untouched | pass |
| Reused consumable | reuse refused; a new instance accepted; replenish cannot revive the used-up one | pass |
| Two identical copies | copy B still valid after copy A leaves; pointing the cue at copy A fails | pass |
| Cue reordering | valid as written, mismatch after the swap, traced to the starting state | pass |
| Valid control chain | no findings at all | pass |

The control case exists to stop a checker that always complains from "passing" the other four.

### Generated property tests (`tests/properties.test.ts`, fast-check)

Each runs 50–300 generated scenes: generated scenes stay inside the import schema; single custody;
consumption is terminal; determinism (same scene replays identically); rejected steps leave state
untouched and always carry an error; every finding sits on its own step and any cause is a strictly
earlier applied step on the same instance; the initial state reflects only authored starting
positions; an empty plan reports nothing.

## Browser checks (Chromium via Playwright, against the production build)

Script and screenshots were run from a scratch directory and are not committed.

- Stepping with the buttons, with arrow keys, and with Home/End moves through the plan correctly.
- Missing-handoff example: the problem is reported, "Show the cause" jumps to the earlier carry-off,
  and the stage view shows the dashed ghost at the required table with the solid chip in the wing.
- Reordering a cue in the editor flips the verdict from 0 problems to 1 problem, and the authored
  required source is unchanged by the move. Undo restores it.
- An invalid import is refused with per-field messages and the current scene is left in place.
- Export → New scene → re-import restores the scene; a reload restores the autosaved scene.
- Reports render preset, who-does-what and reset, and the three CSV downloads work.
- **Accessibility:** axe-core 4.14 (wcag2a, wcag2aa, wcag21a, wcag21aa, best-practice) on five
  states — run-through, scene editor, reports, mobile with reduced motion, light colour scheme —
  reported **0 violations**. Two findings from the first pass (heading order, content outside
  landmarks) were fixed before this run.
- Keyboard: every control in the first 24 tab stops is reachable with a visible focus outline; a
  skip link leads to the plan.
- Reduced motion (`prefers-reduced-motion: reduce`) opens the equivalent list table instead of the
  stage diagram; the diagram can still be chosen by hand.
- Mobile 390×844: 0 px horizontal overflow, list view legible, controls wrap.
- No console errors or page errors during the whole run.

## Limitations — what these checks do **not** show

- **No user validation.** No stage manager or ASM has used this. The validation-plan gates on users,
  data, differentiation and bookkeeping effort remain NOT RUN.
- **No competitor comparison was executed.** CueCall, DigiScript and Standby were read about in the
  research pass only; no equivalent runtime test has been performed.
- **No evidence of Kiro use.** The files under `.kiro/` are hand-written specs and steering notes.
- Browser coverage is Chromium only. No Firefox, Safari, real mobile device, screen-reader or
  colour-blindness testing was performed; axe catches a subset of accessibility problems.
- Contrast was designed against the WCAG AA target and checked by axe, not measured by hand for
  every pairing.
- No end-to-end test suite is committed; the browser checks above were run from a script in a
  scratch directory, so they are not reproducible from this repository as-is.
- 10 moderate dev-only advisories remain (a `minimatch` DoS reachable through the eslint and
  typescript-eslint chain). Nothing ships to the browser from those packages; fixing them currently
  means downgrading eslint.
- The engine models a plan. It cannot tell you whether the real objects are where the plan says.
