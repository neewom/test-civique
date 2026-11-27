import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FicheTitre from './FicheTitre'
import { OFFLINE_TITLE_NOTE } from './TitreVise'
import { resetQuestionPacksForTests } from '@/lib/question-packs'
import { loadTargetTitle } from '@/lib/target-title'

let store: Record<string, string> = {}
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => void (store[k] = v),
  removeItem: (k: string) => void delete store[k],
  clear: () => void (store = {}),
}
let online = true
let cachedTitles = ['pluriannuelle']

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageMock)
  localStorageMock.clear()
  localStorageMock.setItem('target-title', 'pluriannuelle')
  online = true
  cachedTitles = ['pluriannuelle']
  resetQuestionPacksForTests()
  const worker = {
    postMessage: (m: { type: string }, ports?: MessagePort[]) => {
      if (m.type === 'cached-packs') ports?.[0]?.postMessage(cachedTitles)
    },
  }
  vi.stubGlobal('navigator', {
    ...navigator,
    get onLine() {
      return online
    },
    serviceWorker: { getRegistration: () => Promise.resolve({ active: worker }) },
  })
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function renderFiche(slug: string) {
  render(
    <MemoryRouter initialEntries={[`/titres/${slug}`]}>
      <Routes>
        <Route path="/titres/:slug" element={<FicheTitre />} />
        <Route path="/" element={<p>Accueil</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Fiche d\'un titre hors ligne', () => {
  it('en ligne, le bouton fonctionne et aucune mention n\'apparaît', () => {
    renderFiche('carte-de-resident')
    expect(screen.getByRole('button', { name: "M'entraîner pour ce titre" })).not.toHaveAttribute('aria-disabled')
    expect(screen.queryByText(OFFLINE_TITLE_NOTE)).not.toBeInTheDocument()
  })

  it('hors ligne, « M\'entraîner pour ce titre » est désactivé avec la mention quand le titre n\'est pas sur l\'appareil', async () => {
    online = false
    renderFiche('carte-de-resident')
    const button = screen.getByRole('button', { name: "M'entraîner pour ce titre" })
    await waitFor(() => expect(button).toHaveAttribute('aria-disabled', 'true'))
    const note = screen.getByText(OFFLINE_TITLE_NOTE)
    expect(button).toHaveAttribute('aria-describedby', note.closest('p')!.id)
    fireEvent.click(button)
    expect(loadTargetTitle()).toBe('pluriannuelle')
    expect(screen.queryByText('Accueil')).not.toBeInTheDocument()
  })

  it('hors ligne, le titre dont le paquet est en cache reste utilisable', async () => {
    online = false
    renderFiche('carte-de-sejour-pluriannuelle')
    await screen.findByRole('button', { name: 'Continuer mon entraînement' })
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.getByRole('button', { name: 'Continuer mon entraînement' })).not.toHaveAttribute('aria-disabled')
    expect(screen.queryByText(OFFLINE_TITLE_NOTE)).not.toBeInTheDocument()
  })

  it('le titre déjà choisi n\'est jamais grisé, même si son paquet n\'est pas sur l\'appareil', async () => {
    online = false
    cachedTitles = []
    renderFiche('carte-de-sejour-pluriannuelle')
    const button = await screen.findByRole('button', { name: 'Continuer mon entraînement' })
    await new Promise((r) => setTimeout(r, 20))
    expect(button).not.toHaveAttribute('aria-disabled')
    expect(screen.queryByText(OFFLINE_TITLE_NOTE)).not.toBeInTheDocument()
  })
})
