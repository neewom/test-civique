import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Home from './Home'
import TitreVise from './TitreVise'
import { ThemeProvider } from '@/components/ThemeProvider'
import { resetTargetTitleForTests } from '@/lib/target-title'

const store: Record<string, string> = {}
const ls = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
  clear: () => { for (const k of Object.keys(store)) delete store[k] },
}

beforeEach(() => {
  vi.stubGlobal('localStorage', ls)
  ls.clear()
  resetTargetTitleForTests()
})
afterEach(() => vi.unstubAllGlobals())

function Probe() {
  return <p data-testid="location">{useLocation().pathname}</p>
}

function renderAt(path: string) {
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/titre" element={<TitreVise />} />
          <Route path="*" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

const ADDRESS = {
  'Carte de séjour pluriannuelle': '/titres/carte-de-sejour-pluriannuelle',
  'Carte de résident': '/titres/carte-de-resident',
  Naturalisation: '/titres/naturalisation',
}

describe('liens vers les fiches des titres', () => {
  it.each([
    ['première visite', () => undefined],
    ['changement de titre', () => ls.setItem('quiz-history', JSON.stringify([{ date: '2026-11-20T10:00:00.000Z', score: 30, total: 40 }]))],
  ])('%s : « En savoir plus » sous chaque titre, distinct de la sélection', (_name, setup) => {
    setup()
    renderAt('/titre')
    for (const [label, href] of Object.entries(ADDRESS)) {
      const link = screen.getByRole('link', { name: new RegExp(`En savoir plus sur : ${label}`) })
      expect(link).toHaveAttribute('href', href)
    }
    // Ouvrir une fiche ne change pas le choix
    expect(ls.getItem('target-title')).toBeNull()
    fireEvent.click(screen.getByRole('link', { name: /En savoir plus sur : Carte de résident/ }))
    expect(screen.getByTestId('location')).toHaveTextContent('/titres/carte-de-resident')
    expect(ls.getItem('target-title')).toBeNull()
  })

  it('le lien « En savoir plus » est hors du bouton de sélection', () => {
    renderAt('/titre')
    const group = screen.getByRole('group', { name: 'Titre visé' })
    for (const button of within(group).getAllByRole('button')) {
      expect(within(button).queryByRole('link')).not.toBeInTheDocument()
    }
  })

  it.each([
    ['pluriannuelle', '/titres/carte-de-sejour-pluriannuelle'],
    ['resident', '/titres/carte-de-resident'],
  ])('accueil (%s) : « Tout savoir sur ce titre » mène à la fiche du titre préparé', (title, href) => {
    ls.setItem('target-title', title)
    renderAt('/')
    expect(screen.getByRole('link', { name: /Tout savoir sur ce titre/ })).toHaveAttribute('href', href)
  })
})
