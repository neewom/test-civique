import { defineConfig } from '@playwright/test'

// Regression suite (TNR) run against a built app: `vite preview` by default,
// a Netlify deploy preview or the production site through TNR_BASE_URL.
const baseURL = process.env.TNR_BASE_URL ?? 'http://localhost:4173'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  // HTML report and traces stay out of the repository (.gitignore)
  outputDir: 'test-results',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    browserName: 'chromium',
    locale: 'fr-FR',
    colorScheme: 'light',
    trace: 'retain-on-failure',
    launchOptions: {
      // Second lock after page.route (e2e/fixtures.ts): GoatCounter cannot even be resolved
      args: ['--host-resolver-rules=MAP goatcounter.com ~NOTFOUND, MAP *.goatcounter.com ~NOTFOUND'],
    },
  },
  projects: [
    { name: 'telephone', use: { viewport: { width: 390, height: 844 } } },
    { name: 'ordinateur', use: { viewport: { width: 1440, height: 900 } } },
  ],
})
