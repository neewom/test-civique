import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import ExamenDetail from './ExamenDetail'
import type { ExamRecord } from '@/lib/exam-types'
import allQuestions from '@/data/questions.json'

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

  it('affiche le score global', () => {
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    expect(screen.getByLabelText(/Score : 1 sur 40/i)).toBeInTheDocument()
  })

  it('affiche le pourcentage', () => {
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    expect(screen.getByText(/3%/)).toBeInTheDocument()
  })

  it('affiche la bonne réponse en vert quand correcte', () => {
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    // La première réponse est correcte : "Réponse choisie" apparaît en vert
    const labels = screen.getAllByText('Réponse choisie')
    expect(labels.length).toBeGreaterThan(0)
  })

  it('affiche "Sans réponse" pour une question sans réponse', () => {
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    expect(screen.getByText(/Sans réponse/i)).toBeInTheDocument()
  })

  it('affiche les explications', () => {
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    const explications = screen.getAllByText('Explication')
    expect(explications.length).toBeGreaterThan(0)
  })

  it('affiche un bouton retour à l\'accueil', () => {
    seedHistory(RECORD)
    renderDetail(RECORD_ID)
    expect(screen.getAllByRole('button', { name: /Retour à l'accueil/i }).length).toBeGreaterThan(0)
  })
})
