import { test, expect, expectPage, RESIDENT_QUESTIONS } from './fixtures'

test('premier passage : choix du titre, accueil, choix gardé au rechargement', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/titre$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Quel titre préparez-vous ?' })).toBeVisible()
  await expectPage(page, 'Quel titre préparez-vous ?')

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
  await expectPage(page, 'Accueil')

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
  await expect(page.getByRole('button', { name: /Naturalisation/ })).toBeDisabled()
  await resident.click()
  await expect(resident).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Continuer' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: /Carte de résident/ })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('target-title'))).toBe('resident')

  await page.goto('/revision')
  await expect(page.getByText(`Carte de résident · ${RESIDENT_QUESTIONS.length} questions`)).toBeVisible()
  // The title screen reopens on the chosen title
  await page.goto('/titre')
  await expect(page.getByRole('button', { name: /Carte de résident/ })).toHaveAttribute('aria-pressed', 'true')
})
