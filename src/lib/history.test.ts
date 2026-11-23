import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadHistory, findExamRecord, addExamRecord, HISTORY_KEY } from './history'
import type { ExamRecord } from './exam-types'

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

const RECORD: ExamRecord = {
  id: '1700000000000',
  date: '2026-01-15T10:00:00.000Z',
  score: 33,
  total: 40,
  answers: [{ questionId: 1, chosen: 'a', correct: true }],
}

// Record saved before the detail page existed: no id, no answers
const LEGACY = { date: '2026-01-01T10:00:00.000Z', score: 20, total: 40 }

function store(value: unknown) {
  localStorageMock.setItem(HISTORY_KEY, JSON.stringify(value))
}

describe('loadHistory', () => {
  it('renvoie une liste vide sans historique', () => {
    expect(loadHistory()).toEqual([])
  })

  it('renvoie les examens stockés dans l\'ordre', () => {
    store([LEGACY, RECORD])
    expect(loadHistory()).toEqual([LEGACY, RECORD])
  })

  it('renvoie une liste vide si le JSON est invalide', () => {
    localStorageMock.setItem(HISTORY_KEY, 'pas du json{')
    expect(loadHistory()).toEqual([])
  })

  it('renvoie une liste vide si la valeur est un objet et non un tableau', () => {
    store({ score: 30, total: 40 })
    expect(loadHistory()).toEqual([])
  })

  it('ignore les entrées incomplètes ou mal typées', () => {
    store([
      RECORD,
      null,
      'texte',
      { date: RECORD.date, total: 40 },
      { date: RECORD.date, score: '30', total: 40 },
      { date: RECORD.date, score: 30, total: null },
      { score: 30, total: 40 },
      { ...RECORD, id: 42 },
      { ...RECORD, answers: 'x' },
    ])
    expect(loadHistory()).toEqual([RECORD])
  })

  it('renvoie une liste vide si localStorage lève une exception', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied') },
    })
    expect(loadHistory()).toEqual([])
  })
})

describe('findExamRecord', () => {
  it('trouve un examen par id', () => {
    store([LEGACY, RECORD])
    expect(findExamRecord(RECORD.id)).toEqual(RECORD)
  })

  it('renvoie null pour un id inconnu', () => {
    store([RECORD])
    expect(findExamRecord('inconnu')).toBeNull()
  })

  it('renvoie null pour un examen sans réponses', () => {
    store([{ id: 'x', date: RECORD.date, score: 1, total: 40 }])
    expect(findExamRecord('x')).toBeNull()
  })

  it('renvoie null si l\'historique est corrompu', () => {
    localStorageMock.setItem(HISTORY_KEY, '{oops')
    expect(findExamRecord(RECORD.id)).toBeNull()
  })
})

describe('addExamRecord', () => {
  it('crée l\'historique au premier examen', () => {
    addExamRecord(RECORD)
    expect(JSON.parse(localStorageMock.getItem(HISTORY_KEY)!)).toEqual([RECORD])
  })

  it('ajoute à la fin sans modifier les entrées existantes', () => {
    store([LEGACY])
    addExamRecord(RECORD)
    expect(JSON.parse(localStorageMock.getItem(HISTORY_KEY)!)).toEqual([LEGACY, RECORD])
  })

  it('enregistre l\'examen même si l\'historique stocké est corrompu', () => {
    localStorageMock.setItem(HISTORY_KEY, 'pas du json{')
    addExamRecord(RECORD)
    expect(JSON.parse(localStorageMock.getItem(HISTORY_KEY)!)).toEqual([RECORD])
  })

  it('n\'écrit rien si la lecture de localStorage lève une exception', () => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied') },
      setItem,
    })
    expect(() => addExamRecord(RECORD)).not.toThrow()
    expect(setItem).not.toHaveBeenCalled()
  })

  it('ne lève pas d\'exception si localStorage refuse l\'écriture', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('quota') },
    })
    expect(() => addExamRecord(RECORD)).not.toThrow()
  })
})
