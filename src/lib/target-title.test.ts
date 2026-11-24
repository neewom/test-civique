import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadTargetTitle, saveTargetTitle, TARGET_TITLE_KEY } from '@/lib/target-title'

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

describe('titre visé', () => {
  it('vaut null sans choix enregistré', () => {
    expect(loadTargetTitle()).toBeNull()
  })

  it('enregistre la carte pluriannuelle sous la clé target-title', () => {
    saveTargetTitle('pluriannuelle')
    expect(TARGET_TITLE_KEY).toBe('target-title')
    expect(localStorageMock.getItem('target-title')).toBe('pluriannuelle')
    expect(loadTargetTitle()).toBe('pluriannuelle')
  })

  it.each(['inconnu', '"pluriannuelle"', '', 'resident'])('ignore une valeur inconnue (%j)', (value) => {
    localStorageMock.setItem('target-title', value)
    expect(loadTargetTitle()).toBeNull()
  })

  it('vaut null quand le stockage est illisible', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
    })
    expect(loadTargetTitle()).toBeNull()
    expect(() => saveTargetTitle('pluriannuelle')).not.toThrow()
  })

  it('garde le choix en mémoire quand setItem lève (stockage plein ou bloqué)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError') },
    })
    saveTargetTitle('pluriannuelle')
    expect(loadTargetTitle()).toBe('pluriannuelle')
  })

  it('garde le choix en mémoire quand getItem lève', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('SecurityError') },
      setItem: () => { throw new Error('SecurityError') },
    })
    expect(loadTargetTitle()).toBeNull()
    saveTargetTitle('pluriannuelle')
    expect(loadTargetTitle()).toBe('pluriannuelle')
  })
})
