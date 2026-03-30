import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { ThemeProvider } from '@/lib/theme-context'
import { ThemeSwitch } from '@/components/ThemeSwitch'

function renderSwitch() {
  return render(
    <ThemeProvider>
      <ThemeSwitch />
    </ThemeProvider>
  )
}

describe('ThemeSwitch', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('s\'affiche avec un aria-label accessible', () => {
    renderSwitch()
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('est non coché par défaut en mode clair', () => {
    renderSwitch()
    expect(screen.getByRole('switch')).not.toBeChecked()
  })

  it('est coché si la classe dark est déjà présente sur <html>', () => {
    document.documentElement.classList.add('dark')
    renderSwitch()
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('ajoute la classe dark sur <html> quand on active le switch', async () => {
    renderSwitch()
    await act(async () => {
      fireEvent.click(screen.getByRole('switch'))
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('retire la classe dark sur <html> quand on désactive le switch', async () => {
    document.documentElement.classList.add('dark')
    renderSwitch()
    await act(async () => {
      fireEvent.click(screen.getByRole('switch'))
    })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('sauvegarde "dark" dans le localStorage quand on active', async () => {
    renderSwitch()
    await act(async () => {
      fireEvent.click(screen.getByRole('switch'))
    })
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('sauvegarde "light" dans le localStorage quand on désactive', async () => {
    document.documentElement.classList.add('dark')
    renderSwitch()
    await act(async () => {
      fireEvent.click(screen.getByRole('switch'))
    })
    expect(localStorage.getItem('theme')).toBe('light')
  })
})
