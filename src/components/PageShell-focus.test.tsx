import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PageShell } from './PageShell'

function Result() {
  // A page that puts the focus somewhere itself (the exam result screen does so on its title)
  return (
    <main>
      <h1 tabIndex={-1} ref={(el) => el?.focus()}>Résultat</h1>
      <button ref={(el) => el?.focus()}>Choix déjà focalisé</button>
    </main>
  )
}

function HomePage() {
  return (
    <main>
      <h1>Accueil</h1>
      <Link to="/revision">vers révision</Link>
      <Link to="/resultat">vers résultat</Link>
      <Link to="/sans-titre">vers sans titre</Link>
      <Link to="/" state={{ a: 1 }}>accueil encore</Link>
      <Link to="/ancre#vos-donnees">vers ancre</Link>
    </main>
  )
}

function RevisionPage() {
  return (
    <main>
      <h1>Réviser</h1>
      <Link to="/">retour</Link>
    </main>
  )
}

function NoTitlePage() {
  return <main>Pas de titre</main>
}

function renderShell(startAt = '/') {
  return render(
    <MemoryRouter initialEntries={[startAt]}>
      <PageShell>
        {(location) => (
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/revision" element={<RevisionPage />} />
            <Route path="/resultat" element={<Result />} />
            <Route path="/sans-titre" element={<NoTitlePage />} />
            <Route path="/ancien" element={<Navigate to="/revision" replace />} />
            <Route path="/ancre" element={<RevisionPage />} />
          </Routes>
        )}
      </PageShell>
    </MemoryRouter>,
  )
}

describe('PageShell — focus après navigation', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn())
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

  it('ne déplace pas le focus au premier chargement', () => {
    renderShell()
    expect(document.body).toHaveFocus()
  })

  it('met le focus sur le titre de la nouvelle page après un clic de lien', () => {
    renderShell()
    const link = screen.getByRole('link', { name: 'vers révision' })
    link.focus()
    fireEvent.click(link)
    const title = screen.getByRole('heading', { level: 1, name: 'Réviser' })
    expect(title).toHaveFocus()
    expect(title).toHaveAttribute('tabindex', '-1')
  })

  it('suit aussi « Retour » : le focus revient sur le titre de l\'accueil', () => {
    renderShell('/revision')
    fireEvent.click(screen.getByRole('link', { name: 'retour' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Accueil' })).toHaveFocus()
  })

  it('avec une transition de page : le focus est posé une fois la nouvelle page affichée', async () => {
    const start = vi.fn((cb: () => void) => {
      cb()
      return { finished: Promise.resolve(), ready: Promise.resolve(), updateCallbackDone: Promise.resolve() }
    })
    document.startViewTransition = start as unknown as typeof document.startViewTransition
    renderShell()
    const link = screen.getByRole('link', { name: 'vers révision' })
    link.focus()
    await act(async () => {
      fireEvent.click(link)
    })
    expect(start).toHaveBeenCalled()
    expect(screen.getByRole('heading', { level: 1, name: 'Réviser' })).toHaveFocus()
  })

  it('en mouvement réduit (animations coupées) : même résultat, sans transition', () => {
    localStorage.setItem('motion', 'off')
    const start = vi.fn()
    document.startViewTransition = start as unknown as typeof document.startViewTransition
    renderShell()
    const link = screen.getByRole('link', { name: 'vers révision' })
    link.focus()
    fireEvent.click(link)
    expect(start).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { level: 1, name: 'Réviser' })).toHaveFocus()
    localStorage.clear()
  })

  it('laisse le focus à la page qui le place elle-même (écran de résultat)', () => {
    renderShell()
    fireEvent.click(screen.getByRole('link', { name: 'vers résultat' }))
    expect(screen.getByRole('button', { name: 'Choix déjà focalisé' })).toHaveFocus()
  })

  it('à défaut de titre, le focus va sur <main>', () => {
    renderShell()
    fireEvent.click(screen.getByRole('link', { name: 'vers sans titre' }))
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('ne bouge pas quand seul l\'état change sur le même chemin', () => {
    renderShell()
    const link = screen.getByRole('link', { name: 'accueil encore' })
    link.focus()
    fireEvent.click(link)
    expect(link).toHaveFocus()
  })

  it('redirection au premier chargement (nouveau visiteur, adresse inconnue) : le focus reste sur body', () => {
    renderShell('/ancien')
    expect(screen.getByRole('heading', { level: 1, name: 'Réviser' })).toBeInTheDocument()
    expect(document.body).toHaveFocus()
  })

  it('une adresse avec ancre : le focus ne bouge pas (la page défile vers l\'ancre)', () => {
    renderShell()
    fireEvent.click(screen.getByRole('link', { name: 'vers ancre' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Réviser' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Réviser' })).not.toHaveFocus()
  })

  it('une page qui garde un défilement restauré : le focus ne bouge pas', () => {
    renderShell()
    const link = screen.getByRole('link', { name: 'vers révision' })
    Object.defineProperty(window, 'scrollY', { value: 300, configurable: true })
    fireEvent.click(link)
    expect(screen.getByRole('heading', { level: 1, name: 'Réviser' })).not.toHaveFocus()
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  })
})
