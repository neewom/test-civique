import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import ExamenDetail from './ExamenDetail'
import type { ExamRecord } from '@/lib/exam-types'
import allQuestions from '@/data/questions.json'
import { getLoadedPack } from '@/lib/question-packs'
import { stubWideScreen } from '@/test/wide-screen'

const RECORD_ID = '1700000000000'

function seedHistory(record: ExamRecord) {
  localStorage.setItem('quiz-history', JSON.stringify([record]))
}

function renderDetail(id: string) {
  render(
    <MemoryRouter initialEntries={[`/examen/${id}`]}>
      <Routes>
        <Route path="/examen/:id" element={<ExamenDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

const q0 = (allQuestions as { id: number; answers: string[]; distractors: string[] }[])[0]

const RECORD: ExamRecord = {
  id: RECORD_ID,
  date: '2026-01-15T10:00:00.000Z',
  score: 1,
  total: 40,
  answers: [
    { questionId: q0.id, chosen: q0.answers[0], correct: true },
    { questionId: (allQuestions as { id: number }[])[1].id, chosen: null, correct: false },
  ],
}

describe('ExamenDetail', () => {
  beforeEach(() => localStorage.clear())

  it('affiche "Examen introuvable" si l\'id est inconnu', () => {
    renderDetail('unknown-id')
    expect(screen.getByText(/Examen introuvable/i)).toBeInTheDocument()
  })

  it("ne plante pas sur un historique abîmé (answers: [null])", () => {
    localStorage.setItem('quiz-history', JSON.stringify([{ ...RECORD, answers: [null, 3, { questionId: 'x' }] }]))
    expect(() => renderDetail(RECORD_ID)).not.toThrow()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('affiche "Examen introuvable" si l\'historique n\'est pas du JSON', () => {
    localStorage.setItem('quiz-history', 'pas du json{')
    renderDetail(RECORD_ID)
    expect(screen.getByText(/Examen introuvable/i)).toBeInTheDocument()
  })

  it('affiche "Examen introuvable" si l\'examen n\'a pas de réponses enregistrées', () => {
    localStorage.setItem('quiz-history', JSON.stringify([{ ...RECORD, answers: undefined }]))
    renderDetail(RECORD_ID)
    expect(screen.getByText(/Examen introuvable/i)).toBeInTheDocument()
  })

  it('donne le titre "Détail de l\'examen · Futur Citoyen" à l\'onglet', () => {
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    expect(document.title).toBe("Détail de l'examen · Futur Citoyen")
  })

  it('affiche le score global', () => {
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    // Le titre se lit « Examen du <date> : 1 sur 40 » (le « 1/40 » visible est masqué aux lecteurs d'écran)
    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toHaveAccessibleName(/^Examen du .+ : 1 sur 40$/)
    expect(within(title).getByText('1/40')).toHaveAttribute('aria-hidden', 'true')
  })

  it('affiche la date de l\'examen', () => {
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    expect(screen.getByText('15 janvier 2026')).toBeInTheDocument()
  })

  it('affiche la bonne réponse donnée, dans « Toutes »', () => {
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    fireEvent.click(screen.getByRole('button', { name: 'Toutes (2)' }))
    expect(screen.getByText('Bonne réponse, la vôtre')).toBeInTheDocument()
  })

  it('affiche "Sans réponse" pour une question sans réponse', () => {
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    expect(screen.getByText(/Sans réponse/i)).toBeInTheDocument()
  })

  it('affiche les explications', () => {
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    const q1 = (allQuestions as { explanation: string }[])[1]
    expect(screen.getByText(q1.explanation)).toBeInTheDocument()
  })

  it('affiche un lien retour vers le parcours', () => {
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    expect(screen.getByRole('link', { name: 'Retour à mon parcours' })).toHaveAttribute('href', '/')
  })
})

// La pastille de verdict mêle plusieurs nœuds de texte : on compare son texte complet
// Texte visible de la pastille : la forme lue (« 32 sur 40 », masquée) est écartée
function visibleText(el: Element): string {
  const copy = el.cloneNode(true) as Element
  copy.querySelectorAll('.sr-only').forEach((n) => n.remove())
  return (copy.textContent ?? '').replace(/\s+/g, ' ')
}

function verdict(text: string) {
  return screen.getByText((_, el) => el?.tagName === 'P' && visibleText(el) === text)
}

it('la pastille du verdict lit le seuil « 32 sur 40 »', () => {
  seedHistory(RECORD)
  renderDetail(RECORD_ID)
  expect(screen.getByText('32 sur 40')).toHaveClass('sr-only')
})

describe('ExamenDetail — verdict', () => {
  beforeEach(() => localStorage.clear())

  it('affiche « Réussi » pour un score enregistré de 32/40', () => {
    seedHistory({ ...RECORD, score: 32 })
    renderDetail(RECORD_ID)
    expect(verdict('Réussi · seuil 32/40')).toBeInTheDocument()
  })

  it('affiche « Pas encore réussi » pour un score enregistré de 31/40', () => {
    seedHistory({ ...RECORD, score: 31 })
    renderDetail(RECORD_ID)
    expect(verdict('Pas encore réussi · seuil 32/40')).toBeInTheDocument()
  })

  it('applique 80 % du total pour un ancien enregistrement dont le total n\'est pas 40', () => {
    seedHistory({ ...RECORD, score: 16, total: 20 })
    renderDetail(RECORD_ID)
    expect(verdict('Réussi · seuil 16/20')).toBeInTheDocument()
  })
})

// ─── Refonte 4 : erreurs d'abord, score par thème ──────────────────────────────

type Q = { id: number; theme: string; question: string; answers: string[]; explanation: string }
const QS = allQuestions as Q[]

function renderWithState(id: string) {
  function StateProbe() {
    const location = useLocation()
    return <pre data-testid="state">{JSON.stringify(location.state)}</pre>
  }
  render(
    <MemoryRouter initialEntries={[`/examen/${id}`]}>
      <Routes>
        <Route path="/examen/:id" element={<ExamenDetail />} />
        <Route path="/revision" element={<StateProbe />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ExamenDetail — revoir ses erreurs', () => {
  beforeEach(() => localStorage.clear())

  // Questions 1 à 4 de la liste : 2 bonnes, 1 fausse, 1 sans réponse. Format d'un examen
  // enregistré depuis la v1.22.1 : `answer` (la question 2 a plusieurs bonnes réponses, sans
  // `answer` le détail les liste toutes : couvert plus bas).
  const answers = [
    { questionId: QS[0].id, chosen: QS[0].answers[0], correct: true },
    { questionId: QS[1].id, chosen: 'Mauvaise réponse', correct: false, answer: QS[1].answers[0] },
    { questionId: QS[2].id, chosen: QS[2].answers[0], correct: true },
    { questionId: QS[3].id, chosen: null, correct: false, answer: QS[3].answers[0] },
  ]
  const record: ExamRecord = { ...RECORD, score: 2, total: 4, answers }

  it('affiche d\'abord les erreurs, puis toutes les questions sur demande', () => {
    seedHistory(record)
    renderDetail(RECORD_ID)
    const mine = screen.getByRole('button', { name: 'À revoir (2)' })
    expect(mine).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([QS[1].question, QS[3].question])
    expect(screen.getByText('Question 2 · ' + QS[1].theme)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Toutes (4)' }))
    expect(screen.getByRole('button', { name: 'Toutes (4)' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4)
  })

  it('« Votre réponse » fausse et « Bonne réponse »', () => {
    seedHistory(record)
    renderDetail(RECORD_ID)
    expect(screen.getByText('Mauvaise réponse')).toBeInTheDocument()
    expect(screen.getByText(QS[1].answers[0])).toBeInTheDocument()
    expect(screen.getAllByText('Votre réponse')).toHaveLength(2)
    expect(screen.getAllByText('Bonne réponse')).toHaveLength(2)
  })

  it('score par thème, thème le plus faible signalé', () => {
    seedHistory(record)
    renderDetail(RECORD_ID)
    const section = screen.getByRole('region', { name: 'Par thème' })
    const rows = within(section).getAllByRole('listitem')
    const total = rows.reduce((n, r) => n + Number(within(r).getByText(/^\d+\/\d+$/).textContent!.split('/')[1]), 0)
    expect(total).toBe(4)
    expect(within(section).getAllByText('(thème le plus faible)').length).toBeGreaterThan(0)
  })

  it('« Réviser ces n questions » transmet les identifiants des erreurs à la révision', () => {
    seedHistory(record)
    renderWithState(RECORD_ID)
    // Phone layout: the link is also under the verdict (v1.26.0), same state; take the first
    fireEvent.click(screen.getAllByRole('link', { name: 'Réviser ces 2 questions' })[0])
    expect(JSON.parse(screen.getByTestId('state').textContent!)).toEqual({ reviewIds: [QS[1].id, QS[3].id], title: 'pluriannuelle' })
  })

  it('sans erreur : pas de filtre ni de lien de révision, toutes les questions affichées', () => {
    seedHistory({ ...record, score: 2, total: 2, answers: [answers[0], answers[2]] })
    renderDetail(RECORD_ID)
    expect(screen.getByText('Aucune erreur sur cet examen, bravo.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /À revoir/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Réviser/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2)
    expect(screen.getByRole('region', { name: 'Par thème' }).querySelector('.bg-coral')).toBeNull()
  })

  it('un examen introuvable propose le retour au parcours', () => {
    renderDetail('inconnu')
    expect(screen.getByRole('heading', { level: 1, name: 'Examen introuvable' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour à mon parcours' })).toHaveAttribute('href', '/')
  })
})

describe('ExamenDetail — lien source', () => {
  type WithSource = { id: number; explanation: string; source?: { url: string; label: string } }
  // The page reads the questions of the pack of the title, in memory since the test setup: edit those objects
  let first: WithSource
  let realSources: Map<WithSource, WithSource['source']>

  beforeEach(() => {
    localStorage.clear()
    const all = getLoadedPack('pluriannuelle') as WithSource[]
    first = all[0]
    // Real sources are set aside so each test controls which question has one.
    realSources = new Map(all.filter((q) => q.source).map((q) => [q, q.source]))
    realSources.forEach((_, q) => delete q.source)
  })
  afterEach(() => {
    delete first.source
    realSources.forEach((source, q) => { q.source = source })
  })

  it('affiche le lien source sous l\'explication d\'une question qui en a un', () => {
    first.source = { url: 'https://www.elysee.fr/x', label: 'elysee.fr' }
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    fireEvent.click(screen.getByRole('button', { name: /Toutes/ }))
    const links = screen.getAllByRole('link', { name: /^Source :/ })
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAccessibleName('Source : elysee.fr (nouvel onglet)')
    expect(links[0]).toHaveAttribute('href', 'https://www.elysee.fr/x')
    expect(links[0]).toHaveAttribute('target', '_blank')
    const card = links[0].closest('li')!
    expect(within(card).getByText(first.explanation).compareDocumentPosition(links[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('n\'affiche aucun lien source quand la question n\'en a pas', () => {
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    fireEvent.click(screen.getByRole('button', { name: /Toutes/ }))
    expect(screen.queryByRole('link', { name: /^Source :/ })).not.toBeInTheDocument()
  })
})

describe('ExamenDetail — placement des actions', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  function order() {
    // On a phone the link appears twice (under the verdict and after the questions): the last one is the bottom one
    const review = screen.getAllByRole('link', { name: 'Réviser cette question' }).at(-1)!
    const back = screen.getAllByRole('link', { name: 'Retour à mon parcours' })
    // The questions are the only ordered list of the page
    const list = document.querySelector('ol')!
    return { review, back, list }
  }

  it('téléphone et tablette : les actions suivent les questions', () => {
    stubWideScreen(false)
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    const { review, back, list } = order()
    expect(back).toHaveLength(1)
    expect(list.compareDocumentPosition(review) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('grand écran : les actions sont dans la colonne latérale, avant les questions, une seule fois', () => {
    stubWideScreen()
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    const { review, back, list } = order()
    expect(back).toHaveLength(1)
    expect(review.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('ExamenDetail — bonne réponse proposée', () => {
  beforeEach(() => localStorage.clear())

  type Q = { id: number; answers: string[] }
  const questions = allQuestions as Q[]
  const multi = questions.find((q) => q.answers.length > 1)!
  const single = questions.find((q) => q.answers.length === 1)!

  function recordWith(answer: Record<string, unknown>): ExamRecord {
    return {
      id: RECORD_ID,
      date: '2026-01-15T10:00:00.000Z',
      score: 0,
      total: 40,
      answers: [{ chosen: null, correct: false, ...answer } as ExamRecord['answers'][number]],
    }
  }

  // Décision de l'utilisateur (2026-11-27) : une bonne réponse par ligne, dans une vraie liste
  // (certaines réponses contiennent des virgules)
  function expectAcceptedList() {
    expect(screen.getByText('Bonnes réponses acceptées')).toBeInTheDocument()
    const items = within(screen.getByText('Bonnes réponses acceptées').closest('div')!).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual(multi.answers)
  }

  it('affiche la réponse proposée à l\'examen, même si ce n\'est pas la première', () => {
    const proposed = multi.answers[1]
    seedHistory(recordWith({ questionId: multi.id, answer: proposed }))
    renderDetail(RECORD_ID)
    expect(screen.getByText('Bonne réponse')).toBeInTheDocument()
    expect(screen.getByText(proposed)).toBeInTheDocument()
    expect(screen.queryByText('Bonnes réponses acceptées')).not.toBeInTheDocument()
  })

  it('ancien examen, une seule bonne réponse : inchangé', () => {
    seedHistory(recordWith({ questionId: single.id }))
    renderDetail(RECORD_ID)
    expect(screen.getByText('Bonne réponse')).toBeInTheDocument()
    expect(screen.getByText(single.answers[0])).toBeInTheDocument()
  })

  it('ancien examen, plusieurs bonnes réponses : toutes listées', () => {
    seedHistory(recordWith({ questionId: multi.id }))
    renderDetail(RECORD_ID)
    expectAcceptedList()
  })

  it.each([
    ['absente des réponses actuelles', 'une réponse retirée des données'],
    ['illisible (nombre)', 42],
    ['illisible (objet)', { a: 1 }],
  ])('answer %s : repli sur la liste, l\'examen reste lu', (_label, bad) => {
    seedHistory(recordWith({ questionId: multi.id, answer: bad }))
    renderDetail(RECORD_ID)
    expectAcceptedList()
  })

  it('une réponse juste reste inchangée', () => {
    seedHistory(recordWith({ questionId: multi.id, chosen: multi.answers[1], correct: true, answer: multi.answers[1] }))
    renderDetail(RECORD_ID)
    expect(screen.getByText('Bonne réponse, la vôtre')).toBeInTheDocument()
  })

  it('ne réécrit pas l\'historique stocké', () => {
    const record = recordWith({ questionId: multi.id, answer: 42 })
    seedHistory(record)
    const before = localStorage.getItem('quiz-history')
    renderDetail(RECORD_ID)
    expect(localStorage.getItem('quiz-history')).toBe(before)
  })
})

describe('ExamenDetail — « Réviser » sous le verdict', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  const reviewName = 'Réviser cette question'

  it("un examen d'un autre titre transmet son titre", () => {
    const residentOnly = (allQuestions as { id: number; lists: string[] }[]).find((q) => q.id >= 292 && q.lists.includes('resident'))!
    seedHistory({ ...RECORD, title: 'resident', answers: [{ questionId: residentOnly.id, chosen: null, correct: false }] })
    renderWithState(RECORD_ID)
    fireEvent.click(screen.getAllByRole('link', { name: 'Réviser cette question' })[0])
    expect(JSON.parse(screen.getByTestId('state').textContent!).title).toBe('resident')
  })

  it('téléphone : le lien est aussi sous le verdict, avant les questions, même état', () => {
    stubWideScreen(false)
    seedHistory(RECORD)
    renderWithState(RECORD_ID)
    const links = screen.getAllByRole('link', { name: reviewName })
    expect(links).toHaveLength(2)
    expect(links[0].compareDocumentPosition(document.querySelector('ol')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(links[0])
    expect(JSON.parse(screen.getByTestId('state').textContent!)).toEqual({ reviewIds: [(allQuestions as { id: number }[])[1].id], title: 'pluriannuelle' })
  })

  it('grand écran : un seul lien (colonne latérale)', () => {
    stubWideScreen()
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    expect(screen.getAllByRole('link', { name: reviewName })).toHaveLength(1)
  })

  it('aucune erreur : aucun lien', () => {
    stubWideScreen(false)
    seedHistory({ ...RECORD, score: 1, total: 1, answers: [RECORD.answers[0]] })
    renderDetail(RECORD_ID)
    expect(screen.queryByRole('link', { name: /Réviser/ })).not.toBeInTheDocument()
  })
})
