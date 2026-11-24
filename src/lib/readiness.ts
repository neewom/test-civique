import { isPassed } from '@/lib/exam'

// « Prêt pour le jour J » : 3 practice exams passed in a row.
export const READY_GOAL = 3

/**
 * Practice exams passed in a row, counted back from the most recent one
 * (history is stored oldest first). A failed exam stops the count, so the
 * streak restarts at 0 after a failure. Capped at READY_GOAL for display.
 */
export function passedInARow(history: ReadonlyArray<{ score: number; total: number }>): number {
  let streak = 0
  for (let i = history.length - 1; i >= 0 && streak < READY_GOAL; i--) {
    if (!isPassed(history[i].score, history[i].total)) break
    streak++
  }
  return streak
}
