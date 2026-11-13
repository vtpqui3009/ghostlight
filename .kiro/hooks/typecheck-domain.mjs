// Ghostlight Kiro hook, authored by Kiro on 2026-11-10 during task K8.
//
// Replaces the bash dependency of typecheck-domain.sh: on the owner's Windows machine
// `Get-Command bash` returned nothing, so `bash .kiro/hooks/typecheck-domain.sh` cannot run.
// This script needs only Node, which the project already requires.
//
// Bounded, deterministic, LOCAL COMMAND hook. No agent prompt, no network, no file writes
// beyond what `tsc -b` already does for the project's own typecheck script.
// Report-only: always exits 0, so a failing typecheck is shown but never blocks a save.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');

if (!existsSync(join(root, 'package.json'))) {
  console.log('[ghostlight hook] NOT RUN - project root not found.');
  process.exit(0);
}
if (!existsSync(tsc)) {
  console.log('[ghostlight hook] NOT RUN - dependencies not installed. Run `npm ci` first.');
  process.exit(0);
}

console.log('[ghostlight hook] Running typecheck after a domain-model change...');
// Same command as the `typecheck` script in package.json, run without a shell.
const result = spawnSync(process.execPath, [tsc, '-b', '--pretty', 'false'], {
  cwd: root,
  stdio: 'inherit',
});
const code = result.status ?? 1;
console.log(
  code === 0
    ? '[ghostlight hook] typecheck PASS'
    : `[ghostlight hook] typecheck FAIL (exit ${code}) - see output above.`,
);
process.exit(0);
