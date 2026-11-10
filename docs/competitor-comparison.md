# Comparison with existing tools — **NOT RUN**

Innovation/Idea is 20% and asks whether the project "differs from existing concepts". Ghostlight's
claim is narrow and specific, so it has to be tested against the tools that already exist rather
than asserted.

**Status: NOT RUN.** Nothing below has been executed. The 2026-10-31 research pass *read about*
these tools; it did not run them. Until this table is filled from actual use, the submission must
not claim the difference — it may only describe what Ghostlight does.

## The claim being tested

> Ghostlight checks **each physical instance** against a **required source and holder that the user
> authored independently**, and when they disagree it names the **earlier action** that caused it.

Three parts, each of which an existing tool might already do:

1. Are two identical props two things, or one line item with a quantity?
2. Does a step carry a source and holder the *user stated*, separate from whatever the tool has
   computed — or does the tool fill that in from its own model, so the check can never fail?
3. When something is wrong, does it point at the earlier step that caused it?

## Tools to test

| Tool | Entry point | Access |
|---|---|---|
| CueCall | <https://www.cuecall.app/docs/run-sheets-reports-tab-adding-duties> | public docs read on 2026-10-31; **runtime not tested** |
| DigiScript | <https://dreamteamprod.github.io/DigiScript/pages/show_config/stage_management.html> | public docs read on 2026-10-31; **runtime not tested** |
| Standby | <https://github.com/ShannonH/standby> | open source, so it can be run locally |

**Only use access you are entitled to.** Do not buy a licence, do not create an account that
requires agreeing to terms you have not read, and do not attempt anything a free tier does not
offer. Where a tool cannot be tested, write *why* — "not accessible without a paid plan" is a
legitimate and publishable result. **"Not visible in the public docs" is not the same as "the
product cannot do it"**, and the write-up must not blur the two.

## Method

Run the identical five scenarios already bundled in Ghostlight as demo scenes, so the comparison is
like for like:

1. Valid control — four clean steps. Does the tool stay quiet?
2. Missing handoff — the letter leaves with Actor A; a later cue still expects it.
3. Consumed reuse — a wax seal is used, then required again.
4. Duplicate names — two identical letters, distinct ids.
5. Reordering — valid in one order, broken in the other.

For each tool and each scenario record: what you typed, what the tool did, how long it took, and a
screenshot or a quote from its output.

## Results table — fill from actual runs

| Capability | Ghostlight | CueCall | DigiScript | Standby |
|---|---|---|---|---|
| Two identical props are two tracked instances | yes, by id | NOT RUN | NOT RUN | NOT RUN |
| A step carries a user-authored required source **and** holder | yes | NOT RUN | NOT RUN | NOT RUN |
| That requirement is independent of computed state | yes — the replay never writes back into it | NOT RUN | NOT RUN | NOT RUN |
| Detects a missing handoff | yes | NOT RUN | NOT RUN | NOT RUN |
| Refuses reuse of a consumed instance | yes, terminal | NOT RUN | NOT RUN | NOT RUN |
| Names the earlier action that caused a mismatch | yes | NOT RUN | NOT RUN | NOT RUN |
| Unrecorded start reported as uncertainty, not error | yes | NOT RUN | NOT RUN | NOT RUN |
| Reordering cues changes the verdict | yes | NOT RUN | NOT RUN | NOT RUN |
| Printable preset / runner / reset sheets | yes | NOT RUN | NOT RUN | NOT RUN |
| Could not be tested because… | — | | | |

## Writing it up afterwards

- Say what each tool **already does well**. Handoffs, presets, tracks, reports and playback exist in
  this space already; none of those is the claim.
- If a tool turns out to do all three parts of the claim, **say so** and narrow the claim to what is
  left. That is a better submission than one that pretends otherwise.
- Date every observation and name the version or the page, because these products change.
