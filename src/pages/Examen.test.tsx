import { themeLabel } from '@/lib/themes'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { within } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Examen, { GLOBAL_EXAM_TIME } from './Examen'
import { UNSAVED_MESSAGE } from '@/lib/readiness'
import type { ExamInProgress } from '@/lib/exam-types'
import { saveProgress, loadProgress, EXAM_PROGRESS_KEY } from '@/lib/exam-types'
import allQuestions from '@/data/questions.json'
import { buildExam, saveResult, shuffle, formatTime, EXAM_SIZE } from '@/lib/exam'
import { questionsForTitle } from '@/test/questions'

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
  // The spoken form of the threshold (« 32 sur 40 », sr-only) is not part of the visible text
  const visible = (el: Element) => {
    const copy = el.cloneNode(true) as Element
    copy.querySelectorAll('.sr-only').forEach((n) => n.remove())
    return (copy.textContent ?? '').replace(/\s+/g, ' ')
  }
  return screen.getByText((_, el) => el?.getAttribute('role') === 'status' && visible(el) === text)
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
    expect(buildExam(questionsForTitle('pluriannuelle'))).toHaveLength(EXAM_SIZE)
  })

  it('chaque question a exactement 4 choix', () => {
    buildExam(questionsForTitle('pluriannuelle')).forEach((q) => expect(q.choices).toHaveLength(4))
  })

  it('la bonne réponse est toujours dans les choix', () => {
    buildExam(questionsForTitle('pluriannuelle')).forEach((q) => expect(q.choices).toContain(q.answer))
  })

  it('chaque question a une explication', () => {
    buildExam(questionsForTitle('pluriannuelle')).forEach((q) => expect(q.explanation).toBeTruthy())
  })

  it('la réponse choisie est toujours une des valeurs du tableau answers', () => {
    const pool: Parameters<typeof buildExam>[0] = [
      { id: 1, theme: 'T', notion: 'patrimoine', question: 'Q', answers: ['A', 'B', 'C'], distractors: ['D', 'E', 'F'], explanation: 'E' },
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
      { id: 1, theme: 'T', notion: 'patrimoine', question: 'Q1', answers: ['A'], distractors: ['B', 'C', 'D'], explanation: 'E', group: 'g1' },
      { id: 2, theme: 'T', notion: 'patrimoine', question: 'Q2', answers: ['A'], distractors: ['B', 'C', 'D'], explanation: 'E', group: 'g1' },
      { id: 3, theme: 'T', notion: 'patrimoine', question: 'Q3', answers: ['A'], distractors: ['B', 'C', 'D'], explanation: 'E', group: 'g2' },
      { id: 4, theme: 'T', notion: 'patrimoine', question: 'Q4', answers: ['A'], distractors: ['B', 'C', 'D'], explanation: 'E' },
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

  it('un nouvel examen ne reprend aucune question du dernier examen du même titre', () => {
    const pool = questionsForTitle('pluriannuelle')
    const previous = buildExam(pool)
    const previousTexts = new Set(previous.map((e) => e.question))
    localStorage.setItem(
      'quiz-history',
      JSON.stringify([
        {
          id: '1',
          date: '2026-01-01T00:00:00.000Z',
          score: 20,
          total: 40,
          answers: previous.map((e) => ({ questionId: e.id, chosen: null, correct: false })),
        },
      ]),
    )
    // Only the first question is on screen: several draws make a leak likely to show
    for (let i = 0; i < 40; i++) {
      const { unmount } = renderExamen()
      const shown = screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent ?? '')
      expect(shown.some((text) => previousTexts.has(text))).toBe(false)
      unmount()
      localStorage.removeItem(EXAM_PROGRESS_KEY)
    }
  })

  it('affiche "Question 1 sur 40" au démarrage', () => {
    renderExamen()
    expect(screen.getByText(`Question 1 sur ${EXAM_SIZE}`)).toBeInTheDocument()
  })

  it('affiche le temps global à "45:00" au démarrage', () => {
    renderExamen()
    expect(GLOBAL_EXAM_TIME).toBe(45 * 60)
    expect(timeLeft()).toBe(2700)
    expect(screen.getByText('45:00')).toBeInTheDocument()
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
    // La correction n'est plus un groupe de boutons radio : les cartes sont du contenu
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(document.querySelector('[data-state="correct"]')).toBeInTheDocument()
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

  it('enregistre la bonne réponse proposée pour chaque question d\'un examen terminé', async () => {
    renderExamen()
    for (let i = 0; i < EXAM_SIZE; i++) {
      await act(async () => { fireEvent.click(getChoices()[0]) })
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider ma réponse' })) })
      const nextBtn =
        screen.queryByRole('button', { name: 'Question suivante' }) ??
        screen.getByRole('button', { name: 'Voir les résultats' })
      await act(async () => { fireEvent.click(nextBtn) })
    }
    const [record] = JSON.parse(localStorage.getItem('quiz-history') ?? '[]')
    expect(record.answers).toHaveLength(EXAM_SIZE)
    for (const a of record.answers) {
      const q = (allQuestions as { id: number; answers: string[] }[]).find((x) => x.id === a.questionId)!
      expect(q.answers).toContain(a.answer)
    }
  })

  it('enregistre aussi la bonne réponse proposée des questions sans réponse quand le chrono expire', async () => {
    renderExamen()
    await act(async () => { fireEvent.click(getChoices()[0]) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider ma réponse' })) })
    // The timer is paused during the correction: move on to the next question before it runs out
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Question suivante' })) })
    await act(async () => { vi.advanceTimersByTime(GLOBAL_EXAM_TIME * 1000) })
    const [record] = JSON.parse(localStorage.getItem('quiz-history') ?? '[]')
    expect(record.answers).toHaveLength(EXAM_SIZE)
    const unanswered = record.answers.filter((a: { chosen: string | null }) => a.chosen === null)
    expect(unanswered).toHaveLength(EXAM_SIZE - 1)
    for (const a of record.answers) {
      const q = (allQuestions as { id: number; answers: string[] }[]).find((x) => x.id === a.questionId)!
      expect(q.answers).toContain(a.answer)
    }
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

  it('le logo de l\'en-tête fin ouvre la fenêtre « Quitter l\'examen ? » au lieu de sortir', async () => {
    renderExamen()
    const header = document.querySelector('[data-app-header]') as HTMLElement
    expect(within(header).getByRole('button', { name: 'Affichage' })).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(within(header).getByRole('button', { name: /Futur Citoyen/ }))
    })
    expect(screen.getByText('Quitter l\'examen ?')).toBeInTheDocument()
    expect(screen.getByText(`Question 1 sur ${EXAM_SIZE}`)).toBeInTheDocument()
  })
})

// ─── Règles officielles : reprise et verdict ──────────────────────────────────

function makeResume(timeLeft: number, correctCount: number): ExamInProgress {
  const questions = buildExam(questionsForTitle('pluriannuelle'))
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
    expect(screen.getByText('Score : 32 sur 40')).toBeInTheDocument()
    expect(verdictPill('Réussi · seuil 32/40')).toBeInTheDocument()
  })

  it('affiche « Pas encore réussi » à 31/40 avec le nombre de réponses manquantes', async () => {
    renderResumed(makeResume(2, 31))
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(screen.getByText('Score : 31 sur 40')).toBeInTheDocument()
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

// Le titre commence par « Question n sur 40 : » (texte masqué, lu au lecteur d'écran) : on le retire
function currentQuestionText(): string {
  return (screen.getByRole('heading', { level: 1 }).textContent ?? '').replace(/^Question \d+ sur \d+ : /, '').trim()
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
    // Rechargement sans marqueur de nouvel examen : il ne doit pas faire tirer un nouvel examen
    renderAt(null)
    expect(screen.getByText(`Question 3 sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(currentQuestionText()).toBe(resume.questions[2].question)
    expect(timeLeft()).toBe(1500)
    await act(async () => { vi.advanceTimersByTime(1000) })
    const saved = loadProgress('pluriannuelle')!
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
    const first = renderAt({ start: 'new' })
    // Nouvel examen demandé : la progression précédente est remplacée
    expect(screen.getByText(`Question 1 sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(timeLeft()).toBe(2700)
    const drawn = currentQuestionText()
    const leftState = JSON.parse(screen.getByTestId('location-state').textContent!)
    expect(leftState).toBeNull()
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
    expect(screen.getByText('Score : 10 sur 40')).toBeInTheDocument()
    expect(historyLength()).toBe(1)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Nouvel examen blanc' }))
    })
    expect(screen.getByText(`Question 1 sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(timeLeft()).toBe(2700)
    expect(loadProgress('pluriannuelle')!.answers).toHaveLength(0)
    expect(loadProgress('pluriannuelle')!.timeLeft).toBe(GLOBAL_EXAM_TIME)

    // Le nouvel examen ne se termine pas tout seul
    await act(async () => { vi.advanceTimersByTime(5000) })
    expect(timeLeft()).toBe(2695)
    expect(historyLength()).toBe(1)
  })

  it('« Nouvel examen blanc » relance un examen conforme (12 mises en situation)', async () => {
    renderAt({ start: 'new' })
    await act(async () => { vi.advanceTimersByTime(GLOBAL_EXAM_TIME * 1000) })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Nouvel examen blanc' }))
    })
    const questions = loadProgress('pluriannuelle')!.questions
    expect(questions).toHaveLength(EXAM_SIZE)
    // An exam question keeps no notion: look it up in the data
    const situationalIds = new Set(
      (allQuestions as { id: number; notion: string }[]).filter((q) => q.notion === 'mise-en-situation').map((q) => q.id),
    )
    expect(questions.filter((q) => situationalIds.has(q.id))).toHaveLength(12)
  })

  it('« Nouvel examen blanc » met le focus sur le titre de la première question (le bouton a disparu)', async () => {
    renderAt({ start: 'new' })
    await act(async () => { vi.advanceTimersByTime(GLOBAL_EXAM_TIME * 1000) })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Nouvel examen blanc' }))
    })
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(new RegExp(`^Question 1 sur ${EXAM_SIZE} : `))
  })

  it('le score du résultat n\'est pas nommé par un aria-label sur un paragraphe (lu « 39 sur 40 »)', async () => {
    renderAt({ start: 'new' })
    await act(async () => { vi.advanceTimersByTime(GLOBAL_EXAM_TIME * 1000) })
    expect(screen.getByText(`Score : 0 sur ${EXAM_SIZE}`)).toHaveClass('sr-only')
    expect(document.querySelector('p[aria-label]')).toBeNull()
  })

  it('une reprise dont toutes les réponses sont données affiche le résultat une seule fois', async () => {
    const resume = makeResume(1200, EXAM_SIZE)
    saveProgress({ ...resume, index: EXAM_SIZE - 1 })
    await act(async () => { renderAt(null) })
    expect(screen.getByText(`Score : ${EXAM_SIZE} sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(historyLength()).toBe(1)
    expect(localStorage.getItem(EXAM_PROGRESS_KEY)).toBeNull()
  })

  it('le chrono ne tourne pas sur le résultat d\'une reprise déjà complète', async () => {
    const resume = makeResume(1200, EXAM_SIZE)
    saveProgress({ ...resume, index: EXAM_SIZE - 1 })
    await act(async () => { renderAt(null) })
    expect(screen.getByText(`Score : ${EXAM_SIZE} sur ${EXAM_SIZE}`)).toBeInTheDocument()
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
  const q = loadProgress('pluriannuelle')!.questions[loadProgress('pluriannuelle')!.index]
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

  it('affiche les minutes sans zéro devant et les secondes sur deux chiffres sous 10 minutes', () => {
    renderResumed(makeResume(262, 0))
    expect(screen.getByText('4:22')).toBeInTheDocument()
  })

  it('regroupe les 4 cartes dans un groupe radio nommé par la question', () => {
    const resume = makeResume(1500, 0)
    renderResumed(resume)
    const group = screen.getByRole('radiogroup', { name: resume.questions[0].question })
    expect(within(group).getAllByRole('radio')).toHaveLength(4)
  })

  it('le titre se lit « Question n sur 40 : … » et le groupe de réponses garde le seul énoncé', () => {
    const resume = makeResume(1500, 2)
    renderResumed(resume)
    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toHaveAccessibleName(`Question 3 sur ${EXAM_SIZE} : ${resume.questions[2].question}`)
    expect(screen.getByRole('radiogroup', { name: resume.questions[2].question })).toBeInTheDocument()
  })

  it('en correction, le titre porte aussi le numéro de la question', async () => {
    renderResumed(makeResume(1500, 0))
    await answer(true)
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(new RegExp(`^Question 1 sur ${EXAM_SIZE} : `))
  })

  it('affiche le temps en minutes et secondes, avec une barre nommée en minutes arrondies au supérieur', () => {
    renderResumed(makeResume(31 * 60 - 20, 0))
    expect(screen.getByText('30:40')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Temps restant' })).toHaveAttribute('aria-valuetext', '31 minutes sur 45')
  })

  it('bonne réponse : « Bonne réponse » annoncé, focus sur l\'intitulé de la question, une seule étiquette « Votre réponse · bonne réponse »', async () => {
    renderResumed(makeResume(1500, 0))
    await answer(true)
    expect(screen.getByRole('status')).toHaveTextContent('Bonne réponse')
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
    expect(screen.getByText('Votre réponse · bonne réponse')).toBeInTheDocument()
    expect(screen.queryByText('Bonne réponse', { selector: 'span' })).not.toBeInTheDocument()
    expect(screen.queryByText('Votre réponse', { exact: true })).not.toBeInTheDocument()
  })

  it('réponse fausse : « Pas tout à fait » annoncé, bonne réponse et réponse de l\'utilisateur', async () => {
    const resume = makeResume(1500, 0)
    renderResumed(resume)
    await answer(false)
    expect(screen.getByRole('status')).toHaveTextContent('Pas tout à fait')
    // The answer is drawn at random: escape it, a parenthesis (question 56) broke the pattern
    const answerStart = resume.questions[0].answer.slice(0, 10).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Correction : quatre cartes de contenu (plus de radio désactivée, lue « non cochée » sur la bonne réponse)
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(screen.getByText('Bonne réponse').closest('[data-state]')).toHaveTextContent(new RegExp(`Bonne réponse.*${answerStart}`))
    expect(screen.getByText('Votre réponse').closest('[data-state]')).toHaveAttribute('data-state', 'wrong')
    expect(screen.getByRole('heading', { level: 2, name: 'Pourquoi' })).toBeInTheDocument()
    expect(screen.getByText(resume.questions[0].explanation)).toBeInTheDocument()
  })

  it('correction : le thème et les 4 réponses restent à leur place, les deux autres en retrait', async () => {
    const resume = makeResume(1500, 0)
    renderResumed(resume)
    const q = resume.questions[0]
    const before = screen.getAllByRole('radio').map((r) => r.closest('label')!.textContent)
    expect(screen.getByText(themeLabel(q.theme))).toBeInTheDocument()
    await answer(false)
    // Same theme pill, same order of the 4 choices
    expect(screen.getByText(themeLabel(q.theme))).toBeInTheDocument()
    const cards = Array.from(document.querySelectorAll('[data-state]')).filter((el) => el.tagName === 'DIV')
    expect(cards).toHaveLength(4)
    before.forEach((text, i) => expect(cards[i].textContent!.endsWith(text!.slice(1))).toBe(true))
    expect(cards.map((c) => c.getAttribute('data-state')).sort()).toEqual(['correct', 'other', 'other', 'wrong'])
    cards.filter((c) => c.getAttribute('data-state') === 'other').forEach((c) => expect(c).toHaveClass('opacity-45'))
  })

  it('correction : le verdict est un tampon hors du flux, masqué aux lecteurs d\'écran, qui disparaît seul', async () => {
    localStorage.setItem('motion', 'on')
    renderResumed(makeResume(1500, 0))
    await answer(true)
    const stamp = screen.getByTestId('verdict-stamp')
    expect(stamp).toHaveTextContent('Bien joué')
    expect(stamp).toHaveAttribute('aria-hidden', 'true')
    expect(stamp).toHaveClass('fixed', 'pointer-events-none')
    // Not a status of its own (the announcement is the screen-reader region) and not in the heading
    expect(screen.getAllByRole('status')).toHaveLength(1)
    await act(async () => { vi.advanceTimersByTime(1100) })
    expect(screen.getByTestId('verdict-stamp')).toBeInTheDocument()
    await act(async () => { vi.advanceTimersByTime(500) })
    expect(screen.queryByTestId('verdict-stamp')).not.toBeInTheDocument()
  })

  it('correction, tampon d\'une mauvaise réponse : « Pas tout à fait »', async () => {
    renderResumed(makeResume(1500, 0))
    await answer(false)
    expect(screen.getByTestId('verdict-stamp')).toHaveTextContent('Pas tout à fait')
  })

  it('une nouvelle correction retire le tampon précédent', async () => {
    renderResumed(makeResume(1500, 0))
    await answer(true)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Question suivante' })) })
    expect(screen.queryByTestId('verdict-stamp')).not.toBeInTheDocument()
    await answer(false)
    expect(screen.getAllByTestId('verdict-stamp')).toHaveLength(1)
    expect(screen.getByTestId('verdict-stamp')).toHaveTextContent('Pas tout à fait')
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

  it('le chrono est arrêté pendant la correction et repart à la question suivante', async () => {
    renderResumed(makeResume(1500, 0))
    await act(async () => { vi.advanceTimersByTime(3000) })
    await answer(true)
    const atCorrection = timeLeft()
    expect(atCorrection).toBe(1497)
    await act(async () => { vi.advanceTimersByTime(60 * 1000) })
    expect(timeLeft()).toBe(atCorrection)
    expect(loadProgress('pluriannuelle')!.timeLeft).toBe(atCorrection)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Question suivante' })) })
    await act(async () => { vi.advanceTimersByTime(2000) })
    expect(timeLeft()).toBe(atCorrection - 2)
  })

  it('affiche le picto pause à côté du temps pendant la correction seulement', async () => {
    renderResumed(makeResume(1500, 0))
    expect(screen.queryByTestId('timer-paused')).not.toBeInTheDocument()
    await answer(true)
    expect(screen.getByTestId('timer-paused')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Temps restant' })).toHaveAttribute('aria-valuetext', '25 minutes sur 45, en pause')
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Question suivante' })) })
    expect(screen.queryByTestId('timer-paused')).not.toBeInTheDocument()
  })

  it('le temps expiré pendant la réponse termine toujours l\'examen', async () => {
    renderResumed(makeResume(2, 0))
    await act(async () => { vi.advanceTimersByTime(2000) })
    expect(screen.getByText(/sans réponse/)).toBeInTheDocument()
  })

  it('pastille « Moins de 5 minutes » et barre corail : absentes à 300 s, présentes à 299 s', async () => {
    renderResumed(makeResume(300, 0))
    expect(screen.queryByText('Moins de 5 minutes')).not.toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Temps restant' }).className).not.toMatch(/bg-coral/)
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(timeLeft()).toBe(299)
    expect(screen.getByText('Moins de 5 minutes')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Temps restant' }).className).toMatch(/bg-coral/)
  })

  it('annonce « moins de 5 minutes » dès la reprise d\'un examen déjà sous les 5 minutes', async () => {
    renderResumed(makeResume(262, 27))
    const live = document.querySelector('[aria-live="polite"]')!
    await act(async () => { await Promise.resolve() })
    expect(live).toHaveTextContent('Il reste moins de 5 minutes.')
    expect(screen.getByText('Moins de 5 minutes')).toBeInTheDocument()
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

  it('boîte « Quitter » : promet la sauvegarde quand elle a réussi', async () => {
    renderResumed(makeResume(1500, 0))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Quitter l\'examen' })) })
    expect(screen.getByText(/Votre progression est sauvegardée/)).toBeInTheDocument()
    expect(screen.queryByText(/n'a pas pu être enregistrée/)).not.toBeInTheDocument()
  })

  it('boîte « Quitter » : prévient que l\'examen sera perdu quand l\'enregistrement a échoué', async () => {
    renderResumed(makeResume(1500, 0))
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    await act(async () => { vi.advanceTimersByTime(2000) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Quitter l\'examen' })) })
    spy.mockRestore()
    expect(screen.getByText("Votre progression n'a pas pu être enregistrée sur cet appareil : si vous quittez, cet examen sera perdu.")).toBeInTheDocument()
    expect(screen.queryByText(/Votre progression est sauvegardée/)).not.toBeInTheDocument()
  })

  it('boîte « Quitter » : le dernier enregistrement décide (réussi après un échec)', async () => {
    renderResumed(makeResume(1500, 0))
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    await act(async () => { vi.advanceTimersByTime(2000) })
    spy.mockRestore()
    await act(async () => { vi.advanceTimersByTime(2000) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Quitter l\'examen' })) })
    expect(screen.getByText(/Votre progression est sauvegardée/)).toBeInTheDocument()
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
    const [withSource] = buildExam([{ id: 1, theme: 'T', notion: 'patrimoine', question: 'Q', answers: ['A'], distractors: ['B', 'C', 'D'], explanation: 'E', source }])
    expect(withSource.source).toEqual(source)
    const [without] = buildExam([{ id: 2, theme: 'T', notion: 'patrimoine', question: 'Q', answers: ['A'], distractors: ['B', 'C', 'D'], explanation: 'E' }])
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

  it('« Voir les n questions à revoir » mène au détail de l\'examen enregistré', async () => {
    await finishWith(34)
    const history = JSON.parse(localStorage.getItem('quiz-history')!)
    const link = screen.getByRole('link', { name: /Voir les 6 questions à revoir/ })
    expect(link).toHaveAttribute('href', `/examen/${history[0].id}`)
  })

  it('« Voir mes erreurs » nomme le thème le plus faible', async () => {
    const resume = makeResume(2, 39)
    renderResumed(resume)
    await act(async () => { vi.advanceTimersByTime(3000) })
    const theme = resume.questions[39].theme
    expect(screen.getByRole('link', { name: new RegExp(`Voir la question à revoir.*À travailler : ${themeLabel(theme)}`) })).toBeInTheDocument()
  })

  it('un seul résultat à revoir : « Voir la question à revoir »', async () => {
    const resume = makeResume(2, 39)
    renderResumed(resume)
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(screen.getByRole('link', { name: /^Voir la question à revoir/ })).toBeInTheDocument()
  })

  it('les questions sans réponse comptent parmi les questions à revoir', async () => {
    // 30 answered right, the 10 left unanswered when the timer runs out
    renderResumed(makeResume(2, 30))
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(screen.getByRole('link', { name: /^Voir les 10 questions à revoir/ })).toBeInTheDocument()
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
    expect(screen.queryByRole('link', { name: /questions? à revoir/ })).not.toBeInTheDocument()
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
    await act(async () => { fireEvent.click(screen.getByRole('link', { name: /Voir les 6 questions à revoir/ })) })
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

describe('Examen — titre visé', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('enregistre le titre dans la progression d\'un nouvel examen', () => {
    renderExamen()
    expect(loadProgress('pluriannuelle')?.title).toBe('pluriannuelle')
  })

  it('enregistre le titre dans l\'historique à la fin de l\'examen', async () => {
    renderResumed(makeResume(2, 10))
    await act(async () => { vi.advanceTimersByTime(3000) })
    const history = JSON.parse(localStorage.getItem('quiz-history')!)
    expect(history.at(-1).title).toBe('pluriannuelle')
  })

  it('reprend un examen en cours enregistré sans titre', () => {
    const resume = makeResume(1500, 3)
    renderResumed(resume)
    expect(screen.getByText(`Question 4 sur ${EXAM_SIZE}`)).toBeInTheDocument()
  })

  it('ne reprend pas un examen en cours d\'un autre titre : un nouvel examen est tiré', () => {
    const resume = { ...makeResume(1500, 3), title: 'resident' as const }
    renderResumed(resume)
    expect(screen.getByText(`Question 1 sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(timeLeft()).toBe(GLOBAL_EXAM_TIME)
  })

  it('le message de parcours ne compte que les examens du titre', async () => {
    localStorage.setItem('quiz-history', JSON.stringify([
      { id: '1', date: '2026-11-01T10:00:00.000Z', score: 35, total: 40, answers: [] },
      { id: '2', date: '2026-11-02T10:00:00.000Z', score: 35, total: 40, answers: [], title: 'naturalisation' },
    ]))
    renderResumed(makeResume(2, 33))
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(screen.getByText(/^Deuxième réussite d'affilée/)).toBeInTheDocument()
  })
})
