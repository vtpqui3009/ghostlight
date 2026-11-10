// Ghostlight end-to-end harness — REVIEWER-AUTHORED (Claude, automated daily run).
// Page helpers: a fresh context per test, with console and uncaught errors captured so a
// test can assert the app booted cleanly rather than merely rendering something.

const DEFAULT_VIEWPORT = { width: 1280, height: 800 };

// `colorScheme` is a late addition. The first version of this harness scanned the light
// scheme only, and that blind spot hid 14 real dark-scheme contrast failures for a day —
// see the 2026-11-10 entry in ops/RUN_LOG.md. Every a11y scan now names its scheme.
export async function newPage(browser, baseUrl, viewport = DEFAULT_VIEWPORT, colorScheme = 'light') {
  const context = await browser.newContext({ viewport, colorScheme });
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err && err.message ? err.message : String(err)));

  const response = await page.goto(baseUrl, { waitUntil: 'load' });
  if (!response || !response.ok()) {
    throw new Error(`failed to load ${baseUrl}: ${response ? response.status() : 'no response'}`);
  }
  // React mounts into #root; wait for actual content rather than a bare div.
  await page.waitForSelector('#root h1', { timeout: 15000 });

  return {
    page,
    consoleErrors,
    pageErrors,
    async close() {
      await context.close();
    },
  };
}

// The empty state, with localStorage cleared, which is what a judge opens first.
export async function firstScreen(browser, baseUrl, viewport = DEFAULT_VIEWPORT, colorScheme = 'light') {
  const handle = await newPage(browser, baseUrl, viewport, colorScheme);
  await handle.page.evaluate(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* storage may be denied; the app has its own error state for that */
    }
  });
  await handle.page.reload({ waitUntil: 'load' });
  await handle.page.waitForSelector('#root h1');
  return handle;
}

// A loaded demo scene, by its button label on the empty state.
export async function loadedScene(browser, baseUrl, demoLabel, viewport = DEFAULT_VIEWPORT, colorScheme = 'light') {
  const handle = await firstScreen(browser, baseUrl, viewport, colorScheme);
  await handle.page.getByRole('button', { name: demoLabel, exact: true }).click();
  await handle.page.waitForSelector('.app-main');
  return handle;
}

// Select the first rejected action in the timeline, which is the state a judge lands in
// when they follow the demo: a failing step highlighted, its cause and fix on screen.
//
// This matters for the accessibility scans specifically. `.action-item.selected` paints a
// mint fill, and nothing is painted mint until a row is selected, so a scan that never
// clicks a row cannot see the contrast of text on that fill. Returns the selected row's
// locator, or null if the scene has no rejected action.
export async function selectFailingAction(page) {
  const rows = await page.locator('.action-item').all();
  for (const row of rows) {
    const status = row.locator('.action-status').first();
    const cls = await status.getAttribute('class').catch(() => null);
    if (cls && /\brejected\b/.test(cls)) {
      await row.click();
      await page.locator('.action-item.selected').first().waitFor({ state: 'visible' });
      return row;
    }
  }
  return null;
}
