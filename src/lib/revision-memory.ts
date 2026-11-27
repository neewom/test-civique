import type { TitleKey } from '@/lib/target-title'

// What the revision page remembers for the length of the tab session (sessionStorage, never
// localStorage): the filter, the « Sans les mises en situation » box and the scroll position,
// so that coming back to the revision (back button, or home → « Réviser les thèmes ») finds it as left.
// One key per title; this module is the only reader and writer.
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
    const raw = sessionStorage.getItem(keyOf(title))
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
    sessionStorage.setItem(keyOf(title), JSON.stringify(view))
  } catch {
    // The memory is a convenience
  }
}
