# Ghostlight requirements

Provenance: authored by Codex on 2026-10-31 from the user's approved scope. This file has NOT been generated or reviewed by Kiro. Merely placing it here does not establish meaningful Kiro use.

1. Store independent physical instance IDs and independent cue source/holder requirements.
2. Replay ordered transitions immutably; reject invalid transitions without mutating state.
3. Report unknown starting state as uncertainty, consumption as terminal for that instance, and replenishment as introducing an absent new instance.
4. Explain mismatches with the last relevant earlier action or initial state; never cite future actions.
5. Provide editable original scenes, cue replay, required ghost versus modeled solid location, and preset/runner/reset reports.
6. Support validated JSON import/export, local save with recovery/error states, accessible responsive interaction and reduced motion.
7. Label all playback as planned state, not live physical tracking. Do not claim real-user validation.

Acceptance: missing handoff, consumed reuse, duplicate identity, cue reordering and valid-control examples; generated deterministic invariant tests; browser interaction/accessibility/responsive checks. Results belong in QA documentation after execution.
