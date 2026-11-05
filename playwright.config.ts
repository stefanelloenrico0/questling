import { defineConfig, devices } from '@playwright/test'

// I test girano sulla build statica REALE (.output/public): `pnpm e2e` la rigenera prima.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 390, height: 844 },
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } }],
  webServer: {
    command: 'node scripts/serve-static.mjs',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
})
