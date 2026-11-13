// Kiro-authored (K12, 2026-11-13). Bundles the Ghostlight MCP server into one file.
//
//   node tools/mcp/build.mjs                  -> .kiro/mcp/ghostlight-mcp.mjs (committed)
//   node tools/mcp/build.mjs --out <path>     -> any other path (used by the staleness test)
//
// The bundle is committed so that someone who clones the repository can run the server with
// nothing but Node. The build is deterministic: no timestamps, paths relative to the repo root.
import { build } from 'esbuild';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const argIndex = process.argv.indexOf('--out');
const outfile = argIndex > -1 ? resolve(process.argv[argIndex + 1]) : resolve(root, '.kiro', 'mcp', 'ghostlight-mcp.mjs');

await build({
  absWorkingDir: root,
  entryPoints: ['tools/mcp/server.ts'],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  loader: { '.md': 'text' },
  legalComments: 'none',
  logLevel: 'warning',
  // Some bundled CommonJS dependencies call require(); give them one.
  banner: { js: "import { createRequire as __gl_createRequire } from 'node:module'; const require = __gl_createRequire(import.meta.url);" },
});
