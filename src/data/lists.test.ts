import { describe, it, expect } from 'vitest'
import allQuestions from './questions.json'
import type { ListedQuestion } from '@/lib/exam'
import { TITLE_KEYS } from '@/lib/target-title'

// Official lists that hold each question (`lists`): keys of TITLE_KEYS.

const questions = allQuestions as ListedQuestion[]
const SITUATIONAL = 'mise-en-situation'

describe('question lists', () => {
  it('every question has a non-empty list of known titles, without duplicates', () => {
    const outliers = questions.filter(
      (q) =>
        !Array.isArray(q.lists) ||
        q.lists.length === 0 ||
        new Set(q.lists).size !== q.lists.length ||
        q.lists.some((t) => !(TITLE_KEYS as readonly string[]).includes(t)),
    )
    expect(outliers.map((q) => q.id)).toEqual([])
  })

  it('every official question (1-191) belongs to the multi-year permit list', () => {
    const outliers = questions.filter((q) => q.notion !== SITUATIONAL && !q.lists.includes('pluriannuelle'))
    expect(outliers.map((q) => q.id)).toEqual([])
  })

  it('situational questions belong to every title (same blueprint, official ones not published)', () => {
    const outliers = questions.filter(
      (q) => q.notion === SITUATIONAL && TITLE_KEYS.some((t) => !q.lists.includes(t)),
    )
    expect(outliers.map((q) => q.id)).toEqual([])
  })

  it('never ranks a situational question in an official list', () => {
    const outliers = questions.filter(
      (q) => q.notion === SITUATIONAL && (q.crNumber !== undefined || q.natNumber !== undefined),
    )
    expect(outliers.map((q) => q.id)).toEqual([])
  })
})
