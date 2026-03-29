import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Revision from './Revision'
import questions from '@/data/questions.json'

function renderRevision() {
  render(
    <MemoryRouter>
      <Revision />
    </MemoryRouter>
  )
}

describe('Revision', () => {
  it('affiche le titre "Mode révision"', () => {
    renderRevision()
    expect(screen.getByRole('heading', { level: 1, name: /mode révision/i })).toBeInTheDocument()
  })

  it('affiche le nombre total de questions', () => {
    renderRevision()
    expect(screen.getByText(`${questions.length} questions par thème`)).toBeInTheDocument()
  })

  it('affiche toutes les questions', () => {
    renderRevision()
    questions.forEach((q) => {
      expect(screen.getByText(q.question)).toBeInTheDocument()
    })
  })

  it('affiche les bonnes réponses mises en évidence', () => {
    renderRevision()
    expect(screen.getAllByText('Bonne réponse')).toHaveLength(questions.length)
  })

  it('affiche une section par thème', () => {
    renderRevision()
    const themes = [...new Set(questions.map((q) => q.theme))]
    themes.forEach((theme) => {
      expect(screen.getByRole('region', { name: `Thème : ${theme}` })).toBeInTheDocument()
    })
  })

  it('affiche le lien retour vers l\'accueil', () => {
    renderRevision()
    expect(screen.getByText(/← Accueil/)).toBeInTheDocument()
  })
})
