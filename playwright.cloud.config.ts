import { defineConfig, devices } from '@playwright/test'

// Test con account e sync REALI contro gli emulatori Firebase: `pnpm e2e:cloud`.
export default defineConfig({
  testDir: 'tests/e2e-cloud',
  timeout: 60_000,
  workers: 1, // gli emulatori sono condivisi: i test girano uno alla volta
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4174',
    viewport: { width: 390, height: 844 },
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } }],
  webServer: {
    command: 'node scripts/serve-static.mjs',
    url: 'http://localhost:4174',
    reuseExistingServer: false,
  },
})
