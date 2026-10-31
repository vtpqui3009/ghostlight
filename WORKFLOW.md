# Ghostlight cloud work protocol

Prepared by **Codex** on 2026-10-31. This is orchestration guidance and a task ledger, not a Kiro transcript, application implementation, or QA result. Baseline: `1a2f9521111f0ba67a085474a441f26a61d709b9`.

The user's later implementation authorization supersedes the validation-only execution gates in the research documents. Their caveats about demand, differentiation, real-user validation, and contest eligibility remain intact. The parent subsequently relayed explicit user authorization for private coding branches, commits, pushes, and draft pull requests. Preserve `main`; use a separate WIP branch after reviewing the diff and scanning for secrets/proprietary content. No merge, force push, deployment, submission, visibility/security change, outreach, purchase, or unrelated project access is authorized.

## Ownership and sequence

- One native Kiro session is the primary writer for specifications, design, meaningful hooks, application code, fixtures, tests, and fixes. Do not substitute Codex implementation if Kiro setup is blocked.
- Codex owns environment preparation, this ledger, scoped task handoffs, independent review, command verification, and honest evidence recording. Reviewers do not edit paths owned by the active Kiro task.
- Before a writer begins, record the task ID, owner/session, allowed paths, base SHA, dependencies, acceptance commands, and output evidence. A task may cross only explicitly recorded path boundaries.
- Keep secrets and authenticated session state outside the repository. Review actual Kiro transcript excerpts for secrets before preserving sanitized evidence; preserve existing Codex provenance.
- Use original lightweight orchestration. Do not install an agent framework or copy licensed ClaudeKit sources into this repository. Private skill transfer remains a separate pending handoff.
- The user requires free-only Kiro use. Native `/usage` verified KIRO FREE, 0.33/50 credits at the first check, resetting 2026-11-01. Recheck at milestones; stop on unknown entitlement or quota exhaustion. Never upgrade, purchase credits, enable overages, alter billing, or use paid allowance. Routine authorized development does not need repeated confirmation.

## Task ledger

Native Builder ID login and whoami verification succeeded in this environment. T1 specifications passed independent domain review and were checkpointed locally at `29c9d75489c10c97ce097eadb7ab0d070613961b`. T2 is in progress in native Kiro PTY 66744 after PTY 44795 exited normally. Initial checks failed; the repair pass has since run lint, typecheck, 30 tests and the stub production build successfully, and is strengthening test oracles. No complete T2 or product acceptance is claimed. Optional native hook-trigger and final spec-format checks remain deferred.

| ID | Owner | Paths | Base SHA | Dependencies | Acceptance and evidence | Status |
|---|---|---|---|---|---|---|
| T0 | Codex preflight | Repository checkout; `WORKFLOW.md` | `1a2f9521111f0ba67a085474a441f26a61d709b9` | None | Verify exact fetched SHA, read all 17 baseline files, identify missing runtime pieces | DONE: baseline restored; no app checks run |
| T1 | Kiro primary writer | `.kiro/specs/ghostlight/**`, `.kiro/steering/**`, meaningful `.kiro` hook/config paths | Baseline, then record checkpoint | Verified native authentication | Resolve six-action transition table, state invariants, unknown handling, causal semantics, report semantics, and acceptance plan; preserve prior authorship | DONE for domain handoff: independent GO; hook syntax/skip checked, native trigger deferred |
| T2 | Kiro primary writer, current PTY 66744 | `package.json`, lockfile, project tool configs, `src/domain/**`, owned fixture paths, `tests/**`, minimal `src/App.tsx`/`src/styles.css`/`src/main.tsx` stubs and Playwright config | `29c9d75489c10c97ce097eadb7ab0d070613961b` | T1 | A01–A15 and A18 model/parser coverage; `npm run lint`, `npm run typecheck`, `npm test`, scoped independent review | IN PROGRESS: engine slice checks green; stronger oracles, parser, reports and edit helpers pending |
| T3 | Kiro primary writer | `src/**`, `index.html`, UI/browser test/config paths; any T2 fixes explicitly recorded | Record T2 checkpoint | T2 model review | Editable scene/timeline, ghost/solid comparison, causal links, reports, validated import/export, recovery and empty/error states; A16–A18 | NOT RUN |
| T4 | Codex reviewer/QA; fixes by Kiro | Read all implementation; write only QA evidence outside active writer scope | Record T3 checkpoint | T3 | `npm run check`, `npm run test:e2e`; browser workflow, keyboard, responsive, reduced motion, storage error and print checks; record exact failures and fixes | NOT RUN |
| T5 | Codex checkpoint owner | Progress/QA documents; private WIP branch/commit/draft PR after review | Record reviewed SHA | Reviewed milestone; T4 for final acceptance | `git diff --check`, reviewed diff and secret/proprietary scan, documented checks/limitations and next action; preserve main, no merge/deploy | WIP checkpoint preparation authorized; final acceptance NOT RUN |

Scripts in the baseline were intentions. Kiro has now installed dependencies, created a lockfile, and added minimal compilation stubs. The stubs are not the product UI. Do not mark checks passed because the scripts exist.

## Acceptance map

The handoff's A01–A18 examples are independent acceptance requirements, not executed tests. Kiro must formalize the action transition table before implementing it. Each rejected action must leave state unchanged and report a useful error or uncertainty.

| IDs | Required independent oracle |
|---|---|
| A01 | Valid collect → transfer → carry → place control has four applied frames and the hand-calculated final holder/location. |
| A02 | Missing transfer rejects the later wrong-holder requirement and cites the last relevant successful action; requirements stay authored independently. |
| A03 | Consumed ID never revives; replenishing a different absent ID does not satisfy a requirement still naming the consumed ID. |
| A04 | Same-name duplicates remain independent physical IDs. |
| A05–A06 | Reordering cues or same-cue actions changes outcomes without rewriting requirements or IDs; causes respect full action order. |
| A07–A08 | Unknown stays uncertain; absent cannot be used before replenishment; only a previously absent instance can be introduced. |
| A09–A10 | Both holder and zone must match; explicit null holder differs from omitted holder; missing/forbidden fields and illegal transitions follow the authored table. |
| A11–A12 | Replay is immutable and deterministic; snapshots are independent; rejected actions cannot cause later state; causes are earlier successful actions on the same instance or clearly identified initial state. |
| A13–A15 | Parser rejects malformed/version/ID/reference/boundary input, strips extra keys, safely handles allowed `toString`, enforces UTF-8 byte limit, and returns an owned normalized copy. Define direct-object input behavior separately from JSON. |
| A16 | Import round trip preserves identity/order/requirements; invalid input retains current work; corrupt saved data and storage access/quota failure are recoverable without false saved state. |
| A17 | Preset reflects known initial state; runner reflects ordered requirements and warnings; physical reset reflects final state and replacement/uncertainty, never resurrecting consumed IDs. |
| A18 | Reference edits prevent dangling references; computed state shapes remain valid; document unsupported direct-object adversarial inputs rather than claiming unrun cases passed. |

Generated invariant tests must record reproducible seeds/counterexamples and use independent expected results. UI checks must cover keyboard/focus, text equivalents for ghost and solid states, pre-action comparison, predictable replay after edits, mobile/zoom, reduced motion, practical print output, and real error/empty states. Synthetic planned-state playback is never live tracking or real-user validation.

## Evidence, retries, and checkpoints

For each actual check record UTC time, actor/tool and version, command, exit code, checkpoint SHA or diff identity, observed result, evidence location, and remaining limitations. Preserve failure evidence and connect Kiro fixes to the observed issue. A plan, scaffold, hook file, or claimed test run is not a passing result.

After an implementation failure, assign a scoped Kiro fix, rerun the affected check, then complete remaining acceptance checks. Limit unchanged retries: after two failed fix attempts on the same issue, review the diagnosis and revise the task before continuing. For network/auth policy denial, stop that action; retry once only after materially new relevant authorization/configuration evidence, first checking any uncertain outcome.

At a completed milestone, stop the writer, review the diff, run the relevant checks, and update the ledger before a local atomic checkpoint. Keep interrupted work and a precise next action; do not overwrite another writer's changes. Do not call a milestone done until the evidence and independent review support it. Cloud execution can stop for service limits, runtime lifetime, or required user authorization; do not promise uninterrupted 24/7 operation.

## Preflight evidence — 2026-10-31

- Native Git fetched only `vtpqui3009/ghostlight` at the expected SHA and checked it out detached; the tracked tree was clean afterward.
- Read both `.kiro` documents, build progress, validation plan, final review, research evidence, all source/config files, and project metadata. No repository `AGENTS.md` exists at this baseline.
- Existing code consists of domain types, a structural import parser, and a React bootstrap importing absent `App` and `styles.css`. There is no engine, fixture, test suite, UI, persistence, report implementation, dependency list, or lockfile.
- No application code, dependency installation, application test, or remote mutation occurred during preflight. Kiro installation/authentication status is deliberately not inferred here.

## Private skill transfer status

The parent supplied a verified private ClaudeKit Library archive. This environment's supported materialization helper failed twice with `download failed` (exit 1); no local archive exists. Read-only network diagnostics returned no retained records, so the cause is unknown rather than a proven policy denial. No alternative download route or policy bypass was attempted. Hash verification, extraction, skill reading, and ClaudeKit-assisted work are NOT COMPLETE here. Original orchestration and the native Kiro pass can continue independently. Detailed nonsecret transfer status is outside the repo at `/workspace/.ghostlight-private-skills/STATUS.md`; do not copy licensed content into the repository.
