# Submission packet — everything to copy, in the order you need it

Prepared 2026-11-13. **Deadline: Friday 2026-12-04, 2:00 PM Pacific (2026-12-05, 05:00 Vietnam time).
No edits after it.** Submit days early; drafts can be saved any time before.

Facts in here were checked against the repository and the live app on 2026-11-13. The Official Rules
on the Devpost Rules tab are the deciding source, and automated fetches of that site return HTTP 403,
so read the Rules and FAQ yourself once before you submit.

What is already true and needs nothing from you:

| Requirement | State |
|---|---|
| Public GitHub repository | <https://github.com/vtpqui3009/ghostlight>, public |
| Open-source licence shown in the About box | MIT, detected by GitHub (look at the sidebar once yourself) |
| `/.kiro` at the root, not in `.gitignore` | yes (specs, steering, hooks, MCP launch config) |
| Working app URL | <https://vtpqui3009.github.io/ghostlight/> |
| Written "how Kiro was used" | [`docs/kiro-writeup.md`](kiro-writeup.md) |
| English | all of the above |

What only you can do: **the video, the blog, the social post, and pressing Submit.**

---

## 1. Devpost form fields (paste as written)

| Field | Value |
|---|---|
| Project name | Ghostlight |
| Tagline | Catch the prop plan that cannot work, before the curtain rises. |
| Category | **Costume Contest** (only one) |
| Repository URL | https://github.com/vtpqui3009/ghostlight |
| Working app URL | https://vtpqui3009.github.io/ghostlight/ |
| Judge login | None needed. The app is local-first; nothing to sign into. |
| Demo video URL | *(yours: public YouTube link, under 3:00)* |
| Team | One person |
| Built with | TypeScript, React, Vite, Vitest, fast-check, Playwright, axe-core, Model Context Protocol, Kiro CLI |

### Short description (paste into the text description, then keep the long form below it)

> Ghostlight is a planned-state checker for stage props. A stage manager's run sheet says who
> carries what, from where, in which cue; when one handoff is missing, nobody finds out until an
> actor reaches for a letter that is not there. Ghostlight replays the plan in cue order and shows
> where it contradicts itself. The ghost, a dashed outline, is where a prop *should* be according to
> the run sheet; the solid block is where the plan *actually* has it. Every finding names the earlier
> step that caused it, and you can jump to it and apply the one unambiguous fix.
>
> Two identical letters are two tracked objects, a consumed prop never comes back, and unknown
> starting positions are reported as uncertainty rather than guessed. The requirement is always the
> one the user wrote; the tool never fills it in from its own model. It is planned state only, not live
> tracking and not a safety system. It runs entirely in the browser, has light and dark schemes, a
> keyboard path and a plain list view, and prints or exports preset, runner and reset sheets.

Long form: the **Description** section of [`docs/submission.md`](submission.md) (problem, what it
does, what makes it different, the interface, what it is not, built honestly). Paste it below the
short one. The two paragraphs that used to be marked `TO FILL` (competitor comparison and user
sessions) were replaced on 2026-11-23 with a plain statement that no interview or comparison was run
and there is no real-user validation. Keep that statement. Do not imply a stage manager tried it.
The only blank left in `docs/submission.md` is the video URL (`OWNER TO ADD`).

### "How Kiro was used" field

Paste the full text of [`docs/kiro-writeup.md`](kiro-writeup.md). It answers every question the Rules
list (surfaces, custom agents, hooks, spec-driven development, steering, MCP, property-based testing,
powers). One statement in it is deliberately cautious and you should keep it that way unless you
verify it yourself first:

1. The `PostFileSave` hook was **not observed firing** (four non-interactive attempts, the last on
   2026-11-23). If you open an interactive `kiro-cli chat` in the repo folder, run `/hooks`, then ask
   the agent to append a comment line to `src/domain/ids.ts` and see the typecheck output, update the
   **Agent hooks** section with what you saw, then `git checkout -- src`. This is optional: an honest
   "not verified" is already in the write-up.

The MCP statement is now backed by an observation. On 2026-11-23 a non-interactive Kiro CLI session
called `@ghostlight/list_demos`, `get_demo` and `check_scenario` for the Missing Handoff demo, using
`.kiro/settings/mcp.json` (a copy of `.kiro/mcp/mcp.settings.json`, now committed). Only an
interactive `/mcp` listing was not looked at.

### Bonus prizes

| Bonus | Do you enter? |
|---|---|
| Best Demo | Automatic, nothing to do |
| Bonus Blog Prize | Yes if you publish the blog (section 3) and paste the link |
| Social Blitz | Yes if you publish the post (section 4) and paste the link |
| Best Ghost of Kiroween Past | **Not entered.** You did not register for Kiroween 2025 |
| Best Student Project | **Not entered** (owner decision) |
| Best Startup Project | **Not entered** (owner decision) |
| Best Kiro Crew App | No (Crew not used) |

---

## 2. The video (you record it; ≤ 3:00, public on YouTube)

The complete script, with every click and the English narration, is in
[`docs/demo-script.md`](demo-script.md). Do not keep a second copy: that file is the one to read from.

Checklist before you press record:

- [ ] Open the **live URL** in a private window, dark mode if your system uses it.
- [ ] Re-check each beat works on the live site (Valid Control, Missing Handoff → cause → fix, Duplicate
      Names, Consumed Reuse, List view, Reports → CSV).
- [ ] Corner caption on screen throughout: "Synthetic demo scenes — planned state, not live tracking."
- [ ] No music. Your own narration only. English.
- [ ] Do not show a real run sheet, a real production, or any account page.

After uploading:

- [ ] Visibility is **Public**, not Unlisted; length is under 3:00.
- [ ] Title: "Ghostlight — catch the prop plan that cannot work (Kiroween 2026)".
- [ ] Description has the app URL, the repo URL, the category, and one line saying there is no
      real-user validation yet.
- [ ] Open the link while signed out of YouTube to confirm anyone can watch.

---

## 3. Blog post (Bonus Blog Prize) — a full draft exists, edit it in your own voice

Rules: public, on a third-party platform (dev.to, Medium, Hashnode and similar), published during the
submission period, and it must say it was written for **Kiroween 2026**. Winners are chosen from the
top-scoring posts, so specific and honest beats polished. A complete draft written on 2026-11-23 from
the evidence file is in [`docs/blog-post.md`](blog-post.md). It is a draft for you to edit, not to paste
unchanged. Replace the three `OWNER TO ADD` links at the bottom after publishing.

Real events you can build the story from (all in `KIRO_SESSION_EVIDENCE.md`):

- Why a prop plan can contradict itself and nobody notices until an actor reaches for the letter.
- Specs first: the spec was reviewed before any code; the review made Kiro add rules it had missed
  (a `carryOff` within one zone, a holder-less `place`).
- A model that stopped converging (Haiku) versus one that fixed it in one pass (Sonnet), and what
  you learned about stopping a writer.
- A test that compared an object with itself and passed for the wrong reason.
- Property-based tests that found **nothing**, and how eight deliberately injected bugs proved the
  tests could fail.
- A hook that was configured but never seen firing, and a Windows machine with no `bash`.
- An infinite CSS animation that hung the accessibility harness for fifteen minutes.
- An MCP server built because earlier fixtures were wrong, and the honest result of using it.
- Making a Halloween interface that still passes axe in light and dark, with no jump scares.

Suggested shape: hook → the problem → what you built → three things that went wrong → what you would
tell the next developer → links. Start the post with the line that says it is for Kiroween 2026.

---

## 4. Social Blitz post — draft in `docs/social-post.md`; rewrite it in your own voice

This prize is judged on **original thoughts versus AI writing**. A short draft was written on
2026-11-23 and is in [`docs/social-post.md`](social-post.md), but it was written by an AI assistant, so
it may score badly as it stands. Use it as a starting point and put your own thoughts in.

Constraints from the Rules: any social platform; a public post during the submission period; it must
**begin with `#KiroweenHackathon26`**; share what you liked most about Kiro and how it changed the way
you develop; paste the link into the form.

Raw material (pick one or two, say it your way):

- The thing that surprised you most about working with Kiro.
- A moment a spec or steering rule stopped a mistake before it shipped.
- One failure you would admit to (the hook, the self-comparing test, the animation).
- A screenshot from `docs/media/` (the stage with the dashed ghost is the most distinctive).

---

## 5. Pre-submit checklist

- [ ] Repository public; About box shows **MIT License**.
- [ ] `https://vtpqui3009.github.io/ghostlight/` loads (try it on your phone, too).
- [ ] `.kiro/` is visible on GitHub (specs, steering, hooks, mcp) and not in `.gitignore`.
- [ ] Video public, under 3:00, narrated in English.
- [ ] Description pasted; no `OWNER TO ADD` or `TO FILL` left in anything you paste.
- [ ] Kiro write-up pasted; the hook and MCP lines match what you actually saw.
- [ ] Blog and social links pasted, if you wrote them.
- [ ] Category set to **Costume Contest**.
- [ ] Submit by **2026-12-04 14:00 PT**, ideally days before.

## 6. After you submit

- Keep the repository **public** and the Pages site **up** until judging ends (about **2027-01-29**);
  projects must stay freely accessible through judging.
- Do not rename or delete the repository.
- Winners are expected around 2027-02-03.
