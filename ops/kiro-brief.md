# Kiro brief — current task

**Status 2026-11-13:** K8, K2 (reopened part), K3, K6 (CSV), K7, K9, K10 and K11 are done in a Kiro
CLI 3.3.0 session; see the 2026-11-10 and 2026-11-13 entries in `KIRO_SESSION_EVIDENCE.md`, including
what failed. `npm run check` green with 275 tests; `npm run test:e2e -- --strict` 25 passed, empty
axe baseline.

**Open items, in order:**

1. **K8 follow-up (owner, ~2 minutes).** Three non-interactive child sessions saw *no* hook fire,
   including `SessionStart`. Settle it in an interactive `kiro-cli chat` in this folder: run `/hooks`,
   then ask the agent to append `// k8-hook-probe` to `src/domain/ids.ts`, record what appears, and
   `git checkout -- src`. Until then the hook trigger is NOT VERIFIED.
2. **[K12](kiro-briefs/K12.md) — variety of Kiro tools.** Not started. Choose only what genuinely
   helps this local-first app and record what each changed; "considered, not used" is an acceptable
   honest answer for MCP and powers.
3. **Fill the `TO FILL` blocks** in `docs/kiro-writeup.md` and `docs/submission.md` from the evidence
   file only.
4. Owner-only items U1–U6 are in `docs/HANDOFF_TO_KIRO.md`. Nothing new in the last week.

## Before every session

`git checkout main; git pull --ff-only; npm ci; npm run check`, note the real test count, and run
`/usage` (note which pool). Afterwards run the four gates plus `npm run test:e2e -- --strict` (needs
`npm i --no-save playwright@1.63.0` and `npx playwright install chromium` on a machine without it),
then append to `KIRO_SESSION_EVIDENCE.md`, including what failed.
