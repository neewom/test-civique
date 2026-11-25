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

  it('ne rend rien sans source', () => {
    const { container } = render(<SourceLink />)
    expect(container).toBeEmptyDOMElement()
  })
})
