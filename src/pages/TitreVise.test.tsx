import { render, screen, fireEvent } from '@testing-library/react'
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

function renderTitre(state?: unknown) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/titre', state }]}>
      <Routes>
        <Route path="/titre" element={<TitreVise />} />
        <Route path="/" element={<p>Accueil</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Écran « Quel titre préparez-vous ? »', () => {
  it('a son titre de page et d\'onglet', () => {
    renderTitre()
    expect(screen.getByRole('heading', { level: 1, name: 'Quel titre préparez-vous ?' })).toBeInTheDocument()
    expect(document.title).toBe('Quel titre préparez-vous ? · Futur Citoyen')
  })

  it('propose la carte pluriannuelle, choisie par défaut', () => {
    renderTitre()
    const option = screen.getByRole('button', { name: /Carte de séjour pluriannuelle/ })
    expect(option).toHaveAttribute('aria-pressed', 'true')
    expect(option).toBeEnabled()
  })

  it('propose la carte de résident, sélectionnable, avec son nombre de questions officielles', () => {
    renderTitre()
    const option = screen.getByRole('button', { name: /Carte de résident/ })
    expect(option).toBeEnabled()
    expect(option).toHaveAttribute('aria-pressed', 'false')
    expect(option).toHaveTextContent('209 questions officielles')
    expect(screen.getByRole('button', { name: /Carte de séjour pluriannuelle/ })).toHaveTextContent('191 questions officielles')
  })

  it('affiche la naturalisation « bientôt », non sélectionnable', () => {
    renderTitre()
    const option = screen.getByRole('button', { name: /Naturalisation/ })
    expect(option).toBeDisabled()
    expect(option).toHaveAttribute('aria-pressed', 'false')
    expect(option).toHaveTextContent(/bientôt/i)
  })

  it('le groupe d\'options est nommé « Titre visé »', () => {
    renderTitre()
    expect(screen.getByRole('group', { name: 'Titre visé' })).toBeInTheDocument()
  })

  it('choisir la carte de résident déplace la sélection, et « Continuer » l\'enregistre', () => {
    renderTitre()
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
    renderTitre()
    expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
  })

  it('un choix illisible ouvre l\'écran sur la pluriannuelle', () => {
    localStorageMock.setItem('target-title', 'inconnu')
    renderTitre()
    expect(screen.getByRole('button', { name: /Carte de séjour pluriannuelle/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('« Continuer » enregistre le choix et mène à l\'accueil', () => {
    renderTitre()
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(localStorageMock.getItem('target-title')).toBe('pluriannuelle')
    expect(screen.getByText('Accueil')).toBeInTheDocument()
  })

  it('au premier lancement (renvoyé par l\'accueil), pas de lien « Retour »', () => {
    renderTitre({ firstLaunch: true })
    expect(screen.queryByRole('link', { name: 'Retour' })).toBeNull()
  })

  it('ouvert depuis la pastille de l\'accueil, propose « Retour » même sans titre enregistré', () => {
    // Utilisateur existant (historique, pas de target-title) : il arrive sans l'état de redirection
    localStorageMock.setItem('quiz-history', JSON.stringify([{ date: '2026-11-20T10:00:00.000Z', score: 30, total: 40 }]))
    renderTitre()
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/')
  })

  it('ouvert depuis l\'accueil, « Continuer » ajoute une entrée d\'historique (le retour arrière ramène au titre)', () => {
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
