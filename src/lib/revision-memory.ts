import { loadQuestionsToReview } from '@/lib/review-queue'
import type { TitleKey } from '@/lib/target-title'
import { THEME_COLORS, themeLabel } from '@/lib/themes'

// What the revision page remembers on this device (localStorage, kept after the browser is closed):
// the filter, the « Sans les mises en situation » box and the scroll position, so that coming back
// to the revision (back button, home → « Réviser les thèmes » or « Continuer où j'en étais »)
// finds it as left. One key per title; this module is the only reader and writer.
// A value that an older version wrote in sessionStorage is ignored (no migration).
export const REVISION_VIEW_KEY_PREFIX = 'revision-view:'

/** Filters worth remembering: « Cet examen » comes from navigation state, not from memory. */
export type StoredFilter = { kind: 'review' } | { kind: 'all' } | { kind: 'theme'; theme: string }

export interface RevisionView {
  filter: StoredFilter
  excludeSituational: boolean
  scrollY: number
}

const keyOf = (title: TitleKey) => `${REVISION_VIEW_KEY_PREFIX}${title}`

/**
 * The remembered view of a title, or null when there is none or it cannot be read.
 * A theme that is not one of `themes` and « À revoir » without any question to review
 * (`hasReviewQuestions` false) fall back to « Tous les thèmes ».
 */
export function loadRevisionView(
  title: TitleKey,
  themes: readonly string[],
  hasReviewQuestions: boolean,
): RevisionView | null {
  try {
    const raw = localStorage.getItem(keyOf(title))
    if (raw === null) return null
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) return null
    const { filter: f, excludeSituational, scrollY } = data as Record<string, unknown>
    if (typeof f !== 'object' || f === null) return null
    const { kind, theme } = f as Record<string, unknown>
    let filter: StoredFilter
    if (kind === 'all') filter = { kind: 'all' }
    else if (kind === 'review') filter = hasReviewQuestions ? { kind: 'review' } : { kind: 'all' }
    else if (kind === 'theme' && typeof theme === 'string')
      filter = themes.includes(theme) ? { kind: 'theme', theme } : { kind: 'all' }
    else return null
    return {
      filter,
      excludeSituational: excludeSituational === true,
      scrollY: typeof scrollY === 'number' && Number.isFinite(scrollY) && scrollY > 0 ? scrollY : 0,
    }
  } catch {
    return null
  }
}

/** Remembers the view; a blocked or full storage is ignored. */
export function saveRevisionView(title: TitleKey, view: RevisionView): void {
  try {
    localStorage.setItem(keyOf(title), JSON.stringify(view))
  } catch {
    // The memory is a convenience
  }
}

/**
 * Label of the filter for the home shortcut « Continuer où j'en étais », or null when there is
 * nothing to continue (no remembered view, or a position still at the top). The label is the one
 * the revision page will show: a theme that is no longer known, or « À revoir » with nothing
 * left to review, fall back to « Tous les thèmes » as in `loadRevisionView`.
 */
export function revisionResumeLabel(title: TitleKey): string | null {
  const view = loadRevisionView(title, Object.keys(THEME_COLORS), loadQuestionsToReview(title).length > 0)
  if (view === null || view.scrollY <= 0) return null
  if (view.filter.kind === 'theme') return themeLabel(view.filter.theme)
  return view.filter.kind === 'review' ? 'À revoir' : 'Tous les thèmes'
}
