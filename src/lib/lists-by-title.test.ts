import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import allQuestions from '@/data/questions.json'
import {
  buildExam,
  EXAM_BLUEPRINT,
  EXAM_SIZE,
  questionsForTitle,
  saveResult,
  type ListedQuestion,
} from './exam'
import { EXAM_PROGRESS_KEY, loadProgress, loadProgressForTitle, type ExamInProgress } from './exam-types'
import { HISTORY_KEY, findExamRecord, loadHistory, loadHistoryForTitle } from './history'
import { passedInARow } from './readiness'
import { loadQuestionsToReview } from './review-queue'
import { TARGET_TITLES, TITLE_KEYS, titleOf } from './target-title'

function makeLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
}
const localStorageMock = makeLocalStorageMock()

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageMock)
  localStorageMock.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const listed = allQuestions as ListedQuestion[]

describe('title keys', () => {
  it('knows the three titles, only the multi-year permit can be chosen for now', () => {
    expect(TITLE_KEYS).toEqual(['pluriannuelle', 'resident', 'naturalisation'])
    expect(TARGET_TITLES).toEqual(['pluriannuelle'])
  })

  it('titleOf: a missing, unknown or malformed title counts for the multi-year permit', () => {
    expect(titleOf({})).toBe('pluriannuelle')
    expect(titleOf({ title: 'inconnu' })).toBe('pluriannuelle')
    expect(titleOf({ title: 3 })).toBe('pluriannuelle')
    expect(titleOf({ title: 'resident' })).toBe('resident')
    expect(titleOf({ title: 'naturalisation' })).toBe('naturalisation')
  })
})

describe('questionsForTitle', () => {
  it('keeps the questions whose lists hold the title', () => {
    const pool = [
      { id: 1, lists: ['pluriannuelle'] },
      { id: 2, lists: ['pluriannuelle', 'resident'] },
      { id: 3, lists: ['naturalisation'] },
    ] as ListedQuestion[]
    expect(questionsForTitle('pluriannuelle', pool).map((q) => q.id)).toEqual([1, 2])
    expect(questionsForTitle('resident', pool).map((q) => q.id)).toEqual([2])
    expect(questionsForTitle('naturalisation', pool).map((q) => q.id)).toEqual([3])
  })

  it('the multi-year permit pool is its official list (1-191) plus the situational questions', () => {
    const expected = listed.filter((q) => q.id <= 191 || q.notion === 'mise-en-situation').map((q) => q.id)
    expect(questionsForTitle('pluriannuelle').map((q) => q.id)).toEqual(expected)
  })

  it('every situational question is in the pool of each title', () => {
    const situational = listed.filter((q) => q.notion === 'mise-en-situation').length
    for (const title of TITLE_KEYS) {
      expect(questionsForTitle(title).filter((q) => q.notion === 'mise-en-situation')).toHaveLength(situational)
    }
  })
})

describe('buildExam with the pool of another title', () => {
  // Fictional complete pool for the « carte de résident »: 3 questions per blueprint line
  // (situational lines: 8), never drawn from the multi-year permit questions
  const residentPool: ListedQuestion[] = EXAM_BLUEPRINT.flatMap((line, l) =>
    Array.from({ length: line.notion === 'mise-en-situation' ? 8 : 3 }, (_, i) => ({
      id: 10_000 + l * 100 + i,
      theme: line.theme,
      notion: line.notion,
      lists: ['resident' as const],
      question: `CR ${l}-${i}`,
      answers: ['A'],
      distractors: ['B', 'C', 'D'],
      explanation: 'E',
    })),
  )
  // Data questions kept on the multi-year permit list only, so that the resident pool is the fictional one
  const multiYearOnly = listed.map((q) => ({ ...q, lists: ['pluriannuelle' as const] }))
  const mixed = [...multiYearOnly, ...residentPool]

  it('draws 40 questions of that title only, with the official breakdown', () => {
    const pool = questionsForTitle('resident', mixed)
    expect(pool).toHaveLength(residentPool.length)
    for (let draw = 0; draw < 50; draw++) {
      const exam = buildExam(pool)
      expect(exam).toHaveLength(EXAM_SIZE)
      expect(exam.every((q) => q.id >= 10_000)).toBe(true)
      const counts = new Map<string, number>()
      for (const q of exam) {
        const source = pool.find((p) => p.id === q.id)!
        const key = `${source.theme}|${source.notion}`
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
      for (const line of EXAM_BLUEPRINT) expect(counts.get(`${line.theme}|${line.notion}`)).toBe(line.count)
    }
  })

  it('the multi-year permit pool never draws a question of the other title', () => {
    const exam = buildExam(questionsForTitle('pluriannuelle', mixed))
    expect(exam.every((q) => q.id < 10_000)).toBe(true)
  })
})

// ─── Historique par titre ────────────────────────────────────────────────────

const wrong = (questionId: number) => ({ questionId, chosen: 'x', correct: false })
const right = (questionId: number) => ({ questionId, chosen: 'a', correct: true })

// Entries stored by earlier versions: no title, no id, no answers
const LEGACY_NO_ID = { date: '2026-01-01T10:00:00.000Z', score: 35, total: 40 }
const LEGACY_NO_TITLE = { id: 'old', date: '2026-02-01T10:00:00.000Z', score: 36, total: 40, answers: [wrong(5)] }

function storeHistory(entries: unknown[]) {
  localStorageMock.setItem(HISTORY_KEY, JSON.stringify(entries))
}

describe('history per title', () => {
  it('saveResult writes the title of the exam', () => {
    saveResult(33, 40, [], 'resident')
    saveResult(20, 40, [])
    const stored = JSON.parse(localStorageMock.getItem(HISTORY_KEY)!)
    expect(stored.map((e: { title?: string }) => e.title)).toEqual(['resident', 'pluriannuelle'])
  })

  it('old entries without title (with or without id and answers) count for the multi-year permit', () => {
    storeHistory([LEGACY_NO_ID, LEGACY_NO_TITLE])
    expect(loadHistoryForTitle('pluriannuelle')).toEqual([LEGACY_NO_ID, LEGACY_NO_TITLE])
    expect(loadHistoryForTitle('resident')).toEqual([])
  })

  it('an unknown title counts for the multi-year permit, and is never rewritten', () => {
    const unknown = { ...LEGACY_NO_TITLE, id: 'u', title: 'carte-bleue' }
    storeHistory([unknown])
    expect(loadHistoryForTitle('pluriannuelle')).toEqual([unknown])
    saveResult(30, 40, [], 'pluriannuelle')
    const stored = JSON.parse(localStorageMock.getItem(HISTORY_KEY)!)
    expect(stored[0]).toEqual(unknown)
  })

  it('reading per title leaves the stored history untouched', () => {
    const raw = JSON.stringify([LEGACY_NO_ID, LEGACY_NO_TITLE, { ...LEGACY_NO_TITLE, id: 'r', title: 'resident' }])
    localStorageMock.setItem(HISTORY_KEY, raw)
    loadHistoryForTitle('pluriannuelle')
    loadHistoryForTitle('resident')
    loadQuestionsToReview('resident')
    expect(localStorageMock.getItem(HISTORY_KEY)).toBe(raw)
  })

  it('the « n sur 3 » counter only counts the exams of the title', () => {
    storeHistory([
      { ...LEGACY_NO_TITLE, id: '1' },
      { ...LEGACY_NO_TITLE, id: '2', title: 'pluriannuelle' },
      // A failed exam of another title does not break the multi-year streak
      { ...LEGACY_NO_TITLE, id: '3', score: 10, title: 'resident' },
      { ...LEGACY_NO_ID },
    ])
    expect(passedInARow(loadHistoryForTitle('pluriannuelle'))).toBe(3)
    expect(passedInARow(loadHistoryForTitle('resident'))).toBe(0)
    expect(loadHistory()).toHaveLength(4)
  })

  it('questions « à revoir » only come from the exams of the title', () => {
    storeHistory([
      { ...LEGACY_NO_TITLE, id: '1', answers: [wrong(5)] },
      { ...LEGACY_NO_TITLE, id: '2', title: 'resident', answers: [wrong(7), right(5)] },
    ])
    expect(loadQuestionsToReview('pluriannuelle')).toEqual([5])
    expect(loadQuestionsToReview('resident')).toEqual([7])
    expect(loadQuestionsToReview()).toEqual([5])
  })

  it('findExamRecord reads an exam of any title (a past exam stays readable)', () => {
    storeHistory([LEGACY_NO_TITLE, { ...LEGACY_NO_TITLE, id: 'n', title: 'naturalisation' }])
    expect(findExamRecord('old')).toEqual(LEGACY_NO_TITLE)
    expect(findExamRecord('n')?.title).toBe('naturalisation')
  })
})

// ─── Examen en cours par titre ───────────────────────────────────────────────

function progress(title?: unknown): ExamInProgress {
  return {
    questions: [{ id: 1, theme: 'T', question: 'Q', answer: 'A', choices: ['A', 'B', 'C', 'D'], explanation: 'E' }],
    index: 0,
    answers: [],
    timeLeft: 1200,
    startedAt: '2026-11-01T10:00:00.000Z',
    ...(title === undefined ? {} : { title: title as ExamInProgress['title'] }),
  }
}

describe('exam in progress per title', () => {
  it('a progress stored without title resumes for the multi-year permit', () => {
    localStorageMock.setItem(EXAM_PROGRESS_KEY, JSON.stringify(progress()))
    expect(loadProgressForTitle('pluriannuelle')).toEqual(progress())
    expect(loadProgressForTitle('resident')).toBeNull()
  })

  it('a progress with an unknown title resumes for the multi-year permit', () => {
    localStorageMock.setItem(EXAM_PROGRESS_KEY, JSON.stringify(progress('inconnu')))
    expect(loadProgressForTitle('pluriannuelle')).not.toBeNull()
  })

  it('a progress of another title is not offered, and stays stored', () => {
    const raw = JSON.stringify(progress('naturalisation'))
    localStorageMock.setItem(EXAM_PROGRESS_KEY, raw)
    expect(loadProgressForTitle('pluriannuelle')).toBeNull()
    expect(loadProgressForTitle('naturalisation')).not.toBeNull()
    expect(loadProgress()).not.toBeNull()
    expect(localStorageMock.getItem(EXAM_PROGRESS_KEY)).toBe(raw)
  })
})
