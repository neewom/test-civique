import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import ExamenBlanc from './ExamenBlanc'
import Examen from './Examen'
import { ThemeProvider } from '@/components/ThemeProvider'
import { saveProgress, loadProgress } from '@/lib/exam-types'
import type { ExamInProgress } from '@/lib/exam-types'
import { buildExam, questionsForTitle, EXAM_SIZE } from '@/lib/exam'
import type { TitleKey } from '@/lib/target-title'

function makeProgress(title: TitleKey, answered: number): ExamInProgress {
  const questions = buildExam(questionsForTitle(title))
  return {
    questions,
    index: answered,
    answers: questions.slice(0, answered).map((q) => ({ questionId: q.id, chosen: q.answer, correct: true })),
    timeLeft: 1500,
    startedAt: '2026-11-01T10:00:00.000Z',
    title,
  }
}

function Probe() {
  const l = useLocation()
  return <p data-testid="loc">{l.pathname}</p>
}

function renderPage() {
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/examen-blanc']}>
        <Routes>
          <Route path="/examen-blanc" element={<ExamenBlanc />} />
          <Route path="/examen" element={<Examen />} />
          <Route path="*" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('/examen-blanc', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('target-title', 'resident')
  })

  it("a un titre d'onglet distinct de celui de l'examen", () => {
    renderPage()
    expect(document.title).toBe("Avant l'examen blanc · Futur Citoyen")
  })

  it('affiche le titre visé, les repères du jour J et ce qui change', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Examen blanc' })).toBeInTheDocument()
    expect(screen.getByText('Carte de résident')).toBeInTheDocument()
    const marks = within(screen.getByRole('region', { name: 'Comme le jour J' }))
    expect(marks.getByText(String(EXAM_SIZE))).toBeInTheDocument()
    expect(marks.getByText('45 min')).toBeInTheDocument()
    expect(marks.getByText('4 choix')).toBeInTheDocument()
    expect(marks.getByText('32/40')).toBeInTheDocument()
    expect(screen.getByText(/correction et l'explication après chaque question/)).toBeInTheDocument()
    expect(screen.getByText("Le chrono s'arrête pendant la correction.")).toBeInTheDocument()
    expect(screen.getByText(/erreurs vont dans « À revoir »/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: "Tout savoir sur l'examen" })).toHaveAttribute('href', '/regles')
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/')
  })

  it('« Commencer l\'examen blanc » lance un nouvel examen à la question 1', () => {
    renderPage()
    fireEvent.click(screen.getByRole('link', { name: "Commencer l'examen blanc" }))
    expect(screen.getByText(`Question 1 sur ${EXAM_SIZE}`)).toBeInTheDocument()
  })

  it('avec un examen en cours : « Reprendre » à la bonne question, progression intacte', () => {
    const progress = makeProgress('resident', 3)
    saveProgress(progress)
    renderPage()
    expect(screen.queryByRole('link', { name: "Commencer l'examen blanc" })).toBeNull()
    fireEvent.click(screen.getByRole('link', { name: `Reprendre l'examen (question 4 sur ${EXAM_SIZE})` }))
    expect(screen.getByText(`Question 4 sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(loadProgress('resident')?.answers).toHaveLength(3)
  })

  it('un examen en cours d\'un autre titre est ignoré : pas de reprise proposée', () => {
    saveProgress(makeProgress('pluriannuelle', 3))
    renderPage()
    expect(screen.getByRole('link', { name: "Commencer l'examen blanc" })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Reprendre l'examen/ })).toBeNull()
  })

  it('« Commencer un nouvel examen » demande confirmation ; Annuler garde l\'examen en cours', () => {
    const progress = makeProgress('resident', 3)
    saveProgress(progress)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Commencer un nouvel examen' }))
    expect(screen.getByText("L'examen en cours sera abandonné.")).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(loadProgress('resident')?.questions.map((q) => q.id)).toEqual(progress.questions.map((q) => q.id))
    expect(screen.getByRole('heading', { level: 1, name: 'Examen blanc' })).toBeInTheDocument()
  })

  it('confirmer remplace l\'examen en cours par un nouvel examen à la question 1', () => {
    saveProgress(makeProgress('resident', 3))
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Commencer un nouvel examen' }))
    fireEvent.click(screen.getByRole('button', { name: 'Nouvel examen' }))
    expect(screen.getByText(`Question 1 sur ${EXAM_SIZE}`)).toBeInTheDocument()
    expect(loadProgress('resident')?.answers ?? []).toHaveLength(0)
  })
})
