# How Kiro was used — submission draft

Devpost requires a write-up explaining how Kiro was used, and lists what the judges want covered.
This draft answers those questions in order. **Anything not yet true is marked `TO FILL` rather
than written as if it had happened** — the record in `KIRO_SESSION_EVIDENCE.md` is honest and this
has to match it.

Owner: replace the `TO FILL` blocks after the relevant Kiro session, with the real `/usage` numbers
and real outcomes. Do not smooth over the failures; the failures are the most convincing part.

---

## Which Kiro surfaces, and how they differed

**Kiro CLI 2.37.0**, authenticated with Builder ID, was the primary writer for the specification,
the domain engine, the UI and the tests. Sessions ran as
`kiro-cli chat --v3 --mode spec` for specification work and `--v3 --mode default` for
implementation, with `--trust-tools=` empty so every tool action was reviewed individually. No
whole-tool or whole-folder trust rule was ever granted; one session was given a single
exact-file write rule for one test file, and nothing broader.

Model choice was deliberate and changed mid-project. The first implementation turn ran on Auto and
produced no application files after about nine minutes, so it was cancelled. The next ran on
`claude-haiku-4.5`, chosen from the native model catalogue at a 0.4 credit multiplier — it reached
30 passing tests but could not clear 17 TypeScript and 18 ESLint errors, repeatedly editing the
wrong thing. A fresh session on Sonnet 4.5 fixed the actual strict-mode errors, kept the checks
rather than disabling them, and strengthened the test oracles. **The lesson we would pass on: match
the model to the task, and stop a writer that is not converging instead of letting it grind.**

`TO FILL` — Kiro IDE, Kiro Web, Kiro Crew: not used yet. If any of them gets used, say which, what
it did better or worse than the CLI, and why the switch was made.

## Spec-driven development

Ghostlight is a correctness tool, so the specification *was* the product. The spec had to pin down
things an implementation would otherwise invent: what each of six action kinds requires, when a
mismatch is an error versus "not enough information", what a cause may point at, and what must stay
immutable.

The spec went through independent review before any code existed, and Kiro revised it on the
findings. Concretely, the review held implementation for: explicit source-holder and zone rules
including `place` and equal-zone `carryOff` rejection; unknown-state recovery only through
correcting the initial declaration; distinct no-state / initial-state / earlier-action cause kinds;
issue identity independent of frame order; independent initial, final and frame maps with no
freezing or mutating of caller-owned input; and truthful reset handling for instances that start
absent and are later replenished and consumed. Only after Kiro revised the spec did the review
return GO.

**Against vibe coding:** the engine is 531 lines with 134 acceptance tests behind it. Those tests
assert the spec's table, not the implementation's behaviour, which is why they caught real defects
rather than ratifying whatever the code did. Writing them from a prose description would have
produced tests that agreed with the bug.

## Steering

Two steering documents. `product.md` fixes the scope and the claims: this is planning, not live
tracking, not a safety system; keep real requirements separate from computed state; keep keyboard,
contrast and reduced-motion equivalents; preserve the research documents' caveats. `tech.md` fixes
the technical conventions — ownership, parser and replay separation, report semantics.

The one that paid for itself was the honesty constraint. An assistant's default instinct is to
describe a planning tool as if it knew where things are. Steering made "planned state, not live
tracking" a standing rule rather than something to re-argue every session, and that phrase is now
on the first screen of the app.

`TO FILL` — name one concrete moment where steering visibly changed an output.

## Agent hooks

`.kiro/hooks/domain-typecheck.json` declares a `PostFileSave` hook matching
`(^|/)src/domain/.*\.tsx?$` that runs `bash .kiro/hooks/typecheck-domain.sh` with a 30-second
timeout. The idea is narrow on purpose: the domain is where a silent type regression would be most
expensive, and a hook that fires on every save anywhere is noise.

The first draft of the hook was wrong in two ways — it had no `name`, and it used a file glob where
the schema requires a regular expression. Review caught both and Kiro corrected the JSON and wrote
the shell script.

**What has actually been verified**: the JSON parses, the regex matches domain paths and excludes a
UI path, `bash -n` passes, and a manual invocation prints `NOT RUN — dependencies not installed`,
which is correct honest skip behaviour. **What has not**: Kiro firing the hook by itself after a
save has never been observed. That is recorded as NOT VERIFIED in `KIRO_SESSION_EVIDENCE.md` and we
are not claiming it.

`TO FILL` — after K8: save a file under `src/domain/`, record verbatim whether the hook fired, and
save a file outside it to confirm the matcher is real. **Either outcome goes in.** A negative result
honestly recorded is worth more than a claim.

## Property-based testing

`TO FILL` — K11, not done yet. The engine's invariants are unusually well suited to it, and the
properties worth asserting are already written down in `GHOSTLIGHT_VALIDATION_PLAN.md`: single
custody (one holder and one location per usable instance, no duplication after a transfer),
consumption as terminal (a consumed instance can never be collected or transferred again, and
replenish mints a new identity rather than reviving the old one), determinism (same initial state
plus same ordered actions gives the same result and the same traces), causal soundness (every error
traces to the initial state or an earlier action on the same instance, never a later cue), and
invalid actions leaving state untouched.

When this is done, say which property found something unit tests had missed — and if none did, say
that instead.

## MCP

`TO FILL` — not used. If an MCP server is added, it must be because this project needed it, not to
have an MCP line in the write-up. If none is added, say plainly that none was needed for a
local-first app with no external data, which is a more honest answer than a token integration.

## Custom agents and Kiro powers

`TO FILL` — none used yet.

## What Kiro got wrong, and what we did about it

This section exists because it is the most useful thing we can tell another developer.

- **A writer that does not converge should be stopped, not coaxed.** The Haiku session reached 30
  passing tests but spent several turns failing to remove unused parameters. Stopping it and
  starting a Sonnet session fixed the real errors in one pass.
- **An LLM will write a test that proves itself right.** One generated test mutated an object and
  then compared it against itself. It passed and meant nothing. Review caught it; Kiro rewrote the
  fixture, and the rewritten fixture then failed for a *real* reason — the intended rejection was
  actually a valid transfer. Both the bad test and the misunderstanding are in the record.
- **Checks are not negotiable.** When strict TypeScript errors appeared, the repair session was
  told to fix them rather than relax the compiler. It added an asserted helper instead of widening
  a type. `npm run check` has run on every change since.
- **Dependency reality intrudes.** The first install failed with `ERESOLVE`; the fix was compatible
  versions, not `--force` or `--legacy-peer-deps`.

## Honest limits

No stage manager has used this tool. `TO FILL` after the user sessions — and if they do not happen,
say so rather than implying otherwise. The accessibility work and the open defects are listed in
`QA_RESULTS.md` rather than hidden, and the parts of `src/` that were not written by Kiro are named
in the README's authorship table.
