import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ExamResult, type ExamOutcome } from '@/components/ExamResult'
import { MemoryRouter } from 'react-router-dom'

function outcome(score: number): ExamOutcome {
  return { score, total: 40, answers: [], recordId: null, journey: '', timedOutUnanswered: null }
}

function renderResult(score: number) {
  return render(
    <MemoryRouter>
      <ExamResult outcome={outcome(score)} themeOf={() => undefined} onRestart={() => {}} />
    </MemoryRouter>,
  )
}

describe('Célébration de l\'écran de résultat', () => {
  const getContext = vi.fn(() => ({
    scale: vi.fn(), clearRect: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(),
    beginPath: vi.fn(), moveTo: vi.fn(), bezierCurveTo: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
  }))
  beforeEach(() => {
    localStorage.clear()
    getContext.mockClear()
    HTMLCanvasElement.prototype.getContext = getContext as unknown as typeof HTMLCanvasElement.prototype.getContext
  })
  afterEach(() => vi.restoreAllMocks())

  it('examen réussi, animations activées : canvas décoratif qui ne gêne pas les boutons', () => {
    localStorage.setItem('motion', 'on')
    renderResult(32)
    const canvas = screen.getByTestId('leaf-celebration')
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
    expect(canvas).toHaveClass('pointer-events-none')
    expect(getContext).toHaveBeenCalled()
  })

  it('pas encore réussi : aucune célébration', () => {
    localStorage.setItem('motion', 'on')
    renderResult(31)
    expect(screen.queryByTestId('leaf-celebration')).not.toBeInTheDocument()
    expect(getContext).not.toHaveBeenCalled()
  })

  it('animations coupées : aucune célébration, même réussi', () => {
    localStorage.setItem('motion', 'off')
    renderResult(40)
    expect(screen.queryByTestId('leaf-celebration')).not.toBeInTheDocument()
    expect(getContext).not.toHaveBeenCalled()
  })
})
