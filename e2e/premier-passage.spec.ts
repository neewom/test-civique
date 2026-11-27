import { test, expect, expectPage, RESIDENT_QUESTIONS, NATURALISATION_QUESTIONS, EXAM_SIZE, SITUATION_COUNT } from './fixtures'

test('premier passage : choix du titre, accueil, choix gardé au rechargement', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/titre$/)
  await expect(page.getByRole('heading', { level: 1, name: "Préparez l'examen civique" })).toBeVisible()
  await expect(page.getByText('Site indépendant, non officiel')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Retour' })).toHaveCount(0)
  await expectPage(page, "Préparez l'examen civique")

  // Nothing is preselected: « Continuer » is visible and, without a choice, says so
  await expect(page.getByRole('button', { name: 'Continuer' })).toBeInViewport()
  await expect(page.locator('[aria-pressed="true"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Continuer' }).click()
  await expect(page.getByRole('alert')).toHaveText("Choisissez d'abord le titre que vous préparez.")
  await expect(page).toHaveURL(/\/titre$/)

  await page.getByRole('button', { name: /Carte de séjour pluriannuelle/ }).click()
  await page.getByRole('button', { name: 'Continuer' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Votre chemin vers le jour J' })).toBeVisible()
  const journey = page.getByRole('navigation', { name: 'Votre parcours' })
  await expect(journey.getByRole('listitem')).toHaveCount(4)
  await expect(journey.getByRole('link', { name: /1 · Réviser les thèmes/ })).toBeVisible()
  await expect(journey.getByRole('button', { name: /2 · Réussir 3 examens blancs/ })).toBeVisible()
  await expect(journey.getByText(/3 · Trouver un centre d'examen/)).toBeVisible()
  await expect(journey.getByText('4 · Le jour J')).toBeVisible()
  await expectPage(page, 'Examen civique : entraînement gratuit · Futur Citoyen')

  await page.reload()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Votre chemin vers le jour J' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Carte de séjour pluriannuelle/ })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('target-title'))).toBe('pluriannuelle')
})

test('premier passage : choix de la carte de résident, accueil et révision sur ce titre', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/titre$/)
  const resident = page.getByRole('button', { name: /Carte de résident/ })
  await expect(resident).toBeEnabled()
  await expect(page.getByRole('button', { name: /Naturalisation/ })).toBeEnabled()
  await expect(page.getByText(/bientôt/i)).toHaveCount(0)
  await resident.click()
  await expect(resident).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Continuer' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: /Carte de résident/ })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('target-title'))).toBe('resident')

  await page.goto('/revision')
  await expect(page.getByText(
      `Carte de résident · ${RESIDENT_QUESTIONS.length - SITUATION_COUNT} questions + ${SITUATION_COUNT} mises en situation`,
    )).toBeVisible()
  // The title screen reopens on the chosen title
  await page.goto('/titre')
  await expect(page.getByRole('button', { name: /Carte de résident/ })).toHaveAttribute('aria-pressed', 'true')
})

test('premier passage : choix de la naturalisation, accueil, révision et examen sur ce titre', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/titre$/)
  const nat = page.getByRole('button', { name: /Naturalisation/ })
  await expect(nat).toBeEnabled()
  await expect(nat).toContainText('258 questions officielles')
  await nat.click()
  await expect(nat).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Continuer' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: /Naturalisation/ })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('target-title'))).toBe('naturalisation')

  await page.goto('/revision')
  await expect(page.getByText(
      `Naturalisation · ${NATURALISATION_QUESTIONS.length - SITUATION_COUNT} questions + ${SITUATION_COUNT} mises en situation`,
    )).toBeVisible()
  // The title screen reopens on the chosen title
  await page.goto('/titre')
  await expect(page.getByRole('button', { name: /Naturalisation/ })).toHaveAttribute('aria-pressed', 'true')

  // A naturalisation exam keeps its own progress: the two other titles' keys stay empty
  if (testInfo.project.name !== 'telephone') return
  await page.goto('/examen-blanc')
  await page.getByRole('link', { name: "Commencer l'examen blanc" }).click()
  await expect(page).toHaveURL(/\/examen$/)
  await expect(page.getByText(`Question 1 sur ${EXAM_SIZE}`, { exact: true })).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => [
        localStorage.getItem('exam-in-progress-naturalisation') !== null,
        localStorage.getItem('exam-in-progress'),
        localStorage.getItem('exam-in-progress-resident'),
      ]),
    )
    .toEqual([true, null, null])
  await page.reload()
  await expect(page.getByText(`Question 1 sur ${EXAM_SIZE}`, { exact: true })).toBeVisible()
})

test('premier passage : « En savoir plus » sur la naturalisation, puis « M\'entraîner pour ce titre »', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /En savoir plus sur : Naturalisation/ }).click()
  await expect(page).toHaveURL(/\/titres\/naturalisation$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Naturalisation' })).toBeVisible()
  await expectPage(page, 'Naturalisation et examen civique · Futur Citoyen')
  await expect(page.getByText(/Entraînement bientôt disponible/)).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('target-title'))).toBeNull()
  await page.getByRole('button', { name: "M'entraîner pour ce titre" }).click()
  await expect(page).toHaveURL(/\/$/)
  expect(await page.evaluate(() => localStorage.getItem('target-title'))).toBe('naturalisation')
  await page.getByRole('link', { name: /Tout savoir sur ce titre/ }).click()
  await expect(page).toHaveURL(/\/titres\/naturalisation$/)
  await expect(page.getByRole('button', { name: 'Continuer mon entraînement' })).toBeVisible()
})

test('premier passage : « En savoir plus » sur la carte de résident, puis « M\'entraîner pour ce titre »', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/titre$/)
  await page.getByRole('link', { name: /En savoir plus sur : Carte de résident/ }).click()

  await expect(page).toHaveURL(/\/titres\/carte-de-resident$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Carte de résident' })).toBeVisible()
  await expectPage(page, 'Carte de résident et examen civique · Futur Citoyen')
  // Opening a sheet chooses nothing
  expect(await page.evaluate(() => localStorage.getItem('target-title'))).toBeNull()

  await page.getByRole('button', { name: "M'entraîner pour ce titre" }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Votre chemin vers le jour J' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Carte de résident/ }).first()).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('target-title'))).toBe('resident')

  // The home page links back to the sheet of the chosen title, whose button now continues
  await page.getByRole('link', { name: /Tout savoir sur ce titre/ }).click()
  await expect(page).toHaveURL(/\/titres\/carte-de-resident$/)
  await expect(page.getByRole('button', { name: 'Continuer mon entraînement' })).toBeVisible()
})

test('fiche : adresse inconnue renvoie vers l\'accueil (appli déjà installée, service worker)', async ({ page, guard }) => {
  // Without the worker Netlify answers a real 404 page (e2e/pages.spec.ts); the app itself still sends an unknown fiche home
  guard.allowedErrors.push('/titres/inconnu')
  await page.goto('/')
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await page.goto('/titres/inconnu')
  await expect(page).toHaveURL(/\/titre$/)
})
