// Ghostlight end-to-end harness — REVIEWER-AUTHORED (Claude), not Kiro.
// The 1:00–1:45 beat of the demo script: a finding, its cause, a fix, a clean re-run.

import { describe, test, expect, assert } from '../lib/runner.mjs';
import { loadedScene } from '../lib/page.mjs';

const failingAction = (page) => page.locator('.action-item', { hasText: 'source-mismatch' }).first();

describe('guided fix — cause, fix, re-run', () => {
  test('the cause is a control that names the cue in words and jumps to it', async ({ browser, baseUrl }) => {
    const { page, close } = await loadedScene(browser, baseUrl, 'Missing Handoff');
    try {
      await failingAction(page).click();
      await page.waitForSelector('.alert');

      const cause = page.locator('button.link-button').first();
      assert(await cause.isVisible(), 'the cause is not rendered as a control');

      const label = await cause.innerText();
      assert(/Cue “|Cue "/.test(label), `the cause does not name its cue: ${label}`);
      assert(!/^Earlier action a\d/.test(label), `the cause still reads as a raw id: ${label}`);

      await cause.click();
      await page.waitForTimeout(200);

      // The selected step is now the earlier one that put the letter in Actor A's hands:
      // the collect in cue 1, not the carryOff that fails in cue 2.
      const selected = await page.locator('.action-item.selected').innerText();
      assert(/collect/i.test(selected), `expected the earlier collect to be selected, got: ${selected.replace(/\n/g, ' ')}`);
      assert(!/source-mismatch/.test(selected), 'the cause jumped to the failing step rather than its cause');

      assert(pageHasNoError(await page.locator('body').innerText()), 'an unexpected error banner appeared');
    } finally {
      await close();
    }
  });

  test('the suggested fix is described before it is applied, and the re-run is clean', async ({ browser, baseUrl }) => {
    const { page, close } = await loadedScene(browser, baseUrl, 'Missing Handoff');
    try {
      await failingAction(page).click();
      await page.waitForSelector('.alert');

      const body = await page.locator('body').innerText();
      assert(/Suggested fix:/.test(body), 'no fix was offered for a plain missing handoff');
      assert(/Insert a handoff/.test(body), `the fix does not say what it will insert: ${body.slice(0, 300)}`);

      // Before: the timeline shows the mismatch.
      assert((await page.locator('.action-item', { hasText: 'source-mismatch' }).count()) > 0, 'expected a mismatch before the fix');

      await page.getByRole('button', { name: 'Add this step and replay' }).click();
      await page.waitForTimeout(400);

      // After: nothing is left to report, and the inserted step is in the timeline.
      const after = await page.locator('body').innerText();
      assert(!/source-mismatch/.test(after), `the mismatch survived the fix:\n${after.slice(0, 400)}`);
      assert(/transfer/i.test(after), 'the inserted handoff is not visible in the timeline');
    } finally {
      await close();
    }
  });

  test('a consumed instance is refused a fix, and told what to do instead', async ({ browser, baseUrl }) => {
    const { page, close } = await loadedScene(browser, baseUrl, 'Consumed Reuse');
    try {
      await page.locator('.action-item', { hasText: 'consumed-reuse' }).first().click();
      await page.waitForSelector('.alert');
      const body = await page.locator('body').innerText();
      assert(/No single fix:/.test(body), 'a consumed instance must not be offered an automatic fix');
      assert(/replenish/i.test(body), 'the advice does not name the replenish step');
      assert(
        (await page.getByRole('button', { name: 'Add this step and replay' }).count()) === 0,
        'an apply button was offered for a consumed instance',
      );
    } finally {
      await close();
    }
  });
});

function pageHasNoError(text) {
  return !/Import Failed|The edit was refused/.test(text);
}

void expect;
