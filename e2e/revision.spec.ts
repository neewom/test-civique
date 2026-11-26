import { test, expect, expectPage, withTitleChosen, QUESTIONS, SITUATION_COUNT, THEMES } from './fixtures'

test.beforeEach(async ({ page }) => {
  await withTitleChosen(page)
})

test('révision : nombre de questions et case « Sans les mises en situation »', async ({ page }) => {
  await page.goto('/revision')
  await expect(page.getByRole('heading', { level: 1, name: 'Réviser' })).toBeVisible()
  await expectPage(page, 'Révision')
  await expect(page.getByText(`Carte de séjour pluriannuelle · ${QUESTIONS.length} questions`)).toBeVisible()

  await page.getByRole('checkbox', { name: 'Sans les mises en situation' }).check()
  await expect(
    page.getByText(`Carte de séjour pluriannuelle · ${QUESTIONS.length - SITUATION_COUNT} questions`),
  ).toBeVisible()
})

test('révision : filtre par thème et sources', async ({ page }) => {
  await page.goto('/revision')
  const filters = page.getByRole('group', { name: 'Questions à afficher' })
  for (const theme of THEMES) {
    await filters.getByRole('button', { name: theme, exact: true }).click()
    await expect(filters.getByRole('button', { name: theme, exact: true })).toHaveAttribute('aria-pressed', 'true')

    // Only the section of this theme, with every question of the theme
    const sections = page.getByRole('region', { name: /^Thème : / })
    await expect(sections).toHaveCount(1)
    const section = page.getByRole('region', { name: `Thème : ${theme}`, exact: true })
    const expected = QUESTIONS.filter((q) => q.theme === theme)
    await expect(section.getByRole('listitem')).toHaveCount(expected.length)
    const shown = await section.getByRole('heading', { level: 3 }).allTextContents()
    expect(shown.sort()).toEqual(expected.map((q) => q.question).sort())

    // At least one source per theme, never followed: only its address is checked
    const sources = section.getByRole('link', { name: /^Source : / })
    expect(await sources.count()).toBeGreaterThan(0)
    for (const href of await sources.evaluateAll((links) => links.map((a) => a.getAttribute('href')))) {
      expect(href).toMatch(/^https:\/\//)
    }
  }
  await expectPage(page, 'Révision')
})
