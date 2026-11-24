import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { ArrowRight } from 'lucide-react'
import { PillButton, PillLink } from '@/components/PillButton'

describe('PillButton', () => {
  it('est un bouton avec son libellé et réagit au clic', async () => {
    const onClick = vi.fn()
    render(<PillButton onClick={onClick}>Valider ma réponse</PillButton>)
    const button = screen.getByRole('button', { name: 'Valider ma réponse' })
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('a 48 px de haut par défaut et 56 px en grand, en hauteur minimale relative (texte agrandi)', () => {
    render(
      <>
        <PillButton>Normal</PillButton>
        <PillButton size="lg">Grand</PillButton>
      </>,
    )
    const normal = screen.getByRole('button', { name: 'Normal' })
    const large = screen.getByRole('button', { name: 'Grand' })
    expect(normal).toHaveClass('min-h-12', 'rounded-[1.5rem]', 'whitespace-normal')
    expect(normal).not.toHaveClass('whitespace-nowrap')
    expect(large).toHaveClass('min-h-14', 'rounded-[1.75rem]')
  })

  it.each([
    ['action', 'bg-action'],
    ['ink', 'bg-primary'],
    ['surface', 'bg-card'],
  ] as const)('applique le ton %s', (tone, cls) => {
    render(<PillButton tone={tone}>Libellé</PillButton>)
    expect(screen.getByRole('button')).toHaveClass(cls)
  })

  it('masque une icône de fin aux lecteurs d\'écran', () => {
    render(<PillButton end={<ArrowRight data-testid="icon" />}>Reprendre l'examen en cours</PillButton>)
    const end = screen.getByTestId('icon').closest('[data-slot="pill-end"]')
    expect(end).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: "Reprendre l'examen en cours" })).toBeInTheDocument()
  })

  it('fait lire un compteur de fin avec le libellé', () => {
    render(<PillButton end="1 sur 3" endIsText>Réussir 3 examens blancs</PillButton>)
    const end = screen.getByText('1 sur 3')
    expect(end).not.toHaveAttribute('aria-hidden')
    expect(screen.getByRole('button', { name: /^Réussir 3 examens blancs\s*,\s*1 sur 3$/ })).toBeInTheDocument()
  })

  it('existe en lien de navigation (PillLink), avec le rôle lien et la même forme', () => {
    render(
      <MemoryRouter>
        <PillLink to="/revision" tone="surface" end="✓">Réviser les thèmes</PillLink>
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: 'Réviser les thèmes' })
    expect(link).toHaveAttribute('href', '/revision')
    expect(link).toHaveClass('min-h-12', 'rounded-[1.5rem]', 'bg-card', 'justify-between')
  })
})
