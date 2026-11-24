import { render, screen } from '@testing-library/react'
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
      expect(screen.getByRole('heading', { level: 1, name: 'Futur Citoyen' })).toBeInTheDocument()
      expect(window.location.pathname).toBe('/')
    },
  )

  it('affiche toujours l\'accueil sur /', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1, name: 'Futur Citoyen' })).toBeInTheDocument()
  })
})
