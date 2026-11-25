import { render, fireEvent, screen } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, onTestFinished, vi } from 'vitest'
import { ScrollToTop } from './ScrollToTop'

function Navigator() {
  const navigate = useNavigate()
  return (
    <>
      <button onClick={() => navigate('/revision', { state: { reviewIds: [1] } })}>Autre page</button>
      <button onClick={() => navigate('/revision?x=1', { state: { a: 1 } })}>Même page</button>
    </>
  )
}

describe('ScrollToTop', () => {
  let scrollTo: ReturnType<typeof vi.fn>
  beforeEach(() => {
    scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
  })
  afterEach(() => vi.unstubAllGlobals())

  function renderAt(path: string) {
    render(
      <MemoryRouter initialEntries={[path]}>
        <ScrollToTop />
        <Navigator />
      </MemoryRouter>,
    )
  }

  it('remonte en haut de page à l\'arrivée et à chaque nouveau chemin', () => {
    renderAt('/examen/e1')
    expect(scrollTo).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Autre page' }))
    expect(scrollTo).toHaveBeenCalledTimes(2)
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0)
  })

  it('ne bouge pas quand seul l\'état ou la recherche change sur le même chemin', () => {
    renderAt('/revision')
    fireEvent.click(screen.getByRole('button', { name: 'Même page' }))
    expect(scrollTo).toHaveBeenCalledTimes(1)
  })

  it('fait défiler jusqu\'à l\'élément de l\'ancre quand l\'adresse en porte une', () => {
    const scrollIntoView = vi.fn()
    const original = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = scrollIntoView
    onTestFinished(() => {
      Element.prototype.scrollIntoView = original
    })
    render(
      <MemoryRouter initialEntries={['/mentions-legales#vos-donnees']}>
        <ScrollToTop />
        <h2 id="vos-donnees">Vos données</h2>
      </MemoryRouter>,
    )
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByRole('heading', { name: 'Vos données' }))
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('remonte en haut quand l\'ancre ne correspond à aucun élément', () => {
    renderAt('/mentions-legales#inconnue')
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
  })
})
