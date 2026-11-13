# Devpost submission — draft

Fill the `TO FILL` items before submitting. **No edits are possible after 2026-12-04 14:00 PST.**

## Form fields

| Field | Value |
|---|---|
| Project name | Ghostlight |
| Tagline | Catch the prop plan that cannot work, before the curtain rises. |
| Category | **Costume Contest** (one category only) |
| Public GitHub repo | <https://github.com/vtpqui3009/ghostlight> — public on 2026-11-13, GitHub detects MIT |
| Working app URL | <https://vtpqui3009.github.io/ghostlight/> — GitHub Pages, HTTP 200 on 2026-11-13 |
| Judge login needed? | No. The app is local-first; nothing to sign into. |
| Demo video | `TO FILL` — public YouTube, under 3:00, per `docs/demo-script.md` |
| How Kiro was used | `docs/kiro-writeup.md` |
| Team | One person. |
| Built with | TypeScript, React, Vite, Vitest, fast-check, Playwright, axe-core, the Model Context Protocol SDK — and Kiro CLI. |

### Bonus prizes to tick

- [x] **Best Demo** — automatic, no extra steps.
- [ ] **Bonus Blog Prize** — needs the post URL. 100 winners, 2,000 bonus Kiro credits. Draft in `docs/blog-post.md`.
- [ ] **Social Blitz** — needs the post URL, starting with `#KiroweenHackathon26`. Write it yourself; it is judged on "original thoughts vs AI writing".
- ~~Best Ghost of Kiroween Past~~ — **not eligible**: the owner did not register for Kiroween 2025 (confirmed 2026-11-10).
- [ ] **Best Student Project** — only if you are a student. `TO FILL`
- [ ] **Best Startup Project** — only if you are a founder. `TO FILL`

---

## Description

### The problem

A stage manager's run sheet says who carries what, from where, in which cue. It is written by hand,
changed in rehearsal, and read under pressure. When one handoff is missing from that sheet, nobody
finds out until an actor reaches for a letter that is not there — in front of an audience.

The plan can be internally contradictory and still look fine. There is nothing that reads it back
and says *this cannot happen*.

### What Ghostlight does

You type the cues, the physical prop instances, and what each step requires. Ghostlight replays the
plan in cue order and reports where the plan contradicts itself:

- **a missing handoff** — a cue needs the letter on the table, but the plan left it in an actor's
  hand two cues ago;
- **a consumable used twice** — a wax seal is broken, then required again; a reset does not
  un-break it, and a fresh seal is a *different* physical object;
- **the wrong one of two identical props** — `letter-A` and `letter-B` look the same and are not
  interchangeable;
- **a cue order that only works one way round.**

Every finding names the **earlier step that caused it** — never a later cue — and you can jump
straight to it.

### What makes it different

Three things, and they only matter together:

1. **A physical instance is a physical instance.** Two identical letters are two tracked objects.
   A kind — "sealed letter" — never stands in for an instance.
2. **The requirement is yours, not the tool's.** Each step carries the source and holder *you* state
   from the run sheet. The replay compares against that and never writes its own model back into it.
   This is the part that makes the check mean anything: a tool that fills in "expected" from its own
   state can never find a fault.
3. **Uncertainty is not failure.** An instance with no recorded starting position produces "not
   enough information", never a red error. A planning tool that cries wolf gets closed.

`TO FILL` after `docs/competitor-comparison.md` is run — one honest paragraph on what CueCall,
DigiScript and Standby already do, and what is genuinely left over.

### The interface

Ghostlight is a haunted theatre, and the haunting does a job. The room is dark and the one lamp
burning is the "ghost light" a theatre leaves on an empty stage. The ghost is where a prop *should*
be, drawn as a dashed outline; the solid block is where the plan *actually* has it; a mismatch gets a
heavier outline and a note in words saying where the other half is. The stage has a curtain, a
valance and footlights, and the zones are arched like old theatre windows. Nothing depends on colour
alone: every state also has a glyph and a word label (REQUIRED, BEFORE, MATCH, MISMATCH), because this
gets read in a dark room by someone who is already busy. There are no jump scares and no sound, and
the only motion is a short one-time fade that is removed when the browser asks for reduced motion.

There is a plain list equivalent of the stage (the default under reduced motion), a keyboard path
through every control, light and dark colour schemes, and the crew sheets (preset, who-does-what,
reset) print on paper or download as CSV.

### What it is not

**Planned state, not live tracking.** It never sees the real stage, it does not know where anything
actually is, and it is not a safety system. It reads the plan you typed and tells you whether that
plan holds together. The app says so on its first screen.

`TO FILL` after the user sessions — what two stage managers actually said, including anything that
contradicts the idea. If the sessions do not happen, say that plainly instead.

### Built honestly

- 297 tests (engine and acceptance, 15 property-based tests with a reference-model oracle, UI logic,
  and a local MCP server tested over stdio), strict TypeScript, and a committed end-to-end and
  accessibility harness. `--strict` axe-core passes in light and dark, and `QA_RESULTS.md` lists what
  the checks do **not** cover.
- Kiro CLI wrote the specification, the engine and most of the interface. The parts of `src/` it did
  not write are named in the README's authorship table.
- The write-up in `docs/kiro-writeup.md` includes what did not work: a hook whose trigger was never
  observed, a property suite that found no engine bug, and an animation that hung the test harness.
- Free to use and open source (MIT); the app runs entirely in the browser with no account, backend
  or paid service.
