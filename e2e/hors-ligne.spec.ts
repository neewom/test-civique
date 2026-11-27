import { test, expect, expectPage, withTitleChosen } from './fixtures'

// Offline mode (service worker): after a first online visit, the app and the questions of the chosen
// title keep working with no network, and the other titles are greyed out on /titre.
test.beforeEach(async ({ page }) => {
  await withTitleChosen(page)
})

test('hors ligne : accueil, révision et titres grisés après une première visite en ligne', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // The worker takes control, and the pack of the chosen title (preloaded by the home page) is cached
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  // (the home page preloads it when the browser is idle, after 4 s at most)
  await expect
    .poll(
      () => page.evaluate(async () => (await (await caches.open('packs')).keys()).some((r) => r.url.includes('/pluriannuelle-'))),
      { timeout: 15_000 },
    )
    .toBe(true)

  await context.setOffline(true)
  await page.goto('/revision')
  await expect(page.getByRole('heading', { level: 1, name: 'Réviser' })).toBeVisible()
  await expectPage(page, 'Révision')
  await expect(page.getByText(/Carte de séjour pluriannuelle · \d+ questions/)).toBeVisible()

  await page.goto('/titre')
  // Chromium under Playwright reports navigator.onLine = true on a page loaded while offline (from the worker's cache): say it again
  await context.setOffline(false)
  await context.setOffline(true)
  await expect(page.getByText('Vous êtes hors ligne', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: /Carte de résident/ })).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByRole('button', { name: /Naturalisation/ })).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByRole('button', { name: /Carte de séjour pluriannuelle/ })).not.toHaveAttribute('aria-disabled')

  // Back online: nothing is greyed out
  await context.setOffline(false)
  await expect(page.getByRole('button', { name: /Carte de résident/ })).not.toHaveAttribute('aria-disabled')
})
