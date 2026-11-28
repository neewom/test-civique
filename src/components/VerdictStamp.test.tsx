import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { VerdictStamp } from '@/components/VerdictStamp'

describe('VerdictStamp', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('animations activées : arrive en tampon, sort en fondu après 1,15 s, retiré à 1,5 s', () => {
    localStorage.setItem('motion', 'on')
    render(<VerdictStamp right />)
    const stamp = screen.getByTestId('verdict-stamp')
    expect(stamp).toHaveTextContent('Bien joué')
    expect(stamp.querySelector('.verdict-stamp-in')).not.toBeNull()
    act(() => { vi.advanceTimersByTime(1149) })
    expect(stamp.querySelector('.verdict-stamp-out')).toBeNull()
    act(() => { vi.advanceTimersByTime(2) })
    expect(stamp.querySelector('.verdict-stamp-out')).not.toBeNull()
    act(() => { vi.advanceTimersByTime(348) })
    expect(screen.getByTestId('verdict-stamp')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(5) })
    expect(screen.queryByTestId('verdict-stamp')).not.toBeInTheDocument()
  })

  it('animations coupées : affiché 1,3 s sans aucune classe d\'animation, puis retiré', () => {
    localStorage.setItem('motion', 'off')
    render(<VerdictStamp right={false} />)
    const stamp = screen.getByTestId('verdict-stamp')
    expect(stamp).toHaveTextContent('Pas tout à fait')
    expect(stamp.querySelector('[class*="verdict-stamp"]')).toBeNull()
    act(() => { vi.advanceTimersByTime(1299) })
    expect(screen.getByTestId('verdict-stamp')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(2) })
    expect(screen.queryByTestId('verdict-stamp')).not.toBeInTheDocument()
  })

  it('sans réglage enregistré, suit la préférence de l\'appareil (mouvement réduit = coupé)', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
    render(<VerdictStamp right />)
    expect(screen.getByTestId('verdict-stamp').querySelector('[class*="verdict-stamp"]')).toBeNull()
    act(() => { vi.advanceTimersByTime(1301) })
    expect(screen.queryByTestId('verdict-stamp')).not.toBeInTheDocument()
    vi.unstubAllGlobals()
  })
})
