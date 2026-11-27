import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Examen from './Examen'
import ExamenDetail from './ExamenDetail'
import FicheTitre from './FicheTitre'
import Home from './Home'
import Revision from './Revision'
import TitreVise from './TitreVise'
import { ThemeProvider } from '@/components/ThemeProvider'
import { saveProgress } from '@/lib/exam-types'
import type { ExamRecord } from '@/lib/exam-types'
import {
  getLoadedPack,
  loadQuestionPack,
  resetQuestionPacksForTests,
  setQuestionPackLoaderForTests,
} from '@/lib/question-packs'
import { buildExam } from '@/lib/exam'
import { TITLE_KEYS, type TitleKey } from '@/lib/target-title'
import { ALL_QUESTIONS, questionsForTitle } from '@/test/questions'

// The questions load on demand: here no pack is in memory at the start of each test (the test
// setup puts them there), and each loader is a spy that the test can hold back or make fail.
type Loader = ReturnType<typeof spyLoaders>[TitleKey]
function spyLoaders() {
  const out = {} as Record<TitleKey, ReturnType<typeof vi.fn<() => Promise<{ default: ReturnType<typeof questionsForTitle> }>>>>
  for (const title of TITLE_KEYS) {
    const real = questionsForTitle(title, ALL_QUESTIONS)
    out[title] = vi.fn(async () => ({ default: real }))
    setQuestionPackLoaderForTests(title, out[title])
  }
  return out
}

function deferred(title: TitleKey, loader: Loader) {
  let resolve!: () => void
  let reject!: (e: Error) => void
  const gate = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  const real = questionsForTitle(title, ALL_QUESTIONS)
  loader.mockImplementationOnce(async () => {
    await gate
    return { default: real }
  })
  return { resolve, reject }
}

beforeEach(() => {
  localStorage.clear()
  resetQuestionPacksForTests()
})
afterEach(() => {
  resetQuestionPacksForTests()
})

const flush = () => act(async () => {})

describe('Révision : chargement des questions', () => {
  const renderRevision = () =>
    render(
      <MemoryRouter>
        <Revision />
      </MemoryRouter>,
    )

  it('montre « Chargement des questions… » puis les questions, avec les nombres déjà là', async () => {
    const loaders = spyLoaders()
    const gate = deferred('pluriannuelle', loaders.pluriannuelle)
    renderRevision()
    expect(screen.getByRole('heading', { level: 1, name: 'Réviser' })).toBeInTheDocument()
    expect(screen.getByText(/191 questions \+ 100 mises en situation/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des questions…')
    expect(screen.queryByRole('group', { name: 'Questions à afficher' })).not.toBeInTheDocument()
    await act(async () => gate.resolve())
    expect(await screen.findByRole('group', { name: 'Questions à afficher' })).toBeInTheDocument()
    expect(screen.queryByText('Chargement des questions…')).not.toBeInTheDocument()
    expect(loaders.pluriannuelle).toHaveBeenCalledTimes(1)
    expect(loaders.resident).not.toHaveBeenCalled()
    expect(loaders.naturalisation).not.toHaveBeenCalled()
  })

  it('charge le paquet du titre choisi, pas celui d’un autre', async () => {
    localStorage.setItem('target-title', 'naturalisation')
    const loaders = spyLoaders()
    renderRevision()
    expect(await screen.findByRole('group', { name: 'Questions à afficher' })).toBeInTheDocument()
    expect(screen.getByText(/258 questions \+ 100 mises en situation/)).toBeInTheDocument()
    expect(loaders.naturalisation).toHaveBeenCalledTimes(1)
    expect(loaders.pluriannuelle).not.toHaveBeenCalled()
  })

  it('échec : message et « Réessayer », jamais un écran blanc ; « Réessayer » recharge', async () => {
    const loaders = spyLoaders()
    loaders.pluriannuelle.mockRejectedValueOnce(new Error('réseau'))
    renderRevision()
    expect(await screen.findByRole('alert')).toHaveTextContent("Les questions n'ont pas pu être chargées.")
    expect(screen.getByRole('heading', { level: 1, name: 'Réviser' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mon parcours' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByRole('group', { name: 'Questions à afficher' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(loaders.pluriannuelle).toHaveBeenCalledTimes(2)
  })

  it('un paquet déjà en mémoire (préchargé) s’affiche sans passer par le chargement', async () => {
    spyLoaders()
    await loadQuestionPack('pluriannuelle')
    renderRevision()
    expect(screen.getByRole('group', { name: 'Questions à afficher' })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('Examen : chargement des questions', () => {
  const renderExamen = () =>
    render(
      <MemoryRouter>
        <Examen />
      </MemoryRouter>,
    )

  it('un nouvel examen attend le paquet du titre ; le chrono ne démarre qu’ensuite', async () => {
    const loaders = spyLoaders()
    const gate = deferred('pluriannuelle', loaders.pluriannuelle)
    renderExamen()
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des questions…')
    expect(screen.getByRole('heading', { level: 1, name: 'Examen blanc' })).toBeInTheDocument()
    expect(localStorage.getItem('exam-in-progress')).toBeNull()
    await act(async () => gate.resolve())
    expect(await screen.findAllByRole('radio')).toHaveLength(4)
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0)
  })

  it('échec puis « Réessayer » : l’examen se tire', async () => {
    const loaders = spyLoaders()
    loaders.pluriannuelle.mockRejectedValueOnce(new Error('réseau'))
    renderExamen()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findAllByRole('radio')).toHaveLength(4)
  })

  it('la reprise d’un examen ne charge aucun paquet', async () => {
    const loaders = spyLoaders()
    const questions = buildExam(questionsForTitle('pluriannuelle', ALL_QUESTIONS))
    saveProgress({ questions, index: 3, answers: [], timeLeft: 1500, startedAt: new Date().toISOString(), title: 'pluriannuelle' })
    renderExamen()
    expect(screen.queryByText('Chargement des questions…')).not.toBeInTheDocument()
    expect(await screen.findAllByRole('radio')).toHaveLength(4)
    await flush()
    for (const title of TITLE_KEYS) expect(loaders[title]).not.toHaveBeenCalled()
    expect(getLoadedPack('pluriannuelle')).toBeUndefined()
  })
})

describe('Détail d’un examen : paquet du titre de l’examen', () => {
  const q = questionsForTitle('resident', ALL_QUESTIONS).find((x) => x.lists.length === 1)!
  const record = (title?: TitleKey): ExamRecord => ({
    id: '1700000000000',
    date: '2026-01-15T10:00:00.000Z',
    score: 0,
    total: 40,
    answers: [{ questionId: q.id, chosen: null, correct: false }],
    ...(title ? { title } : {}),
  })
  const renderDetail = () =>
    render(
      <MemoryRouter initialEntries={['/examen/1700000000000']}>
        <Routes>
          <Route path="/examen/:id" element={<ExamenDetail />} />
        </Routes>
      </MemoryRouter>,
    )

  it('charge le paquet du titre de l’examen, même si le titre choisi est un autre', async () => {
    localStorage.setItem('target-title', 'pluriannuelle')
    localStorage.setItem('quiz-history', JSON.stringify([record('resident')]))
    const loaders = spyLoaders()
    renderDetail()
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des questions…')
    expect(await screen.findByText(q.question)).toBeInTheDocument()
    expect(loaders.resident).toHaveBeenCalledTimes(1)
    expect(loaders.pluriannuelle).not.toHaveBeenCalled()
  })

  it('un ancien examen sans titre compte pour la carte pluriannuelle', async () => {
    const first = questionsForTitle('pluriannuelle', ALL_QUESTIONS)[0]
    localStorage.setItem(
      'quiz-history',
      JSON.stringify([{ ...record(), answers: [{ questionId: first.id, chosen: null, correct: false }] }]),
    )
    const loaders = spyLoaders()
    renderDetail()
    expect(await screen.findByText(first.question)).toBeInTheDocument()
    expect(loaders.pluriannuelle).toHaveBeenCalledTimes(1)
    expect(loaders.resident).not.toHaveBeenCalled()
  })

  it('échec : message et « Réessayer » ; un examen introuvable ne charge rien', async () => {
    localStorage.setItem('quiz-history', JSON.stringify([record('resident')]))
    const loaders = spyLoaders()
    loaders.resident.mockRejectedValueOnce(new Error('réseau'))
    renderDetail()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByText(q.question)).toBeInTheDocument()

    localStorage.clear()
    resetQuestionPacksForTests()
    const none = spyLoaders()
    renderDetail()
    expect(await screen.findAllByText(/Examen introuvable/)).not.toHaveLength(0)
    for (const title of TITLE_KEYS) expect(none[title]).not.toHaveBeenCalled()
  })
})

describe('Les écrans sans questions n’en téléchargent aucune', () => {
  it('accueil (sans titre choisi), choix du titre et fiche : aucun paquet', async () => {
    const loaders = spyLoaders()
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/titre']}>
          <Routes>
            <Route path="/titre" element={<TitreVise />} />
            <Route path="/titres/:slug" element={<FicheTitre />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )
    expect(screen.getByText(/191 questions officielles/)).toBeInTheDocument()
    expect(screen.getByText(/209 questions officielles/)).toBeInTheDocument()
    expect(screen.getByText(/258 questions officielles/)).toBeInTheDocument()
    await flush()
    for (const title of TITLE_KEYS) expect(loaders[title]).not.toHaveBeenCalled()
  })
})

describe('Accueil : préchargement discret du paquet du titre choisi', () => {
  const renderHome = () =>
    render(
      <ThemeProvider>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </ThemeProvider>,
    )

  it('une fois l’accueil affiché et le navigateur au repos, charge le paquet du titre choisi seulement', async () => {
    localStorage.setItem('target-title', 'resident')
    const loaders = spyLoaders()
    let idle: () => void = () => {}
    vi.stubGlobal('requestIdleCallback', (cb: () => void) => {
      idle = cb
      return 1
    })
    renderHome()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(loaders.resident).not.toHaveBeenCalled()
    await act(async () => idle())
    await waitFor(() => expect(loaders.resident).toHaveBeenCalledTimes(1))
    expect(loaders.pluriannuelle).not.toHaveBeenCalled()
    expect(loaders.naturalisation).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('sans titre choisi (même avec un historique), aucun préchargement', async () => {
    localStorage.setItem('quiz-history', JSON.stringify([{ date: '2026-11-20T10:00:00.000Z', score: 30, total: 40 }]))
    const loaders = spyLoaders()
    const idle = vi.fn((cb: () => void) => (cb(), 1))
    vi.stubGlobal('requestIdleCallback', idle)
    renderHome()
    await flush()
    expect(idle).not.toHaveBeenCalled()
    for (const title of TITLE_KEYS) expect(loaders[title]).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
