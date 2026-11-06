# Ghostlight tasks

Provenance: written by hand. **Not** generated, planned or tracked by Kiro.

## Done (2026-11-06)

- [x] Domain types and import validation with limits and hostile-input handling.
- [x] Deterministic replay engine: six step kinds, uncertainty for unrecorded starts, terminal
      consumption, backwards-only causal traces, rejected steps that do not mutate state.
- [x] Immutable scene edits: cues, steps, instances, areas, runners; reordering; limit guards;
      removal that keeps the scene importable.
- [x] Reports: preset, who-does-what, reset, plus three CSV exports and a print stylesheet.
- [x] Local save with recovery and error states; JSON import/export; single-level undo.
- [x] Interface: ghost/solid stage view with an equivalent list table, ordered timeline, findings
      with cause navigation, full scene editor.
- [x] Tests: 69 across unit, the five acceptance scenarios, and generated property tests.
- [x] Browser pass in Chromium: interaction, keyboard, reduced motion, mobile, axe (0 violations).
      Recorded in `QA_RESULTS.md`.

## Not done — and not to be marked done without the work

- [ ] User validation with stage managers / ASMs. All of the validation plan's user gates are still
      NOT RUN, and nothing in this build changes that.
- [ ] Executed comparison against CueCall, DigiScript and Standby.
- [ ] Any genuine Kiro session. These spec files do not count as evidence of one.
- [ ] Committed end-to-end tests; the browser checks live in a scratch script.
- [ ] Cross-browser, screen-reader and real-device accessibility testing.
- [ ] Demo video, submission material, deployment. Out of the current scope.
