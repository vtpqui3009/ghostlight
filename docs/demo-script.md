# Demo video script — Kiroween submission

Target **2:50**, under the three-minute limit with room to spare.

**Revised 2026-11-10, after the rules were read.** The first draft spent 0:25 on "how Kiro built
this". That was a mistake: Kiro usage is scored on **Technological Implementation**, through the
*written* write-up (`docs/kiro-writeup.md`), which is a separate required submission field. The
video is scored on **Presentation**: "Does the video clearly demonstrate the project working
end-to-end? Does the pitch communicate what problem is solved, who it's for, and why it matters?
Is the presentation creative and memorable?" So the Kiro section shrinks to one sentence and the
time goes back to the product and to who it is for. English narration. Public on
YouTube. Everything on screen is a scene invented for this demo; say so in the first twenty seconds
and leave a corner caption up for the whole video.

Reviewer-authored draft. The owner records it (roadmap item **U3**).

## Before you can shoot this

Four beats depend on work that has not landed yet. Check this table before booking time — shooting
against today's build would mean reshooting.

| Beat | Needs | State |
|---|---|---|
| 1:00–1:45 "open the cause, fix it, re-run" | **K4** causal navigation, **K5** guided fix | not built |
| "copies and consumables" | works today on the bundled demos | ready |
| "list view and keyboard" | **K3** list equivalent, keyboard pass | not built |
| the whole video reading as "creative and memorable" | **K10** the haunting interface | not built |
| 0:40–1:00 "the printed sheet" | **K6** reports, CSV and print | partly — preset report renders, print and CSV are not done |
| Any wide shot of Reports on a phone | **K6** 390 px overflow fix | fails today by 73 px |

**K1 and K2 are done** as of 2026-11-10, so the UI in shot is already accessibility-clean. The
remaining order before recording is **K4 → K5 → K3 → K10**, then record. K10 matters for the video
specifically: Presentation rewards a presentation that is "creative and memorable", and Costume
Contest asks for a haunting interface.

## Setup

- Record at 1280×800 or larger, zoomed enough that a judge on a phone can read the cue titles.
- Use the bundled demos, not a typed-in scene: `Valid Control — Four Clean Steps`,
  `Missing Handoff — Wrong Holder`, `Consumed Reuse — Terminal State`,
  `Duplicate Names — Distinct IDs`.
- Have the app already open on the empty state. Do not film `npm run dev` starting.
- One take per beat is fine; cut between beats rather than trying to do it live.

## The script

### 0:00–0:20 — the problem, in one concrete scene

*On screen: the empty state, then `Missing Handoff — Wrong Holder` about to be loaded. Caption:
"Synthetic demo scene".*

> A stage manager's run sheet says who carries what, from where, in which cue. When one handoff is
> missing from that sheet, nobody finds out until an actor reaches for a letter that is not there.
> This is Ghostlight. It reads a prop plan and tells you where the plan contradicts itself. Every
> scene you will see is invented for this demo.

### 0:20–0:40 — a plan that is fine

*Load `Valid Control — Four Clean Steps`. Step through the four cues: Actor A collects the sealed
letter stage left, hands it to Actor B, who carries it stage right and sets it down.*

> Four cues, one physical letter. Each step states where the run sheet expects it to be. Ghostlight
> replays them in order and agrees with all four. That matters: a checker that always complains is
> worthless, so the first thing to show is that it stays quiet when the plan is sound.

### 0:40–1:00 — what it models, and what it does not

*Open the Reports view. Show the preset list.*

> This is the preset: where every instance starts, ready to print for the crew. One thing to be
> clear about — this is the **planned** state, not live tracking. Ghostlight never sees the real
> stage. It only knows the plan you typed in.

### 1:00–1:45 — the missing handoff, the cause, the fix

*Load `Missing Handoff — Wrong Holder`. The timeline marks cue 2 with `source-mismatch`.*

> Same letter. Cue one: Actor A picks it up. Cue two: Actor B carries it offstage — but the run
> sheet never says it reached Actor B.

*Select the failing action. The required ghost sits with Actor B; the modelled solid sits with
Actor A.*

> The ghost is what the cue requires. The solid is where the plan actually leaves the letter.
> They disagree, so Ghostlight refuses the step rather than quietly moving the letter.

*Open the cause. It jumps back to cue one — **needs K4**.*

> And it names the step that caused it: cue one, where Actor A picked it up and nothing handed it
> on. It never blames a later cue for an earlier problem.

*Add the missing transfer and re-run — **needs K5**. The verdict changes.*

> Add the handoff the run sheet was missing, replay, and the scene is clean.

### 1:45–2:00 — copies and consumables

*Load `Duplicate Names — Distinct IDs`, then `Consumed Reuse — Terminal State`.*

> Two identical letters are still two objects. Moving copy A does not satisfy a cue that needs copy
> B. And a wax seal that has been broken is gone: a later cue asking for the same seal is refused,
> because a reset does not un-break it. Bring on a second seal and that is a different physical
> instance, with its own identity.

### 2:00–2:12 — reading it without the diagram

*Switch to the list view and tab through the timeline with the keyboard — **needs K3**.*

> The same information without the diagram, for a crew sheet, for reduced motion, and for anyone
> working by keyboard.

### 2:12–2:28 — who this is for, and the honest limit

*On screen: the reset report, then the printed sheet.*

> This is for the person doing paper tech at eleven at night with a pencil and a run sheet, trying
> to work out whether the plan they have written actually holds together. It is not live tracking —
> it never sees the real stage, and it says so on the first screen. No stage manager has used it
> yet, and the open defects are listed in the repository rather than hidden.

### 2:28–2:38 — built with Kiro

*On screen: `.kiro/specs/ghostlight/design.md` beside a passing test run.*

> Kiro wrote the specification before any code existed, then implemented it and wrote the tests.
> The full account, including what Kiro got wrong, is in the submission write-up.

### 2:38–2:50 — where to find it

*On screen: the live URL and the repository.*

> Ghostlight. The app and the full record of how it was built are at the link below.

## Caption and description checklist

- Corner caption for the whole video: **"Synthetic demo scene — planned state, not live tracking."**
- Video description: the app URL, the repository URL, the category (Costume Contest), one line
  saying there is no user validation yet, and a pointer to `QA_RESULTS.md`.
- Do not claim minutes saved, do not imply a stage manager tested it, and do not show a real run
  sheet from any production.
