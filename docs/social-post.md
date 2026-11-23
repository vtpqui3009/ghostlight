# Social post — Social Blitz

**DRAFT FOR THE OWNER TO EDIT AND PUBLISH. Nothing has been posted.**

The Social Blitz prize is judged on "original thoughts vs AI writing", and this draft was written by an
AI assistant, so it is only a starting point. Rewrite it in your own voice, keep it to what you
actually felt, and cut anything that sounds generic. After posting, paste the post URL into Devpost.

Rules: public, any social platform, posted during the submission period, and the post must **begin
with `#KiroweenHackathon26`**. The prompt asks what you liked most about Kiro and how it changed the
way you develop.

## Draft (about 280 characters)

```
#KiroweenHackathon26 I built Ghostlight, a checker for stage prop plans, with Kiro CLI. What changed
how I work: I made it write the spec first and no code. A review of that spec found holes before a
single test existed. It also wrote a test that compared an object with itself. It passed. Review caught it.
```

## Alternative, shorter

```
#KiroweenHackathon26 Kiro made me write the spec before the code. For a tool whose whole job is to be
right, that mattered more than anything it generated afterwards. Ghostlight: https://vtpqui3009.github.io/ghostlight/
```

## Facts you can swap in (all documented)

- The first Kiro sessions produced a spec and no code, on purpose.
- Review of the spec found missing rules (a `carryOff` within one zone, a holder-less `place`).
- A generated test passed while comparing an object with itself; the rewrite then failed for a real
  reason and corrected my own understanding.
- 15 property tests found no engine bug; eight deliberately injected bugs were all caught.
- A Kiro agent was seen calling the project's local MCP server on 2026-11-23.
- An infinite CSS animation hung the end-to-end harness for fifteen minutes.

Do not describe Ghostlight as validated by real stage managers. It has not been used by any.
