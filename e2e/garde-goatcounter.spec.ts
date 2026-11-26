import { test, expect } from './fixtures'

// Self-test of the lock of e2e/fixtures.ts, on a blank page (no app, no CSP): a request
// to GoatCounter must be stopped by the route. The address is a page of goatcounter.com,
// not a site counter: even a failing lock would count nothing.
test('garde : les requêtes vers GoatCounter sont bloquées', async ({ page, guard }) => {
  await page.goto('about:blank')
  const failed = await page.evaluate(async () => {
    try {
      await fetch('https://goatcounter.com/tnr-guard', { mode: 'no-cors', credentials: 'omit' })
      return false
    } catch {
      return true
    }
  })
  expect(failed).toBe(true)
  await page.evaluate(() => navigator.sendBeacon('https://goatcounter.com/tnr-guard-beacon'))
  await expect.poll(() => guard.blocked.length).toBe(2)
})
