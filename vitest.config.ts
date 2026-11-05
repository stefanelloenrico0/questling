import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    // Fuso fisso: i test su ora legale e rollover delle 04:00 devono essere deterministici.
    env: { TZ: 'Europe/Rome' },
    coverage: {
      provider: 'v8',
      include: ['core/**/*.ts'],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 },
    },
  },
})
