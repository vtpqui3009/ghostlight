# Blog post draft — Bonus Blog Prize

**Why bother:** 100 winners, 2,000 bonus Kiro credits each. It must be public, on any third-party
blog platform, published **during the submission period**, and must say it was written as part of
the Kiroween 2026 hackathon. Add the URL to the Devpost submission.

**Read this before publishing.** The draft below is a starting point, not something to paste. Put
it in your own words and cut anything you would not say out loud — the parts that are specifically
yours are what make it worth reading. Fill the `TO FILL` items with real numbers from your own
sessions; do not publish a figure you have not seen.

---

## Draft: "I let Kiro write the spec before it wrote the code, and the spec is what caught the bugs"

*Written as part of the Kiroween 2026 hackathon.*

### The thing I was building

A stage manager's run sheet says who carries which prop, from where, in which cue. It is written by
hand and changed in rehearsal. When one handoff goes missing from that sheet, nobody finds out
until an actor reaches for a letter that is not there, in front of an audience.

So I built Ghostlight: you type the cues and the props, and it replays the plan and tells you where
the plan contradicts itself. A missing handoff. A wax seal that gets broken and then required
again. Two identical letters that are not actually interchangeable.

### Why I started with the spec

This is a correctness tool. If I had vibe-coded it, the tests would have been written against
whatever the code happened to do, and they would all have passed, and the tool would have been
confidently wrong. That is the worst possible outcome for something whose entire job is to be right.

So the first Kiro sessions ran in spec mode and produced no code at all. They produced a table: six
kinds of action, what each one requires, what counts as an error versus "not enough information",
and what a cause is allowed to point at.

Then I had the spec reviewed before implementation — and it came back with holes. Not typos:
genuine contract gaps. What happens when an instance's starting position was never recorded and a
later cue needs it? Can a cause point at the initial state as well as at an earlier action? Is the
identity of an issue allowed to depend on where it sits in the replay? Kiro revised the
specification on those findings, and only then did I let it write code.

`TO FILL` — the one spec change that saved you the most time. Say which, and why.

### The moment that convinced me

Kiro wrote a test that passed and meant nothing. It mutated an object and then compared that object
against itself. Of course it passed.

I would have written that test too, at midnight. What caught it was not cleverness — it was having
an independent reviewer whose only job was to check the oracle, separately from the writer whose
job was to make it green.

When Kiro rewrote the fixture, the new test failed. And it failed for a *real* reason: the
transition I had assumed was a rejection was actually a valid transfer. My understanding of my own
spec was wrong, and only a test with a correct oracle could show me that.

### Things I would tell someone starting now

- **Stop a writer that is not converging.** One session reached 30 passing tests and then spent
  several turns failing to delete unused parameters. Stopping it and starting a fresh session on a
  stronger model fixed the real errors in one pass. Persistence is not a virtue here.
- **Match the model to the task.** Specification and review got the strongest model. Mechanical
  work did not need it.
- **Never relax the compiler to get green.** When strict TypeScript complained, the fix was an
  asserted helper, not a widened type. Every relaxation is a future bug with a certificate.
- **Separate the writer from the reviewer.** Not two models — two *jobs*. The writer wants it to
  pass. Something else has to want it to be right.

`TO FILL` — the thing *you* found hardest. That is the part people will actually remember.

### What I will not claim

No stage manager has used this yet. It checks a plan; it has never seen a real stage. The open
defects and the accessibility results are in the repository rather than in a footnote, because a
tool that tells you when your plan is wrong has no business being vague about its own.

`TO FILL` — repository link, app link, and the Devpost project link.

---

# Social post — write this one yourself

The Social Blitz prize is judged on "**original thoughts vs AI writing**", and five winners are
picked by the Kiro team. A post that reads as generated will lose. So here are only the
constraints and the raw material — the sentences have to be yours.

**Constraints**

- Must start with `#KiroweenHackathon26` — literally the first thing in the post.
- Public, published during the submission period.
- Add the URL to your Devpost submission.
- Their prompt: your favourite thing about Kiro and how it changed the way you approach development.

**Raw material you actually have**

- You ran spec mode first and got no code out of it on purpose, for a tool whose job is correctness.
- An independent review of the spec found real contract gaps before any code existed.
- Kiro wrote a self-referential test that passed and meant nothing; the rewrite then failed for a
  real reason and corrected your own understanding of your spec.
- You stopped a model that was not converging instead of coaxing it, and that was the right call.
- `TO FILL` — the one moment that genuinely surprised you. One concrete sentence beats five general
  ones.

**What not to do:** do not list features, do not thank the tool, and do not write "game changer".
Pick the single thing that changed how you work and say it in your own voice, in two or three
sentences.
