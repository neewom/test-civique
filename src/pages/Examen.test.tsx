import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { within } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Examen, { GLOBAL_EXAM_TIME } from './Examen'
import { UNSAVED_MESSAGE } from '@/lib/readiness'
import type { ExamInProgress } from '@/lib/exam-types'
import { saveProgress, loadProgress, EXAM_PROGRESS_KEY } from '@/lib/exam-types'
import {
  buildExam,
  saveResult,
  shuffle,
  formatTime,
  EXAM_SIZE,
} from '@/lib/exam'

function renderExamen() {
  return render(
    <MemoryRouter>
      <Examen />
    </MemoryRouter>
  )
}

// Answer cards are radios (Refonte 3); the correction keeps the right one and the wrong one
function getChoices() {
  return screen.getAllByRole('radio')
}

// Remaining seconds, read on the time progressbar: the screen shows a budget in minutes
function timeLeft(): number {
  const bar = screen.getAllByRole('progressbar').find((el) => el.getAttribute('aria-valuemax') === String(GLOBAL_EXAM_TIME))!
  return Number(bar.getAttribute('aria-valuenow'))
}

// The verdict pill mixes several text nodes: its full text is compared
function verdictPill(text: string) {
  return screen.getByText((_, el) => el?.getAttribute('role') === 'status' && el.textContent?.replace(/\s+/g, ' ') === text)
}

// ─── Fonctions utilitaires ────────────────────────────────────────────────────

describe('shuffle', () => {
  it('retourne un tableau de même longueur', () => {
    expect(shuffle([1, 2, 3, 4, 5])).toHaveLength(5)
  })

  it('contient les mêmes éléments', () => {
    expect(shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5])
  })
})

describe('formatTime', () => {
  it('formate 2400s en "40:00"', () => {
    expect(formatTime(2400)).toBe('40:00')
  })

  it('formate 90s en "01:30"', () => {
    expect(formatTime(90)).toBe('01:30')
  })

  it('formate 0s en "00:00"', () => {
    expect(formatTime(0)).toBe('00:00')
  })
})

describe('buildExam', () => {
  it(`retourne exactement ${EXAM_SIZE} questions`, () => {
    expect(buildExam()).toHaveLength(EXAM_SIZE)
  })

  it('chaque question a exactement 4 choix', () => {
    buildExam().forEach((q) => expect(q.choices).toHaveLength(4))
  })

  it('la bonne réponse est toujours dans les choix', () => {
    buildExam().forEach((q) => expect(q.choices).toContain(q.answer))
  })

  it('chaque question a une explication', () => {
    buildExam().forEach((q) => expect(q.explanation).toBeTruthy())
  })

  it('la réponse choisie est toujours une des valeurs du tableau answers', () => {
    const pool: Parameters<typeof buildExam>[0] = [
      { id: 1, theme: 'T', question: 'Q', answers: ['A', 'B', 'C'], distractors: ['D', 'E', 'F'], explanation: 'E' },
    ]
    // On tire plusieurs fois pour couvrir les différentes valeurs possibles
    for (let i = 0; i < 20; i++) {
      const [result] = buildExam(pool)
      expect(['A', 'B', 'C']).toContain(result.answer)
      expect(result.choices).toContain(result.answer)
    }
  })

  it('un seul groupe est représenté dans la sélection — pas de doublons de groupe', () => {
    const pool: Parameters<typeof buildExam>[0] = [
      { id: 1, theme: 'T', question: 'Q1', answers: ['A'], distractors: ['B', 'C', 'D'], explanation: 'E', group: 'g1' },
      { id: 2, theme: 'T', question: 'Q2', answers: ['A'], distractors: ['B', 'C', 'D'], explanation: 'E', group: 'g1' },
      { id: 3, theme: 'T', question: 'Q3', answers: ['A'], distractors: ['B', 'C', 'D'], explanation: 'E', group: 'g2' },
      { id: 4, theme: 'T', question: 'Q4', answers: ['A'], distractors: ['B', 'C', 'D'], explanation: 'E' },
    ]
    const result = buildExam(pool)
    const groups = result.map((q) => (pool.find((p) => p.id === q.id) as typeof pool[0]).group).filter(Boolean)
    const uniqueGroups = new Set(groups)
    expect(uniqueGroups.size).toBe(groups.length) // chaque groupe apparaît au plus une fois
    // pool: 2 questions groupe g1, 1 groupe g2, 1 sans groupe → 3 sélectionnées (doublon g1 exclu)
    expect(result).toHaveLength(3)
  })
})

describe('saveResult', () => {
  beforeEach(() => localStorage.clear())

  it('crée une entrée dans quiz-history', () => {
    saveResult(30, 40, [])
    const history = JSON.parse(localStorage.getItem('quiz-history')!)
    expect(history).toHaveLength(1)
    expect(history[0].score).toBe(30)
    expect(history[0].total).toBe(40)
  })

  it('accumule les résultats', () => {
    saveResult(20, 40, [])
    saveResult(35, 40, [])
    expect(JSON.parse(localStorage.getItem('quiz-history')!)).toHaveLength(2)
  })

  it('enregistre la date ISO', () => {
    saveResult(10, 40, [])
    const entry = JSON.parse(localStorage.getItem('quiz-history')!)[0]
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('enregistre les réponses et un id', () => {
    const answers = [{ questionId: 1, chosen: 'Paris', correct: true }]
    saveResult(1, 40, answers)
    const entry = JSON.parse(localStorage.getItem('quiz-history')!)[0]
    expect(entry.id).toBeTruthy()
    expect(entry.answers).toHaveLength(1)
    expect(entry.answers[0].questionId).toBe(1)
  })
})

// ─── Composant Examen ─────────────────────────────────────────────────────────

describe('Examen', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('affiche "Question 1 sur 40" au démarrage', () => {
    renderExamen()
    expect(screen.getByText(`Question 1 sur ${EXAM_SIZE}`)).toBeInTheDocument()
  })

  it('affiche le temps global à "45 min" au démarrage', () => {
    renderExamen()
    expect(GLOBAL_EXAM_TIME).toBe(45 * 60)
    expect(timeLeft()).toBe(2700)
    expect(screen.getByText('45 min')).toBeInTheDocument()
  })

  it('le timer global décrémente', async () => {
    renderExamen()
    await act(async () => { vi.advanceTimersByTime(5000) })
    expect(timeLeft()).toBe(2695)
  })

  it('affiche 4 boutons de réponse', () => {
    renderExamen()
    expect(getChoices()).toHaveLength(4)
  })

  it('le bouton Valider n\'est pas visible sans sélection', () => {
    renderExamen()
    expect(screen.queryByRole('button', { name: 'Valider ma réponse' })).not.toBeInTheDocument()
  })

  it('le bouton Valider apparaît après sélection d\'une réponse', async () => {
    renderExamen()
    await act(async () => { fireEvent.click(getChoices()[0]) })
    expect(screen.getByRole('button', { name: 'Valider ma réponse' })).toBeInTheDocument()
  })

  it('les boutons restent actifs après sélection (avant validation)', async () => {
    renderExamen()
    await act(async () => { fireEvent.click(getChoices()[0]) })
    getChoices().forEach((btn) => expect(btn).not.toBeDisabled())
  })

  it('peut changer de réponse avant de valider', async () => {
    renderExamen()
    const choices = getChoices()
    await act(async () => { fireEvent.click(choices[0]) })
    await act(async () => { fireEvent.click(choices[1]) })
    expect(choices[1]).toBeChecked()
    expect(choices[0]).not.toBeChecked()
  })

  it('après validation, les boutons sont désactivés et l\'explication apparaît', async () => {
    renderExamen()
    await act(async () => { fireEvent.click(getChoices()[0]) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider ma réponse' })) })
    getChoices().forEach((btn) => expect(btn).toBeDisabled())
    expect(screen.getByText('Pourquoi')).toBeInTheDocument()
  })

  it('après validation, le bouton "Question suivante" apparaît', async () => {
    renderExamen()
    await act(async () => { fireEvent.click(getChoices()[0]) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider ma réponse' })) })
    expect(screen.getByRole('button', { name: 'Question suivante' })).toBeInTheDocument()
  })

  it('"Question suivante" avance à la question 2', async () => {
    renderExamen()
    await act(async () => { fireEvent.click(getChoices()[0]) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider ma réponse' })) })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Question suivante' }))
    })
    expect(screen.getByText(`Question 2 sur ${EXAM_SIZE}`)).toBeInTheDocument()
  })

  it('titre de l\'onglet : "Examen blanc" puis "Résultat" à la fin', async () => {
    renderExamen()
    expect(document.title).toBe('Examen blanc · Futur Citoyen')
    await act(async () => { vi.advanceTimersByTime(GLOBAL_EXAM_TIME * 1000) })
    expect(document.title).toBe('Résultat · Futur Citoyen')
  })

  it('quand le timer global expire, affiche le résultat directement', async () => {
    renderExamen()
    await act(async () => { vi.advanceTimersByTime(GLOBAL_EXAM_TIME * 1000) })
    expect(screen.getByRole('heading', { level: 1, name: 'Examen blanc terminé' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nouvel examen blanc' })).toBeInTheDocument()
  })

  it('quand le timer expire en cours d\'examen, sauvegarde le score partiel', async () => {
    renderExamen()
    // Répondre correctement à quelques questions
    for (let i = 0; i < 3; i++) {
      const choices = getChoices()
      // trouver la bonne réponse (fond vert après validation) — on valide peu importe
      await act(async () => { fireEvent.click(choices[0]) })
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider ma réponse' })) })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Question suivante' }))
      })
    }
    // Timer global expire
    await act(async () => { vi.advanceTimersByTime(GLOBAL_EXAM_TIME * 1000) })
    const history = JSON.parse(localStorage.getItem('quiz-history') ?? '[]')
    expect(history.length).toBeGreaterThan(0)
    expect(history[0].total).toBe(EXAM_SIZE)
  })

  it('affiche le résultat après 40 questions', async () => {
    renderExamen()
    for (let i = 0; i < EXAM_SIZE; i++) {
      await act(async () => { fireEvent.click(getChoices()[0]) })
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider ma réponse' })) })
      const nextBtn =
        screen.queryByRole('button', { name: 'Question suivante' }) ??
        screen.getByRole('button', { name: 'Voir les résultats' })
      await act(async () => { fireEvent.click(nextBtn) })
    }
    expect(screen.getByRole('heading', { level: 1, name: 'Examen blanc terminé' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nouvel examen blanc' })).toBeInTheDocument()
  })

  it('sauvegarde le résultat dans localStorage après la fin', async () => {
    renderExamen()
    for (let i = 0; i < EXAM_SIZE; i++) {
      await act(async () => { fireEvent.click(getChoices()[0]) })
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider ma réponse' })) })
      const nextBtn =
        screen.queryByRole('button', { name: 'Question suivante' }) ??
        screen.getByRole('button', { name: 'Voir les résultats' })
      await act(async () => { fireEvent.click(nextBtn) })
    }
    const history = JSON.parse(localStorage.getItem('quiz-history') ?? '[]')
    expect(history.length).toBeGreaterThan(0)
    expect(history[0].total).toBe(EXAM_SIZE)
  })

  it('le bouton "← Quitter" est visible pendant l\'examen', () => {
    renderExamen()
    expect(screen.getByRole('button', { name: 'Quitter l\'examen' })).toBeInTheDocument()
  })

  it('cliquer sur "← Quitter" ouvre le dialog de confirmation', async () => {
    renderExamen()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Quitter l\'examen' }))
    })
    expect(screen.getByText('Quitter l\'examen ?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Quitter' })).toBeInTheDocument()
  })

  it('cliquer sur "Annuler" ferme le dialog et reste sur l\'examen', async () => {
    renderExamen()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Quitter l\'examen' }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    })
    expect(screen.queryByText('Quitter l\'examen ?')).not.toBeInTheDocument()
    expect(screen.getByText(`Question 1 sur ${EXAM_SIZE}`)).toBeInTheDocument()
  })
})

// ─── Règles officielles : reprise et verdict ──────────────────────────────────

function makeResume(timeLeft: number, correctCount: number): ExamInProgress {
  const questions = buildExam()
  return {
    questions,
    index: correctCount,
    answers: questions.slice(0, correctCount).map((q) => ({
      questionId: q.id,
      chosen: q.answer,
      correct: true,
    })),
    timeLeft,
    startedAt: '2026-11-01T10:00:00.000Z',
  }
}

// La reprise lit la progression stockée (exam-in-progress) ; l'état de navigation ne la transporte plus
function renderResumed(resume: ExamInProgress) {
  saveProgress(resume)
  return render(
    <MemoryRouter initialEntries={['/examen']}>
      <Examen />
    </MemoryRouter>
  )
}

describe('Examen — règles officielles', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reprend un examen sauvegardé avec l\'ancienne durée (40 min) sans changer son temps restant', () => {
    renderResumed(makeResume(40 * 60, 0))
    expect(timeLeft()).toBe(2400)
    const bar = screen.getAllByRole('progressbar').find((el) => el.getAttribute('aria-valuemax') === String(GLOBAL_EXAM_TIME))!
    const width = parseFloat(bar.style.width)
    expect(width).toBeGreaterThan(0)
    expect(width).toBeLessThanOrEqual(100)
    expect(width).toBeCloseTo((2400 / 2700) * 100, 5)
  })

  it('borne la barre du chrono à 100 % si le temps restant dépasse la durée', () => {
    renderResumed(makeResume(GLOBAL_EXAM_TIME + 600, 0))
    const bar = screen.getAllByRole('progressbar').find((el) => el.getAttribute('aria-valuemax') === String(GLOBAL_EXAM_TIME))!
    expect(bar.style.width).toBe('100%')
  })

  it('affiche « Réussi » à 32/40', async () => {
    renderResumed(makeResume(2, 32))
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(screen.getByLabelText('Score : 32 sur 40')).toBeInTheDocument()
    expect(verdictPill('Réussi · seuil 32/40')).toBeInTheDocument()
  })

  it('affiche « Pas encore réussi » à 31/40 avec le nombre de réponses manquantes', async () => {
    renderResumed(makeResume(2, 31))
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(screen.getByLabelText('Score : 31 sur 40')).toBeInTheDocument()
    expect(verdictPill('Pas encore réussi · seuil 32/40')).toBeInTheDocument()
    expect(screen.getByText('Encore 1 bonne réponse pour atteindre 32/40')).toBeInTheDocument()
  })

  it('accorde le nombre de réponses manquantes au pluriel', async () => {
    renderResumed(makeResume(2, 27))
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(screen.getByText('Encore 5 bonnes réponses pour atteindre 32/40')).toBeInTheDocument()
  })
})

// ─── Fiabilité : rechargement, recommencer, reprise ───────────────────────────

function LocationStateProbe() {
  const location = useLocation()
  return <pre data-testid="location-state">{JSON.stringify(location.state)}</pre>
}

function renderAt(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/examen', state }]}>
      <Examen />
      <LocationStateProbe />
    </MemoryRouter>
  )
}

function currentQuestionText(): string {
  return screen.getByRole('heading', { level: 1 }).textContent?.trim() ?? ''
}

function historyLength(): number {
  return JSON.parse(localStorage.getItem('quiz-history') ?? '[]').length
}

describe('Examen — fiabilité', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('un rechargement en cours d\'examen reprend les mêmes questions au même index', async () => {
    const resume = makeResume(1500, 2)
    saveProgress(resume)
    // L'état d'historique survit au rechargement : il ne doit pas faire tirer un nouvel examen
    renderAt({ excludeSituational: false })
    expect(screen.getByText(`Question 3 sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(currentQuestionText()).toBe(resume.questions[2].question)
    expect(timeLeft()).toBe(1500)
    await act(async () => { vi.advanceTimersByTime(1000) })
    const saved = loadProgress()!
    expect(saved.questions.map((q) => q.id)).toEqual(resume.questions.map((q) => q.id))
    expect(saved.answers).toHaveLength(2)
  })

  it('reprend sur la question suivante quand la sauvegarde date de la correction', () => {
    const resume = makeResume(1500, 3)
    saveProgress({ ...resume, index: 2 })
    renderAt(null)
    expect(screen.getByText(`Question 4 sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(currentQuestionText()).toBe(resume.questions[3].question)
  })

  it('le marqueur de nouvel examen est consommé : un rechargement reprend l\'examen tiré', async () => {
    saveProgress(makeResume(1500, 2))
    const first = renderAt({ start: 'new', excludeSituational: false })
    // Nouvel examen demandé : la progression précédente est remplacée
    expect(screen.getByText(`Question 1 sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(timeLeft()).toBe(2700)
    const drawn = currentQuestionText()
    const leftState = JSON.parse(screen.getByTestId('location-state').textContent!)
    expect(leftState).toEqual({ excludeSituational: false })
    await act(async () => { vi.advanceTimersByTime(1000) })
    first.unmount()

    // Rechargement : même état d'historique, sans le marqueur
    renderAt(leftState)
    expect(screen.getByText(`Question 1 sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(currentQuestionText()).toBe(drawn)
    expect(timeLeft()).toBe(2699)
  })

  it('n\'utilise pas une progression « resume » périmée venue de l\'état de navigation', () => {
    const stored = makeResume(1500, 2)
    saveProgress(stored)
    renderAt({ resume: makeResume(5, 30) })
    expect(screen.getByText(`Question 3 sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(currentQuestionText()).toBe(stored.questions[2].question)
  })

  it('« Nouvel examen blanc » après une reprise lance un nouvel examen à 45:00 sans réponse', async () => {
    renderResumed(makeResume(2, 10))
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(screen.getByLabelText('Score : 10 sur 40')).toBeInTheDocument()
    expect(historyLength()).toBe(1)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Nouvel examen blanc' }))
    })
    expect(screen.getByText(`Question 1 sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(timeLeft()).toBe(2700)
    expect(loadProgress()!.answers).toHaveLength(0)
    expect(loadProgress()!.timeLeft).toBe(GLOBAL_EXAM_TIME)

    // Le nouvel examen ne se termine pas tout seul
    await act(async () => { vi.advanceTimersByTime(5000) })
    expect(timeLeft()).toBe(2695)
    expect(historyLength()).toBe(1)
  })

  it('« Nouvel examen blanc » garde le jeu sans mises en situation', async () => {
    renderAt({ start: 'new', excludeSituational: true })
    await act(async () => { vi.advanceTimersByTime(GLOBAL_EXAM_TIME * 1000) })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Nouvel examen blanc' }))
    })
    expect(loadProgress()!.questions.every((q) => q.id <= 191)).toBe(true)
  })

  it('une reprise dont toutes les réponses sont données affiche le résultat une seule fois', async () => {
    const resume = makeResume(1200, EXAM_SIZE)
    saveProgress({ ...resume, index: EXAM_SIZE - 1 })
    await act(async () => { renderAt(null) })
    expect(screen.getByLabelText(`Score : ${EXAM_SIZE} sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(historyLength()).toBe(1)
    expect(localStorage.getItem(EXAM_PROGRESS_KEY)).toBeNull()
  })

  it('le chrono ne tourne pas sur le résultat d\'une reprise déjà complète', async () => {
    const resume = makeResume(1200, EXAM_SIZE)
    saveProgress({ ...resume, index: EXAM_SIZE - 1 })
    await act(async () => { renderAt(null) })
    expect(screen.getByLabelText(`Score : ${EXAM_SIZE} sur ${EXAM_SIZE}`)).toBeInTheDocument()
    // Seuls des minuteurs ponctuels restent au montage : aucun intervalle ne survit
    await act(async () => { vi.advanceTimersByTime(5000) })
    expect(vi.getTimerCount()).toBe(0)
    expect(historyLength()).toBe(1)
  })
})

// ─── Refonte 3 : écrans de question et de correction ──────────────────────────

function resumeWith(overrides: Partial<ExamInProgress['questions'][number]>, timeLeft = 1500): ExamInProgress {
  const resume = makeResume(timeLeft, 0)
  resume.questions[0] = { ...resume.questions[0], ...overrides }
  return resume
}

async function answer(correct: boolean) {
  const q = loadProgress()!.questions[loadProgress()!.index]
  const choice = correct ? q.answer : q.choices.find((c) => c !== q.answer)!
  await act(async () => { fireEvent.click(screen.getByRole('radio', { name: choice })) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider ma réponse' })) })
}

describe('Examen — écrans de question et de correction', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('regroupe les 4 cartes dans un groupe radio nommé par la question', () => {
    const resume = makeResume(1500, 0)
    renderResumed(resume)
    const group = screen.getByRole('radiogroup', { name: resume.questions[0].question })
    expect(within(group).getAllByRole('radio')).toHaveLength(4)
  })

  it('affiche le temps en minutes, arrondi au supérieur, avec une barre nommée', () => {
    renderResumed(makeResume(31 * 60 - 20, 0))
    expect(screen.getByText('31 min')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Temps restant' })).toHaveAttribute('aria-valuetext', '31 minutes sur 45')
  })

  it('bonne réponse : verdict « Bien joué » annoncé et focalisé, sans carte « Votre réponse »', async () => {
    renderResumed(makeResume(1500, 0))
    await answer(true)
    const verdict = screen.getByRole('status')
    expect(verdict).toHaveTextContent('Bien joué')
    expect(verdict).toHaveFocus()
    expect(screen.getByText('Bonne réponse')).toBeInTheDocument()
    expect(screen.queryByText('Votre réponse')).not.toBeInTheDocument()
  })

  it('réponse fausse : verdict « Pas tout à fait », bonne réponse et réponse de l\'utilisateur', async () => {
    const resume = makeResume(1500, 0)
    renderResumed(resume)
    await answer(false)
    expect(screen.getByRole('status')).toHaveTextContent('Pas tout à fait')
    expect(screen.getByRole('radio', { name: new RegExp(`Bonne réponse.*${resume.questions[0].answer.slice(0, 10)}`) })).toBeDisabled()
    expect(screen.getByRole('radio', { name: /Votre réponse/ })).toBeChecked()
    expect(screen.getByRole('heading', { level: 2, name: 'Pourquoi' })).toBeInTheDocument()
    expect(screen.getByText(resume.questions[0].explanation)).toBeInTheDocument()
  })

  it('déplace le focus sur la question suivante après « Question suivante »', async () => {
    const resume = makeResume(1500, 0)
    renderResumed(resume)
    await answer(true)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Question suivante' })) })
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent(resume.questions[1].question)
    expect(heading).toHaveFocus()
  })

  it('n\'affiche pas d\'anneau de focus sur le titre de question, qui n\'est pas interactif', async () => {
    renderResumed(makeResume(1500, 0))
    expect(screen.getByRole('heading', { level: 1 }).className).toMatch(/\boutline-none\b/)
    await answer(false)
    expect(screen.getByRole('heading', { level: 1 }).className).toMatch(/\boutline-none\b/)
  })

  it('n\'affiche pas d\'anneau de focus sur le verdict de la correction, qui n\'est pas interactif', async () => {
    renderResumed(makeResume(1500, 0))
    await answer(true)
    expect(screen.getByRole('status')).toHaveFocus()
    expect(screen.getByRole('status').className).toMatch(/\boutline-none\b/)
  })

  it('ne déplace pas le focus à l\'arrivée sur la première question', () => {
    renderResumed(makeResume(1500, 0))
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveFocus()
  })

  it('affiche le lien source quand la question en a un, dans un nouvel onglet', async () => {
    renderResumed(resumeWith({ source: { url: 'https://www.service-public.fr/x', label: 'service-public.fr' } }))
    await answer(true)
    const link = screen.getByRole('link', { name: /Source : service-public\.fr/ })
    expect(link).toHaveAttribute('href', 'https://www.service-public.fr/x')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('n\'affiche pas de lien source quand la question n\'en a pas', async () => {
    renderResumed(resumeWith({ source: undefined }))
    await answer(true)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('annonce poliment le temps restant à 5 minutes puis à 1 minute', async () => {
    renderResumed(makeResume(5 * 60 + 2, 0))
    const live = document.querySelector('[aria-live="polite"]')!
    expect(live).toHaveTextContent('')
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(live).toHaveTextContent('Il reste moins de 5 minutes.')
    await act(async () => { vi.advanceTimersByTime(4 * 60 * 1000) })
    expect(live).toHaveTextContent("Il reste moins d'une minute.")
  })

  it('à la fin du temps, le résultat indique le nombre de questions sans réponse', async () => {
    renderResumed(makeResume(3, 2))
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(screen.getByText(`Temps écoulé : ${EXAM_SIZE - 2} questions sans réponse`)).toBeInTheDocument()
  })

  it('un examen terminé normalement n\'affiche pas « Temps écoulé »', async () => {
    const resume = makeResume(1200, EXAM_SIZE)
    saveProgress({ ...resume, index: EXAM_SIZE - 1 })
    await act(async () => { renderAt(null) })
    expect(screen.queryByText(/Temps écoulé/)).not.toBeInTheDocument()
  })

  it('le dialogue « Quitter » place « Annuler » avant « Quitter »', async () => {
    renderResumed(makeResume(1500, 0))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Quitter l\'examen' })) })
    const dialog = screen.getByRole('dialog')
    const buttons = within(dialog).getAllByRole('button').map((b) => b.textContent)
    expect(buttons).toEqual(['Annuler', 'Quitter'])
  })
})

describe('buildExam — source', () => {
  it('reporte le champ source facultatif sur la question tirée', () => {
    const source = { url: 'https://www.legifrance.gouv.fr', label: 'Légifrance' }
    const [withSource] = buildExam([{ id: 1, theme: 'T', question: 'Q', answers: ['A'], distractors: ['B', 'C', 'D'], explanation: 'E', source }])
    expect(withSource.source).toEqual(source)
    const [without] = buildExam([{ id: 2, theme: 'T', question: 'Q', answers: ['A'], distractors: ['B', 'C', 'D'], explanation: 'E' }])
    expect(without).not.toHaveProperty('source')
  })
})

// ─── Refonte 4 : écran de résultat ─────────────────────────────────────────────

describe('Examen — écran de résultat', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function seedPassed(count: number) {
    const entries = Array.from({ length: count }, (_, i) => ({
      id: String(i + 1),
      date: '2026-11-01T10:00:00.000Z',
      score: 35,
      total: 40,
      answers: [],
    }))
    localStorage.setItem('quiz-history', JSON.stringify(entries))
  }

  async function finishWith(correct: number) {
    renderResumed(makeResume(2, correct))
    await act(async () => { vi.advanceTimersByTime(3000) })
  }

  it('place le focus sur le titre du résultat à l\'arrivée', async () => {
    await finishWith(10)
    expect(screen.getByRole('heading', { level: 1, name: 'Examen blanc terminé' })).toHaveFocus()
  })

  it('n\'affiche pas d\'anneau de focus sur le titre du résultat, qui n\'est pas interactif', async () => {
    await finishWith(10)
    expect(screen.getByRole('heading', { level: 1, name: 'Examen blanc terminé' }).className).toMatch(/\boutline-none\b/)
  })

  it('26/40 : « Pas encore réussi » sans texte « Bon résultat »', async () => {
    await finishWith(26)
    expect(verdictPill('Pas encore réussi · seuil 32/40')).toBeInTheDocument()
    expect(screen.queryByText(/Bon résultat/)).not.toBeInTheDocument()
    expect(screen.getByText(/^Revoyez vos erreurs, puis retentez/)).toBeInTheDocument()
  })

  it('une réussite après une autre : « Deuxième réussite d\'affilée »', async () => {
    seedPassed(1)
    await finishWith(33)
    expect(screen.getByText(/^Deuxième réussite d'affilée/)).toBeInTheDocument()
  })

  it('première réussite sans historique', async () => {
    await finishWith(32)
    expect(screen.getByText(/^Première réussite/)).toBeInTheDocument()
  })

  it('un échec après deux réussites remet le compteur à 0, avec un message rassurant', async () => {
    seedPassed(2)
    await finishWith(20)
    expect(screen.getByText(/^Le compteur repart à 0 sur 3/)).toBeInTheDocument()
  })

  it('« Voir mes n erreurs » mène au détail de l\'examen enregistré', async () => {
    await finishWith(34)
    const history = JSON.parse(localStorage.getItem('quiz-history')!)
    const link = screen.getByRole('link', { name: /Voir mes 6 erreurs/ })
    expect(link).toHaveAttribute('href', `/examen/${history[0].id}`)
  })

  it('« Voir mes erreurs » nomme le thème le plus faible', async () => {
    const resume = makeResume(2, 39)
    renderResumed(resume)
    await act(async () => { vi.advanceTimersByTime(3000) })
    const theme = resume.questions[39].theme
    expect(screen.getByRole('link', { name: new RegExp(`Voir mon erreur.*Surtout ${theme}`) })).toBeInTheDocument()
  })

  it('40/40 : « Revoir l\'examen », sans erreur', async () => {
    const resume = makeResume(1200, EXAM_SIZE)
    saveProgress({ ...resume, index: EXAM_SIZE - 1 })
    await act(async () => { renderAt(null) })
    expect(screen.getByRole('link', { name: /Revoir l'examen/ })).toBeInTheDocument()
    expect(screen.getByText('Aucune erreur, bravo')).toBeInTheDocument()
  })

  it('sans historique enregistrable, pas de lien vers un détail introuvable', async () => {
    const setItem = Storage.prototype.setItem
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === 'quiz-history') throw new Error('quota')
      setItem.call(this, key, value)
    })
    await finishWith(10)
    spy.mockRestore()
    expect(screen.queryByRole('link', { name: /Voir mes/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nouvel examen blanc' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour à mon parcours' })).toHaveAttribute('href', '/')
  })

  it('sans historique enregistrable, la phrase de parcours n\'annonce aucune réussite', async () => {
    seedPassed(1)
    const setItem = Storage.prototype.setItem
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === 'quiz-history') throw new Error('quota')
      setItem.call(this, key, value)
    })
    await finishWith(34)
    spy.mockRestore()
    expect(screen.getByText(UNSAVED_MESSAGE)).toBeInTheDocument()
    expect(screen.queryByText(/réussite/)).not.toBeInTheDocument()
  })

  function BackButton() {
    const navigate = useNavigate()
    return <button type="button" onClick={() => navigate(-1)}>Retour arrière</button>
  }

  function renderJourney() {
    return render(
      <MemoryRouter initialEntries={['/', '/examen']} initialIndex={1}>
        <Routes>
          <Route path="/" element={<p>Page d'accueil</p>} />
          <Route path="/examen" element={<Examen />} />
          <Route path="/examen/:id" element={<BackButton />} />
        </Routes>
      </MemoryRouter>
    )
  }

  async function finishInJourney(correct: number) {
    const resume = makeResume(1200, EXAM_SIZE)
    resume.answers = resume.answers.map((a, i) => (i < correct ? a : { ...a, chosen: 'x', correct: false }))
    saveProgress({ ...resume, index: EXAM_SIZE - 1 })
    await act(async () => { renderJourney() })
  }

  it('retour arrière après « Voir mes erreurs » : pas de nouvel examen tiré', async () => {
    await finishInJourney(34)
    await act(async () => { fireEvent.click(screen.getByRole('link', { name: /Voir mes 6 erreurs/ })) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Retour arrière' })) })
    expect(screen.getByText("Page d'accueil")).toBeInTheDocument()
    expect(localStorage.getItem(EXAM_PROGRESS_KEY)).toBeNull()
  })

  it('retour arrière après « Revoir l\'examen » (40/40) : pas de nouvel examen tiré', async () => {
    await finishInJourney(EXAM_SIZE)
    await act(async () => { fireEvent.click(screen.getByRole('link', { name: /Revoir l'examen/ })) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Retour arrière' })) })
    expect(screen.getByText("Page d'accueil")).toBeInTheDocument()
    expect(localStorage.getItem(EXAM_PROGRESS_KEY)).toBeNull()
  })
})
