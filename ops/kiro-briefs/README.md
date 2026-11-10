# Kiro brief queue

One file per Kiro item, in order. `../kiro-brief.md` always points at the first unfinished one; this
folder holds the rest so you can run several in an evening without waiting for a daily run.

Each brief carries measured evidence, not guesses: axe node counts and CSS selectors come from
`tests/e2e/axe-baseline.json`, overflow numbers from `npm run test:e2e`. If a brief contradicts what
you see in the code, trust the code and say so — the brief was written by a reviewer reading the
repository, not by running Kiro.

## Order and why

Current order, from [`../kiro-session-howto.md`](../kiro-session-howto.md) with the 2026-11-10
insertion of the reopened K2:

**K8 → K2 (reopened) → K11 → K10 → K3 → K7 → K6 CSV → K12 → K9**

| Brief | State | Why it is here |
|---|---|---|
| [K8](K8.md) | open | Cheapest on the list, no code at all. Closes a line that has read NOT VERIFIED since 2026-10-31, and it is exactly what Technological Implementation asks about. |
| [K2](K2.md) | **reopened** | The original 33 violations are fixed. A selected timeline row was never scanned, and with one selected axe measures 1 contrast node in light and 6 in dark. One token pair. A live AA failure on the main view outranks new test work. |
| [K11](K11.md) | open | Not new scope — `.kiro/specs/ghostlight/tasks.md` §2.6 specifies `tests/pbt/` with fast-check and it was never implemented. The submission form asks about PBT by name. |
| [K10](K10.md) | open | Costume Contest's own wording. Bigger than it looked: the ghost-versus-solid CSS matches nothing the component emits, so three of five glyph types render as plain white boxes. |
| [K3](K3.md) | open | The list equivalent and reduced motion. Re-read it against K10's finding first — its premise that "ghost versus solid already exists" is true of the CSS and false of the screen. |
| [K7](K7.md) | open | Empty state and first-screen copy. Cheap, and it is the first thing a judge sees. |
| [K6](K6.md) | half done | The 390 px overflow is fixed. **CSV export is still open.** |
| K12 | **no brief on purpose** | MCP, custom agents, Crew, powers. What is worth trying depends on what the first sessions teach you; a brief written now would be a guess. Do not bolt one on for a checklist. |
| [K9](K9.md) | open | Dependency advisories. Last, because a major bump can break the suite and a red suite in the final week costs more than a dev-only advisory. |

### Done, kept for the record

| Brief | What happened |
|---|---|
| [K1](../kiro-brief.md) | The delayed-import race. **Done 2026-11-10 by the reviewer**, not Kiro, at the owner's explicit direction. A mirror-image bug surfaced on the way: the old code also wrongly *blocked* an import that completed after a deliberate Cancel. |
| [K2](K2.md) original | 33 violations across four screens, fixed at the token level rather than per selector. Then widened to two schemes and found 79 where the baseline had seen 32. Now partly reopened — see above. |
| [K4](K4.md) | The cause is a control that names its cue in words and jumps to the earlier step. Done by the reviewer. |
| [K5](K5.md) | The guided fix, narrow on purpose: two unambiguous cases, advice in words for everything else, and a test asserting a fix never edits the authored requirement. Done by the reviewer. |

`docs/demo-script.md` has its own "before you can shoot this" table mapping video beats to the
items they depend on. Check it before filming, not after.

## Every session

Before: check native `/usage` and note the number. After: append to `KIRO_SESSION_EVIDENCE.md` —
date, CLI version, model and mode, `/usage` before and after, which files Kiro wrote, what failed on
the way, and the final command results. Keep raw transcripts and credentials out of the repository.

Finish each item by running `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and
report the real numbers including failures. `npm run test:e2e` needs a browser; if the machine has
no Playwright, leave it to CI rather than installing a mismatched copy.
