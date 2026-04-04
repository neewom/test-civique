import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Revision from './Revision'
import questions from '@/data/questions.json'

// localStorage mock — jsdom dans ce projet ne fournit pas une implémentation complète
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

function renderRevision() {
  render(
    <MemoryRouter>
      <Revision />
    </MemoryRouter>
  )
}

/** Ouvre le panneau de filtres. */
async function openFilters() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /filtres/i }))
  })
}

// ── Structure de base ────────────────────────────────────────────────────────

describe('Revision — structure', () => {
  it('affiche le titre "Mode révision"', () => {
    renderRevision()
    expect(screen.getByRole('heading', { level: 1, name: /mode révision/i })).toBeInTheDocument()
  })

  it('affiche le nombre total de questions', () => {
    renderRevision()
    expect(screen.getByText(`${questions.length} questions par thème`)).toBeInTheDocument()
  })

  it('affiche toutes les questions', () => {
    renderRevision()
    questions.forEach((q) => {
      expect(screen.getByText(q.question)).toBeInTheDocument()
    })
  })

  it('affiche les bonnes réponses mises en évidence', () => {
    renderRevision()
    expect(screen.getAllByText('Bonne réponse')).toHaveLength(questions.length)
  })

  it('affiche une section par thème', () => {
    renderRevision()
    const themes = [...new Set(questions.map((q) => q.theme))]
    themes.forEach((theme) => {
      expect(screen.getByRole('region', { name: `Thème : ${theme}` })).toBeInTheDocument()
    })
  })

  it('affiche le lien retour vers l\'accueil', () => {
    renderRevision()
    expect(screen.getByText(/← Accueil/)).toBeInTheDocument()
  })
})

// ── Bouton Filtres ───────────────────────────────────────────────────────────

describe('Revision — bouton Filtres', () => {
  it('affiche un bouton "Filtres" dans le header', () => {
    renderRevision()
    expect(screen.getByRole('button', { name: /filtres/i })).toBeInTheDocument()
  })

  it('le bouton Filtres a aria-expanded="false" par défaut', () => {
    renderRevision()
    expect(screen.getByRole('button', { name: /filtres/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('les filtres internes ne sont pas accessibles par défaut (aria-hidden)', () => {
    renderRevision()
    expect(screen.queryByRole('button', { name: 'Tous' })).toBeNull()
  })

  it('cliquer sur "Filtres" ouvre le panneau et expose les filtres', async () => {
    renderRevision()
    await openFilters()
    expect(screen.getByRole('button', { name: /filtres/i })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Tous' })).toBeInTheDocument()
  })

  it('recliquer sur "Filtres" referme le panneau', async () => {
    renderRevision()
    const btn = screen.getByRole('button', { name: /filtres/i })
    await act(async () => { fireEvent.click(btn) })
    await act(async () => { fireEvent.click(btn) })
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Tous' })).toBeNull()
  })

  it('le badge de filtre n\'est pas affiché quand aucun filtre n\'est actif', () => {
    renderRevision()
    // aria-label du bouton ne contient pas de mention "actif" par défaut
    expect(screen.getByRole('button', { name: 'Filtres' })).toBeInTheDocument()
  })

  it('le badge indique 1 filtre actif après sélection d\'un thème', async () => {
    renderRevision()
    await openFilters()
    const firstTheme = [...new Set(questions.map((q) => q.theme))][0]
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: firstTheme }))
    })
    expect(screen.getByRole('button', { name: /1 actif/i })).toBeInTheDocument()
  })

  it('le badge indique 2 filtres actifs après sans mise en situation + thème', async () => {
    renderRevision()
    await openFilters()
    // 1. activer "sans mise en situation" (remet activeTheme à null)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sans les questions/i }))
    })
    // 2. sélectionner un thème (excludeSituational reste true)
    const firstTheme = [...new Set(questions.map((q) => q.theme))][0]
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: firstTheme }))
    })
    expect(screen.getByRole('button', { name: /2 actifs/i })).toBeInTheDocument()
  })
})

// ── Filtres — comportement ───────────────────────────────────────────────────

describe('Revision — filtres par thème', () => {
  it('affiche un bouton "Tous" et un bouton par thème dans le panneau', async () => {
    renderRevision()
    await openFilters()
    const themes = [...new Set(questions.map((q) => q.theme))]
    expect(screen.getByRole('button', { name: 'Tous' })).toBeInTheDocument()
    themes.forEach((theme) => {
      expect(screen.getByRole('button', { name: theme })).toBeInTheDocument()
    })
  })

  it('le bouton "Tous" est actif par défaut', async () => {
    renderRevision()
    await openFilters()
    expect(screen.getByRole('button', { name: 'Tous' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('filtrer par thème n\'affiche que les questions de ce thème', async () => {
    renderRevision()
    await openFilters()
    const firstTheme = [...new Set(questions.map((q) => q.theme))][0]
    const themeQuestions = questions.filter((q) => q.theme === firstTheme)
    const otherQuestions = questions.filter((q) => q.theme !== firstTheme)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: firstTheme }))
    })

    themeQuestions.forEach((q) => {
      expect(screen.getByText(q.question)).toBeInTheDocument()
    })
    expect(screen.queryByText(otherQuestions[0].question)).not.toBeInTheDocument()
  })

  it('le bouton du thème actif est mis en évidence (aria-pressed)', async () => {
    renderRevision()
    await openFilters()
    const firstTheme = [...new Set(questions.map((q) => q.theme))][0]
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: firstTheme }))
    })
    expect(screen.getByRole('button', { name: firstTheme })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Tous' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('cliquer sur "Tous" réaffiche toutes les questions', async () => {
    renderRevision()
    await openFilters()
    const firstTheme = [...new Set(questions.map((q) => q.theme))][0]
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: firstTheme }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tous' }))
    })
    expect(screen.getAllByText('Bonne réponse')).toHaveLength(questions.length)
  })
})
