// Ghostlight end-to-end harness — REVIEWER-AUTHORED (Claude, automated daily run).
// axe-core scans of the screens a judge actually sees, compared against the recorded
// baseline in tests/e2e/axe-baseline.json.
//
// The baseline is a debt ledger, not a silencer: every baselined violation is printed on
// every run, a new rule fails the harness, and a baselined rule that gains nodes fails it
// too. Once Kiro item K2 lands, run with --strict and empty the baseline.

import { join } from 'node:path';
import { describe, test, assert } from '../lib/runner.mjs';
import { firstScreen, loadedScene } from '../lib/page.mjs';
import { runAxe, loadBaseline, compareToBaseline, formatViolation } from '../lib/axe.mjs';

const BASELINE_PATH_PARTS = ['tests', 'e2e', 'axe-baseline.json'];

// Populated as the specs run. With --record the entry point writes these observations
// into the baseline file, so recorded numbers always come from a real scan and are
// never typed in by hand.
export const observed = new Map();

async function scan({ repoRoot, strict, record, note }, screenKey, open) {
  const baselineFile = await loadBaseline(join(repoRoot, ...BASELINE_PATH_PARTS));
  assert(baselineFile !== null, `missing accessibility baseline at ${BASELINE_PATH_PARTS.join('/')}`);

  const baselineForScreen = baselineFile.screens?.[screenKey];
  assert(
    baselineForScreen !== undefined,
    `the baseline has no entry for screen "${screenKey}"; add one (an empty array means "no known violations")`,
  );

  const { page, close } = await open();
  let violations;
  try {
    violations = await runAxe(page);
  } finally {
    await close();
  }

  observed.set(screenKey, violations);

  if (record) {
    for (const v of violations) {
      console.log(`      RECORDED    ${formatViolation(v)}`);
    }
    note(`a11y ${screenKey}: recorded ${violations.length} violation rule(s) into the baseline`);
    return;
  }

  const cmp = compareToBaseline(violations, baselineForScreen, { strict });

  for (const v of cmp.known) {
    console.log(`      KNOWN DEBT  ${formatViolation(v)}`);
    note(`a11y ${screenKey}: known violation "${v.id}" (${v.nodeCount} node(s)) — owned by Kiro item K2`);
  }
  for (const v of cmp.fixed) {
    console.log(`      FIXED       ${v.id} no longer fires — remove it from the baseline`);
    note(`a11y ${screenKey}: baselined violation "${v.id}" is fixed; shrink axe-baseline.json`);
  }

  const problems = [];
  for (const v of cmp.newViolations) {
    problems.push(`NEW ${formatViolation(v)}`);
  }
  for (const v of cmp.worsened) {
    problems.push(`WORSE ${v.id}: ${v.nodeCount} node(s), baseline allows ${v.baselineNodeCount}\n${formatViolation(v)}`);
  }

  assert(
    problems.length === 0,
    `${screenKey}: ${problems.length} accessibility problem(s) beyond the baseline\n      ` +
      problems.join('\n      '),
  );
}

describe('accessibility — axe-core, WCAG 2.1 A/AA + best practice', () => {
  test('first screen (no scene loaded)', async (ctx) => {
    await scan(ctx, 'first-screen', () => firstScreen(ctx.browser, ctx.baseUrl));
  });

  test('stage view with a failing scene loaded', async (ctx) => {
    await scan(ctx, 'stage-view', () => loadedScene(ctx.browser, ctx.baseUrl, 'Missing Handoff'));
  });

  test('reports view with a failing scene loaded', async (ctx) => {
    await scan(ctx, 'reports-view', async () => {
      const handle = await loadedScene(ctx.browser, ctx.baseUrl, 'Missing Handoff');
      await handle.page.getByRole('button', { name: 'Reports', exact: true }).click();
      await handle.page.locator('.report-title').first().waitFor({ state: 'visible' });
      return handle;
    });
  });

  test('editor view with a failing scene loaded', async (ctx) => {
    await scan(ctx, 'editor-view', async () => {
      const handle = await loadedScene(ctx.browser, ctx.baseUrl, 'Missing Handoff');
      await handle.page.getByRole('button', { name: 'Editor', exact: true }).click();
      await handle.page.waitForSelector('.panel-header');
      return handle;
    });
  });
});
