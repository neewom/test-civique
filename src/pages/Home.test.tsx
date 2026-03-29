import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import Home from './Home'

function renderHome() {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
}

describe('Home', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('affiche le titre "Test Civique" dans un h1', () => {
    renderHome()
    expect(screen.getByRole('heading', { level: 1, name: /test civique/i })).toBeInTheDocument()
  })

  it('a un conteneur principal avec role="main"', () => {
    renderHome()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('affiche la card "Examen blanc" avec le bon aria-label', () => {
    renderHome()
    expect(screen.getByRole('button', { name: 'Démarrer un examen blanc' })).toBeInTheDocument()
  })

  it('affiche la card "Mode révision" avec le bon aria-label', () => {
    renderHome()
    expect(screen.getByRole('button', { name: 'Accéder au mode révision' })).toBeInTheDocument()
  })

  it('la section historique a le bon aria-label', () => {
    renderHome()
    expect(screen.getByRole('region', { name: 'Historique des examens récents' })).toBeInTheDocument()
  })

  it('affiche "Aucun examen passé" quand le localStorage est vide', () => {
    renderHome()
    expect(screen.getByText('Aucun examen passé')).toBeInTheDocument()
  })

  it('les entrées d\'historique avec id sont cliquables', () => {
    localStorage.setItem('quiz-history', JSON.stringify([
      { id: '123', date: new Date().toISOString(), score: 30, total: 40, answers: [] },
    ]))
    renderHome()
    const btn = screen.getByRole('button', { name: /voir le détail/i })
    expect(btn).toBeInTheDocument()
  })
})
