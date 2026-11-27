import { test, expect, expectPage, withTitleChosen } from './fixtures'

test.beforeEach(async ({ page }) => {
  await withTitleChosen(page)
})

test('page « Comment se passe l\'examen »', async ({ page }) => {
  await page.goto('/regles')
  await expect(page.getByRole('heading', { level: 1, name: "Comment se passe l'examen" })).toBeVisible()
  await expect(page.getByRole('link', { name: "M'entraîner maintenant" })).toBeVisible()
  await expectPage(page, "L'examen civique 2026 : format et préparation · Futur Citoyen")
})

test('page « Trouver un centre d\'examen », liens externes non suivis', async ({ page }) => {
  await page.goto('/centres')
  await expect(page.getByRole('heading', { level: 1, name: "Trouver un centre d'examen" })).toBeVisible()
  await expect(page.getByRole('link', { name: /Voir la carte des centres/ })).toHaveAttribute('target', '_blank')
  await expectPage(page, "Où passer l'examen civique · Futur Citoyen")
  await page.getByRole('link', { name: /Mon parcours/ }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('« En savoir plus » de l\'accueil mène à la section « Vos données »', async ({ page }) => {
  await page.goto('/')
  await expectPage(page, 'Examen civique : entraînement gratuit · Futur Citoyen')
  const official = page.getByRole('link', { name: 'formation-civique.interieur.gouv.fr' })
  await expect(official).toHaveAttribute('href', 'https://formation-civique.interieur.gouv.fr')

  await page.getByRole('link', { name: 'En savoir plus' }).click()
  await expect(page).toHaveURL(/\/mentions-legales#vos-donnees$/)
  await expect(page.getByRole('heading', { level: 2, name: 'Vos données' })).toBeInViewport()
  await expectPage(page, 'Mentions légales et confidentialité · Futur Citoyen')
})

test('adresse directe /mentions-legales#vos-donnees', async ({ page }) => {
  await page.goto('/mentions-legales#vos-donnees')
  await expect(page.getByRole('heading', { level: 1, name: 'Mentions légales et confidentialité' })).toBeAttached()
  await expect(page.getByRole('heading', { level: 2, name: 'Vos données' })).toBeInViewport()
  await expectPage(page, 'Mentions légales et confidentialité · Futur Citoyen')
})

test('le thème sombre reste après un rechargement', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/)
  // The theme is set in the « Affichage » panel of the header
  await page.getByRole('button', { name: 'Affichage' }).click()
  await page.getByRole('button', { name: 'Sombre', exact: true }).click()
  await expect(html).toHaveClass(/(^|\s)dark(\s|$)/)

  await page.reload()
  await expect(html).toHaveClass(/(^|\s)dark(\s|$)/)
  await page.getByRole('button', { name: 'Affichage' }).click()
  await expect(page.getByRole('button', { name: 'Sombre', exact: true })).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark')
  await expectPage(page, 'Examen civique : entraînement gratuit · Futur Citoyen')
})

// vite preview (the default local target) answers every address with the app: only Netlify has the real 404
const isLocal = /^(localhost|127\.0\.0\.1)$/.test(new URL(process.env.TNR_BASE_URL ?? 'http://localhost:4173').hostname)

test('une adresse inconnue : vraie page 404, noindex, lien vers l\'accueil', async ({ page, guard }) => {
  test.skip(isLocal, 'only Netlify answers with the code 404')
  guard.allowedErrors.push('/nimporte-quoi')
  const response = await page.goto('/nimporte-quoi')
  expect(response?.status()).toBe(404)
  await expect(page).toHaveTitle('Page introuvable · Futur Citoyen')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
  await expect(page.getByRole('heading', { level: 1, name: 'Page introuvable' })).toBeVisible()
  await page.getByRole('link', { name: "Retour à l'accueil" }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('une adresse inconnue renvoie à l\'accueil quand l\'appli est déjà installée (service worker)', async ({ page, guard }) => {
  guard.allowedErrors.push('/nimporte-quoi')
  await page.goto('/')
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await page.goto('/nimporte-quoi')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Votre chemin vers le jour J' })).toBeVisible()
  await expectPage(page, 'Examen civique : entraînement gratuit · Futur Citoyen')
})

test('fichier introuvable de /assets/ : 404, jamais l\'appli', async ({ page }) => {
  test.skip(isLocal, 'only Netlify answers with the code 404')
  expect((await page.request.get('/assets/inexistant.js')).status()).toBe(404)
})

test('robots.txt et sitemap.xml', async ({ page }) => {
  const robots = await page.request.get('/robots.txt')
  expect(robots.status()).toBe(200)
  expect(robots.headers()['content-type']).toContain('text/plain')
  expect(await robots.text()).toContain('Sitemap: https://futurcitoyen.fr/sitemap.xml')
  if (isLocal) return // vite preview serves index.html for an address it has no file for: only the files of dist/ are real
  const sitemap = await page.request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  expect(sitemap.headers()['content-type']).toMatch(/xml/)
  const body = await sitemap.text()
  expect(body).toContain('<loc>https://futurcitoyen.fr/revision</loc>')
  expect(body).not.toContain('/examen<')
})

test('chaque page publique annonce son titre, sa description et son canonical dans le HTML brut', async ({ page }) => {
  // vite preview serves the home page for these addresses: only Netlify has one file per address
  test.skip(isLocal, 'only Netlify has one HTML file per address')
  for (const [path, title, canonical] of [
    ['/revision', "Questions de l'examen civique à réviser · Futur Citoyen", 'https://futurcitoyen.fr/revision'],
    ['/titres/carte-de-resident', 'Carte de résident et examen civique · Futur Citoyen', 'https://futurcitoyen.fr/titres/carte-de-resident'],
    ['/centres', "Où passer l'examen civique · Futur Citoyen", 'https://futurcitoyen.fr/centres'],
  ]) {
    const html = await (await page.request.get(path)).text()
    expect(html, path).toContain(`<title>${title}</title>`)
    expect(html, path).toContain(`<link rel="canonical" href="${canonical}" />`)
    expect(html, path).toMatch(/<meta name="description" content="[^"]{40,}" \/>/)
  }
})
