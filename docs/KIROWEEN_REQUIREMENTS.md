# Kiroween 2026 — requirements reference

Single place to check the submission against the event's rules. Every line says where it came from
and when, because the two sources have different weight.

## Source status — read this first

| Source | What it is | When |
|---|---|---|
| **S1** | A direct read of <https://kiroween.devpost.com/rules> recorded in `KIROWEEN_RESEARCH_EVIDENCE.md` §A and `GHOSTLIGHT_VALIDATION_PLAN.md` §2 | 2026-10-31 |
| **S2** | A web-search summary, mixing the official page with third-party write-ups | 2026-11-10 |

**The tabs were NOT re-read on 2026-11-10.** `kiroween.devpost.com` and `devpost.com` do not resolve
from this cloud session: every fetch returned `getaddrinfo ENOTFOUND`, which is how the session's
network proxy denies a host. A personal environment named `ghostlight` was created with both hosts
allowed, but the proxy had not picked up the change within the session (it can cache for up to about
an hour). Nothing here was invented to fill the gap.

**Anything marked S2 is unconfirmed against the official page.** The rules are the deciding source;
where S1 and S2 disagree, re-read the page before acting.

## Dates

- Project period: **2026-10-30 09:00 Pacific → 2026-12-04 14:00 PST** (S1, confirmed by S2).
- That deadline is **2026-12-05 05:00 Vietnam time** (S1).
- Only new projects count. Work started before 2026-10-30, including Kiroween 2025 projects, is not
  eligible (S2). Ghostlight's first commit is 2026-10-31, inside the window; the research documents
  were written 2026-10-31 and are declared as prior planning material, not prior code.

## Categories

Four categories (S2, names only — the full official descriptions have not been re-read):

| Category | What it asks for (S2 summary) |
|---|---|
| Resurrection | Bring a dead technology back to life |
| Frankenstein | Stitch together technologies that do not usually work together |
| Skeleton Crew | A lean code template, then two different apps built from it |
| **Costume Contest** | Any app with a haunting, polished user interface |

**Ghostlight targets Costume Contest.** The ghost-versus-solid reading of a prop plan is the
interface idea, not decoration. This remains our inference about category fit; the organisers judge
the actual submission.

## Submission requirements

From S1, recorded in `GHOSTLIGHT_VALIDATION_PLAN.md` §2:

| Requirement | Current state |
|---|---|
| New project built inside the submission window | Met. Declare the pre-existing research documents. |
| Meaningful use of Kiro, with real evidence of decisions, checks and fixes | Partly met. `KIRO_SESSION_EVIDENCE.md` records genuine native Kiro CLI 2.37.0 sessions that authored the specs, engine and tests. More Kiro work is queued in `SUBMISSION_ROADMAP.md` §B. |
| Public repository with source, assets and run instructions, under a recognised open-source licence shown on the repo | **Not met — the repository is private.** MIT `LICENSE` is present. |
| `/.kiro` committed at the root, not gitignored, including sub-directories | Met. `.kiro/specs`, `.kiro/steering`, `.kiro/hooks` are tracked; `.gitignore` does not exclude them. |
| A working app with a URL the judges can use | **Not met.** Pages workflow is roadmap item C3; enabling Pages is U2. |
| Judge access instructions in the submission's own field if a login is needed | Not applicable so far — the app is local-first with no login. |
| Public YouTube video, under three minutes, showing the app on its target device, using content you have the rights to | **Not met.** Script is roadmap item C6; recording is U3. |
| English, or an English translation of the video, description, instructions and documents | Repository documentation is English; the research documents are Vietnamese and are internal, not submission material. |
| Category and team: submit to one category, at most three people | Costume Contest. 2026's team-size limit was not re-confirmed today; 2025's was three (S2). |

An app does **not** have to contain an LLM, and there is no rule that every line be written by Kiro
(S1). Kiro simply has to contribute substantially, with evidence.

## Judging — five criteria, 20% each

From S1 (`GHOSTLIGHT_VALIDATION_PLAN.md` §2, read from the rules page's Judges & Criteria section):

| Criterion | What we would need to show |
|---|---|
| Potential Impact | A real anonymised situation, how it is handled today, what the tool surfaces, and what testers said |
| Technological Implementation | Specs, steering, hooks and property tests genuinely used in Kiro; one requirement traced to a check, a bug found, and the code change |
| Design | A complete flow, ghost/solid explaining a real mismatch, a static list equivalent, keyboard, contrast and reduced motion |
| Innovation / Idea | Per-physical-instance checking and independent source requirements compared against CueCall, DigiScript and Standby, naming what already exists |
| Presentation | Under three minutes: one problem, the app end to end, one cause explained and fixed, with demo data distinguished from real-user evidence |

## Prizes

S2 only, not re-verified: about US$100,000 in total. A project can win one Overall **or** one
Category prize, not both, and any number of bonus prizes. A **bonus blog prize** is listed, which
requires a public post about Kiro and the project — this is not in the 2026-10-31 notes and is worth
confirming, since the Kiro evidence already written up would make such a post cheap to produce.

## Still to read when the host is reachable

The daily run should finish this file once `kiroween.devpost.com` resolves. Re-read, in order:

1. `/rules` — confirm the criteria wording and weights, team size, licence wording, and the full
   category descriptions.
2. `/details/faqs` — it failed to load on the last 2026-10-31 attempt, so it has never been read.
3. `/details/resources` — tooling and any required Kiro setup.
4. `/updates` — the submissions-are-open post and anything later; this is where rule changes appear.
5. `/` overview — prizes, bonus challenges, and the blog prize's actual conditions.
6. `/project-gallery` — only to see what is being submitted; not a requirement.

Record what each page actually says, with the date. Do not paraphrase a third-party summary into
this file as if it were the official text.
