# Kiro brief — current task

**Status 2026-11-13:** every item in the Kiro queue has been worked in Kiro CLI 3.1.0 / 3.3.0
sessions: **K2 (reopened part), K3, K6 (CSV), K7, K8, K9, K10, K11, K12.** The records, including what
failed, are in `KIRO_SESSION_EVIDENCE.md` (entries dated 2026-11-10 and 2026-11-13). `npm run check`
is green with 297 tests; `npm run test:e2e -- --strict` passes 25/25 with an empty axe baseline.

Nothing is queued for Kiro except the two owner checks below. **Nothing new should land in the last
week** before the 2026-12-04 deadline.

## Open, and only the owner can close them

1. **K8 hook trigger, ~2 minutes.** Three non-interactive child sessions saw no hook fire, not even
   `SessionStart`. In an interactive `kiro-cli chat` in this folder run `/hooks`, then ask the agent to
   append `// k8-hook-probe` to `src/domain/ids.ts`, record whether `[ghostlight hook]` appears, then
   `git checkout -- src`. Until then the trigger is NOT VERIFIED.
2. **K12 MCP, ~3 minutes.** A permission rule blocked the Kiro session from writing
   `.kiro/settings/`, so the launch config is committed as `.kiro/mcp/mcp.settings.json`. Copy it to
   `.kiro/settings/mcp.json`, start a new `kiro-cli chat`, run `/mcp`, and ask the agent to check the
   missing-handoff demo through the ghostlight server. Record whether it was listed and called. Until
   then live use by a Kiro agent is NOT VERIFIED (the server itself is tested over stdio).
3. Submission items (video, blog, social post, Devpost form): see
   [`docs/submission-packet.md`](../docs/submission-packet.md).

## Before every session

`git checkout main; git pull --ff-only; npm ci; npm run check`, note the real test count, and run
`/usage` (note which pool). Afterwards run the four gates plus `npm run test:e2e -- --strict` (needs
`npm i --no-save playwright@1.63.0` and `npx playwright install chromium` on a machine without it), then
append to `KIRO_SESSION_EVIDENCE.md`, including what failed.
