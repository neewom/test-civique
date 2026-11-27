import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import ExamenDetail from './ExamenDetail'
import type { ExamRecord } from '@/lib/exam-types'
import allQuestions from '@/data/questions.json'
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
    expect(screen.getByLabelText(/Score : 1 sur 40/i)).toBeInTheDocument()
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
function verdict(text: string) {
  return screen.getByText((_, el) => el?.tagName === 'P' && el.textContent?.replace(/\s+/g, ' ') === text)
}

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
    const mine = screen.getByRole('button', { name: 'Mes erreurs (2)' })
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
    const total = rows.reduce((n, r) => n + Number(r.textContent!.match(/(\d+)\/(\d+)$/)![2]), 0)
    expect(total).toBe(4)
    expect(within(section).getAllByText('(thème le plus faible)').length).toBeGreaterThan(0)
  })

  it('« Réviser ces n questions » transmet les identifiants des erreurs à la révision', () => {
    seedHistory(record)
    renderWithState(RECORD_ID)
    fireEvent.click(screen.getByRole('link', { name: 'Réviser ces 2 questions' }))
    expect(JSON.parse(screen.getByTestId('state').textContent!)).toEqual({ reviewIds: [QS[1].id, QS[3].id] })
  })

  it('sans erreur : pas de filtre ni de lien de révision, toutes les questions affichées', () => {
    seedHistory({ ...record, score: 2, total: 2, answers: [answers[0], answers[2]] })
    renderDetail(RECORD_ID)
    expect(screen.getByText('Aucune erreur sur cet examen, bravo.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Mes erreurs/ })).not.toBeInTheDocument()
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
  const all = allQuestions as { id: number; explanation: string; source?: { url: string; label: string } }[]
  const first = all[0]
  // Real sources are set aside so each test controls which question has one.
  const realSources = new Map(all.filter((q) => q.source).map((q) => [q, q.source]))

  beforeEach(() => {
    localStorage.clear()
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
    const review = screen.getByRole('link', { name: 'Réviser cette question' })
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
