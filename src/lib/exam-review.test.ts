import { describe, it, expect } from 'vitest'
import { mistakes, OFFICIAL_THEMES, themeScores, weakestThemes, weakestThemesLabel, weakestThemesToShow } from '@/lib/exam-review'
import type { AnswerRecord } from '@/lib/exam-types'

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
