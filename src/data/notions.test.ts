import { describe, it, expect } from 'vitest'
import allQuestions from './questions.json'
import { EXAM_BLUEPRINT, EXAM_SIZE, NOTIONS, type Question } from '@/lib/exam'

// Sous-thème officiel (« notion ») de chaque question, arrêté du 10 octobre 2025.

const OFFICIAL_MAX_ID = 191
const SITUATIONAL = 'mise-en-situation'

const questions = allQuestions as Question[]

describe('question notions', () => {
  it('every question has a notion from the closed list', () => {
    const outliers = questions.filter((q) => !(NOTIONS as readonly string[]).includes(q.notion))
    expect(outliers.map((q) => q.id)).toEqual([])
  })

  it('official questions (1-191) are never situational, 192+ always are', () => {
    const wrongOfficial = questions.filter((q) => q.id <= OFFICIAL_MAX_ID && q.notion === SITUATIONAL)
    const wrongSituational = questions.filter((q) => q.id > OFFICIAL_MAX_ID && q.notion !== SITUATIONAL)
    expect(wrongOfficial.map((q) => q.id)).toEqual([])
    expect(wrongSituational.map((q) => q.id)).toEqual([])
  })

  it('each non-situational notion belongs to a single theme, the one of the blueprint', () => {
    const blueprintTheme = new Map(
      EXAM_BLUEPRINT.filter((l) => l.notion !== SITUATIONAL).map((l) => [l.notion, l.theme]),
    )
    const mismatches = questions
      .filter((q) => q.notion !== SITUATIONAL && blueprintTheme.get(q.notion) !== q.theme)
      .map((q) => `${q.id}: ${q.notion} / ${q.theme}`)
    expect(mismatches).toEqual([])
  })

  it('every notion of the list is used by the blueprint', () => {
    expect(new Set(EXAM_BLUEPRINT.map((l) => l.notion))).toEqual(new Set(NOTIONS))
  })
})

describe('EXAM_BLUEPRINT', () => {
  it('adds up to the exam size', () => {
    expect(EXAM_BLUEPRINT.reduce((sum, l) => sum + l.count, 0)).toBe(EXAM_SIZE)
  })

  it('has no duplicate (theme, notion) line', () => {
    const keys = EXAM_BLUEPRINT.map((l) => `${l.theme}|${l.notion}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('uses the theme labels of questions.json', () => {
    const themes = new Set(questions.map((q) => q.theme))
    expect(EXAM_BLUEPRINT.filter((l) => !themes.has(l.theme))).toEqual([])
  })

  it.each(EXAM_BLUEPRINT.map((l) => [l.theme, l.notion, l.count] as const))(
    '%s / %s has at least %i distinct groups',
    (theme, notion, count) => {
      const pool = questions.filter((q) => q.theme === theme && q.notion === notion)
      // A question without group counts as its own group
      const groups = new Set(pool.map((q) => q.group ?? `id-${q.id}`))
      expect(groups.size).toBeGreaterThanOrEqual(count)
    },
  )
})
