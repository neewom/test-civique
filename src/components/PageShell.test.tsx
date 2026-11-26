import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PageShell } from './PageShell'

function Nav() {
  const navigate = useNavigate()
  return (
    <>
      <button onClick={() => navigate('/revision')}>vers révision</button>
      <button onClick={() => navigate('/', { state: { a: 1 } })}>accueil encore</button>
      <button onClick={() => navigate('/mentions-legales#vos-donnees')}>vers données</button>
    </>
  )
}

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Nav />
      <PageShell>
        {(location) => (
          <Routes location={location}>
            <Route path="/" element={<p>Accueil</p>} />
            <Route path="/revision" element={<p>Révision</p>} />
            <Route
              path="/mentions-legales"
              element={
                <>
                  <p>Mentions</p>
                  <h2 id="vos-donnees">Vos données</h2>
                </>
              }
            />
          </Routes>
        )}
      </PageShell>
    </MemoryRouter>,
  )
}

describe('PageShell', () => {
  let scrollTo: ReturnType<typeof vi.fn>
  beforeEach(() => {
    localStorage.clear()
    scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    // @ts-expect-error the API is absent in jsdom
    delete document.startViewTransition
    document.documentElement.classList.remove('page-transition')
    delete document.documentElement.dataset.direction
  })

  it('sans API View Transitions, change de page tout de suite et sans classe de transition', () => {
    renderShell()
    fireEvent.click(screen.getByText('vers révision'))
    expect(screen.getByText('Révision')).toBeInTheDocument()
    expect(document.documentElement.classList.contains('page-transition')).toBe(false)
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
  })

  it('avec l\'API : la page change dans la transition, avec le sens et la classe, retirée à la fin', async () => {
    let finish: () => void = () => {}
    const finished = new Promise<void>((resolve) => (finish = resolve))
    const start = vi.fn((cb: () => void) => {
      // the old page is still there when the transition starts
      expect(screen.getByText('Accueil')).toBeInTheDocument()
      cb()
      return { finished }
    })
    document.startViewTransition = start as unknown as typeof document.startViewTransition
    renderShell()
    fireEvent.click(screen.getByText('vers révision'))
    expect(start).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Révision')).toBeInTheDocument()
    expect(document.documentElement.dataset.direction).toBe('forward')
    expect(document.documentElement.classList.contains('page-transition')).toBe(true)
    await act(async () => {
      finish()
      await finished
    })
    expect(document.documentElement.classList.contains('page-transition')).toBe(false)
  })

  it('aucune transition quand les animations sont désactivées', () => {
    localStorage.setItem('motion', 'off')
    const start = vi.fn()
    document.startViewTransition = start as unknown as typeof document.startViewTransition
    renderShell()
    fireEvent.click(screen.getByText('vers révision'))
    expect(start).not.toHaveBeenCalled()
    expect(screen.getByText('Révision')).toBeInTheDocument()
  })

  it('aucune transition quand seul l\'état change sur le même chemin', () => {
    const start = vi.fn()
    document.startViewTransition = start as unknown as typeof document.startViewTransition
    renderShell()
    fireEvent.click(screen.getByText('accueil encore'))
    expect(start).not.toHaveBeenCalled()
  })

  it('l\'ancre #vos-donnees reste gérée après le changement de page', () => {
    const scrollIntoView = vi.fn()
    const original = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = scrollIntoView
    try {
      renderShell()
      fireEvent.click(screen.getByText('vers données'))
      expect(scrollIntoView).toHaveBeenCalledTimes(1)
      expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByRole('heading', { name: 'Vos données' }))
    } finally {
      Element.prototype.scrollIntoView = original
    }
  })
})
