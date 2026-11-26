// Residence permit or naturalisation the user is preparing, chosen on the
// « Quel titre préparez-vous ? » screen and kept in localStorage.
export const TARGET_TITLE_KEY = 'target-title'

// Every title the app knows: the keys of `lists` in questions.json, of the `title` of
// stored exams and of the stored choice. Single source of these keys.
export const TITLE_KEYS = ['pluriannuelle', 'resident', 'naturalisation'] as const
export type TitleKey = (typeof TITLE_KEYS)[number]

// Title of exams stored before titles existed, or with an unknown title
export const DEFAULT_TITLE = 'pluriannuelle' satisfies TitleKey

export function isTitleKey(value: unknown): value is TitleKey {
  return typeof value === 'string' && (TITLE_KEYS as readonly string[]).includes(value)
}

/** Title of a stored exam (history entry or exam in progress): its `title`, else the default. */
export function titleOf(stored: { title?: unknown }): TitleKey {
  return isTitleKey(stored.title) ? stored.title : DEFAULT_TITLE
}

// Titles the user can choose: the multi-year residence permit, the resident card and naturalisation.
export const TARGET_TITLES = ['pluriannuelle', 'resident', 'naturalisation'] as const satisfies readonly TitleKey[]
export type TargetTitle = (typeof TARGET_TITLES)[number]

export const TARGET_TITLE_LABELS: Record<TargetTitle, string> = {
  pluriannuelle: 'Carte de séjour pluriannuelle',
  resident: 'Carte de résident',
  naturalisation: 'Naturalisation',
}

function isTargetTitle(value: unknown): value is TargetTitle {
  return typeof value === 'string' && (TARGET_TITLES as readonly string[]).includes(value)
}

// Choice made during this visit, kept in memory: when localStorage is blocked or
// full, the home page must still see it, or it would send the user back to the
// title screen in a loop.
let sessionChoice: TargetTitle | null = null

// Stored choice, else the one made during this visit; an unknown or unreadable
// stored value counts as no choice.
export function loadTargetTitle(): TargetTitle | null {
  try {
    const value = localStorage.getItem(TARGET_TITLE_KEY)
    if (isTargetTitle(value)) return value
  } catch {
    // localStorage unavailable: fall back to the choice kept in memory
  }
  return sessionChoice
}

export function saveTargetTitle(title: TargetTitle): void {
  sessionChoice = title
  try {
    localStorage.setItem(TARGET_TITLE_KEY, title)
  } catch {
    // localStorage unavailable or full: the choice kept in memory lasts until the page is reloaded
  }
}

// Tests only: forget the choice kept in memory.
export function resetTargetTitleForTests(): void {
  sessionChoice = null
}
