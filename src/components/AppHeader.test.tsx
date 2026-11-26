import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AppHeader } from '@/components/AppHeader'
import { ThemeProvider } from '@/components/ThemeProvider'
import { OrganicBackground } from '@/components/OrganicBackground'

function renderHeader(props: React.ComponentProps<typeof AppHeader> = {}) {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <AppHeader {...props} />
        <OrganicBackground />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? reduce : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

describe('AppHeader', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    mockReducedMotion(false)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('porte le logo, lien vers l\'accueil, et le bouton « Affichage » fermé', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: /Futur Citoyen/ })).toHaveAttribute('href', '/')
    const button = screen.getByRole('button', { name: 'Affichage' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Sombre' })).toBeNull()
  })

  it('avec hideBrand, le nom du site disparaît et « Affichage » reste', () => {
    renderHeader({ hideBrand: true })
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByRole('button', { name: 'Affichage' })).toBeInTheDocument()
  })

  it('ouvre le panneau, avec le focus sur le premier réglage', () => {
    renderHeader()
    const button = screen.getByRole('button', { name: 'Affichage' })
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAttribute('aria-controls', screen.getByRole('group', { name: 'Affichage' }).id)
    expect(screen.getByRole('button', { name: 'Clair' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Clair' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Activées' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('Échap ferme le panneau et rend le focus au bouton', () => {
    renderHeader()
    const button = screen.getByRole('button', { name: 'Affichage' })
    fireEvent.click(button)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('button', { name: 'Sombre' })).toBeNull()
    expect(button).toHaveFocus()
  })

  it('un clic à l\'extérieur ferme le panneau, un clic dedans le laisse ouvert', () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Affichage' }))
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Sombre' }))
    expect(screen.getByRole('button', { name: 'Sombre' })).toBeInTheDocument()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('button', { name: 'Sombre' })).toBeNull()
  })

  it('le réglage du thème bascule le thème et l\'enregistre', () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Affichage' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sombre' }))
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Sombre' })).toHaveAttribute('aria-pressed', 'true')
    // Choisir le thème déjà actif ne change rien
    fireEvent.click(screen.getByRole('button', { name: 'Sombre' }))
    expect(document.documentElement).toHaveClass('dark')
    fireEvent.click(screen.getByRole('button', { name: 'Clair' }))
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('le réglage des animations enregistre le choix, pose data-motion et coupe la forme animée', () => {
    const { container } = renderHeader()
    expect(container.querySelector('animate')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Affichage' }))
    fireEvent.click(screen.getByRole('button', { name: 'Désactivées' }))
    expect(localStorage.getItem('motion')).toBe('off')
    expect(document.documentElement.dataset.motion).toBe('off')
    expect(screen.getByRole('button', { name: 'Désactivées' })).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('animate')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Activées' }))
    expect(localStorage.getItem('motion')).toBe('on')
    expect(container.querySelector('animate')).not.toBeNull()
  })

  it('affiche « Désactivées » par défaut quand l\'appareil demande moins d\'animations', () => {
    mockReducedMotion(true)
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Affichage' }))
    expect(screen.getByRole('button', { name: 'Désactivées' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('un choix enregistré « on » prime sur l\'appareil', () => {
    mockReducedMotion(true)
    localStorage.setItem('motion', 'on')
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Affichage' }))
    expect(screen.getByRole('button', { name: 'Activées' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('avec un logo à confirmer (examen), le logo est un bouton qui appelle la confirmation', () => {
    const onLogoClick = vi.fn()
    renderHeader({ thin: true, onLogoClick })
    expect(screen.queryByRole('link')).toBeNull()
    const header = document.querySelector('[data-app-header]') as HTMLElement
    fireEvent.click(within(header).getByRole('button', { name: /Futur Citoyen/ }))
    expect(onLogoClick).toHaveBeenCalledTimes(1)
  })
})
