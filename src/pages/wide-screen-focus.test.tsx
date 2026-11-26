import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Home from './Home'
import ExamenDetail from './ExamenDetail'
import { ThemeProvider } from '@/components/ThemeProvider'
import { WIDE_SCREEN_QUERY } from '@/lib/use-wide-screen'
import allQuestions from '@/data/questions.json'

// A matchMedia whose answer can change after the first render (a tablet turned round)
function stubSwitchableScreen(wide: boolean) {
  const listeners = new Set<() => void>()
  let isWide = wide
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return isWide && query === WIDE_SCREEN_QUERY
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
  return (next: boolean) => {
    isWide = next
    act(() => listeners.forEach((fn) => fn()))
  }
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('target-title', 'pluriannuelle')
})
afterEach(() => vi.unstubAllGlobals())

describe('focus kept when the screen crosses 1024 px', () => {
  it('Home: every focusable block keeps the same element and the focus', () => {
    const questions = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1, theme: 'Test', question: `Q${i + 1}`, answer: 'A', choices: ['A', 'B', 'C', 'D'], explanation: '',
    }))
    localStorage.setItem(
      'exam-in-progress',
      JSON.stringify({ questions, index: 1, answers: [], timeLeft: 2700, startedAt: '2026-11-23T10:00:00.000Z' }),
    )
    localStorage.setItem(
      'quiz-history',
      JSON.stringify([{ id: 'a', answers: [], date: '2026-11-20T10:00:00.000Z', score: 36, total: 40 }]),
    )
    const setWide = stubSwitchableScreen(false)
    render(
      <ThemeProvider>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    )
    const names: (string | RegExp)[] = [
      /Titre visé/,
      'Tout savoir sur ce titre',
      /^1 · Réviser/,
      /^2 · Réussir/,
      /Reprendre l'examen en cours/,
      "Supprimer l'examen en cours",
      "Comment se passe l'examen ?",
      /36\/40/,
      'En savoir plus',
      /formation-civique/,
      'Mentions légales et confidentialité',
    ]
    const find = (name: string | RegExp) =>
      (screen.queryAllByRole('link', { name }).concat(screen.queryAllByRole('button', { name })))[0]
    for (const name of names) {
      const before = find(name)
      expect(before, String(name)).toBeDefined()
      before.focus()
      expect(before).toHaveFocus()
      setWide(true)
      expect(find(name), String(name)).toBe(before)
      expect(before).toHaveFocus()
      setWide(false)
      expect(find(name), String(name)).toBe(before)
      expect(before).toHaveFocus()
    }
  })

  it('ExamenDetail: the action buttons and the filters keep the focus', () => {
    const list = allQuestions as { id: number; answers: string[] }[]
    localStorage.setItem(
      'quiz-history',
      JSON.stringify([
        {
          id: '1700000000000',
          date: '2026-01-15T10:00:00.000Z',
          score: 1,
          total: 40,
          answers: [
            { questionId: list[0].id, chosen: list[0].answers[0], correct: true },
            { questionId: list[1].id, chosen: null, correct: false },
          ],
        },
      ]),
    )
    const setWide = stubSwitchableScreen(false)
    render(
      <MemoryRouter initialEntries={['/examen/1700000000000']}>
        <Routes>
          <Route path="/examen/:id" element={<ExamenDetail />} />
        </Routes>
      </MemoryRouter>,
    )
    for (const name of ['Réviser cette question', 'Retour à mon parcours']) {
      const before = screen.getByRole('link', { name })
      before.focus()
      setWide(true)
      expect(screen.getByRole('link', { name })).toBe(before)
      expect(before).toHaveFocus()
      setWide(false)
      expect(screen.getByRole('link', { name })).toBe(before)
      expect(before).toHaveFocus()
    }
    const all = screen.getByRole('button', { name: /Toutes/ })
    fireEvent.click(all)
    all.focus()
    setWide(true)
    expect(all).toHaveFocus()
  })
})
