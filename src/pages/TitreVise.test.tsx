import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
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

  it('affiche la carte de résident et la naturalisation « bientôt », non sélectionnables', () => {
    renderTitre()
    for (const name of [/Carte de résident/, /Naturalisation/]) {
      const option = screen.getByRole('button', { name })
      expect(option).toBeDisabled()
      expect(option).toHaveAttribute('aria-pressed', 'false')
      expect(option).toHaveTextContent(/bientôt/i)
    }
  })

  it('« Continuer » enregistre le choix et mène à l\'accueil', () => {
    renderTitre()
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(localStorageMock.getItem('target-title')).toBe('pluriannuelle')
    expect(screen.getByText('Accueil')).toBeInTheDocument()
  })

  it('au premier lancement, pas de lien « Retour » (pas encore d\'accueil)', () => {
    renderTitre()
    expect(screen.queryByRole('link', { name: 'Retour' })).toBeNull()
  })

  it('une fois un titre choisi, propose « Retour » vers l\'accueil', () => {
    localStorageMock.setItem('target-title', 'pluriannuelle')
    renderTitre()
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/')
  })
})
