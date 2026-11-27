import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TitreVise, { OFFLINE_NONE_NOTICE, OFFLINE_NOTICE, OFFLINE_TITLE_NOTE } from './TitreVise'
import { resetQuestionPacksForTests } from '@/lib/question-packs'
import { loadTargetTitle } from '@/lib/target-title'

// Change of title while the device is offline: only the titles whose pack of questions is on the device
// (in the service worker's cache) can be chosen.
let store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value
  },
  removeItem: (key: string) => {
    delete store[key]
  },
  clear: () => {
    store = {}
  },
}

let online = true
// What the stubbed service worker says is in its cache
let cachedTitles: string[] = []

function stubServiceWorker() {
  const worker = {
    postMessage: (message: { type: string }, ports?: MessagePort[]) => {
      if (message.type === 'cached-packs') ports?.[0]?.postMessage(cachedTitles)
    },
  }
  vi.stubGlobal('navigator', {
    ...navigator,
    get onLine() {
      return online
    },
    serviceWorker: { getRegistration: () => Promise.resolve({ active: worker }) },
  })
}

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageMock)
  localStorageMock.clear()
  // A visitor with an exam done (not a first visit), the multi-year card chosen
  localStorageMock.setItem('quiz-history', JSON.stringify([{ date: '2026-11-20T10:00:00.000Z', score: 30, total: 40 }]))
  localStorageMock.setItem('target-title', 'pluriannuelle')
  online = true
  cachedTitles = ['pluriannuelle']
  // The test setup loads every pack in memory: here none is
  resetQuestionPacksForTests()
  stubServiceWorker()
})

afterEach(() => {
  cleanup()
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

function setOnline(value: boolean) {
  online = value
  act(() => {
    window.dispatchEvent(new Event(value ? 'online' : 'offline'))
  })
}

const option = (name: RegExp) => screen.getByRole('button', { name })

describe('Changement de titre hors ligne', () => {
  it('en ligne, rien ne change : aucun titre grisé, aucune mention', () => {
    renderTitre()
    for (const name of [/pluriannuelle/, /résident/, /Naturalisation/]) {
      expect(option(name)).not.toHaveAttribute('aria-disabled')
    }
    expect(screen.queryByText(OFFLINE_TITLE_NOTE)).not.toBeInTheDocument()
    expect(screen.queryByText(OFFLINE_NOTICE)).not.toBeInTheDocument()
  })

  it('hors ligne, grise les titres dont le paquet n\'est pas en cache, avec la mention et la phrase', async () => {
    online = false
    renderTitre()
    expect(screen.getByText(OFFLINE_NOTICE)).toBeInTheDocument()
    await waitFor(() => expect(option(/résident/)).toHaveAttribute('aria-disabled', 'true'))
    expect(option(/Naturalisation/)).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getAllByText(OFFLINE_TITLE_NOTE)).toHaveLength(2)
    // The title whose pack is cached stays usable and keeps its count
    expect(option(/pluriannuelle/)).not.toHaveAttribute('aria-disabled')
    expect(option(/pluriannuelle/)).toHaveTextContent('questions officielles')
    // « En savoir plus » stays available
    expect(screen.getAllByRole('link', { name: /En savoir plus/ })).toHaveLength(3)
  })

  it('un titre grisé ne se choisit pas, même au clic', async () => {
    online = false
    renderTitre()
    await waitFor(() => expect(option(/résident/)).toHaveAttribute('aria-disabled', 'true'))
    fireEvent.click(option(/résident/))
    expect(option(/résident/)).toHaveAttribute('aria-pressed', 'false')
    expect(option(/pluriannuelle/)).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(loadTargetTitle()).toBe('pluriannuelle')
  })

  it('un paquet en mémoire compte comme présent sur l\'appareil, même sans cache', async () => {
    online = false
    cachedTitles = []
    const { loadQuestionPack } = await import('@/lib/question-packs')
    await loadQuestionPack('resident')
    renderTitre()
    await waitFor(() => expect(option(/Naturalisation/)).toHaveAttribute('aria-disabled', 'true'))
    expect(option(/résident/)).not.toHaveAttribute('aria-disabled')
  })

  it('le retour en ligne dégrise tout, la perte de connexion regrise', async () => {
    online = false
    renderTitre()
    await waitFor(() => expect(option(/résident/)).toHaveAttribute('aria-disabled', 'true'))
    setOnline(true)
    expect(option(/résident/)).not.toHaveAttribute('aria-disabled')
    expect(screen.queryByText(OFFLINE_NOTICE)).not.toBeInTheDocument()
    setOnline(false)
    await waitFor(() => expect(option(/résident/)).toHaveAttribute('aria-disabled', 'true'))
  })

  it('sans service worker, hors ligne : seuls les titres déjà en mémoire restent disponibles', async () => {
    online = false
    vi.stubGlobal('navigator', {
      ...navigator,
      get onLine() {
        return online
      },
    })
    const { loadQuestionPack } = await import('@/lib/question-packs')
    await loadQuestionPack('pluriannuelle')
    renderTitre()
    await waitFor(() => expect(option(/résident/)).toHaveAttribute('aria-disabled', 'true'))
    expect(option(/pluriannuelle/)).not.toHaveAttribute('aria-disabled')
  })

  it('hors ligne sans aucun titre sur l\'appareil, la phrase dit de se reconnecter', async () => {
    online = false
    cachedTitles = []
    renderTitre()
    await waitFor(() => expect(screen.getByText(OFFLINE_NONE_NOTICE)).toBeInTheDocument())
    expect(screen.queryByText(OFFLINE_NOTICE)).not.toBeInTheDocument()
    expect(screen.getAllByText(OFFLINE_TITLE_NOTE)).toHaveLength(3)
  })
})
