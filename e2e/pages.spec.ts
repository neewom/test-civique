import { test, expect, expectPage, withTitleChosen } from './fixtures'

test.beforeEach(async ({ page }) => {
  await withTitleChosen(page)
})

test('page « Comment se passe l\'examen »', async ({ page }) => {
  await page.goto('/regles')
  await expect(page.getByRole('heading', { level: 1, name: "Comment se passe l'examen" })).toBeVisible()
  await expect(page.getByRole('link', { name: "M'entraîner maintenant" })).toBeVisible()
  await expectPage(page, "Comment se passe l'examen")
})

test('« En savoir plus » de l\'accueil mène à la section « Vos données »', async ({ page }) => {
  await page.goto('/')
  await expectPage(page, 'Accueil')
  const official = page.getByRole('link', { name: 'formation-civique.interieur.gouv.fr' })
  await expect(official).toHaveAttribute('href', 'https://formation-civique.interieur.gouv.fr')

  await page.getByRole('link', { name: 'En savoir plus' }).click()
  await expect(page).toHaveURL(/\/mentions-legales#vos-donnees$/)
  await expect(page.getByRole('heading', { level: 2, name: 'Vos données' })).toBeInViewport()
  await expectPage(page, 'Mentions légales et confidentialité')
})

test('adresse directe /mentions-legales#vos-donnees', async ({ page }) => {
  await page.goto('/mentions-legales#vos-donnees')
  await expect(page.getByRole('heading', { level: 1, name: 'Mentions légales et confidentialité' })).toBeAttached()
  await expect(page.getByRole('heading', { level: 2, name: 'Vos données' })).toBeInViewport()
  await expectPage(page, 'Mentions légales et confidentialité')
})

test('le thème sombre reste après un rechargement', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/)
  await page.getByRole('switch', { name: 'Passer en mode sombre' }).click()
  await expect(html).toHaveClass(/(^|\s)dark(\s|$)/)

  await page.reload()
  await expect(html).toHaveClass(/(^|\s)dark(\s|$)/)
  await expect(page.getByRole('switch', { name: 'Passer en mode clair' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark')
  await expectPage(page, 'Accueil')
})

test('une adresse inconnue renvoie à l\'accueil', async ({ page }) => {
  await page.goto('/nimporte-quoi')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Votre chemin vers le jour J' })).toBeVisible()
  await expectPage(page, 'Accueil')
})
