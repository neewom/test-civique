import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { HistoryEntry } from './history'
import { loadQuestionsToReview, parseReviewIds, questionsToReview } from './review-queue'

function exam(answers: HistoryEntry['answers'], id = 'x'): HistoryEntry {
  return { id, date: '2026-11-01T10:00:00.000Z', score: 0, total: 40, answers }
}
const right = (questionId: number) => ({ questionId, chosen: 'a', correct: true })
const wrong = (questionId: number) => ({ questionId, chosen: 'b', correct: false })
const timedOut = (questionId: number) => ({ questionId, chosen: null, correct: false })

describe('questionsToReview', () => {
  it('est vide sans historique', () => {
    expect(questionsToReview([])).toEqual([])
  })

  it('retient les questions ratées ou sans réponse d\'un examen', () => {
    expect(questionsToReview([exam([right(1), wrong(2), timedOut(3)])])).toEqual([2, 3])
  })

  it('sort une question réussie dans un examen suivant', () => {
    expect(questionsToReview([exam([wrong(2), wrong(5)]), exam([right(2)])])).toEqual([5])
  })

  it('remet une question réussie puis ratée plus tard', () => {
    expect(questionsToReview([exam([right(4)]), exam([wrong(4)])])).toEqual([4])
  })

  it('suit l\'ordre de stockage : le plus récent est à la fin', () => {
    const older = exam([wrong(7)], 'a')
    const newer = exam([right(7)], 'b')
    expect(questionsToReview([older, newer])).toEqual([])
    expect(questionsToReview([newer, older])).toEqual([7])
  })

  it('garde une question ratée absente des examens suivants', () => {
    expect(questionsToReview([exam([wrong(9)]), exam([right(1)])])).toEqual([9])
  })

  it('ignore les anciens examens sans réponses enregistrées', () => {
    const old: HistoryEntry = { date: '2026-01-01T10:00:00.000Z', score: 20, total: 40 }
    expect(questionsToReview([exam([wrong(3)]), old])).toEqual([3])
  })

  it('ignore les réponses mal formées', () => {
    const broken = [null, 'x', { questionId: '3', correct: false }, { questionId: 4 }, wrong(5)]
    expect(questionsToReview([exam(broken as unknown as HistoryEntry['answers'])])).toEqual([5])
  })

  it('renvoie les identifiants triés et sans doublon', () => {
    expect(questionsToReview([exam([wrong(30), wrong(2)]), exam([wrong(30)])])).toEqual([2, 30])
  })
})

describe('loadQuestionsToReview', () => {
  let store: Record<string, string> = {}
  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v },
      removeItem: (k: string) => { delete store[k] },
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('lit l\'historique enregistré', () => {
    store['quiz-history'] = JSON.stringify([exam([wrong(12), right(13)])])
    expect(loadQuestionsToReview()).toEqual([12])
  })

  it('renvoie une liste vide quand l\'historique est illisible', () => {
    store['quiz-history'] = '{pas du json'
    expect(loadQuestionsToReview()).toEqual([])
  })
})

describe('parseReviewIds', () => {
  const known = new Set([1, 2, 3])

  it('garde les identifiants connus, sans doublon, dans l\'ordre reçu', () => {
    expect(parseReviewIds({ reviewIds: [3, 1, 3] }, known)).toEqual([3, 1])
  })

  it('ignore les valeurs invalides ou inconnues', () => {
    expect(parseReviewIds({ reviewIds: [1, '2', null, 99, 2.5] }, known)).toEqual([1])
  })

  it('renvoie une liste vide sans état ou avec un état mal formé', () => {
    expect(parseReviewIds(undefined, known)).toEqual([])
    expect(parseReviewIds(null, known)).toEqual([])
    expect(parseReviewIds('x', known)).toEqual([])
    expect(parseReviewIds({ reviewIds: 'x' }, known)).toEqual([])
    expect(parseReviewIds({}, known)).toEqual([])
  })
})
