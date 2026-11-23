# Kiro brief — current task

**Status 2026-11-13:** every item in the Kiro queue has been worked in Kiro CLI 3.1.0 / 3.3.0
sessions: **K2 (reopened part), K3, K6 (CSV), K7, K8, K9, K10, K11, K12.** The records, including what
failed, are in `KIRO_SESSION_EVIDENCE.md` (entries dated 2026-11-10 and 2026-11-13). `npm run check`
is green with 297 tests; `npm run test:e2e -- --strict` passes 32/32 with an empty axe baseline (K13
Halloween v2 added 7 tests on 2026-11-23).

Nothing is queued for Kiro except the two owner checks below. **Nothing new should land in the last
week** before the 2026-12-04 deadline.

## Open, and only the owner can close them

1. **K8 hook trigger, optional, ~2 minutes.** Four non-interactive sessions (the last on 2026-11-23)
   saw no hook fire. In an interactive `kiro-cli chat` in this folder run `/hooks`, then ask the agent to
   append `// k8-hook-probe` to `src/domain/ids.ts`, record whether `[ghostlight hook]` appears, then
   `git checkout -- src`. Until then the trigger is NOT VERIFIED and the write-up says so.
2. **K12 MCP: done 2026-11-23.** A live non-interactive Kiro CLI session called `list_demos`,
   `get_demo` and `check_scenario` through `.kiro/settings/mcp.json`. An interactive `/mcp` listing was
   not looked at.
3. Submission items (video, blog and social post edits and links, Devpost form): see
   [`docs/submission-packet.md`](../docs/submission-packet.md). Drafts: `docs/blog-post.md`,
   `docs/social-post.md`.

## Before every session

`git checkout main; git pull --ff-only; npm ci; npm run check`, note the real test count, and run
`/usage` (note which pool). Afterwards run the four gates plus `npm run test:e2e -- --strict` (needs
`npm i --no-save playwright@1.63.0` and `npx playwright install chromium` on a machine without it), then
append to `KIRO_SESSION_EVIDENCE.md`, including what failed.
