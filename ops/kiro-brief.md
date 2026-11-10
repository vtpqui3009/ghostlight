# Kiro brief — current task

Refreshed by the daily run. Paste the block below into a native Kiro session. One brief at a time;
the daily run replaces this file when the task is accepted.

**Task K1 — repair the delayed-import race.** Prepared 2026-11-10. Full evidence:
[`docs/handoff/ACTIONFORM_CHECKPOINT.md`](../docs/handoff/ACTIONFORM_CHECKPOINT.md).

## Before you start

- Open the repository at `main` (now the Kiro lineage, `260bca4` or later). Run `npm ci` then
  `npm run check` once and confirm the baseline: lint, strict typecheck, 222 tests, production build.
  Verified green by the daily run on 2026-11-10.
- Check native `/usage` and note the number. The owner reports about 4,000 credits as of 2026-11-10,
  so the old free-only 50-credit ceiling no longer applies — but record what `/usage` actually says
  rather than assuming.
- Kiro is the author of application source and domain tests. Do not ask a reviewer to write them.
- There is now a reviewer-authored browser harness: `npm run build && npm run test:e2e`
  (see `tests/e2e/README.md`). It is **not** part of `npm run check`, and it is currently red on one
  real defect that belongs to a later task — see "Known failures you are not fixing today" below.
  Do not change anything under `tests/e2e/`; it is reviewer-owned, like the rest of the harness.

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
- `npm run build && npm run test:e2e` is no worse than the recorded 14 passed / 1 failed. The one
  failure must still be the Reports 390 px overflow and nothing else; if a new failure appears, K1
  caused it.

## Must not change

`src/domain/**` behaviour, the parser contract, the 200,000-byte import limit, the existing
rejection messages, or any `.kiro/` specification — unless the repair genuinely requires it, in
which case say so explicitly rather than editing quietly.

## Evidence to record afterwards

Append to `KIRO_SESSION_EVIDENCE.md`: the date, CLI version, model and mode, `/usage` before and
after, which files Kiro wrote, what failed on the way, and the final command results. Keep raw
transcripts and credentials out of the repository.

## Known failures you are not fixing today

The daily run's first harness execution on 2026-11-10 found these. They are **real, observed
numbers**, not estimates. None of them is K1, so leave them alone this session — they are listed so
you do not think the harness is broken when it goes red.

| Observed | Owner |
|---|---|
| Reports table overflows a 390 px viewport by **73 px** (`table.report-table`); stage, editor and the first screen do not overflow | K6 (reports), newly found |
| `color-contrast` — **3** nodes on the first screen, **5** stage, **6** reports, **18** editor | K2 |
| `landmark-one-main` **1** node and `region` **2** nodes, first screen only — the loaded views do have a `main` | K2 |
| `label-content-name-mismatch` — **4** nodes on every loaded view, on the timeline's `role="treeitem"` cue headers and action rows, where the `aria-label` does not contain the visible text | K2, newly found |

## Next in the queue

**K2 — accessibility**, now with the counts above rather than the earlier partial figure of three
violations. Note two things when you reach it:

- The first screen has no `main` landmark at all, because `<main className="app-main">` in
  `src/App.tsx` only renders once a scenario is loaded. The empty state and the storage-error alert
  therefore sit outside any landmark. Fixing the empty state alone will not clear `region`.
- `label-content-name-mismatch` is a genuine screen-reader defect, not a lint nit: in
  `src/ui/Timeline.tsx` the `aria-label` on a cue header reads `Cue: <title>. N actions. Click to
  expand`, which does not contain the visible text as a substring in the right form. The accessible
  name must contain the visible label.
- When K2 is done, empty the arrays in `tests/e2e/axe-baseline.json` by running
  `npm run test:e2e -- --record`, then confirm `npm run test:e2e -- --strict` passes. Do not
  hand-edit that file.

## The rest of the queue

Every remaining item now has a written brief with measured evidence and its own paste block, in
[`ops/kiro-briefs/`](kiro-briefs/). Run order: **K1 (this file) → [K2](kiro-briefs/K2.md) →
[K4](kiro-briefs/K4.md) → [K5](kiro-briefs/K5.md) → [K3](kiro-briefs/K3.md) →
[K6](kiro-briefs/K6.md) → [K7](kiro-briefs/K7.md) → [K8](kiro-briefs/K8.md) →
[K9](kiro-briefs/K9.md)**, which is also the order the demo script needs.

Reading the code on 2026-11-10 made three of them smaller than they looked: the causal trace is
already printed and only needs to become navigable (K4), ghost-versus-solid already exists and only
needs a list equivalent (K3), and the print path already exists so K6 is the 390 px overflow plus
CSV. Each brief says so at the top, so no credits go on rebuilding what is there.
