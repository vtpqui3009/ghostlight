# Ghostlight build checkpoints

## 2026-10-31 — implementation authorized

The user authorized building the local MVP, superseding the validation-only execution restriction in the research documents. Real-user usefulness and differentiation remain unvalidated; missing interviews do not block this authorized build.

- In progress: deterministic physical-instance engine and tests; polished editable cue/replay interface.
- Next: integrate, run lint/type/unit/property/build, browser interaction/accessibility/responsive QA, independent review and fixes.
- Kiro: not found on PATH in the initial inspection. Availability inspection continues; no authenticated Kiro invocation has occurred. Codex-written specs are not evidence of Kiro usage.
- Scope: local implementation/testing only. No outreach, account creation, publishing, deployment, push or submission.

## Acceptance checks

- Required source remains independent of calculated state; missing transfers have a causal explanation.
- Physical duplicates are separate; consumed instances cannot revive; replenishment has a new instance identity.
- Unknown initial state is uncertainty; invalid actions do not mutate state; ordered replay is deterministic.
- Original demos and valid control; editable props/cues/actions; reordering changes validation.
- Functional ghost-versus-solid stage view, timeline and practical reports.
- Defensive local persistence/import/export, keyboard access, reduced motion and mobile layout.
- Record actual checks and limitations; never substitute a zero-bug promise for evidence.

## 2026-11-06 — local MVP implemented

The scaffold (types and import schema) was completed into a working local app.

- Added: `engine.ts` (deterministic replay, findings, backwards-only causal traces), `edit.ts`
  (immutable scene edits), `reports.ts` (preset / who-does-what / reset, CSV), `storage.ts` (local
  save with recovery and error states), `samples.ts` (synthetic scenes including all five acceptance
  scenarios), and the React interface (ghost/solid stage view with an equivalent list table, ordered
  timeline, findings with cause navigation, full scene editor, print stylesheet).
- Dependencies were added to `package.json`, which previously declared none.
- Checks run and recorded in `QA_RESULTS.md`: lint clean, `tsc -b` clean, 69 tests passing, production
  build, `npm audit --omit=dev` clean, and a Chromium pass covering interaction, keyboard, reduced
  motion, mobile and axe-core (0 violations after fixing heading order and landmark coverage).
- Still NOT RUN: user validation, competitor comparison, any Kiro session, cross-browser and
  screen-reader testing, committed end-to-end tests. The research documents' caveats stand unchanged.
