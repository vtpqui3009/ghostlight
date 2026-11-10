# Kiroween 2026 — requirements reference

Read directly from <https://kiroween.devpost.com> on **2026-11-10**: the Overview, Rules, Resources,
Updates and FAQ tabs. This supersedes the partial notes of 2026-10-31. Quotations are the site's own
wording. The Official Rules remain the deciding source if anything here drifts.

Tabs on the site: Overview · My projects · Participants (11,316) · Resources · Rules ·
Project gallery · Updates · Discussions · Frequently Asked Questions.

## Dates

| What | When |
|---|---|
| Submission period | 2026-10-30 → **2026-12-04 at 2:00 PM Pacific** |
| In Vietnam | **2026-12-05, 05:00** |
| Kiro credit requests | by 2026-12-01, 12:00 PM PT |
| **Redeem Kiro credits** | **by 2026-12-04** — redeemed credits then expire 2026-12-31 |
| No edits after the deadline | drafts can be saved any time before it |

"Only new projects are eligible. You must build your project during the Submission Period
(October 30 to December 4, 2026). Projects you started before October 30, including Kiroween 2025
projects, are not eligible." Ghostlight's first commit is 2026-10-31, inside the window.

## Eligibility

Individuals at the age of majority; **teams of at most 3**; organizations. Excluded: Quebec,
Argentina, Australia, Brazil, Italy, Philippines, Russia, Cuba, Iran, North Korea, Syria, Belarus,
Crimea, DNR, LNR, UAE, and any comprehensively OFAC-sanctioned country. **Vietnam is not on that
list**, so the owner is eligible. Indonesia was added as eligible in the 2026-11-04 update.

One project goes into **one category only**. It may also apply for any bonus prizes it qualifies for.

## The four categories

> **Resurrection** — Bring your favorite dead technology back to life.
> **Frankenstein** — Stitch together a chimera of technologies into one app.
> **Skeleton Crew** — Build a skeleton code template … Show us its versatility with two distinct applications.
> **Costume Contest** — "Build any app but show us a **haunting user interface that's polished and
> unforgettable. Bring in spooky design elements that enhance your app's function.**"

**Ghostlight is entered in Costume Contest.** Read that wording again against the current build: the
interface is a restrained parchment-and-plum theatre desk. The ghost-versus-solid idea is exactly
the "spooky element that enhances function" the category asks for, but the *visual* language is
muted. This is a real gap for the chosen category and is tracked as a roadmap item, not glossed over.

## What must be submitted

- **Category**, plus any bonus prizes being claimed.
- **Public GitHub repository** — "NOT GitLab or BitBucket" — containing all source, assets and
  instructions needed to run the project.
  - An **open source license file, "detectable and visible at the top of the repository page (in the
    About section)"**. A `LICENSE` file is not enough on its own: check GitHub actually shows it.
  - **`/.kiro` at the root**, showing specs, hooks and steering. "Do NOT add the /.kiro directory or
    sub-folders to your .gitignore, **as this could disqualify your submission**."
- **URL to the working app.** If a login is needed, put test credentials in the Devpost form, which
  only judges see.
- **Text description** of features and functionality.
- **Demo video**: under three minutes, showing the project working on its target device, uploaded to
  **YouTube and public**, no third-party trademarks or copyrighted music without permission.
- **A write-up on how Kiro was used.** "Judges must understand how effectively you used Kiro." The
  site lists what it wants covered — this is effectively the marking scheme for 20% of the score:
  - Kiro IDE, CLI, Web, Crew — which, and how did they differ?
  - Custom agents — created or used any? In which Kiro app? What impact?
  - Agent hooks — which workflows were automated? How did they improve development?
  - Spec-driven development — how was the spec structured? How did it compare to vibe coding?
  - Steering docs — what strategy made the biggest difference?
  - MCP — what did extending Kiro enable that would otherwise have been hard?
  - **Property-based testing** — did PBT catch issues unit tests missed? For which requirements?
  - Kiro powers — which were used? Any third-party tooling or integrations?

## Judging

Stage One is pass/fail: does the project "reasonably fit the theme and reasonably apply the required
tools". Stage Two scores five **equally weighted** criteria, 20% / 10 points each.

| Criterion | The question asked |
|---|---|
| Potential Impact | "Does the project make a credible case for solving a real problem for a real audience? … How useful, intuitive, and accessible is it? Would someone actually use this?" |
| Technological Implementation | "**How thoroughly and skillfully does the project use Kiro?** Was there a thoughtful strategy to AI development? **Was a variety of Kiro tools used impactfully?** Does the project show a deep understanding of Kiro features? **Was there experimentation?**" |
| Design | "Does the project deliver a complete, coherent product experience, not just a technical proof of concept? Is the design intuitive, polished, and intentional?" |
| Innovation/Idea | "How creative and novel is the concept, and does the project differ from existing concepts?" |
| Presentation | "Does the video clearly demonstrate the project working end-to-end? … Is the presentation creative and memorable?" |

Note what Technological Implementation actually rewards: **variety of Kiro tools and
experimentation**, not merely that Kiro wrote the code. Ghostlight currently has specs, steering and
one hook whose automatic trigger has never been observed. No MCP, no custom agents, no Kiro Crew, no
Kiro powers, and no property-based tests on `main`.

Ties are re-scored from scratch at 20 points per criterion, then +10 per round until broken.

## Prizes

$100,000+. Overall: $30,000 / $20,000 / $10,000. Each category: $5,000. A project can win **one**
Overall **or** one Category prize, not both, plus any number of bonus prizes.

| Bonus prize | What it needs | Worth claiming here? |
|---|---|---|
| Best Demo | nothing — all eligible submissions considered | automatic |
| **Bonus Blog Prize** | public blog post about Kiro and the project, on any third-party platform, during the submission period, mentioning Kiroween 2026. **100 winners**, 2,000 bonus Kiro credits each | **yes — cheap.** `KIRO_SESSION_EVIDENCE.md` is most of the draft already |
| **Social Blitz** | public social post starting with `#KiroweenHackathon26`, judged on originality — "original thoughts vs AI writing" | yes, if written by the owner in their own words |
| Best Ghost of Kiroween Past | confirm registration for Kiroween 2025, verified against records | **only the owner knows** — check |
| Best Student Project | all members students, with proof | only if applicable |
| Best Startup Project | founder, LinkedIn + startup site | only if applicable |
| Best Kiro Crew App | a separate public repo for a Kiro Crew app | out of scope unless Crew gets used |

## Kiro credits

"Kiroween participants can request 4,000 free Kiro credits to use during the Submission Period." ID
verification required; one-time grant, no additional credits. **Request by 2026-12-01 12:00 PT,
redeem by 2026-12-04, redeemed credits expire 2026-12-31.** The owner reported holding 4,000 credits
on 2026-11-10 — if they are not yet redeemed, redeem before 2026-12-04.

## Other things the rules say

- Intellectual property: the submission must be the entrant's original work and solely owned by
  them. Open source may be used under its licence, provided the submission "enhances and builds upon"
  it. A third party may give technical assistance provided the components are the entrant's own work
  product.
- Judging "may utilize expert panels, peer review, automated AI-driven analysis, or any combination".
- No material changes to criteria, eligibility or prizes without notifying registered participants.

## Updates posted so far

- **2026-11-04** — Indonesia became eligible; rules updated.
- **2026-10-30** — submissions opened.

Nothing posted so far changes anything above.

---

# Conformance check — 2026-11-10

Each line checked against the repository as it stands, not from memory.

## Pass/fail requirements

| Requirement | State | Verdict |
|---|---|---|
| New project, built inside the window | First commit 2026-10-31, inside 10-30 → 12-04. The research documents are dated 2026-10-31 too; the one earlier date in them (16/10/2026) is a cited forum thread's date, not project work | **pass** |
| Public GitHub repository | **private** | **fail — U1** |
| Open source licence detectable in the About section | `LICENSE` is verbatim 21-line MIT, which GitHub detects. Still needs eyes on the sidebar once public | pass, pending visual confirmation |
| `/.kiro` at root, not gitignored | 7 files tracked across `specs/`, `steering/`, `hooks/`; `.gitignore` does not mention kiro | **pass** |
| Repo holds all source, assets and run instructions | yes; `README.md` carries the commands | **pass** |
| URL to a working app | none. `pages.yml` exists but is `workflow_dispatch` only, and Pages needs the repo public first | **fail — U1 then U2** |
| Text description of the project | not drafted | **fail — C9** |
| Demo video, under 3 min, public on YouTube | none. Script exists, but three of its beats cannot be filmed yet | **fail — U3** |
| Write-up on how Kiro was used | none | **fail — C12** |
| One category, team of at most 3, eligible country | Costume Contest, one person, Vietnam not excluded | **pass** |

## The five criteria, honestly scored against what exists

| Criterion | Where we stand |
|---|---|
| **Potential Impact** | Weakest. "Would someone actually use this?" — there is **no user evidence at all**. No stage manager has seen it. This gate has been NOT RUN since 2026-10-31 and nothing in the code changes it. |
| **Technological Implementation** | This criterion is *only* about Kiro, and rewards **variety** and **experimentation**. Present: specs, steering, one hook. Missing: a verified hook trigger, MCP, custom agents, Kiro Crew, Kiro powers, property-based testing. And on 2026-11-10 the engine's import fix, the whole accessibility pass and the responsive fix were written **by the reviewer, not Kiro** — that subtracts here directly. |
| **Design** | Strongest. 227 tests, `--strict` accessibility clean, 0 contrast failures across two schemes, three demos and three views, no 390 px overflow. But the category asks for a **haunting** interface and the visual language is muted — K10. |
| **Innovation/Idea** | The idea is genuinely differentiated — per-physical-instance checking with independently authored required sources. But the competitor comparison is still **NOT RUN**, so the claim cannot be made with evidence. |
| **Presentation** | Script written and timed. No video. Nothing is blocked except the features three of its beats need. |

## What this changes about the plan

1. **Every further `src/` change should go through Kiro.** Technological Implementation is 20% and
   measures Kiro usage directly. The reviewer-written changes are declared honestly in the README,
   which is the right thing to do, but each one is a subtraction on that criterion.
2. **`docs/demo-script.md` needs a revision.** It spends 0:25 of 2:50 on "how Kiro built it", which
   was written before the rules were read. That material now belongs in the **required written
   Kiro write-up**, which is where Technological Implementation is actually scored. The video is
   scored on Presentation: problem, audience, the product working end to end. Reclaim that time.
3. **User validation is the highest-value hour available.** It is the only thing that moves
   Potential Impact, it is 20%, and it is currently zero.
