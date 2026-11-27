import { describe, it, expect } from 'vitest'
import { mistakes, OFFICIAL_THEMES, recentThemeProgress, themeScores, weakestThemes, weakestThemesLabel, weakestThemesToShow } from '@/lib/exam-review'
import type { AnswerRecord } from '@/lib/exam-types'
import type { HistoryEntry } from '@/lib/history'

const [PRINCIPES, SYSTEME, DROITS, HISTOIRE, VIE] = OFFICIAL_THEMES

// Question id → theme, for the fixtures below
const THEMES: Record<number, string> = { 1: VIE, 2: PRINCIPES, 3: PRINCIPES, 4: HISTOIRE, 5: HISTOIRE, 6: 'Autre thème' }
const themeOf = (id: number) => THEMES[id]

const a = (questionId: number, correct: boolean, chosen: string | null = 'x'): AnswerRecord => ({ questionId, chosen, correct })

describe('OFFICIAL_THEMES', () => {
  it('liste les 5 thèmes officiels', () => {
    expect(OFFICIAL_THEMES).toHaveLength(5)
    expect(SYSTEME).toBe('Système institutionnel et politique')
    expect(DROITS).toBe('Droits et devoirs')
  })
})

describe('mistakes', () => {
  it('compte les réponses fausses et les questions sans réponse', () => {
    expect(mistakes([a(1, true), a(2, false), a(3, false, null)])).toHaveLength(2)
  })
})

describe('themeScores', () => {
  it('suit l\'ordre officiel, omet les thèmes absents de l\'examen, puis les autres thèmes', () => {
    const scores = themeScores([a(6, true), a(1, true), a(4, false), a(2, true), a(3, false)], themeOf)
    expect(scores).toEqual([
      { theme: PRINCIPES, correct: 1, total: 2 },
      { theme: HISTOIRE, correct: 0, total: 1 },
      { theme: VIE, correct: 1, total: 1 },
      { theme: 'Autre thème', correct: 1, total: 1 },
    ])
  })

  it('ignore une question disparue des données', () => {
    expect(themeScores([a(99, false)], themeOf)).toEqual([])
  })
})

describe('weakestThemes', () => {
  it('donne le thème au plus faible taux de bonnes réponses', () => {
    const scores = themeScores([a(2, true), a(3, false), a(4, false), a(5, false)], themeOf)
    expect(weakestThemes(scores)).toEqual([HISTOIRE])
  })

  it('garde tous les thèmes à égalité', () => {
    const scores = themeScores([a(2, true), a(3, false), a(4, true), a(5, false)], themeOf)
    expect(weakestThemes(scores)).toEqual([PRINCIPES, HISTOIRE])
  })

  it('aucun thème sans erreur', () => {
    expect(weakestThemes(themeScores([a(1, true), a(2, true)], themeOf))).toEqual([])
  })
})

describe('weakestThemesLabel', () => {
  it('nomme un ou deux thèmes, rien au-delà', () => {
    expect(weakestThemesLabel([HISTOIRE])).toBe(`À travailler : ${HISTOIRE}`)
    expect(weakestThemesLabel([PRINCIPES, HISTOIRE])).toBe(`À travailler : ${PRINCIPES} | ${HISTOIRE}`)
    expect(weakestThemesLabel([PRINCIPES, HISTOIRE, VIE])).toBeNull()
    expect(weakestThemesLabel([])).toBeNull()
  })
})

describe('weakestThemesToShow', () => {
  it('garde un ou deux thèmes, rien au-delà', () => {
    expect(weakestThemesToShow([PRINCIPES, HISTOIRE])).toEqual([PRINCIPES, HISTOIRE])
    expect(weakestThemesToShow([PRINCIPES, HISTOIRE, VIE])).toBeNull()
    expect(weakestThemesToShow([])).toBeNull()
  })
})

describe('recentThemeProgress (« Vos thèmes »)', () => {
  const T: Record<number, string> = {}
  // 10 questions per official theme: ids 100+, 200+, ...
  OFFICIAL_THEMES.forEach((theme, i) => {
    for (let n = 0; n < 10; n++) T[(i + 1) * 100 + n] = theme
  })
  const of = (id: number) => T[id]
  // An exam answering `right` of the 10 questions of each given theme (index in OFFICIAL_THEMES)
  const examOn = (rightByTheme: Record<number, number>, extra: Partial<HistoryEntry> = {}): HistoryEntry => ({
    date: '2026-11-20T10:00:00.000Z',
    score: 0,
    total: 40,
    answers: Object.entries(rightByTheme).flatMap(([i, right]) =>
      Array.from({ length: 10 }, (_, n) => a((Number(i) + 1) * 100 + n, n < right)),
    ),
    ...extra,
  })

  it('null sans examen, ou si aucun examen n\'a ses réponses', () => {
    expect(recentThemeProgress([], of)).toBeNull()
    expect(recentThemeProgress([{ date: 'd', score: 30, total: 40 }, { date: 'd', score: 30, total: 40, answers: [] }], of)).toBeNull()
  })

  it('calcule le pourcentage arrondi par thème, du plus faible au plus fort', () => {
    const r = recentThemeProgress([examOn({ 0: 9, 1: 7, 2: 10, 3: 8, 4: 6 })], of)!
    expect(r.examCount).toBe(1)
    expect(r.themes.map((t) => [t.theme, t.percent])).toEqual([
      [VIE, 60],
      [SYSTEME, 70],
      [HISTOIRE, 80],
      [PRINCIPES, 90],
      [DROITS, 100],
    ])
  })

  it('« À travailler » sous 80 % seulement (80 % pile n\'en est pas)', () => {
    const r = recentThemeProgress([examOn({ 0: 8, 1: 7 })], of)!
    expect(r.themes.map((t) => [t.theme, t.toWork])).toEqual([[SYSTEME, true], [PRINCIPES, false]])
  })

  it('cumule les 3 derniers examens lisibles, ignore les examens sans réponses et les plus anciens', () => {
    const old = examOn({ 0: 0 })
    const unreadable: HistoryEntry = { date: 'd', score: 40, total: 40 }
    const r = recentThemeProgress([old, examOn({ 0: 10 }), unreadable, examOn({ 0: 5 }), examOn({ 0: 6 })], of)!
    expect(r.examCount).toBe(3)
    expect(r.themes).toEqual([{ theme: PRINCIPES, percent: 70, toWork: true }])
  })

  it('compte une question sans réponse (chrono expiré) comme fausse', () => {
    const entry: HistoryEntry = {
      date: 'd',
      score: 1,
      total: 40,
      answers: [a(100, true), a(101, false, null), a(102, false, null), a(103, false, null)],
    }
    expect(recentThemeProgress([entry], of)!.themes[0].percent).toBe(25)
  })

  it('ignore les thèmes non officiels et les questions inconnues', () => {
    const entry: HistoryEntry = { date: 'd', score: 0, total: 40, answers: [a(100, true), a(9999, true), a(5, false)] }
    const r = recentThemeProgress([entry], (id) => (id === 5 ? 'Autre thème' : T[id]))!
    expect(r.themes).toEqual([{ theme: PRINCIPES, percent: 100, toWork: false }])
    expect(recentThemeProgress([{ date: 'd', score: 0, total: 40, answers: [a(9999, true)] }], of)).toBeNull()
  })
})
