import type { AnswerRecord } from '@/lib/exam-types'
import { THEME_COLORS } from '@/lib/themes'

// The 5 official themes, in the order of the programme
export const OFFICIAL_THEMES = Object.keys(THEME_COLORS)

export interface ThemeScore {
  theme: string
  correct: number
  total: number
}

/** Answers given as wrong, unanswered ones included (time ran out). */
export function mistakes(answers: ReadonlyArray<AnswerRecord>): AnswerRecord[] {
  return answers.filter((a) => !a.correct)
}

/**
 * Score per theme for the questions of an exam. Official themes come first, in their
 * order, and only when the exam has questions on them; any other theme follows.
 * Answers whose question is unknown (removed from the data) are skipped.
 */
export function themeScores(
  answers: ReadonlyArray<AnswerRecord>,
  themeOf: (questionId: number) => string | undefined,
): ThemeScore[] {
  const byTheme = new Map<string, ThemeScore>()
  for (const a of answers) {
    const theme = themeOf(a.questionId)
    if (theme === undefined) continue
    const entry = byTheme.get(theme) ?? { theme, correct: 0, total: 0 }
    entry.total++
    if (a.correct) entry.correct++
    byTheme.set(theme, entry)
  }
  const official = OFFICIAL_THEMES.filter((t) => byTheme.has(t))
  const others = [...byTheme.keys()].filter((t) => !OFFICIAL_THEMES.includes(t))
  return [...official, ...others].map((t) => byTheme.get(t)!)
}

/**
 * Weakest themes: the lowest share of right answers, among themes with at least one
 * mistake. Several themes when tied; none when the exam has no mistake.
 */
export function weakestThemes(scores: ReadonlyArray<ThemeScore>): string[] {
  const withMistakes = scores.filter((s) => s.correct < s.total)
  if (withMistakes.length === 0) return []
  const ratio = (s: ThemeScore) => s.correct / s.total
  const lowest = Math.min(...withMistakes.map(ratio))
  return withMistakes.filter((s) => ratio(s) === lowest).map((s) => s.theme)
}

/** « À travailler : … » line under « Voir mes erreurs »; null with no clear weakest theme. */
export function weakestThemesLabel(themes: ReadonlyArray<string>): string | null {
  if (themes.length === 1) return `À travailler : ${themes[0]}`
  if (themes.length === 2) return `À travailler : ${themes[0]} et ${themes[1]}`
  return null
}
