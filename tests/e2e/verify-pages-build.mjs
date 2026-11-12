#!/usr/bin/env node
// Ghostlight Pages-build verification — REVIEWER-AUTHORED (Claude, automated daily run).
// This is NOT Kiro-authored application source. See tests/e2e/README.md and QA_RESULTS.md.
//
//   node tests/e2e/verify-pages-build.mjs            verify the default base, /ghostlight/
//   node tests/e2e/verify-pages-build.mjs --base=/x/ verify some other project path
//   node tests/e2e/verify-pages-build.mjs --keep      leave the build in place for inspection
//
// WHY THIS EXISTS, separately from `npm run test:e2e`.
//
// The main harness serves dist/ from the server ROOT, and its static server falls back to
// index.html for any unknown path. Both are right for what it tests and wrong for this:
// a project page on GitHub Pages is served from /<repo>/, and a root-based bundle asking
// for /assets/index.js would 404 there. The fallback would then hand that request
// index.html, so even a broken base path could look like a pass.
//
// So .github/workflows/pages.yml built with `--base=/<repo>/` and nothing had ever loaded
// the result. The workflow is workflow_dispatch-only by design — publishing is the owner's
// moment — which means its first real execution would have been on the day it mattered.
// This script runs that build and loads it the way Pages would serve it:
//
//   * nothing outside /<repo>/ is served at all
//   * a missing file is a 404, with no index.html fallback to hide it
//
// A pass means the published bundle boots, renders, and loads a scene with no console
// error, no uncaught error, no failed request, and no request escaping the project path.

import { createServer } from 'node:http';
import { readFile, stat, rm, mkdtemp } from 'node:fs/promises';
import { join, normalize, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');

const argv = process.argv.slice(2);
const keep = argv.includes('--keep');
const baseArg = argv.find((a) => a.startsWith('--base='));
// Mirrors `--base="/${{ github.event.repository.name }}/"` in pages.yml.
const base = baseArg ? baseArg.slice('--base='.length) : '/ghostlight/';

if (!base.startsWith('/') || !base.endsWith('/') || base === '/') {
  console.error(`verify-pages-build: --base must look like /name/ (got ${JSON.stringify(base)})`);
  process.exit(1);
}

const failures = [];
const notes = [];
function check(ok, label, detail) {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(label);
}

// Same resolution strategy as run.mjs: the repo, or the cloud container's ambient toolchain.
// Never silently skip — an unrunnable check must be a loud failure, not a quiet pass.
function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const name of ['playwright', 'playwright-core']) {
    try { return require(name); } catch { /* next */ }
  }
  const bases = (process.env.NODE_PATH || '').split(':').filter(Boolean).concat(['/opt/node-tools/node_modules']);
  for (const b of bases) {
    for (const name of ['playwright', 'playwright-core']) {
      if (existsSync(join(b, name))) {
        try { return createRequire(join(b, 'noop.js'))(name); } catch { /* next */ }
      }
    }
  }
  console.error('verify-pages-build: no playwright available; cannot verify. NOT RUN.');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.map': 'application/json; charset=utf-8',
};

// GitHub Pages for a project page: only /<repo>/... exists, and a miss is a miss.
function startPagesServer(root, prefix, log) {
  const server = createServer(async (req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    log.push(urlPath);
    if (!urlPath.startsWith(prefix)) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('404 — outside the project path, as on GitHub Pages');
      return;
    }
    let rel = normalize(urlPath.slice(prefix.length)).replace(/^(\.\.(\/|\\|$))+/, '');
    if (rel === '' || rel === '.' || rel === '/') rel = 'index.html';
    const filePath = join(root, rel);
    const info = await stat(filePath).catch(() => null);
    if (!info || info.isDirectory()) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('404 — no SPA fallback, as on GitHub Pages');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(filePath)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(filePath));
  });
  return new Promise((ok, no) => {
    server.once('error', no);
    server.listen(0, '127.0.0.1', () => ok({ server, port: server.address().port }));
  });
}

const outDir = await mkdtemp(join(tmpdir(), 'ghostlight-pages-'));
let server;
try {
  console.log(`\nghostlight Pages build verification — base ${base}`);
  console.log(`  build output: ${outDir}\n`);

  // 1. The build the workflow runs, into a temp dir so dist/ is left alone for the main harness.
  const build = spawnSync('npx', ['vite', 'build', `--base=${base}`, '--outDir', outDir, '--emptyOutDir'],
    { cwd: repoRoot, encoding: 'utf8' });
  check(build.status === 0, 'vite build with the Pages base path succeeds',
    build.status === 0 ? undefined : (build.stderr || build.stdout || '').trim().split('\n').slice(-3).join(' | '));
  if (build.status !== 0) throw new Error('build failed');

  // 2. The emitted HTML must reference the project path, not the server root.
  const html = await readFile(join(outDir, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]).filter((u) => u.startsWith('/') || u.startsWith('.'));
  check(refs.length > 0, 'index.html references build assets', `${refs.length} local reference(s)`);
  const wrong = refs.filter((u) => !u.startsWith(base));
  check(wrong.length === 0, `every local asset reference starts with ${base}`,
    wrong.length ? `offenders: ${wrong.join(', ')}` : refs.join(', '));
  // The failure mode this guards: an empty repo name makes the base "//", and "//assets/x.js"
  // is a protocol-relative URL to the host "assets", not a path on this site.
  check(!refs.some((u) => u.startsWith('//')), 'no protocol-relative asset URL');

  // 3. Load it the way Pages serves it.
  const requested = [];
  const started = await startPagesServer(outDir, base, requested);
  server = started.server;
  const url = `http://127.0.0.1:${started.port}${base}`;

  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const consoleErrors = [], pageErrors = [], badResponses = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => pageErrors.push(String((e && e.message) || e)));
  page.on('requestfailed', (r) => badResponses.push(`requestfailed ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`); });

  const response = await page.goto(url, { waitUntil: 'load' });
  check(!!response && response.ok(), `GET ${base} returns 200`, response ? String(response.status()) : 'no response');

  let booted = true;
  try {
    await page.waitForSelector('#root h1', { timeout: 15000 });
  } catch {
    booted = false;
  }
  check(booted, 'the app mounts and renders a heading',
    booted ? JSON.stringify(await page.locator('#root h1').first().innerText()) : '#root h1 never appeared');

  // 4. Not just booting — actually usable from the subpath.
  let scene = null;
  if (booted) {
    try {
      await page.evaluate(() => { try { window.localStorage.clear(); } catch { /* denied storage has its own state */ } });
      await page.reload({ waitUntil: 'load' });
      await page.waitForSelector('#root h1');
      await page.getByRole('button', { name: 'Missing Handoff', exact: true }).click();
      await page.waitForSelector('.app-main', { timeout: 10000 });
    } catch (err) {
      scene = String(err.message).split('\n')[0];
    }
  }
  check(booted && scene === null, 'loading the "Missing Handoff" demo renders the app',
    !booted ? 'skipped, the app did not boot' : (scene === null ? '.app-main rendered' : scene));

  check(consoleErrors.length === 0, 'no console errors', consoleErrors.join(' | ') || 'none');
  check(pageErrors.length === 0, 'no uncaught page errors', pageErrors.join(' | ') || 'none');
  check(badResponses.length === 0, 'no failed or 4xx/5xx requests', badResponses.join(' | ') || 'none');

  const escaped = [...new Set(requested.filter((p) => !p.startsWith(base)))];
  check(escaped.length === 0, 'no request escapes the project path',
    escaped.length ? escaped.join(', ') : `${requested.length} request(s), all under ${base}`);
  notes.push(`paths requested: ${[...new Set(requested)].join(', ')}`);

  await browser.close();
} finally {
  if (server) await new Promise((r) => server.close(r));
  if (!keep) await rm(outDir, { recursive: true, force: true });
  else console.log(`\n  --keep: build left at ${outDir}`);
}

if (notes.length) {
  console.log('\nNotes');
  for (const n of notes) console.log(`  - ${n}`);
}
console.log(`\n${failures.length === 0 ? 'Pages build verified' : `${failures.length} check(s) FAILED`}\n`);
process.exit(failures.length === 0 ? 0 : 1);
