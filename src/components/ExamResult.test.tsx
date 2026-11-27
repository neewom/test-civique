import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ExamResult, type ExamOutcome } from '@/components/ExamResult'

const outcome: ExamOutcome = {
  score: 1,
  total: 2,
  answers: [
    { questionId: 1, chosen: 'x', correct: false },
    { questionId: 2, chosen: 'x', correct: false },
  ],
  recordId: 'abc',
  journey: '',
  timedOutUnanswered: null,
}
const THEMES: Record<number, string> = { 1: 'Droits et devoirs', 2: 'Histoire, géographie et culture' }

describe('ExamResult : thèmes à travailler', () => {
  it('sépare deux thèmes par « | » sans que la barre soit lue', () => {
    render(
      <MemoryRouter>
        <ExamResult outcome={outcome} themeOf={(id) => THEMES[id]} onRestart={() => {}} />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: /À travailler/ })
    expect(link).toHaveTextContent(/À travailler : Droits et devoirs \| , Histoire, géographie et culture/)
    expect(link.querySelector('[aria-hidden="true"]')).toHaveTextContent('|')
    expect(link).toHaveAccessibleName(/À travailler : Droits et devoirs , Histoire, géographie et culture/)
  })
})
