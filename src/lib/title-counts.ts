import type { TitleKey } from '@/lib/target-title'

/**
 * Number of questions of each title, written here so that the screens that show them
 * (title choice, fiches, revision header) do not load the questions. `official`: the questions
 * of the official list (naturalisation: 259 rows, one repeated, so 258); `situational`: the
 * mises en situation written for the app. Checked against the data by title-counts.test.ts:
 * change them with the data.
 */
export const TITLE_COUNTS: Record<TitleKey, { official: number; situational: number }> = {
  pluriannuelle: { official: 191, situational: 100 },
  resident: { official: 209, situational: 100 },
  naturalisation: { official: 258, situational: 100 },
}
