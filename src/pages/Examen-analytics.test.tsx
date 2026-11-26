// @vitest-environment-options { "url": "https://futurcitoyen.fr/" }
// Exam events of the visit stats (src/lib/analytics.ts), on the production host
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Examen, { GLOBAL_EXAM_TIME } from './Examen'
import type { ExamInProgress } from '@/lib/exam-types'
import { saveProgress } from '@/lib/exam-types'
import { buildExam, questionsForTitle, EXAM_SIZE } from '@/lib/exam'
import {
  resetAnalyticsForTests,
  EXAM_STARTED,
  EXAM_FINISHED_PASSED,
  EXAM_FINISHED_NOT_YET,
} from '@/lib/analytics'

let beacon: ReturnType<typeof vi.fn>

// Names of the events sent (page views are not sent here: no PageViewTracker)
function events(): string[] {
  return beacon.mock.calls
    .map(([url]) => new URL(String(url), window.location.origin).searchParams)
    .filter((params) => params.get('e') === 'true')
    .map((params) => params.get('p') ?? '')
}

function makeResume(timeLeft: number, answered: number, correct: boolean): ExamInProgress {
  const questions = buildExam(questionsForTitle('pluriannuelle'))
  return {
    questions,
    index: answered,
    answers: questions.slice(0, answered).map((q) => ({ questionId: q.id, chosen: q.answer, correct })),
    timeLeft,
    startedAt: '2026-11-01T10:00:00.000Z',
  }
}

function renderAt(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/examen', state }]}>
      <Examen />
    </MemoryRouter>,
  )
}

async function answerAndContinue(choice: HTMLElement) {
  await act(async () => { fireEvent.click(choice) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider ma réponse' })) })
  const next =
    screen.queryByRole('button', { name: 'Question suivante' }) ??
    screen.getByRole('button', { name: 'Voir les résultats' })
  await act(async () => { fireEvent.click(next) })
}

describe('Examen — statistiques de visite', () => {
  beforeEach(() => {
    localStorage.clear()
    resetAnalyticsForTests()
    beacon = vi.fn(() => true)
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true, writable: true })
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('compte « examen commencé » une fois pour un nouvel examen demandé depuis l’accueil', async () => {
    saveProgress(makeResume(1500, 2, true))
    renderAt({ start: 'new' })
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(events()).toEqual([EXAM_STARTED])
  })

  it('compte « examen commencé » quand aucun examen n’est en cours', () => {
    renderAt(null)
    expect(events()).toEqual([EXAM_STARTED])
  })

  it('ne compte rien à la reprise d’un examen en cours, ni au rechargement après le marqueur consommé', async () => {
    saveProgress(makeResume(1500, 2, true))
    renderAt(null)
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(events()).toEqual([])
  })

  it('fin normale réussie : « examen-termine-reussi » une seule fois', async () => {
    const resume = makeResume(1500, EXAM_SIZE - 1, true)
    saveProgress(resume)
    renderAt(null)
    const answer = resume.questions[EXAM_SIZE - 1].answer
    const right = screen.getAllByRole('radio').find((el) =>
      Array.from(el.closest('label')?.querySelectorAll('span') ?? []).some((span) => span.textContent === answer),
    )!
    await answerAndContinue(right)
    expect(screen.getByLabelText(`Score : ${EXAM_SIZE} sur ${EXAM_SIZE}`)).toBeInTheDocument()
    await act(async () => { vi.advanceTimersByTime(GLOBAL_EXAM_TIME * 1000) })
    expect(events()).toEqual([EXAM_FINISHED_PASSED])
  })

  it('fin normale pas encore réussie : « examen-termine-pas-encore » une seule fois', async () => {
    saveProgress(makeResume(1500, EXAM_SIZE - 1, false))
    renderAt(null)
    await answerAndContinue(screen.getAllByRole('radio')[0])
    await act(async () => { vi.advanceTimersByTime(GLOBAL_EXAM_TIME * 1000) })
    expect(events()).toEqual([EXAM_FINISHED_NOT_YET])
  })

  it('chrono expiré : un nouvel examen compte « commencé » puis « pas encore », une fois chacun', async () => {
    renderAt({ start: 'new' })
    await act(async () => { vi.advanceTimersByTime(GLOBAL_EXAM_TIME * 1000) })
    await act(async () => { vi.advanceTimersByTime(5000) })
    expect(events()).toEqual([EXAM_STARTED, EXAM_FINISHED_NOT_YET])
  })

  it('chrono expiré avec 32 bonnes réponses : « examen-termine-reussi »', async () => {
    saveProgress(makeResume(2, 32, true))
    renderAt(null)
    await act(async () => { vi.advanceTimersByTime(5000) })
    expect(events()).toEqual([EXAM_FINISHED_PASSED])
  })

  it('reprise déjà complète : terminée au montage, un seul envoi et pas de « commencé »', async () => {
    const resume = makeResume(1200, EXAM_SIZE, true)
    saveProgress({ ...resume, index: EXAM_SIZE - 1 })
    await act(async () => { renderAt(null) })
    await act(async () => { vi.advanceTimersByTime(5000) })
    expect(events()).toEqual([EXAM_FINISHED_PASSED])
  })

  it('« Nouvel examen blanc » compte un nouvel « examen commencé »', async () => {
    saveProgress(makeResume(2, 10, true))
    renderAt(null)
    await act(async () => { vi.advanceTimersByTime(3000) })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Nouvel examen blanc' }))
    })
    expect(events()).toEqual([EXAM_FINISHED_NOT_YET, EXAM_STARTED])
  })
})
