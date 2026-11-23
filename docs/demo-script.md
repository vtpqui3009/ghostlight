# Demo video script — Kiroween submission

Target **2:50**, under the three-minute limit with room to spare. English narration, **public on
YouTube**, no music (the rules forbid copyrighted music; silence under the narration is fine).
The owner records it (roadmap item **U3**). This file is the single script: the submission packet
points here rather than keeping a second copy that could drift.

**What the video is scored on.** Presentation: "Does the video clearly demonstrate the project
working end-to-end? Does the pitch communicate what problem is solved, who it's for, and why it
matters? Is the presentation creative and memorable?" Kiro usage is scored through the separate
written write-up (`docs/kiro-writeup.md`), so the video gives it one sentence and spends the time on
the problem, the product and who it is for.

**Everything the script needs now exists** (checked 2026-11-13 against the build at
<https://vtpqui3009.github.io/ghostlight/>): the haunted-theatre interface, the cause as a clickable
control, the guided fix, the Diagram/List choice, the reports with CSV download and print. Re-check
that each beat still works on the live URL right before you record.

## Setup

- Record the **live URL**, not `npm run dev`. Browser at 1280×800 or larger, zoomed to about 125% so
  a judge on a phone can read it. Use the dark colour scheme if your system is set to it; the
  interface was built to look right in both, and the dark one is the more atmospheric.
- Start on the first screen. If a scene is already loaded, open the site in a private window.
- Record the screen with narration over it, one take per beat, and cut between beats. Record on the
  device you describe: a desktop browser.
- No jump scares, no music. Do not show a real run sheet from any real production.

## The script

Timings are targets; the narration is about 330 words, which reads at a calm pace in 2:50.

### 0:00–0:20 — the problem, in one concrete scene

*On screen: the first screen (curtain, lamp, "No Scene Loaded"). Corner caption for the whole video:
"Synthetic demo scenes — planned state, not live tracking."*

> A stage manager's run sheet says who carries what, from where, in which cue. When one handoff is
> missing from that sheet, nobody finds out until an actor reaches for a letter that is not there.
> This is Ghostlight. It replays a prop plan and shows where the plan contradicts itself. Every
> scene you will see is invented for this demo.

### 0:20–0:40 — a plan that is fine

*Click **Valid Control**. Click each of the four steps in the timeline in turn.*

> Four cues, one physical letter. Ghostlight replays them in order and agrees with all four. That
> matters, because a checker that always complains is worthless. The first thing to show is that it
> stays quiet when the plan is sound.

### 0:40–1:30 — the missing handoff: the ghost, the cause, the fix

*Go back (reload), click **Missing Handoff**. Click the red step "carryOff Sealed Letter". Pause on
the stage with the dashed red outline and the solid purple block.*

> Same letter. Cue one: Actor A picks it up. Cue two: Actor B carries it offstage, but the run sheet
> never says the letter reached Actor B. The dashed outline is the ghost: where the plan says the
> letter should be. The solid block is where the plan actually leaves it. They disagree, so
> Ghostlight refuses the step instead of quietly moving the letter.

*Click the underlined cause, "Cue 'Act 1 Scene 1' — Actor A collects Sealed Letter". The timeline
selects the earlier step.*

> It names the step that caused the problem: cue one, where Actor A picked the letter up and nothing
> handed it on. It never blames a later cue for an earlier mistake.

*Click the red step again, then **Add this step and replay**. The step turns green.*

> Add the handoff the run sheet was missing, replay, and the scene is clean. The requirement you
> wrote is never changed. Only the plan is.

### 1:30–1:50 — copies and consumables

*Click **Duplicate Names** (reload first), select a step. Then **Consumed Reuse**, select the red step.*

> Two identical letters are still two objects. Moving copy A does not satisfy a cue that needs copy
> B. And a wax seal that has been broken is gone. A later cue asking for the same seal is refused,
> because a reset does not un-break it. A new seal is a different object with its own identity.

### 1:50–2:10 — reading it without the diagram

*Click **List**. Press Tab through the timeline and the table with the keyboard, showing the focus
outline.*

> The same facts without the diagram: for a crew sheet, for reduced motion, and for anyone working by
> keyboard. The list is the default when your browser asks for reduced motion.

### 2:10–2:30 — the crew sheets

*Click **Reports**. Scroll the preset, runner and reset tables. Click **Download runner report (CSV)**.*

> Preset, runner and reset reports, ready to print for the crew, or to download as a spreadsheet.
> Every row carries the physical instance id, and the file says on its first line that it is a plan,
> not live tracking. Nothing leaves your browser.

### 2:30–2:42 — who this is for, and the honest limit

*On screen: the first screen again, with the limits sentence visible.*

> This is for the person doing paper tech late at night with a pencil and a run sheet, trying to
> work out whether the plan actually holds together. It is not live tracking and it never sees the
> real stage. No stage manager has used it yet, and the open limits are written down in the repo.

### 2:42–2:50 — built with Kiro, and where to find it

*On screen: `.kiro/` in the repository on GitHub, then the live URL.*

> Built with Kiro: specs, steering, and a record of what went wrong along the way. The app and the
> full write-up are linked below.

## Caption and description checklist

- Corner caption for the whole video: **"Synthetic demo scenes — planned state, not live tracking."**
- Video description: app URL, repository URL, the category (Costume Contest), one line saying there is
  no real-user validation yet, and a pointer to `QA_RESULTS.md`.
- Title suggestion: "Ghostlight — catch the prop plan that cannot work (Kiroween 2026)".
- Visibility **Public** (not Unlisted), length under 3:00, narration in English.
- Do not claim minutes saved, do not imply a stage manager tested it, and do not show a real run
  sheet from any production.
