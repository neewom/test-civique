import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import App from './App'

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
  // Titre déjà choisi : sans choix, l'accueil renvoie vers l'écran du titre (testé plus bas)
  localStorageMock.setItem('target-title', 'pluriannuelle')
})

afterEach(() => {
  vi.unstubAllGlobals()
  window.history.replaceState(null, '', '/')
})

function renderAt(path: string) {
  window.history.replaceState(null, '', path)
  render(<App />)
}

describe('App routing', () => {
  it.each(['/quiz', '/result', '/history', '/adresse-inconnue'])(
    'renvoie %s vers l\'accueil',
    (path) => {
      renderAt(path)
      expect(screen.getByRole('heading', { level: 1, name: 'Votre chemin vers le jour J' })).toBeInTheDocument()
      expect(window.location.pathname).toBe('/')
    },
  )

  it('affiche toujours l\'accueil sur /', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1, name: 'Votre chemin vers le jour J' })).toBeInTheDocument()
  })

  it('ouvre l\'écran du titre au premier lancement, puis l\'accueil après « Continuer »', async () => {
    localStorageMock.clear()
    renderAt('/')
    expect(window.location.pathname).toBe('/titre')
    expect(screen.getByRole('heading', { level: 1, name: 'Quel titre préparez-vous ?' })).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    })
    expect(window.location.pathname).toBe('/')
    expect(localStorageMock.getItem('target-title')).toBe('pluriannuelle')
    expect(screen.getByRole('heading', { level: 1, name: 'Votre chemin vers le jour J' })).toBeInTheDocument()
  })

  it('sert la page « Comment se passe l\'examen » sur /regles', () => {
    renderAt('/regles')
    expect(screen.getByRole('heading', { level: 1, name: "Comment se passe l'examen" })).toBeInTheDocument()
  })

  // Le bouton « Affichage » remplace l'interrupteur de thème fixe
  it.each(['/', '/examen', '/revision', '/regles', '/titre', '/mentions-legales', '/examen/inconnu'])(
    'affiche un seul en-tête (logo et bouton « Affichage ») sur %s, sans interrupteur de thème',
    (path) => {
      renderAt(path)
      expect(screen.getAllByRole('button', { name: 'Affichage' })).toHaveLength(1)
      expect(screen.queryByRole('switch')).not.toBeInTheDocument()
      expect(document.querySelectorAll('[data-app-header]')).toHaveLength(1)
      // Un seul repère « banner » explicite (le <header> du bandeau d'examen n'en est pas un)
      expect(document.querySelectorAll('[role=banner]')).toHaveLength(1)
    },
  )

  it.each([
    ['setItem lève (stockage plein)', { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError') }, removeItem: () => {}, clear: () => {} }],
    ['getItem lève (données de site bloquées)', { getItem: () => { throw new Error('SecurityError') }, setItem: () => { throw new Error('SecurityError') }, removeItem: () => {}, clear: () => {} }],
  ])('sans stockage utilisable (%s), « Continuer » mène quand même à l\'accueil', async (_label, storage) => {
    vi.stubGlobal('localStorage', storage)
    renderAt('/')
    expect(window.location.pathname).toBe('/titre')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    })
    expect(window.location.pathname).toBe('/')
    expect(screen.getByRole('heading', { level: 1, name: 'Votre chemin vers le jour J' })).toBeInTheDocument()
  })
})
