// Ghostlight end-to-end harness — REVIEWER-AUTHORED (Claude, automated daily run).
// This file is NOT Kiro-authored application source. See tests/e2e/README.md and QA_RESULTS.md.
//
// A deliberately small test registry. The harness uses the `playwright` library directly
// rather than `@playwright/test`, because the cloud container ships a preinstalled Playwright
// and browser; installing a second copy would not find that browser. See tests/e2e/README.md.

const suites = [];
let current = null;

export function describe(name, fn) {
  current = { name, tests: [] };
  suites.push(current);
  fn();
  current = null;
}

export function test(name, fn) {
  if (!current) throw new Error(`test("${name}") must be called inside describe()`);
  current.tests.push({ name, fn });
}

class AssertionError extends Error {}

export function expect(actual) {
  const show = (v) => (typeof v === 'string' ? JSON.stringify(v) : String(v));
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new AssertionError(`expected ${show(expected)} but received ${show(actual)}`);
      }
    },
    toEqual(expected) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) throw new AssertionError(`expected ${b} but received ${a}`);
    },
    toBeTruthy() {
      if (!actual) throw new AssertionError(`expected a truthy value but received ${show(actual)}`);
    },
    toContain(needle) {
      if (actual === null || actual === undefined || !String(actual).includes(needle)) {
        throw new AssertionError(`expected ${show(actual)} to contain ${show(needle)}`);
      }
    },
    toBeGreaterThan(n) {
      if (!(actual > n)) throw new AssertionError(`expected ${show(actual)} to be greater than ${n}`);
    },
    toBeLessThanOrEqual(n) {
      if (!(actual <= n)) throw new AssertionError(`expected ${show(actual)} to be <= ${n}`);
    },
  };
}

export function assert(condition, message) {
  if (!condition) throw new AssertionError(message);
}

// Runs every registered suite. Returns { passed, failed, failures, passedTests, notes }.
export async function runAll(context) {
  let passed = 0;
  const failures = [];
  const passedTests = [];
  const notes = [];
  const note = (text) => notes.push(text);

  for (const suite of suites) {
    console.log(`\n  ${suite.name}`);
    for (const t of suite.tests) {
      const started = Date.now();
      try {
        await t.fn({ ...context, note });
        passed += 1;
        passedTests.push({ suite: suite.name, test: t.name });
        console.log(`    PASS  ${t.name}  (${Date.now() - started}ms)`);
      } catch (err) {
        failures.push({ suite: suite.name, test: t.name, error: err });
        console.log(`    FAIL  ${t.name}  (${Date.now() - started}ms)`);
        console.log(`          ${err && err.message ? err.message.split('\n').join('\n          ') : err}`);
      }
    }
  }
  return { passed, failed: failures.length, failures, passedTests, notes };
}
