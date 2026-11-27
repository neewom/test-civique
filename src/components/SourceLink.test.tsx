import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SourceLink } from './SourceLink'

describe('SourceLink', () => {
  it('affiche « Source : <libellé> » vers l\'URL, dans un nouvel onglet annoncé', () => {
    render(<SourceLink source={{ url: 'https://www.elysee.fr/x', label: 'elysee.fr' }} />)
    const link = screen.getByRole('link', { name: 'Source : elysee.fr (nouvel onglet)' })
    expect(link).toHaveAttribute('href', 'https://www.elysee.fr/x')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('reste dans la largeur de sa colonne et coupe un libellé long (texte agrandi)', () => {
    render(
      <SourceLink
        source={{ url: 'https://www.statistiques.developpement-durable.gouv.fr/x', label: 'statistiques.developpement-durable.gouv.fr' }}
      />,
    )
    const link = screen.getByRole('link')
    expect(link).toHaveClass('max-w-full')
    const label = screen.getByText(/Source : statistiques/)
    expect(label).toHaveClass('min-w-0')
    expect(label.className).toContain('[overflow-wrap:anywhere]')
  })

  it('ne rend rien sans source', () => {
    const { container } = render(<SourceLink />)
    expect(container).toBeEmptyDOMElement()
  })
})
