#!/usr/bin/env bash
# Ghostlight Kiro hook — authored 2026-10-31 during T1.
# Bounded, deterministic, LOCAL COMMAND hook only (no agent-prompt hook; no quota spend).
# Purpose: surface TypeScript type errors quickly after editing a domain-model file.
#
# NOT-YET-VERIFIED: authored JSON/script alone is not proof of execution. Discovery and
# trigger behavior must be confirmed in the native CLI during T2. Direct fetch of the
# official hook docs returned HTTP 403 (not retried; recorded as a limitation). The hook
# shape follows the schema evidence supplied for this task (name required; file matcher
# is a regex; timeout in seconds).
#
# During T1 there are no installed dependencies, so this skips truthfully rather than
# faking a pass. It becomes useful once `npm install` runs in T2. This script does not
# mutate application files or install dependencies.
set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)" || exit 0
if [ ! -f "$ROOT/package.json" ]; then
  echo "[ghostlight hook] NOT RUN — project root not found."
  exit 0
fi
cd "$ROOT" || exit 0
if [ ! -d "$ROOT/node_modules" ] || [ ! -x "$ROOT/node_modules/.bin/tsc" ]; then
  echo "[ghostlight hook] NOT RUN — dependencies not installed. Run \`npm install\` first (T2)."
  exit 0
fi
echo "[ghostlight hook] Running typecheck after a domain-model change..."
npm run typecheck
code=$?
if [ "$code" -eq 0 ]; then
  echo "[ghostlight hook] typecheck PASS"
else
  echo "[ghostlight hook] typecheck FAIL (exit $code) — see output above."
fi
# Report-only: never block a save based on unverified trigger/block semantics.
exit 0
