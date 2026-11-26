import { test, expect, expectPage, withTitleChosen, QUESTIONS, EXAM_SIZE, PASS_THRESHOLD, type Question } from './fixtures'

// One wrong answer out of five: 32/40, exactly the pass mark, whatever questions are drawn
const isAnsweredWrong = (index: number) => index % 5 === 4
const EXPECTED_SCORE = EXAM_SIZE - EXAM_SIZE / 5
const RELOAD_AT = 5

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

test('examen blanc complet, reprise après rechargement, résultat et détail', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'telephone', 'Parcours long : sur le téléphone seulement')
  test.setTimeout(120_000)
  await withTitleChosen(page)

  await page.goto('/')
  await page.getByRole('button', { name: /2 · Réussir 3 examens blancs/ }).click()
  // Page before the exam, then the exam itself
  await expect(page).toHaveURL(/\/examen-blanc$/)
  await expectPage(page, 'Examen blanc')
  await expect(page.getByRole('heading', { level: 1, name: 'Examen blanc' })).toBeVisible()
  const dayJ = page.getByRole('region', { name: 'Comme le jour J' })
  await expect(dayJ).toContainText(`${PASS_THRESHOLD}/${EXAM_SIZE}`)
  await expect(page.getByRole('link', { name: "Tout savoir sur l'examen" })).toBeVisible()
  await page.getByRole('link', { name: "Commencer l'examen blanc" }).click()
  await expect(page).toHaveURL(/\/examen$/)
  await expectPage(page, 'Examen blanc')

  const timer = page.getByRole('progressbar', { name: 'Temps restant' })
  const timeLeft = async () => Number(await timer.getAttribute('aria-valuenow'))

  for (let i = 0; i < EXAM_SIZE; i++) {
    await expect(page.getByText(`Question ${i + 1} sur ${EXAM_SIZE}`, { exact: true })).toBeVisible()

    if (i + 1 === RELOAD_AT) {
      const before = await timeLeft()
      await page.reload()
      await expect(page.getByText(`Question ${RELOAD_AT} sur ${EXAM_SIZE}`, { exact: true })).toBeVisible()
      // The timer goes on from where it was: neither reset nor stopped
      const after = await timeLeft()
      expect(after).toBeLessThanOrEqual(before)
      expect(after).toBeGreaterThan(before - 30)
      await expect.poll(timeLeft, { timeout: 5_000 }).toBeLessThan(after)
    }

    const text = (await page.getByRole('heading', { level: 1 }).textContent())?.trim() ?? ''
    const choices = await page.getByRole('radio').evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value),
    )
    expect(choices).toHaveLength(4)
    const question = QUESTIONS.find(
      (q) => q.question === text && choices.some((c) => q.answers.includes(c)),
    ) as Question
    expect(question, `question absente des données : ${text}`).toBeTruthy()
    const right = choices.find((c) => question.answers.includes(c)) as string
    const chosen = isAnsweredWrong(i) ? (choices.find((c) => !question.answers.includes(c)) as string) : right

    // The radio is visually hidden inside its card: a click on the card's text checks it
    await page.getByRole('radiogroup').getByText(chosen, { exact: true }).click()
    await expect(page.getByRole('radio', { name: chosen, exact: true })).toBeChecked()
    await page.getByRole('button', { name: 'Valider ma réponse' }).click()

    // Correction: verdict, right answer marked, explanation, source when the question has one
    await expect(page.getByText(isAnsweredWrong(i) ? 'Pas tout à fait' : 'Bien joué', { exact: true })).toBeVisible()
    const marked = page.getByRole('radio', { name: /^Bonne réponse/ })
    await expect(marked).toHaveCount(1)
    await expect(marked).toHaveAccessibleName(new RegExp(`${escapeRegExp(right)}$`))
    const why = page.getByRole('region', { name: 'Pourquoi' })
    await expect(why.getByRole('paragraph').first()).not.toBeEmpty()
    const source = why.getByRole('link', { name: /^Source : / })
    if (question.source) {
      await expect(source).toHaveAttribute('href', question.source.url)
    } else {
      await expect(source).toHaveCount(0)
    }

    const last = i === EXAM_SIZE - 1
    await page.getByRole('button', { name: last ? 'Voir les résultats' : 'Question suivante' }).click()
  }

  // Result screen
  await expect(page.getByRole('heading', { level: 1, name: 'Examen blanc terminé' })).toBeVisible()
  await expectPage(page, 'Résultat')
  await expect(page.getByLabel(`Score : ${EXPECTED_SCORE} sur ${EXAM_SIZE}`)).toBeVisible()
  const passed = EXPECTED_SCORE >= PASS_THRESHOLD
  await expect(
    page.getByText(`${passed ? 'Réussi' : 'Pas encore réussi'} · seuil ${PASS_THRESHOLD}/${EXAM_SIZE}`, { exact: true }),
  ).toBeVisible()

  // Back home: the exam is listed and the counter follows
  await page.getByRole('link', { name: 'Retour à mon parcours' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expectPage(page, 'Accueil')
  const recent = page.getByRole('region', { name: 'Derniers examens' })
  await expect(recent.getByRole('listitem')).toHaveCount(1)
  await expect(recent.getByRole('link')).toContainText(`${EXPECTED_SCORE}/${EXAM_SIZE}`)
  await expect(recent.getByRole('link')).toContainText(passed ? /Réussi/ : /Pas encore réussi/)
  await expect(page.getByRole('button', { name: /2 · Réussir 3 examens blancs/ })).toContainText(
    `${passed ? 1 : 0} sur 3`,
  )

  // Detail of the exam
  await recent.getByRole('link').click()
  await expect(page).toHaveURL(/\/examen\/[^/]+$/)
  await expectPage(page, "Détail de l'examen")
  await expect(page.getByRole('heading', { level: 1, name: `Score : ${EXPECTED_SCORE} sur ${EXAM_SIZE}` })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Par thème' })).toBeVisible()
  const wrong = EXAM_SIZE - EXPECTED_SCORE
  await expect(page.getByRole('region', { name: 'Mes erreurs' }).getByRole('heading', { level: 3 })).toHaveCount(wrong)
  await page.getByRole('button', { name: `Toutes (${EXAM_SIZE})` }).click()
  await expect(
    page.getByRole('region', { name: 'Toutes les questions' }).getByRole('heading', { level: 3 }),
  ).toHaveCount(EXAM_SIZE)
})
