// Ghostlight end-to-end harness — REVIEWER-AUTHORED (2026-11-23, assistant session, not Kiro).
// Guards the K13 "Halloween v2" decoration layer that Kiro wrote: the art is present, it is
// invisible to assistive technology and the pointer, it never loops, it stops under reduced
// motion, it causes no horizontal scroll, and the stage still says everything in words.
//
// The axe scans in accessibility.spec.mjs already cover these screens with the art mounted.

import { describe, test, assert } from '../lib/runner.mjs';
import { firstScreen, loadedScene, selectFailingAction } from '../lib/page.mjs';

const ART = ['.haunt-decor', '.haunt-moon', '.haunt-graves', '.haunt-bat', '.haunt-ghost', '.haunt-pumpkin'];
const MOBILE = { width: 390, height: 844 };

// Every decorative node must be hidden from assistive technology (itself or via an ancestor),
// ignore the pointer, and contain nothing focusable.
async function decorProblems(page) {
  return page.evaluate((selectors) => {
    const problems = [];
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        if (!el.closest('[aria-hidden="true"]')) problems.push(`${sel} is not inside aria-hidden="true"`);
        if (getComputedStyle(el).pointerEvents !== 'none' && !el.closest('.haunt-decor')) {
          problems.push(`${sel} has pointer-events: ${getComputedStyle(el).pointerEvents}`);
        }
        if (el.querySelector('a, button, input, select, textarea, [tabindex]')) problems.push(`${sel} contains a focusable element`);
      }
    }
    const layer = document.querySelector('.haunt-decor');
    if (layer && getComputedStyle(layer).pointerEvents !== 'none') problems.push('.haunt-decor accepts pointer events');
    return problems;
  }, ART);
}

async function infiniteAnimations(page) {
  return page.evaluate(() =>
    document.getAnimations()
      .filter((a) => a.effect && a.effect.getComputedTiming().iterations === Infinity)
      .map((a) => a.animationName || a.transitionProperty || 'unnamed'));
}

async function overflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

describe('halloween — the K13 decoration layer', () => {
  for (const scheme of ['light', 'dark']) {
    test(`first screen shows the moon, graves, bats, ghost and pumpkin (${scheme})`, async ({ browser, baseUrl }) => {
      const { page, close } = await firstScreen(browser, baseUrl, undefined, scheme);
      try {
        for (const sel of ART) {
          const count = await page.locator(sel).count();
          assert(count > 0, `${sel} is missing from the first screen`);
        }
        const moonBox = await page.locator('.haunt-moon').boundingBox();
        assert(moonBox && moonBox.width > 40, `the moon is not visibly rendered: ${JSON.stringify(moonBox)}`);
      } finally {
        await close();
      }
    });
  }

  test('decoration is aria-hidden, ignores the pointer and holds nothing focusable', async ({ browser, baseUrl }) => {
    const first = await firstScreen(browser, baseUrl);
    try {
      const problems = await decorProblems(first.page);
      assert(problems.length === 0, problems.join('; '));
    } finally {
      await first.close();
    }
    const stage = await loadedScene(browser, baseUrl, 'Missing Handoff');
    try {
      const problems = await decorProblems(stage.page);
      assert(problems.length === 0, problems.join('; '));
    } finally {
      await stage.close();
    }
  });

  test('no animation loops forever, on the first screen or with a failing step selected', async ({ browser, baseUrl }) => {
    const { page, close } = await firstScreen(browser, baseUrl);
    try {
      const first = await infiniteAnimations(page);
      assert(first.length === 0, `infinite animation on the first screen: ${first.join(', ')}`);
      await page.getByRole('button', { name: 'Missing Handoff', exact: true }).click();
      await page.waitForSelector('.app-main');
      await selectFailingAction(page);
      const stage = await infiniteAnimations(page);
      assert(stage.length === 0, `infinite animation on the stage: ${stage.join(', ')}`);
    } finally {
      await close();
    }
  });

  test('under reduced motion nothing runs and the art is still shown', async ({ browser, baseUrl }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await page.goto(baseUrl, { waitUntil: 'load' });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'load' });
      await page.waitForSelector('#root h1');
      const running = await page.evaluate(() =>
        document.getAnimations().filter((a) => a.playState === 'running').map((a) => a.animationName || a.transitionProperty));
      assert(running.length === 0, `animations still running under reduced motion: ${running.join(', ')}`);
      const moonOpacity = await page.locator('.haunt-moon').evaluate((el) => Number(getComputedStyle(el).opacity));
      assert(moonOpacity > 0.5, `the moon is hidden under reduced motion (opacity ${moonOpacity})`);
      const ghostOpacity = await page.locator('.haunt-ghost').evaluate((el) => Number(getComputedStyle(el).opacity));
      assert(ghostOpacity > 0.5, `the ghost is hidden under reduced motion (opacity ${ghostOpacity})`);
    } finally {
      await context.close();
    }
  });

  test('390 px: no horizontal scroll on the first screen, stage, list, reports and editor', async ({ browser, baseUrl }) => {
    const { page, close } = await firstScreen(browser, baseUrl, MOBILE);
    try {
      const seen = { first: await overflow(page) };
      await page.getByRole('button', { name: 'Missing Handoff', exact: true }).click();
      await page.waitForSelector('.app-main');
      await selectFailingAction(page);
      seen.stage = await overflow(page);
      await page.getByRole('button', { name: 'List', exact: true }).click();
      seen.list = await overflow(page);
      // The list table must fit its own box too, so no column is hidden behind an inner scroll.
      seen.listTableInner = await page.evaluate(() => {
        const t = document.querySelector('.stage-list table');
        const box = t && t.parentElement;
        return t && box ? Math.max(0, t.scrollWidth - box.clientWidth) : 0;
      });
      await page.getByRole('button', { name: 'Reports', exact: true }).click();
      seen.reports = await overflow(page);
      await page.getByRole('button', { name: 'Editor', exact: true }).click();
      await page.waitForSelector('.panel-header');
      seen.editor = await overflow(page);
      const bad = Object.entries(seen).filter(([, px]) => px > 0);
      assert(bad.length === 0, `horizontal overflow at 390 px: ${JSON.stringify(seen)}`);
    } finally {
      await close();
    }
  });

  test('the stage still says everything in words: labels and the dashed ghost', async ({ browser, baseUrl }) => {
    const { page, close } = await loadedScene(browser, baseUrl, 'Missing Handoff');
    try {
      await selectFailingAction(page);
      const text = await page.locator('.stage-zones').innerText();
      assert(/MISMATCH:/.test(text), 'the MISMATCH label is missing from the stage');
      assert(/BEFORE:/.test(text), 'the BEFORE label is missing from the stage');
      const dashed = await page.locator('.prop-glyph.mismatch').first().evaluate((el) => getComputedStyle(el).borderTopStyle);
      assert(dashed === 'dashed', `the ghost outline is ${dashed}, expected dashed`);
      const legend = await page.locator('.stage-legend').innerText();
      assert(/Dashed outline/.test(legend) && /Solid fill/.test(legend), 'the stage legend lost its words');
    } finally {
      await close();
    }
  });
});
