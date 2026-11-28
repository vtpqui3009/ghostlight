# Blog post — Bonus Blog Prize

**DRAFT FOR THE OWNER TO EDIT AND PUBLISH.** Nothing here has been posted anywhere. Every event below
comes from `KIRO_SESSION_EVIDENCE.md`, `docs/kiro-writeup.md` or `QA_RESULTS.md`. Rewrite it in your
own words before publishing, and cut anything you would not say out loud.

**Rules for the prize:** public, on a third-party blog platform (dev.to, Medium, Hashnode and
similar), published during the submission period (deadline 2026-12-04 14:00 PST), and it must say
it was written for the Kiroween 2026 hackathon. 100 winners get 2,000 bonus Kiro credits. After
publishing, paste the URL into the Devpost form. Replace the three `OWNER TO ADD` links at the bottom.

---

# What I learned building a prop-plan checker with Kiro, including the parts that failed

*Written for the Kiroween 2026 hackathon.*

## The problem

A stage manager's run sheet says who carries which prop, from where, in which cue. It is written by
hand and changed in rehearsal. When one handoff goes missing from the sheet, nobody finds out until an
actor reaches for a letter that is not there, in front of an audience.

Ghostlight reads that plan back. You type the cues, the physical props and what each step requires.
It replays the plan in cue order and shows where it contradicts itself: a missing handoff, a wax seal
that is broken and then required again, two identical letters that are not interchangeable. It is a
planned-state checker. It never sees a real stage, and it is not a safety system.

The interface is a haunted theatre. The "ghost" is a dashed outline showing where the plan says a
prop *should* be. The solid block is where the plan *actually* has it. When they disagree, the app
says so in words and names the earlier step that caused it.

## Why the spec came first

This tool's whole job is to be right, so I did not want tests written against whatever the code
happened to do. The first Kiro sessions produced no application code. They produced a specification:
six kinds of action, what each one requires, when a mismatch is an error and when it is only "not
enough information", and what a cause may point at.

The spec was reviewed before any code existed, and the review found real holes. For example, a
`carryOff` that moves a prop within one zone, and a `place` with no holder. Kiro revised the spec
for those. Only then did I let it write the engine. The result is a 531-line engine with 134
acceptance tests and 31 engine tests that check the spec's table rather than the implementation.

## Three things that went wrong

**A model that would not converge.** The first implementation turn ran on Auto and produced no
application files after about nine minutes, so I cancelled it. The next session used Haiku 4.5 for its
low cost. It reached 30 passing tests but could not clear 17 TypeScript and 18 ESLint errors, and kept
editing the wrong thing. A fresh Sonnet 4.5 session fixed the real strict-mode errors in one pass and
kept the checks on. I should have stopped the first writer sooner.

**A test that proved itself right.** One generated test mutated an object and then compared the
object with itself. It passed and meant nothing. Review caught it. When the fixture was rewritten
the test failed, and the reason was real: the rejection I thought I was testing was actually a valid
transfer. My own understanding of my spec was wrong, and only a correct oracle showed me.

**An animation that hung my own test harness.** The first version of the ghost's glow was an infinite
CSS animation. The accessibility harness waits for animations to finish, so the whole end-to-end run
hung for fifteen minutes. Infinite animation also fails WCAG 2.2.2, so the glow became a static halo
plus one 0.6 second fade, and it is removed when the browser asks for reduced motion.

## Property-based tests that found nothing

I wrote 15 property-based tests with fast-check against a small reference model built from the spec.
They all passed on the first run, so they found no engine bug. To check that they could fail at all,
I injected eight deliberate bugs into a temporary copy of the engine, such as a consumed id that could
be replenished and a rejection that leaked a state change. All eight were caught. That is a smaller
claim than "PBT found my bugs", and it is the true one.

## A hook I could not make fire, and an MCP server I could

I wrote a `PostFileSave` hook that runs a report-only typecheck after edits under `src/domain`. My
Windows machine has no `bash`, so Kiro rewrote the script in Node. In four non-interactive sessions I
never saw it fire. I have not tried an interactive session, so I am not claiming the hook works.

Earlier fixtures had been wrong more than once, so I built a small local, read-only MCP server that
runs the real engine. On 2026-11-23 I asked a Kiro CLI session to check the Missing Handoff demo
through it. The tool log shows it calling `list_demos`, `get_demo` and `check_scenario`, and its
verdict matched what I had worked out by hand: the carry is rejected, and the earlier collect is the
cause.

## What I would tell the next person

- Stop a writer that is not converging instead of coaxing it.
- Keep the compiler strict. When errors appeared, the fix was to the code, not to the config.
- Write your oracle independently of the thing under test.
- Test the state a user actually lands in. My accessibility scans were clean until the harness
  learned to click a failing row, and then they found a contrast problem that no earlier scan had seen.
- Check that the visual language you think you have is on the screen. The ghost-versus-solid styling
  was in the stylesheet under class names the component never emitted, so most of it did not render.

## What I will not claim

No stage manager has used Ghostlight. I did not run interviews or compare it with other tools, and all
the scenes and tests are synthetic. Whether it is useful to real stage managers is unknown.

- Repository: `OWNER TO ADD` (https://github.com/vtpqui3009/ghostlight)
- Live app: `OWNER TO ADD` (https://vtpqui3009.github.io/ghostlight/)
- Devpost project: `OWNER TO ADD`
