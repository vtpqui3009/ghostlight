// Ghostlight end-to-end harness — REVIEWER-AUTHORED (Claude, automated daily run).
// Page helpers: a fresh context per test, with console and uncaught errors captured so a
// test can assert the app booted cleanly rather than merely rendering something.

const DEFAULT_VIEWPORT = { width: 1280, height: 800 };

export async function newPage(browser, baseUrl, viewport = DEFAULT_VIEWPORT) {
  const context = await browser.newContext({ viewport });
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
export async function firstScreen(browser, baseUrl, viewport = DEFAULT_VIEWPORT) {
  const handle = await newPage(browser, baseUrl, viewport);
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
export async function loadedScene(browser, baseUrl, demoLabel, viewport = DEFAULT_VIEWPORT) {
  const handle = await firstScreen(browser, baseUrl, viewport);
  await handle.page.getByRole('button', { name: demoLabel, exact: true }).click();
  await handle.page.waitForSelector('main.app-main');
  return handle;
}
