# Kiro brief — current task

Refreshed by the daily run. Paste the block below into a native Kiro session. One brief at a time;
the daily run replaces this file when the task is accepted.

**Task K1 — repair the delayed-import race.** Prepared 2026-11-10. Full evidence:
[`docs/handoff/ACTIONFORM_CHECKPOINT.md`](../docs/handoff/ACTIONFORM_CHECKPOINT.md).

## Before you start

- Open the repository at `main` (now the Kiro lineage, `260bca4` or later). Run `npm ci` then
  `npm run check` once and confirm the baseline: lint, strict typecheck, 222 tests, production build.
- Check native `/usage` and note the number. The owner reports about 4,000 credits as of 2026-11-10,
  so the old free-only 50-credit ceiling no longer applies — but record what `/usage` actually says
  rather than assuming.
- Kiro is the author of application source and domain tests. Do not ask a reviewer to write them.

## Paste this into Kiro

```text
Repair one reproduced defect in Ghostlight, nothing else.

Defect: in src/ui/ImportExport.tsx the FileReader.onload handler captures the
onImport callback from the render in which the read started. That stale closure
still sees editorHasDraft = false, so a file read that completes after an action
draft has opened replaces the scene even though the draft guard should reject it.
Saving the retained old draft then overwrites the freshly imported action with the
old kind, prop, source, destination and note.

Reproduce it first, with a controlled FileReader completion:
1. Load a scene containing an action with id `shared`, no draft open.
2. Begin importing a valid replacement scene that reuses the same cue and action
   ids, but hold the read completion.
3. Open `shared` in the current scene, change its note, keep the draft open.
4. Release the read completion. Today the replacement is imported anyway.
5. Save the retained draft. Today it overwrites the imported action.

Fix: decide the import replacement using the draft state at completion and commit
time, not a stale render callback. Use a stable callback reading current state, or
an equivalent latest-state reference. On rejection, leave both the scene and the
draft exactly as they were, and keep the existing rejection message. Parser
ownership stays where it is: the replay still expects structurally validated input.

Do not fix this by silently resetting the draft, by blocking imports permanently,
or by rewriting unrelated UI. Imports must still work normally after a deliberate
Save or Cancel, including a read that was started while editing and completes
after the draft is resolved.

Add a regression test that drives the controlled delayed-read sequence and asserts
that the scene and the draft are both unchanged while a draft is active. Keep the
existing tests passing; do not weaken an assertion to get green.

When the edits are final, run once: npm run lint, npm run typecheck, npm test,
npm run build. Report the real results, including any failure.
```

## Acceptance for this task

- The delayed-read sequence is reproduced, then rejected: scene unchanged, draft unchanged.
- Ordinary import after Save or Cancel still works, including a read started while editing.
- Failed-import retention and the six action-kind editor controls still pass.
- A regression test covers the race and is authored through Kiro.
- `npm run check` passes with the test count at 223 or more, and the real number is reported.

## Must not change

`src/domain/**` behaviour, the parser contract, the 200,000-byte import limit, the existing
rejection messages, or any `.kiro/` specification — unless the repair genuinely requires it, in
which case say so explicitly rather than editing quietly.

## Evidence to record afterwards

Append to `KIRO_SESSION_EVIDENCE.md`: the date, CLI version, model and mode, `/usage` before and
after, which files Kiro wrote, what failed on the way, and the final command results. Keep raw
transcripts and credentials out of the repository.

## Next in the queue

K2 accessibility (3 axe violations: `color-contrast` ×3, `landmark-one-main`, `region`), then K3
ghost-versus-solid stage view with a list equivalent. See `docs/SUBMISSION_ROADMAP.md` section B.
