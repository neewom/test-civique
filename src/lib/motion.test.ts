import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { applyMotion, currentMotion, defaultMotion, loadMotion, saveMotion } from '@/lib/motion'

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? reduce : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

describe('motion', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.motion
  })
  afterEach(() => vi.unstubAllGlobals())

  it('par défaut : activées, sauf si l\'appareil demande moins d\'animations', () => {
    mockReducedMotion(false)
    expect(defaultMotion()).toBe('on')
    expect(currentMotion()).toBe('on')
    mockReducedMotion(true)
    expect(defaultMotion()).toBe('off')
    expect(currentMotion()).toBe('off')
  })

  it('sans matchMedia, les animations restent coupées', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(defaultMotion()).toBe('off')
  })

  it('le choix enregistré prime sur l\'appareil', () => {
    mockReducedMotion(true)
    localStorage.setItem('motion', 'on')
    expect(currentMotion()).toBe('on')
    mockReducedMotion(false)
    localStorage.setItem('motion', 'off')
    expect(currentMotion()).toBe('off')
  })

  it('une valeur illisible vaut « pas de choix » et retombe sur le défaut', () => {
    mockReducedMotion(false)
    for (const bad of ['', 'oui', 'ON', 'true', '{"a":1}']) {
      localStorage.setItem('motion', bad)
      expect(loadMotion()).toBeNull()
      expect(currentMotion()).toBe('on')
    }
  })

  it('un stockage qui lève ne casse rien', () => {
    mockReducedMotion(false)
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('SecurityError') },
      setItem: () => { throw new Error('QuotaExceededError') },
    })
    expect(loadMotion()).toBeNull()
    expect(currentMotion()).toBe('on')
    expect(() => saveMotion('off')).not.toThrow()
    expect(document.documentElement.dataset.motion).toBe('off')
  })

  it('saveMotion enregistre le choix et pose data-motion sur la racine', () => {
    saveMotion('off')
    expect(localStorage.getItem('motion')).toBe('off')
    expect(document.documentElement.dataset.motion).toBe('off')
    saveMotion('on')
    expect(localStorage.getItem('motion')).toBe('on')
    expect(document.documentElement.dataset.motion).toBe('on')
  })

  it('applyMotion pose la valeur courante', () => {
    mockReducedMotion(true)
    applyMotion()
    expect(document.documentElement.dataset.motion).toBe('off')
  })
})
