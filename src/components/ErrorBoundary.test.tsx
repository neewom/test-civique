import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'
import { ThemeProvider } from './ThemeProvider'

function Bomb({ fail }: { fail: boolean }) {
  if (fail) throw new Error('boom')
  return <p>Page saine</p>
}

function Nav() {
  const navigate = useNavigate()
  return <button onClick={() => navigate('/ailleurs')}>ailleurs</button>
}

function renderBoundary(fail: boolean) {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <Nav />
        <ErrorBoundary>
          <Bomb fail={fail} />
        </ErrorBoundary>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

beforeEach(() => {
  // React logs the caught error: keep the output readable
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('ErrorBoundary', () => {
  it("laisse passer une page saine", () => {
    renderBoundary(false)
    expect(screen.getByText('Page saine')).toBeInTheDocument()
  })

  it("affiche la page de secours quand un enfant lève une erreur", () => {
    renderBoundary(true)
    const title = screen.getByRole('heading', { level: 1, name: "Cette page n'a pas pu s'afficher." })
    expect(title).toHaveFocus()
    expect(screen.getByText(/Vos examens enregistrés ne sont pas perdus/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/')
    expect(document.title).toBe('Erreur · Futur Citoyen')
    expect(screen.queryByText('Page saine')).not.toBeInTheDocument()
  })

  it("garde l'en-tête de l'appli sur la page de secours", () => {
    renderBoundary(true)
    expect(screen.getByRole('button', { name: /Affichage/ })).toBeInTheDocument()
  })

  it("se réarme après une navigation", () => {
    function Flaky() {
      const fail = useLocation().pathname === '/'
      return <Bomb fail={fail} />
    }
    render(
      <ThemeProvider>
        <MemoryRouter>
          <Nav />
          <ErrorBoundary>
            <Flaky />
          </ErrorBoundary>
        </MemoryRouter>
      </ThemeProvider>,
    )
    expect(screen.getByText(/n'a pas pu s'afficher/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'ailleurs' }))
    expect(screen.queryByText(/n'a pas pu s'afficher/)).not.toBeInTheDocument()
  })
})
