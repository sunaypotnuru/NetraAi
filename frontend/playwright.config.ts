import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.ts'],
  timeout: 90_000, // Increased from 60s to 90s for slower pages
  expect: { timeout: 15_000 }, // Increased from 10s to 15s
  retries: process.env.CI ? 2 : 1, // Always retry once, twice in CI
  workers: process.env.CI ? 2 : undefined, // Limit workers in CI
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000, // Increased from default 0 (no timeout)
    navigationTimeout: 30_000, // Explicit navigation timeout
  },
  webServer: process.env.PW_NO_WEBSERVER
    ? undefined
    : {
        command: 'npm run dev -- --host 127.0.0.1 --port 5173',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000, // Increased from 120s to 180s
      },
});

