import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  saveProgress,
  clearProgress,
  loadProgress,
  resumeIndex,
  EXAM_PROGRESS_KEY,
} from './exam-types'
import type { ExamInProgress, ExamQuestion, AnswerRecord } from './exam-types'

// ── localStorage mock ─────────────────────────────────────────────────────────

function makeLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    reset: () => { store = {} },
  }
}

const localStorageMock = makeLocalStorageMock()

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageMock)
  localStorageMock.reset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeQuestion(id: number): ExamQuestion {
  return {
    id,
    theme: 'Test',
    question: `Question ${id}`,
    answer: `Réponse ${id}`,
    choices: [`Réponse ${id}`, `Mauvaise A`, `Mauvaise B`, `Mauvaise C`],
    explanation: `Explication ${id}`,
  }
}

function makeProgress(overrides: Partial<ExamInProgress> = {}): ExamInProgress {
  return {
    questions: Array.from({ length: 5 }, (_, i) => makeQuestion(i + 1)),
    index: 2,
    answers: [
      { questionId: 1, chosen: 'Réponse 1', correct: true },
      { questionId: 2, chosen: 'Mauvaise A', correct: false },
    ],
    timeLeft: 1800,
    startedAt: '2026-04-04T10:00:00.000Z',
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('saveProgress', () => {
  it('écrit la clé exam-in-progress dans localStorage', () => {
    const state = makeProgress()
    saveProgress(state)
    expect(localStorage.getItem(EXAM_PROGRESS_KEY)).not.toBeNull()
  })

  it('sérialise correctement le state', () => {
    const state = makeProgress()
    saveProgress(state)
    const raw = localStorage.getItem(EXAM_PROGRESS_KEY)!
    const parsed = JSON.parse(raw)
    expect(parsed.index).toBe(state.index)
    expect(parsed.timeLeft).toBe(state.timeLeft)
    expect(parsed.startedAt).toBe(state.startedAt)
    expect(parsed.answers).toHaveLength(state.answers.length)
    expect(parsed.questions).toHaveLength(state.questions.length)
  })

  it('écrase la valeur précédente', () => {
    saveProgress(makeProgress({ index: 1 }))
    saveProgress(makeProgress({ index: 5 }))
    const parsed = JSON.parse(localStorage.getItem(EXAM_PROGRESS_KEY)!)
    expect(parsed.index).toBe(5)
  })
})

describe('clearProgress', () => {
  it('supprime la clé exam-in-progress', () => {
    saveProgress(makeProgress())
    clearProgress()
    expect(localStorage.getItem(EXAM_PROGRESS_KEY)).toBeNull()
  })

  it('ne lève pas d\'erreur si la clé est absente', () => {
    expect(() => clearProgress()).not.toThrow()
  })
})

describe('loadProgress', () => {
  it('retourne null quand la clé est absente', () => {
    expect(loadProgress()).toBeNull()
  })

  it('retourne le state sauvegardé', () => {
    const state = makeProgress()
    saveProgress(state)
    const loaded = loadProgress()
    expect(loaded).not.toBeNull()
    expect(loaded!.index).toBe(state.index)
    expect(loaded!.timeLeft).toBe(state.timeLeft)
    expect(loaded!.startedAt).toBe(state.startedAt)
  })

  it('restaure les réponses et les questions avec leurs détails', () => {
    const answers: AnswerRecord[] = [
      { questionId: 1, chosen: 'Réponse 1', correct: true },
    ]
    saveProgress(makeProgress({ answers }))
    const loaded = loadProgress()!
    expect(loaded.answers[0].questionId).toBe(1)
    expect(loaded.answers[0].correct).toBe(true)
    expect(loaded.questions[0].choices).toHaveLength(4)
  })

  it('retourne null si le JSON est invalide', () => {
    localStorage.setItem(EXAM_PROGRESS_KEY, 'not-json{')
    expect(loadProgress()).toBeNull()
  })

  // Stored data may be corrupted or edited by hand: a malformed value is ignored
  it.each([
    ['un nombre', 42],
    ['null', null],
    ['un tableau', []],
    ['un objet vide', {}],
    ['sans questions', { ...makeProgress(), questions: [] }],
    ['des questions mal formées', { ...makeProgress(), questions: [{ id: 1 }] }],
    ['des choix qui ne sont pas des chaînes', {
      ...makeProgress(),
      questions: [{ ...makeQuestion(1), choices: [1, 2] }],
    }],
    ['un index hors limites', makeProgress({ index: 5 })],
    ['un index négatif', makeProgress({ index: -1 })],
    ['un index non entier', makeProgress({ index: 1.5 })],
    ['des réponses mal formées', { ...makeProgress(), answers: [{ questionId: '1' }] }],
    ['un temps restant non numérique', { ...makeProgress(), timeLeft: '1800' }],
    ['sans date de début', { ...makeProgress(), startedAt: undefined }],
  ])('retourne null pour une sauvegarde mal formée (%s)', (_label, value) => {
    localStorage.setItem(EXAM_PROGRESS_KEY, JSON.stringify(value))
    expect(loadProgress()).toBeNull()
  })

  it('accepte une réponse sans choix (chrono expiré)', () => {
    saveProgress(makeProgress({ answers: [{ questionId: 1, chosen: null, correct: false }] }))
    expect(loadProgress()?.answers[0].chosen).toBeNull()
  })

  it('retourne null quand localStorage est inaccessible', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('SecurityError') },
    })
    expect(loadProgress()).toBeNull()
  })
})

describe('cycle complet sauvegarde → restauration', () => {
  it('saveProgress puis loadProgress retourne un objet identique', () => {
    const original = makeProgress({
      // index must point to an existing question (shape check of loadProgress)
      questions: Array.from({ length: 10 }, (_, i) => makeQuestion(i + 1)),
      index: 7,
      timeLeft: 500,
      answers: [
        { questionId: 1, chosen: 'Réponse 1', correct: true },
        { questionId: 2, chosen: null, correct: false },
      ],
    })
    saveProgress(original)
    const restored = loadProgress()!

    expect(restored.index).toBe(original.index)
    expect(restored.timeLeft).toBe(original.timeLeft)
    expect(restored.answers).toHaveLength(original.answers.length)
    expect(restored.answers[1].chosen).toBeNull()
    expect(restored.questions).toHaveLength(original.questions.length)
  })

  it('clearProgress après saveProgress → loadProgress retourne null', () => {
    saveProgress(makeProgress())
    clearProgress()
    expect(loadProgress()).toBeNull()
  })
})

describe('resumeIndex', () => {
  it('reprend à index quand la question courante n\'a pas de réponse', () => {
    expect(resumeIndex(makeProgress())).toBe(2)
  })

  it('reprend à index + 1 quand la sauvegarde date de la correction', () => {
    const p = makeProgress()
    expect(resumeIndex({ ...p, answers: [...p.answers, { questionId: 3, chosen: 'Réponse 3', correct: true }] })).toBe(3)
  })
})
