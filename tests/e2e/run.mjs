#!/usr/bin/env node
// Ghostlight end-to-end + accessibility harness — REVIEWER-AUTHORED (Claude, automated daily run).
// This is NOT Kiro-authored application source. See tests/e2e/README.md and QA_RESULTS.md.
//
//   npm run test:e2e              run every spec against the production build in dist/
//   npm run test:e2e -- --strict  additionally fail on any baselined accessibility violation
//   npm run test:e2e -- --record  rewrite the accessibility baseline from this run's scan
//   npm run test:e2e -- --headed  run with a visible browser (local debugging only)
//
// The harness drives the `playwright` library directly instead of `@playwright/test`.
// The cloud container used for the automated run ships a preinstalled Playwright and
// Chromium; installing a second, differently versioned copy would not find that browser.

import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from './lib/server.mjs';
import { runAll } from './lib/runner.mjs';
import { axeVersion } from './lib/axe.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const distDir = join(repoRoot, 'dist');

const argv = process.argv.slice(2);
const strict = argv.includes('--strict');
const headed = argv.includes('--headed');
const record = argv.includes('--record');

if (record && strict) {
  console.error('ghostlight e2e: --record and --strict are contradictory; pick one.');
  process.exit(1);
}

function fail(message) {
  console.error(`\nghostlight e2e: ${message}\n`);
  process.exit(1);
}

// Resolve Playwright from wherever this machine has it: the repo, or the ambient
// toolchain of the cloud container. Never silently skip — an unrunnable harness
// must be a loud failure, not a quiet pass.
function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const candidates = ['playwright', 'playwright-core'];
  for (const name of candidates) {
    try {
      return { mod: require(name), name, version: require(`${name}/package.json`).version };
    } catch {
      /* try the next candidate */
    }
  }
  for (const base of (process.env.NODE_PATH || '').split(':').filter(Boolean).concat(['/opt/node-tools/node_modules'])) {
    for (const name of candidates) {
      const entry = join(base, name);
      if (existsSync(entry)) {
        try {
          const req = createRequire(join(base, 'noop.js'));
          return { mod: req(name), name, version: req(`${name}/package.json`).version };
        } catch {
          /* keep looking */
        }
      }
    }
  }
  return null;
}

async function main() {
  if (!existsSync(join(distDir, 'index.html'))) {
    fail(`no production build found at ${distDir}. Run "npm run build" first.`);
  }

  const pw = loadPlaywright();
  if (!pw) {
    fail(
      'Playwright is not available on this machine.\n' +
      '  The automated cloud run has it preinstalled. Elsewhere:\n' +
      '    npm i -D playwright@1.63.0 && npx playwright install chromium',
    );
  }

  const launchOptions = { headless: !headed };
  // A matching browser outside the Playwright package needs an explicit path.
  if (process.env.GHOSTLIGHT_CHROMIUM) {
    launchOptions.executablePath = process.env.GHOSTLIGHT_CHROMIUM;
  }

  const server = await startStaticServer(distDir);
  let browser;
  let result;

  try {
    browser = await pw.mod.chromium.launch(launchOptions);

    console.log('Ghostlight end-to-end + accessibility harness');
    console.log(`  build      ${distDir}`);
    console.log(`  served at  ${server.baseUrl}`);
    console.log(`  playwright ${pw.name}@${pw.version}`);
    console.log(`  axe-core   ${axeVersion()}`);
    console.log(
      `  mode       ${
        record
          ? 'RECORD (rewriting the a11y baseline from this run)'
          : strict
            ? 'STRICT (any a11y violation fails)'
            : 'baselined (known a11y debt reported, not fatal)'
      }`,
    );

    // Specs register themselves on import.
    await import('./specs/smoke.spec.mjs');
    await import('./specs/responsive.spec.mjs');
    const a11y = await import('./specs/accessibility.spec.mjs');

    result = await runAll({ browser, baseUrl: server.baseUrl, strict, record, repoRoot, here });

    if (record) {
      await writeBaseline(a11y.observed, pw.version);
    }
  } finally {
    if (browser) await browser.close();
    await server.close();
  }

  if (result.notes.length) {
    console.log('\nNotes');
    for (const n of result.notes) console.log(`  - ${n}`);
  }

  console.log(`\n${result.passed} passed, ${result.failed} failed`);

  if (result.failed > 0) {
    console.log('\nFailures');
    for (const f of result.failures) {
      console.log(`  ${f.suite} > ${f.test}`);
      console.log(`    ${f.error && f.error.message ? f.error.message.split('\n').join('\n    ') : f.error}`);
    }
    process.exit(1);
  }
}

// Writes the baseline straight from the scan results, so the recorded counts are
// observations rather than anything a human or an agent typed in.
async function writeBaseline(observed, playwrightVersion) {
  const screens = {};
  for (const [screenKey, violations] of observed) {
    screens[screenKey] = violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodeCount: v.nodeCount,
      help: v.help,
      helpUrl: v.helpUrl,
      targets: v.nodes.map((n) => n.target),
    }));
  }
  const payload = {
    _comment:
      'REVIEWER-AUTHORED (Claude, automated daily run) and GENERATED by "npm run test:e2e -- --record". ' +
      'Recorded accessibility debt, not a silencer: every entry here is printed on every run and is owned by ' +
      'Kiro item K2. A rule not listed fails the harness; a listed rule that gains nodes fails it too. ' +
      'Do not hand-edit the counts — re-record them.',
    _recorded: new Date().toISOString().slice(0, 10),
    _axeCore: axeVersion(),
    _playwright: playwrightVersion,
    _ownedBy: 'Kiro item K2 (accessibility fixes). When K2 lands, empty these arrays and run with --strict.',
    screens,
  };
  const path = join(here, 'axe-baseline.json');
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`\nRecorded accessibility baseline -> ${path}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
