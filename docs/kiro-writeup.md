# How Kiro was used — Ghostlight

Everything below is backed by an entry in [`KIRO_SESSION_EVIDENCE.md`](../KIRO_SESSION_EVIDENCE.md),
which records the failures as well as the successes. Where something was **not** done or **not
verified**, this document says so plainly; the failures are the most useful part for another
developer.

Ghostlight is a planned-state checker for stage props: it replays a prop plan in cue order and shows
where the plan contradicts itself. The ghost is where a prop *should* be; the solid is where the plan
*actually* has it.

---

## Which Kiro surfaces, and how they differed

**Kiro CLI only.** Kiro IDE, Kiro Web and Kiro Crew were **not used**. The honest reason is that the
work was done from a terminal on Windows and the CLI covered everything this project needed; no
comparison between surfaces is claimed.

| When | CLI version | What it did |
|---|---|---|
| 2026-10-31 to 11-01 | 2.37.0 | Specification, domain engine, parser, editor, UI and 222 tests, one writer at a time, `--trust-tools=` empty so every tool action was reviewed individually. |
| 2026-11-10 | 3.1.0 | Hook diagnosis (K8) and property-based tests (K11). |
| 2026-11-13 | 3.3.0 | Haunted-theatre interface, list view, first screen, CSV export, dependency advisories, and a local MCP server. |
| 2026-11-23 | 3.3.0 | Live MCP use check and a fourth hook attempt, both non-interactive, on `claude-haiku-5.5`. |
| 2026-11-23 | 3.3.0 | "Halloween v2" (moon, bats, fog, tombstones, ghost mascot, jack-o-lantern) from a written brief, on `claude-sonnet-5.5`, plus two repair rounds. |

No whole-tool or whole-folder trust rule was ever granted.

**Model choice changed mid-project, and it mattered.** The first implementation turn ran on Auto and
produced no application files after about nine minutes, so it was cancelled. The next ran on
`claude-haiku-4.5`, chosen from the native catalogue for its low credit multiplier. It reached 30
passing tests but could not clear 17 TypeScript and 18 ESLint errors, repeatedly editing the wrong
thing. A fresh session on Sonnet 4.5 fixed the real strict-mode errors, kept the checks instead of
disabling them, and strengthened the test oracles. **Lesson: match the model to the task, and stop a
writer that is not converging instead of coaxing it.**

**Authorship, stated up front.** On 2026-11-10 the owner had a separate reviewing assistant write
some files in `src/` directly (the import guard, the guided fix, the accessibility colour pass and a
few others). They are named in the README's authorship table and are not claimed as Kiro's.

## Spec-driven development

Ghostlight is a correctness tool, so the specification *was* the product. It had to pin down what an
implementation would otherwise invent: what each of the six action kinds requires, when a mismatch is
an error versus "not enough information", what a cause may point at, and what must stay immutable.
The normative transition table lives in `.kiro/specs/ghostlight/design.md`.

The spec was independently reviewed before any code existed, and Kiro revised it on the findings:
explicit source-holder and zone rules (including rejecting `place` without a holder and a `carryOff`
within one zone), unknown state recoverable only by correcting the initial declaration, three distinct
cause kinds, issue identity independent of frame order, independent initial/final/frame maps that
never freeze or mutate caller input, and truthful reset handling for instances that start absent and
are later replenished and consumed.

**Against vibe coding:** the engine is 531 lines with 134 acceptance tests and 31 engine tests behind
it. The tests assert the spec's table rather than the implementation's behaviour, which is why they
caught real defects instead of ratifying whatever the code did.

One honest gap: `tasks.md` §2.6 specified property tests from the start, and they were not written
until 2026-11-10 (next section).

## Steering

Two steering files. `product.md` fixes the scope and the claims: planning, not live tracking, not a
safety system; keep authored requirements separate from computed state; keep keyboard, contrast and
reduced-motion equivalents. `tech.md` fixes the technical conventions: ownership, parser versus replay,
and report semantics.

Two moments where steering visibly changed an output:

1. **`requiredSource` is the user's, never the model's.** `tech.md` says never to fill it from computed
   state. When the stage reading was refactored into one shared derivation (`src/ui/stageModel.ts`),
   that rule became a comment at the top of the file and a test that asserts the requirement is
   returned exactly as authored, even when the computed state differs.
2. **"Planned state, not live tracking" travels with every output.** `product.md` made it a standing
   rule, so when CSV export was added the first row of every file carries it, the list view's verdict
   sentence is built from the same derivation as the diagram, and every response of the local MCP
   server repeats it. It is also on the first screen. No session had to be reminded.

## Agent hooks

`.kiro/hooks/domain-typecheck.json` declares a `PostFileSave` hook on `src/domain/**` that runs a
report-only typecheck. The domain is where a silent type regression is most expensive, and a hook
that fires on every save everywhere is just noise.

- The first draft was wrong in two ways (no `name`, a glob where the schema wants a regular
  expression). Review caught both; Kiro corrected the JSON.
- It called `bash`, and **this Windows machine has no `bash`** (`Get-Command bash` returned nothing),
  so Kiro replaced the script with a Node script (`.kiro/hooks/typecheck-domain.mjs`) and a matcher
  that accepts both path separators. The script was run by hand and passes.

**Did it fire by itself? Not observed.** In three fresh non-interactive Kiro CLI sessions the agent
edited a file under `src/domain/` with its file-write tool and the typecheck did not run. A temporary
diagnostic hook file with four triggers (`SessionStart`, `UserPromptSubmit`, `PostToolUse`,
`PostFileSave`), each appending to a marker file, wrote **no marker at all, not even for
`SessionStart`**. That points away from the matcher and the command and towards non-interactive runs
not loading hooks, but that is a guess: **whether the hook fires in an interactive session is NOT
VERIFIED.** The temporary hook was deleted. We are not claiming an automation we never saw work.

A fourth attempt on 2026-11-23 (CLI 3.3.0, `--trust-workspace`, the real `domain-typecheck` hook in
place) had the agent append `// k8-hook-probe` to `src/domain/ids.ts`. The agent saw no
`[ghostlight hook]` output, and `tsconfig.tsbuildinfo`, which `tsc -b` rewrites, kept its earlier
timestamp, so the typecheck did not run. The probe line was reverted. Same conclusion: not observed
in non-interactive mode, and an interactive session has still not been tried.

## Property-based testing

Written with `fast-check` 4.10.2 (exactly pinned) in `tests/domain/properties.test.ts`. **This was
Kiro writing the tests by hand in the CLI, not the IDE's built-in property-based testing feature**,
which is IDE-only and was not used.

- Oracle: a small reference model written from the spec's transition table that never calls the
  engine, itself checked against hand-calculated cases. Seed 20261110, 300 runs per property.
- 15 tests covering single custody, terminal consumption, replenish only from absent, a rejection
  changing nothing, determinism, purity (frozen input, no aliasing), causal integrity, authored
  actions reproduced verbatim, differential equality with the reference model, unknown stays
  uncertain, same-named props never merge, and cue reordering.
- **Result: all passed on the first run, so no real engine bug was found.** To check that the tests
  could fail, eight deliberate bugs were injected into a temporary copy of the engine (a consumed id
  replenishable, `carryOff` allowed within one zone, a rejection that leaks a state change, the engine
  mutating its input, and so on). **All eight were caught.**
- Honest limit: only about 13% of generated frames are applied moves, so long cause chains are
  exercised much less than rejections.

Answer to "did property-based testing catch issues unit tests missed?": **no, not in this run.** What
it added was evidence across generated inputs and an independent differential check.

## MCP

One MCP server, **local, read-only and owned by the project**, in `tools/mcp/` and bundled to
`.kiro/mcp/ghostlight-mcp.mjs`. It exists for a reason this project actually had: an earlier session
wrote a test that compared an object with itself, and another wrote a fixture whose "intended
rejection" was really a valid transfer. If an agent can ask the **real engine** what a fixture does
before writing a test around it, that class of mistake is caught at the source.

Tools: `check_scenario` (replay a scenario, every action's verdict and cause), `explain_issue` (the
verdict in words and a suggested fix that is described but never applied), `reports` (preset, runner
or reset), `list_demos`, `get_demo`; plus one resource, the normative transition table from
`design.md`. No network, no file writes, no environment or secret access, and every tool is marked
read-only. Every answer repeats "planned state, not live tracking".

Verified:
- 20 handler tests with hand-calculated oracles (Missing Handoff's carry is rejected with the collect
  as its cause and the holder unchanged; a consumed id never revives; an id such as `toString` is
  safe; bad input and over-limit JSON return clean errors). Three deliberate bugs in the handlers
  were each caught by those tests.
- A protocol test spawns the **committed bundle** and speaks raw JSON-RPC over stdio (initialize,
  tools/list, tools/call, resources/read), and a second test fails if the committed bundle no longer
  matches a fresh build.
- A script called the bundle over stdio for all six bundled demo scenes. Each matched what its own
  description says. **It caught nothing wrong**, and we are not going to pretend otherwise.

**Verified on 2026-11-23: a live Kiro agent called the server.** Kiro reads MCP servers from
`.kiro/settings/mcp.json`; the launch configuration is committed as `.kiro/mcp/mcp.settings.json`
and was copied there. A non-interactive `kiro-cli chat` session (CLI 3.3.0, model
`claude-haiku-5.5`, `--trust-tools=@ghostlight` so only this server's tools were allowed) was asked to
check the Missing Handoff demo. The tool log shows it called `@ghostlight/list_demos`, then
`@ghostlight/get_demo`, then `@ghostlight/check_scenario`. It reported `clean: false`, action `a1`
applied and action `a2` rejected with `source-mismatch`, caused by `a1`, which matches the
hand-calculated expectation. It chose to call `get_demo` itself because `check_scenario` takes scenario
JSON rather than a demo id. Limits: this was one session and one demo, and the interactive `/mcp`
listing was not looked at.

## Custom agents, Kiro powers and Kiro Crew

**None used.** A custom agent would mostly have restated the steering files for a single-writer
workflow that already ran with per-action approval, and powers and Crew have nothing to connect to in
a local-first app with no external data and no second repository. Adding one to have used one would
not have changed any output.

## What Kiro got wrong, and what we did about it

- **A writer that does not converge should be stopped, not coaxed.** The Haiku session spent several
  turns failing to remove unused parameters; a fresh Sonnet session fixed it in one pass.
- **An LLM will write a test that proves itself right.** One generated test mutated an object and then
  compared it with itself. It passed and meant nothing. Review caught it; the rewritten fixture then
  failed for a *real* reason, because the intended rejection was actually a valid transfer.
- **Checks are not negotiable.** When strict TypeScript errors appeared, the repair session was told to
  fix them, not relax the compiler, and `npm run check` has run on every change since.
- **A looping animation hung the test harness.** The first version of the ghost's glow was an infinite
  CSS animation. The accessibility harness waits for animations to finish, so the whole end-to-end run
  hung for fifteen minutes. The cause was found by reading the harness; infinite animation also fails
  WCAG 2.2.2, so the glow became a static halo plus a single 0.6 s fade, removed entirely under
  reduced motion.
- **A brief is followed, but not to the letter.** On 2026-11-23 Kiro built the "Halloween v2" layer
  from a written brief in one pass, but each of its three runs ran one shell command despite being told
  not to (it reported this itself each time, and the third was blocked by the permission rule). Its first
  pass also made the phone list view worse, by giving the table a minimum width that hid a column, and
  painted the bats so dark they were invisible. Screenshots and a new end-to-end test, not the build,
  found all three problems; Kiro fixed them when given the exact symptom.
- **A test oracle can be the wrong one.** A CSV test expected an unquoted line, but the honesty
  sentence contains a comma, so RFC 4180 correctly quotes it. The code was right and the expectation
  wrong, and the fix was to the expectation.
- **A major upgrade is not always an upgrade.** `npm audit` suggested vite 8 and vitest 5; vite 8
  needs a newer React plugin and new peer dependencies, so the install failed. Vite 7 with vitest 4
  cleared the two critical and one high advisory and passed the whole suite.
- **Dependency reality intrudes.** The first install failed with `ERESOLVE`; the fix was compatible
  versions, not `--force`.

## Honest limits

- **No stage manager has used this tool.** The tests are synthetic and are not user validation. The
  scenes are invented.
- The hook trigger is not verified; the MCP server was seen used by a live Kiro agent once (above).
- The interface was checked with axe-core in light and dark schemes, at 390 px, and with reduced
  motion emulated; it has not been reviewed by a colour-blind reader or tested with a screen reader.
- `QA_RESULTS.md` lists what the checks do not cover.
