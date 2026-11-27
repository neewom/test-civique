import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import Home from './Home'
import Regles from './Regles'
import ExamenBlanc from './ExamenBlanc'
import Examen, { GLOBAL_EXAM_TIME } from './Examen'
import { ThemeProvider } from '@/components/ThemeProvider'
import { saveProgress, loadProgress } from '@/lib/exam-types'
import type { ExamInProgress } from '@/lib/exam-types'
import { buildExam, EXAM_SIZE } from '@/lib/exam'
import { questionsForTitle } from '@/test/questions'
import type { TitleKey } from '@/lib/target-title'

// Home step 2 and « M'entraîner maintenant » on /regles must resume the exam in progress
// of the chosen title instead of erasing it, and draw a new exam only when there is none.

function makeProgress(title: TitleKey, answered: number, timeLeft: number): ExamInProgress {
  const questions = buildExam(questionsForTitle(title))
  return {
    questions,
    index: answered,
    answers: questions.slice(0, answered).map((q) => ({ questionId: q.id, chosen: q.answer, correct: true })),
    timeLeft,
    startedAt: '2026-11-01T10:00:00.000Z',
    title,
  }
}

function renderAt(path: string) {
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/regles" element={<Regles />} />
          <Route path="/examen-blanc" element={<ExamenBlanc />} />
          <Route path="/examen" element={<Examen />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

const entries: { name: string; path: string; click: () => void }[] = [
  {
    name: 'l\'étape 2 de l\'accueil',
    path: '/',
    click: () => fireEvent.click(screen.getByRole('button', { name: /2 · Réussir 3 examens blancs/ })),
  },
  {
    name: '« M\'entraîner maintenant » sur /regles',
    path: '/regles',
    click: () => fireEvent.click(screen.getByRole('link', { name: "M'entraîner maintenant" })),
  },
]

describe.each(entries)('$name', ({ path, click }) => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('target-title', 'pluriannuelle')
  })

  it('reprend l\'examen en cours à la bonne question, progression intacte', () => {
    const progress = makeProgress('pluriannuelle', 3, 1500)
    saveProgress(progress)
    renderAt(path)
    click()
    expect(screen.getByText(`Question 4 sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(loadProgress('pluriannuelle')?.questions.map((q) => q.id)).toEqual(progress.questions.map((q) => q.id))
    expect(loadProgress('pluriannuelle')?.answers).toHaveLength(3)
  })

  it('lance un nouvel examen sans examen en cours, après la page avant l\'examen blanc', () => {
    renderAt(path)
    click()
    expect(screen.getByRole('heading', { level: 1, name: 'Examen blanc' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: "Commencer l'examen blanc" }))
    expect(screen.getByText(`Question 1 sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(screen.getAllByRole('progressbar').some((el) => el.getAttribute('aria-valuenow') === String(GLOBAL_EXAM_TIME))).toBe(true)
  })

  it('lance un nouvel examen du titre choisi quand l\'examen en cours est celui d\'un autre titre, laissé intact', () => {
    const other = makeProgress('resident', 5, 900)
    saveProgress(other)
    renderAt(path)
    click()
    fireEvent.click(screen.getByRole('link', { name: "Commencer l'examen blanc" }))
    expect(screen.getByText(`Question 1 sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(loadProgress('resident')).toEqual(other)
  })
})
