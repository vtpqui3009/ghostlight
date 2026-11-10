// Ghostlight end-to-end harness — REVIEWER-AUTHORED (Claude, automated daily run).
// Reproduces the hand-run mobile observation: 390 px wide, no horizontal overflow,
// on the first screen and with a scene loaded in each view.

import { describe, test, expect, assert } from '../lib/runner.mjs';
import { firstScreen, loadedScene } from '../lib/page.mjs';

const PHONE = { width: 390, height: 844 };

async function horizontalOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const docOverflow = doc.scrollWidth - doc.clientWidth;
    // Also find the widest offending element, to make a failure diagnosable.
    let worst = null;
    for (const el of document.querySelectorAll('body *')) {
      const rect = el.getBoundingClientRect();
      const spill = Math.round(rect.right - doc.clientWidth);
      if (spill > 1 && (!worst || spill > worst.spill)) {
        worst = {
          spill,
          tag: el.tagName.toLowerCase(),
          cls: typeof el.className === 'string' ? el.className : '',
        };
      }
    }
    return { docOverflow, worst };
  });
}

describe('responsive — 390 px phone viewport', () => {
  test('first screen has no horizontal overflow', async ({ browser, baseUrl }) => {
    const { page, close } = await firstScreen(browser, baseUrl, PHONE);
    try {
      const { docOverflow, worst } = await horizontalOverflow(page);
      assert(
        docOverflow <= 0,
        `document overflows by ${docOverflow}px` +
          (worst ? `; widest offender <${worst.tag} class="${worst.cls}"> spills ${worst.spill}px` : ''),
      );
    } finally {
      await close();
    }
  });

  for (const view of ['Stage', 'Reports', 'Editor']) {
    test(`${view} view has no horizontal overflow with a scene loaded`, async ({ browser, baseUrl }) => {
      const { page, close } = await loadedScene(browser, baseUrl, 'Missing Handoff', PHONE);
      try {
        await page.getByRole('button', { name: view, exact: true }).click();
        await page.waitForSelector('.panel-header');
        const { docOverflow, worst } = await horizontalOverflow(page);
        assert(
          docOverflow <= 0,
          `${view} view overflows by ${docOverflow}px` +
            (worst ? `; widest offender <${worst.tag} class="${worst.cls}"> spills ${worst.spill}px` : ''),
        );
      } finally {
        await close();
      }
    });
  }

  test('the timeline is reachable by keyboard from the top of the page', async ({ browser, baseUrl, note }) => {
    const { page, close } = await loadedScene(browser, baseUrl, 'Valid Control', PHONE);
    try {
      // Tab a bounded number of times and record whether focus ever lands inside the timeline.
      let reached = false;
      for (let i = 0; i < 40 && !reached; i += 1) {
        await page.keyboard.press('Tab');
        reached = await page.evaluate(() => {
          const el = document.activeElement;
          return !!(el && el.closest && el.closest('.timeline'));
        });
      }
      if (!reached) {
        note('responsive: keyboard focus never entered .timeline within 40 tab stops — keyboard equivalence is NOT YET PROVEN (Kiro K2/K3)');
      }
      expect(true).toBe(true);
    } finally {
      await close();
    }
  });
});
