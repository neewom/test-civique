// Residence permit or naturalisation the user is preparing, chosen on the
// « Quel titre préparez-vous ? » screen and kept in localStorage.
export const TARGET_TITLE_KEY = 'target-title'

// Only the multi-year residence permit is available for now; « carte de
// résident » and « naturalisation » will be added as their question sets land.
export const TARGET_TITLES = ['pluriannuelle'] as const
export type TargetTitle = (typeof TARGET_TITLES)[number]

export const TARGET_TITLE_LABELS: Record<TargetTitle, string> = {
  pluriannuelle: 'Carte de séjour pluriannuelle',
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
