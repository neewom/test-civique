import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Verdict } from '@/components/Verdict'

describe('Verdict', () => {
  it.each([
    ['success', 'Réussi', 'bg-primary'],
    ['error', 'Pas tout à fait', 'bg-coral'],
    ['pending', 'Pas encore réussi', 'bg-card'],
  ] as const)('ton %s : texte, icône et couleur, annoncé comme statut', (tone, text, cls) => {
    render(<Verdict tone={tone}>{text}</Verdict>)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(text)
    expect(status).toHaveClass(cls)
    expect(status).toHaveAttribute('data-tone', tone)
    const icon = status.querySelector('svg')
    expect(icon).not.toBeNull()
    expect(icon!.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('a une taille plus grande pour le résultat d\'examen', () => {
    render(<Verdict tone="success" size="lg">Réussi</Verdict>)
    expect(screen.getByRole('status')).toHaveClass('min-h-11', 'text-lg')
  })
})
