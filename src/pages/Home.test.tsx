import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Home from './Home'

// localStorage mock (jsdom dans ce projet ne fournit pas une implémentation complète)
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

function renderHome() {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
}

describe('Home', () => {
  it('affiche le titre "Test Civique" dans un h1', () => {
    renderHome()
    expect(screen.getByRole('heading', { level: 1, name: /test civique/i })).toBeInTheDocument()
  })

  it('a un conteneur principal avec role="main"', () => {
    renderHome()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('affiche la card "Examen blanc" avec le bon aria-label', () => {
    renderHome()
    expect(screen.getByRole('button', { name: 'Démarrer un examen blanc' })).toBeInTheDocument()
  })

  it('affiche la card "Mode révision" avec le bon aria-label', () => {
    renderHome()
    expect(screen.getByRole('button', { name: 'Accéder au mode révision' })).toBeInTheDocument()
  })

  it('la section historique a le bon aria-label', () => {
    renderHome()
    expect(screen.getByRole('region', { name: 'Historique des examens récents' })).toBeInTheDocument()
  })

  it('affiche "Aucun examen passé" quand le localStorage est vide', () => {
    renderHome()
    expect(screen.getByText('Aucun examen passé')).toBeInTheDocument()
  })

  it('les entrées d\'historique avec id sont cliquables', () => {
    localStorageMock.setItem('quiz-history', JSON.stringify([
      { id: '123', date: new Date().toISOString(), score: 30, total: 40, answers: [] },
    ]))
    renderHome()
    const btn = screen.getByRole('button', { name: /voir le détail/i })
    expect(btn).toBeInTheDocument()
  })
})

describe('Examen blanc — expansion', () => {
  it('la card "Examen blanc" a aria-expanded="false" par défaut', () => {
    renderHome()
    const btn = screen.getByRole('button', { name: 'Démarrer un examen blanc' })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('les sous-options ne sont pas accessibles par défaut (aria-hidden)', () => {
    renderHome()
    // aria-hidden=true sur le conteneur → queryByRole ne les voit pas
    expect(screen.queryByRole('button', { name: /questions classiques/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /mises en situation/i })).toBeNull()
  })

  it('cliquer sur la card révèle les deux sous-options', async () => {
    renderHome()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Démarrer un examen blanc' }))
    })
    expect(screen.getByRole('button', { name: 'Démarrer un examen blanc' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /questions classiques/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mises en situation/i })).toBeInTheDocument()
  })

  it('recliquer sur la card la referme', async () => {
    renderHome()
    const examBtn = screen.getByRole('button', { name: 'Démarrer un examen blanc' })
    await act(async () => { fireEvent.click(examBtn) })
    await act(async () => { fireEvent.click(examBtn) })
    expect(examBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('cliquer en dehors referme la card', async () => {
    renderHome()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Démarrer un examen blanc' }))
    })
    await act(async () => {
      fireEvent.mouseDown(document.body)
    })
    expect(screen.getByRole('button', { name: 'Démarrer un examen blanc' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('cliquer sur "Mode révision" referme la card "Examen blanc"', async () => {
    renderHome()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Démarrer un examen blanc' }))
    })
    await act(async () => {
      fireEvent.mouseDown(screen.getByRole('button', { name: 'Accéder au mode révision' }))
    })
    expect(screen.getByRole('button', { name: 'Démarrer un examen blanc' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('"Questions classiques" a le bon aria-label', async () => {
    renderHome()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Démarrer un examen blanc' }))
    })
    expect(
      screen.getByRole('button', { name: 'Lancer un examen avec les questions classiques uniquement' }),
    ).toBeInTheDocument()
  })

  it('"Avec mises en situation" a le bon aria-label', async () => {
    renderHome()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Démarrer un examen blanc' }))
    })
    expect(
      screen.getByRole('button', { name: 'Lancer un examen avec les mises en situation' }),
    ).toBeInTheDocument()
  })
})
