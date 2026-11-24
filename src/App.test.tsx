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

  it('garde l\'interrupteur de thème sur les autres pages, une seule fois sur l\'accueil', () => {
    renderAt('/regles')
    expect(screen.getAllByRole('switch')).toHaveLength(1)
  })

  it('l\'accueil n\'affiche qu\'un interrupteur de thème, dans son en-tête', () => {
    renderAt('/')
    const switches = screen.getAllByRole('switch')
    expect(switches).toHaveLength(1)
    expect(screen.getByRole('banner')).toContainElement(switches[0])
  })
})
