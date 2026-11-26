import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { pageDepth, shouldAnimateNavigation, transitionDirection } from '@/lib/page-transition'

const PAGES = ['/titre', '/', '/revision', '/regles', '/mentions-legales', '/examen', '/examen/abc']

describe('pageDepth', () => {
  it('classe chaque page : titre 0, accueil 1, pages annexes 2, examen et détail 3', () => {
    expect(pageDepth('/titre')).toBe(0)
    expect(pageDepth('/')).toBe(1)
    expect(pageDepth('/revision')).toBe(2)
    expect(pageDepth('/regles')).toBe(2)
    expect(pageDepth('/mentions-legales')).toBe(2)
    expect(pageDepth('/examen')).toBe(3)
    expect(pageDepth('/examen/abc')).toBe(3)
  })
})

describe('transitionDirection', () => {
  it('va en avant quand la page est plus profonde, en arrière quand elle l\'est moins, pour chaque couple', () => {
    for (const from of PAGES) {
      for (const to of PAGES) {
        if (pageDepth(from) === pageDepth(to)) continue
        const expected = pageDepth(to) < pageDepth(from) ? 'back' : 'forward'
        expect(transitionDirection(from, to, 'PUSH'), `${from} → ${to}`).toBe(expected)
      }
    }
  })

  it('accueil → titre = en arrière, accueil → révision ou examen = en avant', () => {
    expect(transitionDirection('/', '/titre', 'PUSH')).toBe('back')
    expect(transitionDirection('/', '/revision', 'PUSH')).toBe('forward')
    expect(transitionDirection('/', '/examen', 'PUSH')).toBe('forward')
    expect(transitionDirection('/examen/abc', '/', 'PUSH')).toBe('back')
  })

  it('à profondeur égale : en avant par un lien, en arrière par le retour du navigateur', () => {
    expect(transitionDirection('/regles', '/revision', 'PUSH')).toBe('forward')
    expect(transitionDirection('/regles', '/revision', 'POP')).toBe('back')
  })
})

describe('shouldAnimateNavigation', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    document.startViewTransition = vi.fn() as unknown as typeof document.startViewTransition
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    // @ts-expect-error the API is absent in jsdom: restore that state
    delete document.startViewTransition
  })

  it('anime un changement de page quand les animations sont activées et l\'API présente', () => {
    expect(shouldAnimateNavigation('/', '/revision', 'PUSH')).toBe(true)
  })

  it('n\'anime pas quand l\'animation est désactivée (choix enregistré)', () => {
    localStorage.setItem('motion', 'off')
    expect(shouldAnimateNavigation('/', '/revision', 'PUSH')).toBe(false)
  })

  it('n\'anime pas quand l\'appareil demande moins d\'animations et qu\'aucun choix n\'est enregistré', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: true,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    expect(shouldAnimateNavigation('/', '/revision', 'PUSH')).toBe(false)
  })

  it('n\'anime pas sans l\'API View Transitions', () => {
    // @ts-expect-error simulating an older browser
    delete document.startViewTransition
    expect(shouldAnimateNavigation('/', '/revision', 'PUSH')).toBe(false)
  })

  it('n\'anime pas entre deux écrans du même chemin (deux questions de l\'examen)', () => {
    expect(shouldAnimateNavigation('/examen', '/examen', 'PUSH')).toBe(false)
  })

  it('n\'anime pas un retour du navigateur sur iPhone (le geste de retour s\'anime déjà)', () => {
    vi.stubGlobal('navigator', { ...navigator, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' })
    expect(shouldAnimateNavigation('/revision', '/', 'POP')).toBe(false)
    expect(shouldAnimateNavigation('/', '/revision', 'PUSH')).toBe(true)
  })
})
