import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Home, { OFFICIAL_SITE_URL } from './Home'
import { LEGIFRANCE_URL } from '@/components/ExamRules'

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

describe('Accueil — règles officielles', () => {
  it('le sous-titre ne promet que la carte de séjour pluriannuelle', () => {
    renderHome()
    expect(screen.getByText(/carte de séjour pluriannuelle/i)).toBeInTheDocument()
    expect(screen.getByText('Carte de résident et naturalisation : bientôt')).toBeInTheDocument()
    expect(screen.queryByText(/carte de résident ou naturalisation/i)).toBeNull()
  })

  it('la carte « Examen blanc » annonce 45 minutes', () => {
    renderHome()
    expect(screen.getByText('40 questions · 45 minutes')).toBeInTheDocument()
  })

  it('le rappel des règles apparaît dans la carte « Examen blanc » ouverte', async () => {
    renderHome()
    const reminder = screen.getByText(
      'Comme le jour J : 40 questions en 45 minutes au maximum. Il faut 32 bonnes réponses sur 40 pour réussir.',
    )
    expect(reminder.closest('[aria-hidden="true"]')).not.toBeNull()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Démarrer un examen blanc' }))
    })
    expect(reminder.closest('[aria-hidden="true"]')).toBeNull()
  })

  it('le bloc « Comment se passe l\'examen » est fermé par défaut', () => {
    renderHome()
    const toggle = screen.getByRole('button', { name: /comment se passe l'examen/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/Réussite à 80 %/)).toBeNull()
  })

  it('ouvrir le bloc affiche les règles et le lien vers l\'arrêté', async () => {
    renderHome()
    const toggle = screen.getByRole('button', { name: /comment se passe l'examen/i })
    await act(async () => { fireEvent.click(toggle) })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('45 min')).toBeInTheDocument()
    expect(screen.getByText('32/40')).toBeInTheDocument()
    expect(screen.getByText('Réussite à 80 % de bonnes réponses, soit 32 sur 40.')).toBeInTheDocument()
    expect(screen.getByText(/pas de point en moins/)).toBeInTheDocument()
    expect(screen.getByText(/situation de handicap/)).toBeInTheDocument()
    expect(screen.getByText('Vivre dans la société française')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /arrêté du 10 octobre 2025/i })).toHaveAttribute('href', LEGIFRANCE_URL)
    await act(async () => { fireEvent.click(toggle) })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('affiche la mention non officielle avec le lien vers le site officiel', () => {
    renderHome()
    expect(screen.getByText(/Site indépendant, non officiel/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'formation-civique.interieur.gouv.fr' })).toHaveAttribute('href', OFFICIAL_SITE_URL)
  })
})

describe('Accueil — couleur de l\'historique alignée sur le verdict', () => {
  function seedScore(score: number) {
    localStorageMock.setItem('quiz-history', JSON.stringify([
      { id: '1', date: new Date().toISOString(), score, total: 40, answers: [] },
    ]))
  }
  function historyBar() {
    const item = screen.getByRole('button', { name: /voir le détail/i })
    return item.querySelector('[aria-hidden="true"].h-full') as HTMLElement
  }

  it('31/40 (78 %) n\'est pas vert', () => {
    seedScore(31)
    renderHome()
    expect(historyBar()).not.toHaveClass('bg-green-500')
    expect(historyBar()).toHaveClass('bg-orange-400')
  })

  it('32/40 est vert', () => {
    seedScore(32)
    renderHome()
    expect(historyBar()).toHaveClass('bg-green-500')
  })

  it('un score sous 50 % reste rouge', () => {
    seedScore(10)
    renderHome()
    expect(historyBar()).toHaveClass('bg-red-500')
  })
})

