import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Revision from './Revision'
import type { ReviewState } from './ExamenDetail'
import allQuestions from '@/data/questions.json'
import { stubWideScreen } from '@/test/wide-screen'
import { ThemeProvider } from '@/components/ThemeProvider'

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

// Revision shows the pool of the chosen title, the multi-year permit by default
const questions = allQuestions.filter((q) => q.lists.includes('pluriannuelle'))
const official = questions.filter((q) => q.notion !== 'mise-en-situation')
const situational = questions.filter((q) => q.notion === 'mise-en-situation')
const themes = [...new Set(questions.map((q) => q.theme))]

function renderRevision(state?: unknown) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/revision', state }]}>
      <Revision />
    </MemoryRouter>,
  )
}

function setHistory(...exams: { questionId: number; correct: boolean }[][]) {
  localStorage.setItem(
    'quiz-history',
    JSON.stringify(
      exams.map((answers, i) => ({
        id: `e${i}`,
        date: '2026-11-01T10:00:00.000Z',
        score: 0,
        total: 40,
        answers: answers.map((a) => ({ ...a, chosen: a.correct ? 'x' : null })),
      })),
    ),
  )
}

const pill = (name: string | RegExp) => screen.getByRole('button', { name })
const shownCards = () => screen.queryAllByText('Bonne réponse')

describe('Revision — structure', () => {
  it('donne le titre "Révision · Futur Citoyen" à l\'onglet', () => {
    renderRevision()
    expect(document.title).toBe('Révision · Futur Citoyen')
  })

  it('affiche le titre « Réviser », le titre visé et le nombre de questions', () => {
    renderRevision()
    expect(screen.getByRole('heading', { level: 1, name: 'Réviser' })).toBeInTheDocument()
    expect(screen.getByText(`Carte de séjour pluriannuelle · ${questions.length} questions`)).toBeInTheDocument()
  })

  it('affiche toutes les questions avec leur bonne réponse', () => {
    renderRevision()
    expect(shownCards()).toHaveLength(questions.length)
    questions.forEach((q) => {
      expect(screen.getByRole('heading', { level: 3, name: q.question })).toBeInTheDocument()
    })
    // 291 role queries take about 4 s alone and pass the 5 s default when the suite runs in parallel
  }, 15_000)

  it('regroupe les questions par thème', () => {
    renderRevision()
    themes.forEach((theme) => {
      const section = screen.getByRole('region', { name: `Thème : ${theme}` })
      expect(within(section).getAllByRole('listitem')).toHaveLength(questions.filter((q) => q.theme === theme).length)
    })
  })

  it('affiche le lien retour vers le parcours', () => {
    renderRevision()
    expect(screen.getByRole('link', { name: 'Mon parcours' })).toHaveAttribute('href', '/')
  })
})

describe('Revision — filtres par thème', () => {
  it('« Tous les thèmes » est actif par défaut, avec une pastille par thème', () => {
    renderRevision()
    expect(pill('Tous les thèmes')).toHaveAttribute('aria-pressed', 'true')
    themes.forEach((theme) => expect(pill(theme)).toHaveAttribute('aria-pressed', 'false'))
  })

  it('filtrer par thème n\'affiche que les questions de ce thème', () => {
    renderRevision()
    fireEvent.click(pill(themes[0]))
    expect(pill(themes[0])).toHaveAttribute('aria-pressed', 'true')
    expect(pill('Tous les thèmes')).toHaveAttribute('aria-pressed', 'false')
    expect(shownCards()).toHaveLength(questions.filter((q) => q.theme === themes[0]).length)
    expect(screen.queryByText(questions.find((q) => q.theme !== themes[0])!.question)).not.toBeInTheDocument()
  })

  it('« Tous les thèmes » réaffiche toutes les questions', () => {
    renderRevision()
    fireEvent.click(pill(themes[0]))
    fireEvent.click(pill('Tous les thèmes'))
    expect(shownCards()).toHaveLength(questions.length)
  })
})

describe('Revision — sans les mises en situation', () => {
  it('retire les mises en situation et met le compte à jour', () => {
    renderRevision()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sans les mises en situation' }))
    expect(shownCards()).toHaveLength(official.length)
    expect(screen.queryByText(situational[0].question)).not.toBeInTheDocument()
    expect(screen.getByText(`Carte de séjour pluriannuelle · ${official.length} questions`)).toBeInTheDocument()
  })

  it('garde le thème choisi quand on coche ou décoche la case', () => {
    renderRevision()
    const checkbox = screen.getByRole('checkbox', { name: 'Sans les mises en situation' })
    fireEvent.click(pill(themes[0]))
    fireEvent.click(checkbox)
    expect(pill(themes[0])).toHaveAttribute('aria-pressed', 'true')
    expect(shownCards()).toHaveLength(official.filter((q) => q.theme === themes[0]).length)
    fireEvent.click(checkbox)
    expect(pill(themes[0])).toHaveAttribute('aria-pressed', 'true')
    expect(shownCards()).toHaveLength(questions.filter((q) => q.theme === themes[0]).length)
  })
})

describe('Revision — À revoir', () => {
  it('affiche « À revoir (0) » et un message quand rien n\'est à revoir', () => {
    renderRevision()
    fireEvent.click(pill('À revoir (0)'))
    expect(shownCards()).toHaveLength(0)
    expect(screen.getByText('Aucune question à revoir pour l\'instant.')).toBeInTheDocument()
  })

  it('ignore les questions retirées des données : compte à 0 et message explicatif', () => {
    setHistory([{ questionId: 99999, correct: false }, { questionId: 88888, correct: false }])
    renderRevision()
    fireEvent.click(pill('À revoir (0)'))
    expect(shownCards()).toHaveLength(0)
    expect(screen.getByText('Aucune question à revoir pour l\'instant.')).toBeInTheDocument()
  })

  it('n\'affiche que les questions dont la dernière réponse était fausse ou absente', () => {
    setHistory(
      [{ questionId: 1, correct: false }, { questionId: 2, correct: false }, { questionId: 3, correct: true }],
      [{ questionId: 1, correct: true }, { questionId: 200, correct: false }],
    )
    renderRevision()
    fireEvent.click(pill('À revoir (2)'))
    expect(shownCards()).toHaveLength(2)
    expect(screen.getByText(questions.find((q) => q.id === 2)!.question)).toBeInTheDocument()
    expect(screen.getByText(questions.find((q) => q.id === 200)!.question)).toBeInTheDocument()
    expect(screen.queryByText(questions.find((q) => q.id === 1)!.question)).not.toBeInTheDocument()
  })

  it('le compte suit la case « Sans les mises en situation »', () => {
    setHistory([{ questionId: 2, correct: false }, { questionId: 200, correct: false }])
    renderRevision()
    fireEvent.click(pill('À revoir (2)'))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sans les mises en situation' }))
    expect(pill('À revoir (1)')).toHaveAttribute('aria-pressed', 'true')
    expect(shownCards()).toHaveLength(1)
  })

  it('invite à décocher la case quand elle masque toutes les questions à revoir', () => {
    setHistory([{ questionId: 200, correct: false }])
    renderRevision()
    fireEvent.click(pill('À revoir (1)'))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sans les mises en situation' }))
    expect(screen.getByText('Aucune question avec ces filtres.')).toBeInTheDocument()
    expect(screen.getByText(/Décochez « Sans les mises en situation »/)).toBeInTheDocument()
  })
})

describe('Revision — arrivée depuis le détail d\'un examen', () => {
  it('s\'ouvre sur les questions de cet examen', () => {
    const state: ReviewState = { reviewIds: [5, 250] }
    renderRevision(state)
    expect(pill('Cet examen (2)')).toHaveAttribute('aria-pressed', 'true')
    expect(shownCards()).toHaveLength(2)
    expect(screen.getByText(questions.find((q) => q.id === 5)!.question)).toBeInTheDocument()
  })

  it('permet de revenir à toutes les questions', () => {
    renderRevision({ reviewIds: [5] })
    fireEvent.click(pill('Tous les thèmes'))
    expect(shownCards()).toHaveLength(questions.length)
  })

  it('ignore les valeurs invalides', () => {
    renderRevision({ reviewIds: [5, 'x', 99999, null] })
    expect(pill('Cet examen (1)')).toBeInTheDocument()
    expect(shownCards()).toHaveLength(1)
  })

  it('s\'ouvre normalement sans identifiant valide', () => {
    renderRevision({ reviewIds: 'x' })
    expect(screen.queryByRole('button', { name: /Cet examen/ })).not.toBeInTheDocument()
    expect(pill('Tous les thèmes')).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Revision — lien source', () => {
  type WithSource = (typeof questions)[number] & { source?: { url: string; label: string } }
  const first = questions[0] as WithSource
  // Real sources are set aside so each test controls which question has one.
  const realSources = new Map((questions as WithSource[]).filter((q) => q.source).map((q) => [q, q.source]))

  beforeEach(() => {
    realSources.forEach((_, q) => delete q.source)
  })
  afterEach(() => {
    delete first.source
    realSources.forEach((source, q) => { q.source = source })
  })

  it('affiche le lien source sous l\'explication d\'une question qui en a un', () => {
    first.source = { url: 'https://www.elysee.fr/x', label: 'elysee.fr' }
    renderRevision()
    const links = screen.getAllByRole('link', { name: /^Source :/ })
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAccessibleName('Source : elysee.fr (nouvel onglet)')
    expect(links[0]).toHaveAttribute('href', 'https://www.elysee.fr/x')
    const card = links[0].closest('li')!
    expect(within(card).getByRole('heading', { level: 3 })).toHaveTextContent(first.question)
    // Under the explanation
    expect(within(card).getByText(first.explanation).compareDocumentPosition(links[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('n\'affiche aucun lien source quand aucune question n\'en a', () => {
    renderRevision()
    expect(screen.queryByRole('link', { name: /^Source :/ })).not.toBeInTheDocument()
  })
})

describe('Revision — en-tête', () => {
  it.each([true, false])('un seul bouton « Affichage » et aucun interrupteur de thème (grand écran : %s)', (wide) => {
    stubWideScreen(wide)
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/revision']}>
          <Revision />
        </MemoryRouter>
      </ThemeProvider>,
    )
    expect(screen.getAllByRole('button', { name: 'Affichage' })).toHaveLength(1)
    expect(screen.queryByRole('switch')).toBeNull()
  })
})

describe('Revision — titre visé', () => {
  it('« À revoir » ne prend que les examens du titre choisi (sans titre = pluriannuelle)', () => {
    localStorage.setItem(
      'quiz-history',
      JSON.stringify([
        { id: 'a', date: '2026-11-01T10:00:00.000Z', score: 0, total: 40, answers: [{ questionId: 1, chosen: null, correct: false }] },
        {
          id: 'b',
          date: '2026-11-02T10:00:00.000Z',
          score: 0,
          total: 40,
          title: 'resident',
          answers: [{ questionId: 2, chosen: null, correct: false }],
        },
      ]),
    )
    renderRevision()
    expect(pill('À revoir (1)')).toBeInTheDocument()
  })

  it('« Sans les mises en situation » retire les questions de notion mise-en-situation', () => {
    renderRevision()
    fireEvent.click(screen.getByLabelText('Sans les mises en situation'))
    const classical = questions.filter((q) => q.notion !== 'mise-en-situation')
    expect(shownCards()).toHaveLength(classical.length)
  })
})

describe('Revision — carte de résident', () => {
  const residentQuestions = allQuestions.filter((q) => q.lists.includes('resident'))

  it('affiche le libellé du titre et le nombre de questions de la liste de la carte de résident', () => {
    localStorageMock.setItem('target-title', 'resident')
    renderRevision()
    expect(residentQuestions.filter((q) => q.notion !== 'mise-en-situation')).toHaveLength(209)
    expect(screen.getByText(`Carte de résident · ${residentQuestions.length} questions`)).toBeInTheDocument()
    expect(screen.queryByText(/Carte de séjour pluriannuelle/)).toBeNull()
  })

  it('« sans les mises en situation » retire celles de la carte de résident', () => {
    localStorageMock.setItem('target-title', 'resident')
    renderRevision()
    fireEvent.click(screen.getByRole('checkbox', { name: /mises en situation/ }))
    const official = residentQuestions.filter((q) => q.notion !== 'mise-en-situation')
    expect(screen.getByText(`Carte de résident · ${official.length} questions`)).toBeInTheDocument()
  })
})

describe('Revision — naturalisation', () => {
  const natQuestions = allQuestions.filter((q) => q.lists.includes('naturalisation'))

  it('affiche le libellé du titre et le nombre de questions de la liste de la naturalisation', () => {
    localStorageMock.setItem('target-title', 'naturalisation')
    renderRevision()
    expect(natQuestions.filter((q) => q.notion !== 'mise-en-situation')).toHaveLength(258)
    expect(screen.getByText(`Naturalisation · ${natQuestions.length} questions`)).toBeInTheDocument()
    expect(screen.queryByText(/Carte de séjour pluriannuelle/)).toBeNull()
  })

  it('« sans les mises en situation » retire celles de la naturalisation', () => {
    localStorageMock.setItem('target-title', 'naturalisation')
    renderRevision()
    fireEvent.click(screen.getByRole('checkbox', { name: /mises en situation/ }))
    const official = natQuestions.filter((q) => q.notion !== 'mise-en-situation')
    expect(screen.getByText(`Naturalisation · ${official.length} questions`)).toBeInTheDocument()
  })
})
