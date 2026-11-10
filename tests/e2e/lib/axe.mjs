// Ghostlight end-to-end harness — REVIEWER-AUTHORED (Claude, automated daily run).
// axe-core injection and baseline comparison.
//
// Baseline semantics, chosen so the harness can never go green by hiding a problem:
//   * a violation rule NOT in the baseline            -> FAILURE (new regression)
//   * a baselined rule with MORE nodes than recorded  -> FAILURE (it got worse)
//   * a baselined rule at or under its recorded count -> reported loudly as known debt
//   * a baselined rule that has disappeared           -> reported as fixed; shrink the baseline
// Run with --strict to fail on any violation at all, which is what should happen
// once the accessibility Kiro item (K2) has landed.

import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);

let axeSourceCache = null;

export async function axeSource() {
  if (axeSourceCache === null) {
    const path = require.resolve('axe-core/axe.min.js');
    axeSourceCache = await readFile(path, 'utf8');
  }
  return axeSourceCache;
}

export function axeVersion() {
  return require('axe-core/package.json').version;
}

// Runs axe-core against the whole page and returns normalised violations.
// 'best-practice' is included deliberately: the project's own accessibility promises
// (one `main` landmark, all content inside landmarks) are axe best-practice rules rather
// than WCAG success criteria, and dropping the tag would hide them.
export async function runAxe(page, {
  tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
} = {}) {
  await page.addScriptTag({ content: await axeSource() });
  await page.waitForFunction(() => typeof window.axe !== 'undefined');

  const raw = await page.evaluate(async (runTags) => {
    const results = await window.axe.run(document, {
      runOnly: { type: 'tag', values: runTags },
      resultTypes: ['violations'],
    });
    return results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n) => ({
        target: n.target.join(' '),
        summary: (n.failureSummary || '').split('\n').slice(0, 3).join(' | '),
      })),
    }));
  }, tags);

  return raw
    .map((v) => ({ ...v, nodeCount: v.nodes.length }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function loadBaseline(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

// Compares a screen's violations against its baseline entry.
// Returns { newViolations, worsened, known, fixed, ok }.
export function compareToBaseline(violations, baselineForScreen, { strict = false } = {}) {
  const baselineRules = new Map(
    (baselineForScreen || []).map((entry) => [entry.id, entry]),
  );

  const newViolations = [];
  const worsened = [];
  const known = [];

  for (const v of violations) {
    const base = baselineRules.get(v.id);
    if (!base || strict) {
      newViolations.push(v);
      continue;
    }
    if (v.nodeCount > base.nodeCount) {
      worsened.push({ ...v, baselineNodeCount: base.nodeCount });
    } else {
      known.push({ ...v, baselineNodeCount: base.nodeCount });
    }
  }

  const seen = new Set(violations.map((v) => v.id));
  const fixed = (baselineForScreen || []).filter((entry) => !seen.has(entry.id));

  return {
    newViolations,
    worsened,
    known,
    fixed,
    ok: newViolations.length === 0 && worsened.length === 0,
  };
}

export function formatViolation(v) {
  const head = `${v.id} [${v.impact || 'n/a'}] ${v.nodeCount} node(s) — ${v.help}`;
  const targets = v.nodes.slice(0, 5).map((n) => `        at ${n.target}`);
  const more = v.nodeCount > 5 ? [`        … and ${v.nodeCount - 5} more`] : [];
  return [head, ...targets, ...more].join('\n');
}
