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

  it('affiche le titre "Test Civique"', () => {
    renderHome()
    expect(screen.getByRole('heading', { name: /test civique/i })).toBeInTheDocument()
  })

  it('affiche les deux cards "Examen blanc" et "Mode révision"', () => {
    renderHome()
    expect(screen.getByText('Examen blanc')).toBeInTheDocument()
    expect(screen.getByText('Mode révision')).toBeInTheDocument()
  })

  it('affiche "Aucun examen passé" quand le localStorage est vide', () => {
    renderHome()
    expect(screen.getByText('Aucun examen passé')).toBeInTheDocument()
  })
})
