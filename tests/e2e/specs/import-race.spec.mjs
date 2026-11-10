// Ghostlight end-to-end harness — REVIEWER-AUTHORED (Claude), not Kiro.
//
// Reproduces the delayed-import race from docs/handoff/ACTIONFORM_CHECKPOINT.md with a
// controlled FileReader, and asserts it no longer replaces the scene. The fix is in
// src/ui/importGuard.ts, src/App.tsx and src/ui/ImportExport.tsx.

import { describe, test, expect, assert } from '../lib/runner.mjs';

// Replaces window.FileReader with one that reads for real but holds its onload until
// released, so a test can decide exactly when a read completes.
const HOLD_FILE_READS = () => {
  const Real = window.FileReader;
  window.__pendingReads = [];
  window.FileReader = class HeldFileReader {
    constructor() {
      this.onload = null;
      this.result = null;
    }
    readAsText(file) {
      const real = new Real();
      real.onload = (event) => {
        this.result = event.target.result;
        window.__pendingReads.push(() => {
          if (this.onload) this.onload({ target: { result: this.result } });
        });
      };
      real.readAsText(file);
    }
  };
  window.__releaseReads = () => {
    const queued = window.__pendingReads.splice(0);
    queued.forEach((fire) => fire());
    return queued.length;
  };
};

async function openScene(browser, baseUrl) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(HOLD_FILE_READS);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err && err.message ? err.message : String(err)));
  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.waitForSelector('#root h1', { timeout: 15000 });
  await page.getByRole('button', { name: /Valid Control/ }).click();
  await page.waitForSelector('.timeline');
  return { page, pageErrors, close: () => context.close() };
}

// Exports the open scene through the app's own Export button, so the replacement file is
// guaranteed to satisfy the parser, then marks its first cue so a successful import is
// visible in the timeline without navigating away from the editor.
async function exportMarkedScene(page, marker) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export JSON' }).click(),
  ]);
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const scene = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  scene.title = marker;
  scene.cues[0].title = marker;
  return JSON.stringify(scene, null, 2);
}

const asFile = (json) => ({ name: 'replacement.json', mimeType: 'application/json', buffer: Buffer.from(json) });
const timelineText = (page) => page.locator('.timeline').innerText();

async function openEditor(page) {
  await page.getByRole('button', { name: 'Editor', exact: true }).click();
  await page.waitForSelector('.timeline');
}

describe('import race — a read that completes after a draft opens', () => {
  test('a held read is refused once a draft opens, leaving the scene untouched', async ({ browser, baseUrl }) => {
    const { page, pageErrors, close } = await openScene(browser, baseUrl);
    try {
      const replacement = await exportMarkedScene(page, 'RACE REPLACEMENT');
      await openEditor(page);
      const before = await timelineText(page);

      // 1. The read starts while nothing is being edited.
      await page.setInputFiles('input[type="file"]', asFile(replacement));
      await page.waitForFunction(() => window.__pendingReads.length === 1, null, { timeout: 5000 });

      // 2. The user opens an action draft while the file is still being read.
      await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
      await page.waitForTimeout(150);

      // 3. The read completes. Before the fix, this replaced the scene.
      expect(await page.evaluate(() => window.__releaseReads())).toBe(1);
      await page.waitForTimeout(300);

      const after = await timelineText(page);
      assert(
        !after.includes('RACE REPLACEMENT'),
        'the held read replaced the scene even though a draft was open',
      );
      expect(after).toBe(before);

      const body = await page.locator('body').innerText();
      assert(
        /Save or Cancel the current action draft/i.test(body),
        'the refusal was not explained to the user',
      );

      assert(pageErrors.length === 0, `uncaught page errors: ${pageErrors.join(' | ')}`);
    } finally {
      await close();
    }
  });

  test('the same read is accepted once the draft is deliberately resolved', async ({ browser, baseUrl }) => {
    const { page, pageErrors, close } = await openScene(browser, baseUrl);
    try {
      const replacement = await exportMarkedScene(page, 'RESOLVED REPLACEMENT');
      await openEditor(page);

      await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
      await page.waitForTimeout(150);

      await page.setInputFiles('input[type="file"]', asFile(replacement));
      await page.waitForFunction(() => window.__pendingReads.length === 1, null, { timeout: 5000 });

      // The user cancels the draft, which is the deliberate resolution the guard waits for.
      await page.getByRole('button', { name: /^Cancel$/ }).first().click();
      await page.waitForTimeout(150);

      await page.evaluate(() => window.__releaseReads());
      await page.waitForTimeout(300);

      const after = await timelineText(page);
      assert(
        after.includes('RESOLVED REPLACEMENT'),
        `import should succeed after Cancel, but the timeline reads: ${after.replace(/\s+/g, ' ').slice(0, 160)}`,
      );

      assert(pageErrors.length === 0, `uncaught page errors: ${pageErrors.join(' | ')}`);
    } finally {
      await close();
    }
  });
});
