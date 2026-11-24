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

// Stored choice; an unknown or unreadable value counts as no choice.
export function loadTargetTitle(): TargetTitle | null {
  try {
    const value = localStorage.getItem(TARGET_TITLE_KEY)
    return isTargetTitle(value) ? value : null
  } catch {
    return null
  }
}

export function saveTargetTitle(title: TargetTitle): void {
  try {
    localStorage.setItem(TARGET_TITLE_KEY, title)
  } catch {
    // localStorage unavailable: the choice lasts until the page is reloaded
  }
}
