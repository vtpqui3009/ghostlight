// Ghostlight end-to-end harness — REVIEWER-AUTHORED (Claude, automated daily run).
// axe-core scans of the screens a judge actually sees, compared against the recorded
// baseline in tests/e2e/axe-baseline.json.
//
// The baseline is a debt ledger, not a silencer: every baselined violation is printed on
// every run, a new rule fails the harness, and a baselined rule that gains nodes fails it
// too. Once Kiro item K2 lands, run with --strict and empty the baseline.
//
// Scheme and selection coverage, added 2026-11-10. The original four scans used the light
// scheme and never selected a timeline row, and that pair of omissions hid 19 real
// contrast failures: `.action-item.selected` paints a mint fill that only exists once a
// row is clicked, and the dark scheme re-tints it without re-pairing the foreground. The
// scans below name their scheme explicitly and the stage scans click a failing row, so
// the state a judge actually looks at is the state that gets measured.

import { join } from 'node:path';
import { describe, test, assert } from '../lib/runner.mjs';
import { firstScreen, loadedScene, selectFailingAction } from '../lib/page.mjs';
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
  // In --record mode a missing entry is the normal case: that is how a newly added screen
  // gets its first recorded numbers. Outside --record a missing entry is a real error,
  // because it means a screen is being scanned with nothing to compare against.
  assert(
    record || baselineForScreen !== undefined,
    `the baseline has no entry for screen "${screenKey}"; run "npm run test:e2e -- --record" to record it`,
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

  // The state the demo script actually puts on screen: a failing step selected, with its
  // cause and the suggested fix visible. Nothing is painted mint until this click happens.
  test('stage view with the failing step selected', async (ctx) => {
    await scan(ctx, 'stage-view-selected', async () => {
      const handle = await loadedScene(ctx.browser, ctx.baseUrl, 'Missing Handoff');
      const row = await selectFailingAction(handle.page);
      assert(row !== null, 'Missing Handoff has no rejected action to select');
      return handle;
    });
  });

  // Dark scheme. Same four screens, plus the selected row, because the dark palette
  // re-tints surfaces independently and a light-only scan cannot speak for it.
  test('first screen, dark scheme', async (ctx) => {
    await scan(ctx, 'first-screen-dark', () =>
      firstScreen(ctx.browser, ctx.baseUrl, undefined, 'dark'));
  });

  test('stage view with the failing step selected, dark scheme', async (ctx) => {
    await scan(ctx, 'stage-view-selected-dark', async () => {
      const handle = await loadedScene(ctx.browser, ctx.baseUrl, 'Missing Handoff', undefined, 'dark');
      const row = await selectFailingAction(handle.page);
      assert(row !== null, 'Missing Handoff has no rejected action to select');
      return handle;
    });
  });

  test('reports view, dark scheme', async (ctx) => {
    await scan(ctx, 'reports-view-dark', async () => {
      const handle = await loadedScene(ctx.browser, ctx.baseUrl, 'Missing Handoff', undefined, 'dark');
      await handle.page.getByRole('button', { name: 'Reports', exact: true }).click();
      await handle.page.locator('.report-title').first().waitFor({ state: 'visible' });
      return handle;
    });
  });

  test('editor view, dark scheme', async (ctx) => {
    await scan(ctx, 'editor-view-dark', async () => {
      const handle = await loadedScene(ctx.browser, ctx.baseUrl, 'Missing Handoff', undefined, 'dark');
      await handle.page.getByRole('button', { name: 'Editor', exact: true }).click();
      await handle.page.waitForSelector('.panel-header');
      return handle;
    });
  });
});
