import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { PageFrame } from './PageFrame'

function renderFrame() {
  return render(
    <MemoryRouter>
      <PageFrame background={<svg data-testid="shape" />} footer={<footer>Pied</footer>}>
        <h1>Titre</h1>
      </PageFrame>
    </MemoryRouter>,
  )
}

describe('PageFrame — repères', () => {
  it('place l\'en-tête avant <main>, jamais dedans', () => {
    renderFrame()
    const header = document.querySelector('[data-app-header]')!
    const main = screen.getByRole('main')
    expect(header.tagName).toBe('HEADER')
    expect(main).not.toContainElement(header as HTMLElement)
    expect(header.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(header.closest('main')).toBeNull()
  })

  it('range le contenu dans <main> et le pied après, hors de <main>', () => {
    renderFrame()
    const main = screen.getByRole('main')
    expect(main).toContainElement(screen.getByRole('heading', { name: 'Titre' }))
    const footer = screen.getByRole('contentinfo')
    expect(main).not.toContainElement(footer)
    expect(main.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('garde la forme décorative hors de <main>', () => {
    renderFrame()
    expect(screen.getByRole('main')).not.toContainElement(screen.getByTestId('shape'))
  })
})
