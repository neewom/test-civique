import { isAnswerRecord, type AnswerRecord } from '@/lib/exam-types'
import { PASS_RATIO } from '@/lib/exam'
import type { HistoryEntry } from '@/lib/history'
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

/** Themes shown in the « À travailler » line: one or two; null with no clear weakest theme. */
export function weakestThemesToShow(themes: ReadonlyArray<string>): string[] | null {
  return themes.length === 1 || themes.length === 2 ? [...themes] : null
}

/** « À travailler : X » or « À travailler : X | Y » (plain text); null with no clear weakest theme. */
export function weakestThemesLabel(themes: ReadonlyArray<string>): string | null {
  const shown = weakestThemesToShow(themes)
  return shown ? `À travailler : ${shown.join(' | ')}` : null
}

// « Vos thèmes » on the home page: the last practice exams that can be read
export const THEME_PROGRESS_EXAMS = 3

export interface ThemeProgress {
  theme: string
  /** Rounded share of right answers, 0 to 100 */
  percent: number
  /** Below the pass ratio (80 %), as displayed */
  toWork: boolean
}

export interface ThemeProgressSummary {
  /** Exams the figures come from (1 to 3) */
  examCount: number
  /** The official themes present in those exams, weakest first (programme order on ties) */
  themes: ThemeProgress[]
}

/**
 * Right answers per official theme over the last 3 exams that kept their answers (history is
 * stored oldest first, already limited to one title). Unanswered questions count as wrong (they
 * are stored as such). Exams without `answers` are ignored; null when no exam can be read.
 */
export function recentThemeProgress(
  history: ReadonlyArray<HistoryEntry>,
  themeOf: (questionId: number) => string | undefined,
): ThemeProgressSummary | null {
  // Damaged storage: only readable answers count, and an exam keeping none is not one of the « n derniers »
  const readable = history
    .map((e) => (Array.isArray(e.answers) ? e.answers.filter(isAnswerRecord) : []))
    .filter((answers) => answers.length > 0)
    .slice(-THEME_PROGRESS_EXAMS)
  if (readable.length === 0) return null
  const scores = themeScores(
    readable.flat(),
    themeOf,
  ).filter((s) => OFFICIAL_THEMES.includes(s.theme))
  if (scores.length === 0) return null
  const themes = scores
    .map((s) => {
      const percent = Math.round((s.correct / s.total) * 100)
      return { theme: s.theme, percent, toWork: percent < PASS_RATIO * 100, ratio: s.correct / s.total }
    })
    .sort((a, b) => a.ratio - b.ratio)
    .map(({ theme, percent, toWork }) => ({ theme, percent, toWork }))
  return { examCount: readable.length, themes }
}
