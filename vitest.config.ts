import { defineConfig } from 'vitest/config'
// testTimeout: the fast-check property tests run 300 cases each with a fixed seed. On a loaded
// Windows machine P1 took 3 to 10 s, so Vitest's 5 s default made `npm test` fail intermittently on
// unchanged code (2026-11-23). A longer limit changes no assertion and no run count.
export default defineConfig({ test: { include: ['tests/**/*.test.ts'], environment: 'node', testTimeout: 30000 } })
