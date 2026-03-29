import { render, screen, fireEvent, act } from '@testing-library/react'
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

  it('affiche un bouton "Tous" et un bouton par thème', () => {
    renderRevision()
    const themes = [...new Set(questions.map((q) => q.theme))]
    expect(screen.getByRole('button', { name: 'Tous' })).toBeInTheDocument()
    themes.forEach((theme) => {
      expect(screen.getByRole('button', { name: theme })).toBeInTheDocument()
    })
  })

  it('le bouton "Tous" est actif par défaut', () => {
    renderRevision()
    expect(screen.getByRole('button', { name: 'Tous' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('filtrer par thème n\'affiche que les questions de ce thème', async () => {
    renderRevision()
    const firstTheme = [...new Set(questions.map((q) => q.theme))][0]
    const themeQuestions = questions.filter((q) => q.theme === firstTheme)
    const otherQuestions = questions.filter((q) => q.theme !== firstTheme)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: firstTheme }))
    })

    themeQuestions.forEach((q) => {
      expect(screen.getByText(q.question)).toBeInTheDocument()
    })
    // Une question d'un autre thème ne doit plus être visible
    expect(screen.queryByText(otherQuestions[0].question)).not.toBeInTheDocument()
  })

  it('le bouton du thème actif est mis en évidence (aria-pressed)', async () => {
    renderRevision()
    const firstTheme = [...new Set(questions.map((q) => q.theme))][0]
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: firstTheme }))
    })
    expect(screen.getByRole('button', { name: firstTheme })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Tous' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('cliquer sur "Tous" réaffiche toutes les questions', async () => {
    renderRevision()
    const firstTheme = [...new Set(questions.map((q) => q.theme))][0]
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: firstTheme }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tous' }))
    })
    expect(screen.getAllByText('Bonne réponse')).toHaveLength(questions.length)
  })
})
