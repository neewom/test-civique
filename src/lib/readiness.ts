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

/**
 * Line under the verdict of the result screen: where the exam leaves the user on
 * the journey (« n sur 3 » counter of the home page). Always in line with the
 * verdict: never a « good result » for an exam that is not passed yet.
 * `streak` is the counter once this exam is counted, `previousStreak` before it.
 */
export function journeyMessage(passed: boolean, streak: number, previousStreak: number): string {
  if (passed) {
    if (streak >= READY_GOAL) return "Trois réussites d'affilée : vous êtes prêt(e) pour le jour J."
    if (streak === 2) return "Deuxième réussite d'affilée. Encore une, et vous êtes prêt(e) pour le jour J."
    return "Première réussite. Encore deux d'affilée, et vous êtes prêt(e) pour le jour J."
  }
  if (previousStreak > 0) {
    return `Le compteur repart à 0 sur ${READY_GOAL}, c'est normal en s'entraînant. Revoyez vos erreurs, puis retentez.`
  }
  return 'Revoyez vos erreurs, puis retentez : chaque examen blanc vous rapproche du jour J.'
}

/** Result screen when the history could not be written (storage blocked or full). */
export const UNSAVED_MESSAGE =
  "Ce résultat n'a pas pu être enregistré dans ce navigateur : il ne compte pas dans votre parcours."
