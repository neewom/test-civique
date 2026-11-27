export const THEME_COLORS: Record<string, string> = {
  'Principes et valeurs de la République': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Système institutionnel et politique': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Droits et devoirs': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'Histoire, géographie et culture': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  'Vie en société': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
}

// Display name of a theme: the stored value « Vie en société » is shown as the official
// « Vivre dans la société française ». Display only: data and storage keep the stored value.
const THEME_LABELS: Record<string, string> = {
  'Vie en société': 'Vivre dans la société française',
}

export function themeLabel(theme: string): string {
  return THEME_LABELS[theme] ?? theme
}

const DEFAULT_THEME_COLOR = 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300'

export function themeColor(theme: string) {
  return THEME_COLORS[theme] ?? DEFAULT_THEME_COLOR
}
