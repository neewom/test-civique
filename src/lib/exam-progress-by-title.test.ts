import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  EXAM_PROGRESS_KEY,
  clearProgress,
  hasProgress,
  loadProgress,
  loadProgressForTitle,
  progressKey,
  saveProgress,
  type ExamInProgress,
} from './exam-types'

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

function progress(title?: string, index = 2): ExamInProgress {
  return {
    questions: Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      theme: 'T',
      question: `Q${i + 1}`,
      answer: 'A',
      choices: ['A', 'B', 'C', 'D'],
      explanation: '',
    })),
    index,
    answers: [],
    timeLeft: 1500,
    startedAt: '2026-11-23T10:00:00.000Z',
    ...(title ? { title: title as ExamInProgress['title'] } : {}),
  }
}

describe('exam in progress, one per title', () => {
  it('the multi-year permit keeps the exam-in-progress key, the resident card has its own', () => {
    saveProgress(progress('pluriannuelle'))
    saveProgress(progress('resident'))
    expect(JSON.parse(localStorageMock.getItem('exam-in-progress')!).title).toBe('pluriannuelle')
    expect(JSON.parse(localStorageMock.getItem('exam-in-progress-resident')!).title).toBe('resident')
    expect(EXAM_PROGRESS_KEY).toBe('exam-in-progress')
    expect(progressKey('pluriannuelle')).toBe('exam-in-progress')
    expect(progressKey('resident')).toBe('exam-in-progress-resident')
    expect(progressKey('naturalisation')).toBe('exam-in-progress-naturalisation')
  })

  it('two exams in progress are resumed each for its own title', () => {
    saveProgress(progress('pluriannuelle', 1))
    saveProgress(progress('resident', 3))
    expect(loadProgressForTitle('pluriannuelle')?.index).toBe(1)
    expect(loadProgressForTitle('resident')?.index).toBe(3)
  })

  it('clearing one title leaves the other untouched', () => {
    saveProgress(progress('pluriannuelle'))
    saveProgress(progress('resident'))
    clearProgress('resident')
    expect(loadProgressForTitle('resident')).toBeNull()
    expect(loadProgressForTitle('pluriannuelle')).not.toBeNull()
    clearProgress('pluriannuelle')
    expect(loadProgressForTitle('pluriannuelle')).toBeNull()
  })

  it('starting a new exam for one title (save) does not overwrite the other', () => {
    saveProgress(progress('pluriannuelle', 4))
    const before = localStorageMock.getItem('exam-in-progress')
    saveProgress(progress('resident', 0))
    expect(localStorageMock.getItem('exam-in-progress')).toBe(before)
  })

  it('a progress stored without title (before titles) resumes for the multi-year permit, in the same key', () => {
    const raw = JSON.stringify(progress())
    localStorageMock.setItem('exam-in-progress', raw)
    expect(loadProgressForTitle('pluriannuelle')).toEqual(progress())
    expect(loadProgressForTitle('resident')).toBeNull()
    expect(localStorageMock.getItem('exam-in-progress')).toBe(raw)
  })

  it('a progress with an unknown title resumes for the multi-year permit', () => {
    localStorageMock.setItem('exam-in-progress', JSON.stringify(progress('inconnu')))
    expect(loadProgressForTitle('pluriannuelle')).not.toBeNull()
    expect(loadProgressForTitle('resident')).toBeNull()
  })

  it('a progress stored in a key is never read for another title', () => {
    localStorageMock.setItem('exam-in-progress', JSON.stringify(progress('resident')))
    expect(loadProgressForTitle('pluriannuelle')).toBeNull()
    expect(loadProgressForTitle('resident')).toBeNull()
    localStorageMock.clear()
    localStorageMock.setItem('exam-in-progress-resident', JSON.stringify(progress('pluriannuelle')))
    expect(loadProgressForTitle('resident')).toBeNull()
    expect(loadProgressForTitle('pluriannuelle')).toBeNull()
    // A resident key without title is not the resident card's either
    localStorageMock.setItem('exam-in-progress-resident', JSON.stringify(progress()))
    expect(loadProgressForTitle('resident')).toBeNull()
  })

  it('an unreadable or malformed progress counts as none, per title', () => {
    localStorageMock.setItem('exam-in-progress', 'not-json{')
    localStorageMock.setItem('exam-in-progress-resident', JSON.stringify({ index: 2, title: 'resident' }))
    expect(loadProgressForTitle('pluriannuelle')).toBeNull()
    expect(loadProgressForTitle('resident')).toBeNull()
    expect(hasProgress()).toBe(false)
  })

  it('a valid resident progress is still offered when the other key is unreadable', () => {
    localStorageMock.setItem('exam-in-progress', 'not-json{')
    saveProgress(progress('resident'))
    expect(loadProgressForTitle('resident')).not.toBeNull()
  })

  it('clearProgress of the multi-year permit leaves the resident card progress alone', () => {
    saveProgress(progress('pluriannuelle'))
    saveProgress(progress('resident'))
    clearProgress('pluriannuelle')
    expect(localStorageMock.getItem('exam-in-progress')).toBeNull()
    expect(loadProgress('resident')).not.toBeNull()
  })

  it('a naturalisation progress never reads as the multi-year permit and never overwrites it', () => {
    saveProgress(progress('pluriannuelle', 4))
    const before = localStorageMock.getItem('exam-in-progress')
    saveProgress(progress('naturalisation', 1))
    expect(localStorageMock.getItem('exam-in-progress')).toBe(before)
    expect(JSON.parse(localStorageMock.getItem('exam-in-progress-naturalisation')!).title).toBe('naturalisation')
    expect(loadProgressForTitle('pluriannuelle')?.index).toBe(4)
    expect(loadProgressForTitle('naturalisation')?.index).toBe(1)
    clearProgress('pluriannuelle')
    expect(loadProgressForTitle('naturalisation')?.index).toBe(1)
    localStorageMock.clear()
    saveProgress(progress('naturalisation'))
    expect(loadProgressForTitle('pluriannuelle')).toBeNull()
    expect(loadProgress('pluriannuelle')).toBeNull()
  })

  it('hasProgress is true when any title has an exam in progress, false when none', () => {
    expect(hasProgress()).toBe(false)
    saveProgress(progress('resident'))
    expect(hasProgress()).toBe(true)
    clearProgress('resident')
    saveProgress(progress())
    expect(hasProgress()).toBe(true)
  })
})
