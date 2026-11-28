# Social post — outline and questions (not a draft)

Prepared 2026-11-28. This is an outline, not text to post. The Social Blitz prize is judged on
"original thoughts vs AI writing", so the sentences have to be yours. [`social-post.md`](social-post.md)
holds an earlier AI-written draft; treat it as raw material only, and do not paste it.

## Rules (from the Devpost Rules tab, as recorded in `submission-packet.md`)

- Public post, any social platform, posted during the submission period (deadline 2026-12-04 14:00 PT).
- The post must **begin with `#KiroweenHackathon26`**.
- Say what you liked most about Kiro and how it changed the way you develop.
- Paste the post URL into the Devpost form.
- Do not say a stage manager used Ghostlight. None has.

## Shape (pick one, keep it short)

1. `#KiroweenHackathon26` as the first characters.
2. One specific thing about working with Kiro that you felt, in your own words.
3. One thing that went wrong or surprised you.
4. The link: https://vtpqui3009.github.io/ghostlight/

## Questions to answer before you write

Answer each in a sentence you would say out loud. Use whichever ones you have a real answer to, and skip the rest.

- What did you expect Kiro to be like, and what was different?
- Before this project, would you have written the spec first? What made you do it here?
- Which moment made you stop and think "I would have missed that"?
- Was there a point where you were annoyed with Kiro? What happened?
- What would you do differently in the next Kiro session?
- Which Kiro feature did you not use that you wish you had (hooks, MCP, steering, specs)?

## Documented facts you can build on (each is in `KIRO_SESSION_EVIDENCE.md`)

| Fact | Where |
|---|---|
| The first Kiro sessions produced a spec and no application code, on purpose | `KIRO_SESSION_EVIDENCE.md`, "Independent T1 review and Kiro fixes" |
| Reviewing the spec found missing rules: a `carryOff` within one zone, a `place` with no holder | `docs/kiro-writeup.md` |
| A Haiku 4.5 session stopped converging at 17 TypeScript and 18 ESLint errors; a fresh Sonnet 4.5 session fixed the real errors in one pass | `KIRO_SESSION_EVIDENCE.md`, "Engine repair checkpoint — 2026-10-31T13:28Z" |
| A generated test compared an object with itself and passed | `docs/kiro-writeup.md` |
| 15 property tests found no engine bug; 8 deliberately injected bugs were all caught | `KIRO_SESSION_EVIDENCE.md`, the property-test (K11) entry; search for "deliberate bugs" |
| An infinite CSS animation hung the end-to-end harness (15-minute timeout) | `KIRO_SESSION_EVIDENCE.md`, search for "The strict harness hung forever" |
| The local MCP server was called by a non-interactive Kiro CLI session on 2026-11-23 | `KIRO_SESSION_EVIDENCE.md` and `docs/kiro-writeup.md`, MCP section |
| The `PostFileSave` hook was **not** seen firing in four non-interactive sessions | `KIRO_SESSION_EVIDENCE.md`, search for "NOT VERIFIED" |

## Do not claim

- Real-user validation, or that any stage manager has tried it.
- That the hook works. It is NOT VERIFIED.
- Uniqueness, or that it beats other tools. No comparison was run.
- That it tracks props live. It checks a plan only.
