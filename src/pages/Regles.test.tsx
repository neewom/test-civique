import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import Regles from './Regles'
import { LEGIFRANCE_URL } from '@/components/ExamRules'

function renderRegles() {
  render(
    <MemoryRouter>
      <Regles />
    </MemoryRouter>,
  )
}

describe('Page « Comment se passe l\'examen »', () => {
  it('a son titre de page et d\'onglet', () => {
    renderRegles()
    expect(screen.getByRole('heading', { level: 1, name: "Comment se passe l'examen" })).toBeInTheDocument()
    expect(document.title).toBe("Comment se passe l'examen · Futur Citoyen")
  })

  it('reprend les règles officielles : 40 questions, 45 minutes, 32/40', () => {
    renderRegles()
    const figures = screen.getByRole('list', { name: "L'examen en bref" })
    expect(figures).toHaveTextContent('40questions')
    expect(figures).toHaveTextContent('45 minau maximum')
    expect(figures).toHaveTextContent('32/40pour réussir')
    expect(screen.getByText(/Réussite à 80 % de bonnes réponses, soit 32 sur 40/)).toBeInTheDocument()
    expect(screen.getByText(/pas de point en moins/)).toBeInTheDocument()
  })

  it('donne la répartition des 40 questions par thème', () => {
    renderRegles()
    expect(screen.getByRole('heading', { level: 2, name: 'Répartition des 40 questions' })).toBeInTheDocument()
    expect(screen.getByText('Principes et valeurs de la République')).toBeInTheDocument()
    expect(screen.getByText('Vivre dans la société française')).toBeInTheDocument()
  })

  it('renvoie vers l\'arrêté sur Légifrance, dans un nouvel onglet', () => {
    renderRegles()
    const link = screen.getByRole('link', { name: /arrêté du 10 octobre 2025/ })
    expect(link).toHaveAttribute('href', LEGIFRANCE_URL)
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('« Retour » mène à l\'accueil, « M\'entraîner maintenant » mène à la page avant l\'examen blanc', () => {
    renderRegles()
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: "M'entraîner maintenant" })).toHaveAttribute('href', '/examen-blanc')
  })

  it('« M\'entraîner maintenant » ouvre /examen-blanc quand aucun examen n\'est en cours (la reprise est testée avec l\'accueil)', async () => {
    function Probe() {
      return <p>chemin : {useLocation().pathname}</p>
    }
    render(
      <MemoryRouter initialEntries={['/regles']}>
        <Routes>
          <Route path="/regles" element={<Regles />} />
          <Route path="/examen-blanc" element={<Probe />} />
        </Routes>
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('link', { name: "M'entraîner maintenant" }))
    expect(screen.getByText('chemin : /examen-blanc')).toBeInTheDocument()
  })
})
