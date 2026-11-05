import { defineConfig } from 'vitest/config'

// Test contro gli EMULATORI Firebase (Firestore + Auth): `pnpm test:rules` li avvia e li spegne da solo.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    env: { TZ: 'Europe/Rome' },
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
})
