import { describe, it, expect } from 'vitest'
import allQuestions from '@/data/questions.json'
import { THEME_COLORS, themeColor } from './themes'

interface Question {
  id: number
  theme: string
}

const questions = allQuestions as Question[]

const OFFICIAL_THEMES = [
  'Principes et valeurs de la République',
  'Système institutionnel et politique',
  'Droits et devoirs',
  'Histoire, géographie et culture',
  'Vie en société',
]

describe('question themes', () => {
  it('every question uses one of the 5 official themes', () => {
    const outliers = questions.filter((q) => !OFFICIAL_THEMES.includes(q.theme))
    expect(outliers).toEqual([])
  })

  it('all 5 official themes are used', () => {
    expect(new Set(questions.map((q) => q.theme))).toEqual(new Set(OFFICIAL_THEMES))
  })

  it('keeps 191 official questions and 100 situational ones', () => {
    expect(questions.filter((q) => q.id <= 191)).toHaveLength(191)
    expect(questions.filter((q) => q.id >= 192)).toHaveLength(100)
  })
})

describe('THEME_COLORS', () => {
  it('has exactly one entry per official theme', () => {
    expect(Object.keys(THEME_COLORS).sort()).toEqual([...OFFICIAL_THEMES].sort())
  })

  it('gives every theme found in the data its own color', () => {
    for (const theme of new Set(questions.map((q) => q.theme))) {
      expect(THEME_COLORS[theme], theme).toBeDefined()
      expect(themeColor(theme)).not.toContain('gray')
    }
  })

  it('uses a distinct hue per theme, never green or red', () => {
    const classes = Object.values(THEME_COLORS)
    expect(new Set(classes).size).toBe(classes.length)
    for (const c of classes) expect(c).not.toMatch(/\b(?:dark:)?(?:bg|text)-(?:green|red)-/)
  })

  it('falls back to gray for an unknown theme', () => {
    expect(themeColor('Inconnu')).toContain('gray')
  })
})
