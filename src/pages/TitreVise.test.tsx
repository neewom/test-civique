import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import TitreVise from './TitreVise'

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

const EXISTING_USER_HISTORY = JSON.stringify([{ date: '2026-11-20T10:00:00.000Z', score: 30, total: 40 }])

// Opened from the home page by someone who already has exams: the change-of-title page
function renderChangeOfTitle() {
  localStorageMock.setItem('quiz-history', EXISTING_USER_HISTORY)
  renderTitre()
}

function renderTitre() {
  render(
    <MemoryRouter initialEntries={['/titre']}>
      <Routes>
        <Route path="/titre" element={<TitreVise />} />
        <Route path="/" element={<p>Accueil</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Changer de titre (« Quel titre préparez-vous ? »)', () => {
  it('a son titre de page et d\'onglet', () => {
    renderChangeOfTitle()
    expect(screen.getByRole('heading', { level: 1, name: 'Quel titre préparez-vous ?' })).toBeInTheDocument()
    expect(document.title).toBe('Quel titre préparez-vous ? · Futur Citoyen')
  })

  it('propose la carte pluriannuelle, choisie par défaut', () => {
    renderChangeOfTitle()
    const option = screen.getByRole('button', { name: /Carte de séjour pluriannuelle/ })
    expect(option).toHaveAttribute('aria-pressed', 'true')
    expect(option).toBeEnabled()
  })

  it('propose la carte de résident, sélectionnable, avec son nombre de questions officielles', () => {
    renderChangeOfTitle()
    const option = screen.getByRole('button', { name: /Carte de résident/ })
    expect(option).toBeEnabled()
    expect(option).toHaveAttribute('aria-pressed', 'false')
    expect(option).toHaveTextContent('209 questions officielles')
    expect(screen.getByRole('button', { name: /Carte de séjour pluriannuelle/ })).toHaveTextContent('191 questions officielles')
  })

  it('propose la naturalisation comme les deux cartes, sans « Bientôt »', () => {
    renderChangeOfTitle()
    const option = screen.getByRole('button', { name: /Naturalisation/ })
    expect(option).toBeEnabled()
    expect(option).toHaveAttribute('aria-pressed', 'false')
    expect(option).toHaveTextContent('258 questions officielles')
    expect(screen.queryByText(/bientôt/i)).not.toBeInTheDocument()
    fireEvent.click(option)
    expect(option).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(localStorageMock.getItem('target-title')).toBe('naturalisation')
  })

  it('le groupe d\'options est nommé « Titre visé »', () => {
    renderChangeOfTitle()
    expect(screen.getByRole('group', { name: 'Titre visé' })).toBeInTheDocument()
  })

  it('choisir la carte de résident déplace la sélection, et « Continuer » l\'enregistre', () => {
    renderChangeOfTitle()
    fireEvent.click(screen.getByRole('button', { name: /Carte de résident/ }))
    expect(screen.getByRole('button', { name: /Carte de résident/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Carte de séjour pluriannuelle/ })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(localStorageMock.getItem('target-title')).toBe('resident')
    expect(screen.getByText('Accueil')).toBeInTheDocument()
  })

  it.each([
    ['resident', /Carte de résident/],
    ['pluriannuelle', /Carte de séjour pluriannuelle/],
  ])('s\'ouvre sur le titre déjà choisi (%s)', (stored, name) => {
    localStorageMock.setItem('target-title', stored)
    renderChangeOfTitle()
    expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
  })

  it('un choix illisible ouvre l\'écran sur la pluriannuelle', () => {
    localStorageMock.setItem('target-title', 'inconnu')
    renderChangeOfTitle()
    expect(screen.getByRole('button', { name: /Carte de séjour pluriannuelle/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('« Continuer » enregistre le choix et mène à l\'accueil', () => {
    renderChangeOfTitle()
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(localStorageMock.getItem('target-title')).toBe('pluriannuelle')
    expect(screen.getByText('Accueil')).toBeInTheDocument()
  })

  it('ouvert depuis la pastille de l\'accueil, propose « Retour » même sans titre enregistré', () => {
    // Utilisateur existant (historique, pas de target-title)
    renderChangeOfTitle()
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/')
  })

  it('ouvert depuis l\'accueil, « Continuer » ajoute une entrée d\'historique (le retour arrière ramène au titre)', () => {
    localStorageMock.setItem('quiz-history', EXISTING_USER_HISTORY)
    function Accueil() {
      const navigate = useNavigate()
      return <button onClick={() => navigate(-1)}>Précédent</button>
    }
    render(
      <MemoryRouter initialEntries={['/', '/titre']} initialIndex={1}>
        <Routes>
          <Route path="/titre" element={<TitreVise />} />
          <Route path="/" element={<Accueil />} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Précédent' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Quel titre préparez-vous ?' })).toBeInTheDocument()
  })
})

describe('Page de première visite', () => {
  it('accueil, choix du titre, sans « Retour »', () => {
    renderTitre()
    expect(screen.getByRole('heading', { level: 1, name: "Préparez l'examen civique" })).toBeInTheDocument()
    expect(document.title).toBe("Préparez l'examen civique · Futur Citoyen")
    expect(screen.getByText('Entraînez-vous gratuitement, avec les questions officielles. Sans inscription.')).toBeInTheDocument()
    expect(screen.getByText('Site indépendant, non officiel')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Quel titre préparez-vous ?' })).toBeInTheDocument()
    expect(screen.getByText('Vous pourrez changer plus tard.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Retour' })).toBeNull()
  })

  it('l\'en-tête ne montre pas le nom du site, seul « Affichage » reste', () => {
    renderTitre()
    const header = document.querySelector('[data-app-header]') as HTMLElement
    expect(within(header).queryByRole('link')).toBeNull()
    expect(within(header).getByRole('button', { name: 'Affichage' })).toBeInTheDocument()
  })

  it('propose les trois titres, la naturalisation comprise, sans « Bientôt »', () => {
    renderTitre()
    expect(screen.getByRole('button', { name: /Carte de séjour pluriannuelle/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Carte de résident/ })).toHaveTextContent('209 questions officielles')
    const nat = screen.getByRole('button', { name: /Naturalisation/ })
    expect(nat).toBeEnabled()
    expect(nat).toHaveTextContent('258 questions officielles')
    expect(screen.queryByText(/bientôt/i)).not.toBeInTheDocument()
    fireEvent.click(nat)
    expect(nat).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(localStorageMock.getItem('target-title')).toBe('naturalisation')
  })

  it('« Continuer » enregistre le choix et remplace la page (le retour arrière ne ramène pas ici)', () => {
    function Accueil() {
      const navigate = useNavigate()
      return <button onClick={() => navigate(-1)}>Précédent</button>
    }
    render(
      <MemoryRouter initialEntries={['/avant', '/titre']} initialIndex={1}>
        <Routes>
          <Route path="/avant" element={<p>Avant</p>} />
          <Route path="/titre" element={<TitreVise />} />
          <Route path="/" element={<Accueil />} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Carte de résident/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(localStorageMock.getItem('target-title')).toBe('resident')
    fireEvent.click(screen.getByRole('button', { name: 'Précédent' }))
    expect(screen.getByText('Avant')).toBeInTheDocument()
  })

  it('un examen en cours sans titre enregistré compte comme un utilisateur existant : « Retour »', () => {
    localStorageMock.setItem('exam-in-progress', JSON.stringify({
      questions: Array.from({ length: 40 }, (_, i) => ({
        id: i + 1, theme: 'Test', question: `Question ${i + 1}`, answer: 'A', choices: ['A', 'B', 'C', 'D'], explanation: '',
      })),
      index: 2,
      answers: [],
      timeLeft: 900,
      startedAt: '2026-11-23T10:00:00.000Z',
    }))
    renderTitre()
    expect(screen.getByRole('link', { name: 'Retour' })).toBeInTheDocument()
  })
})

describe('Sélection gardée pendant un aller-retour vers une fiche', () => {
  function Fiche() {
    const navigate = useNavigate()
    return (
      <>
        <p>Fiche</p>
        <button onClick={() => navigate(-1)}>Retour navigateur</button>
      </>
    )
  }
  function renderWithFiche() {
    render(
      <MemoryRouter initialEntries={['/titre']}>
        <Routes>
          <Route path="/titre" element={<TitreVise />} />
          <Route path="/titres/:slug" element={<Fiche />} />
          <Route path="/" element={<p>Accueil</p>} />
        </Routes>
      </MemoryRouter>,
    )
  }
  const openSheet = () =>
    fireEvent.click(screen.getByRole('link', { name: /En savoir plus sur : Carte de séjour pluriannuelle/ }))

  it('première visite : le titre choisi reste choisi au retour', () => {
    renderWithFiche()
    fireEvent.click(screen.getByRole('button', { name: /Carte de résident/ }))
    openSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Retour navigateur' }))
    expect(screen.getByRole('button', { name: /Carte de résident/ })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(localStorageMock.getItem('target-title')).toBe('resident')
  })

  it('changement de titre : le titre choisi reste choisi au retour, pas le titre enregistré', () => {
    localStorageMock.setItem('quiz-history', EXISTING_USER_HISTORY)
    localStorageMock.setItem('target-title', 'pluriannuelle')
    renderWithFiche()
    fireEvent.click(screen.getByRole('button', { name: /Carte de résident/ }))
    openSheet()
    fireEvent.click(screen.getByRole('button', { name: 'Retour navigateur' }))
    expect(screen.getByRole('button', { name: /Carte de résident/ })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(localStorageMock.getItem('target-title')).toBe('resident')
  })

  it('sans choix fait, un état d\'historique inconnu est ignoré', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/titre', state: { selected: 'nimporte' } }]}>
        <Routes>
          <Route path="/titre" element={<TitreVise />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: /Carte de séjour pluriannuelle/ })).toHaveAttribute('aria-pressed', 'true')
  })
})
