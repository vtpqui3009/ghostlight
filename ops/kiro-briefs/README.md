# Kiro brief queue

One file per Kiro item, in order. `../kiro-brief.md` always points at the first unfinished one; this
folder holds the rest so you can run several in an evening without waiting for a daily run.

Each brief carries measured evidence, not guesses: axe node counts and CSS selectors come from
`tests/e2e/axe-baseline.json`, overflow numbers from `npm run test:e2e`. If a brief contradicts what
you see in the code, trust the code and say so — the brief was written by a reviewer reading the
repository, not by running Kiro.

## Order and why

| Brief | Why it is here |
|---|---|
| [K1](../kiro-brief.md) | Open product defect. Everything else is polish on a build with a known data-loss bug. |
| [K2](K2.md) | 33 accessibility violations. The video shows the UI closely, and Design is 20% of judging. |
| [K4](K4.md) | The cause is already computed and printed — making it navigable is small and it is a video beat. |
| [K5](K5.md) | The guided fix. The strongest single moment in the demo. |
| [K3](K3.md) | The list equivalent and reduced motion. Also a video beat. |
| [K6](K6.md) | Reports: the 390 px overflow and CSV export. |
| [K7](K7.md) | Empty state and first-screen copy. Cheap, and it is the first thing a judge sees. |
| [K8](K8.md) | Verify the hook actually triggers. Recorded as NOT VERIFIED since 2026-10-31. |
| [K9](K9.md) | Dependency advisories. Last, because a major bump can break the suite. |

K1 → K2 → K4 → K5 → K3 → K6 is also the order the demo script needs; see
[`docs/demo-script.md`](../../docs/demo-script.md).

## Every session

Before: check native `/usage` and note the number. After: append to `KIRO_SESSION_EVIDENCE.md` —
date, CLI version, model and mode, `/usage` before and after, which files Kiro wrote, what failed on
the way, and the final command results. Keep raw transcripts and credentials out of the repository.

Finish each item by running `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and
report the real numbers including failures. `npm run test:e2e` needs a browser; if the machine has
no Playwright, leave it to CI rather than installing a mismatched copy.
