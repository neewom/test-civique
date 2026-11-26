import { loadHistoryForTitle, type HistoryEntry } from '@/lib/history'
import { DEFAULT_TITLE, type TitleKey } from '@/lib/target-title'

function isAnswer(value: unknown): value is { questionId: number; correct: boolean } {
  if (typeof value !== 'object' || value === null) return false
  const a = value as Record<string, unknown>
  return Number.isInteger(a.questionId) && typeof a.correct === 'boolean'
}

/**
 * Questions « à revoir »: those whose last known answer, across every exam of the
 * history (oldest first, as stored), was wrong or missing (time ran out). A question
 * leaves the list as soon as a later exam gets it right. Old exams saved without
 * their answers, and malformed answers, are ignored. Ids in ascending order.
 */
export function questionsToReview(history: ReadonlyArray<HistoryEntry>): number[] {
  const lastResult = new Map<number, boolean>()
  for (const entry of history) {
    for (const answer of entry.answers ?? []) {
      if (isAnswer(answer)) lastResult.set(answer.questionId, answer.correct)
    }
  }
  return [...lastResult]
    .filter(([, correct]) => !correct)
    .map(([id]) => id)
    .sort((a, b) => a - b)
}

/** Same list, read from the stored exams of the given title. */
export function loadQuestionsToReview(title: TitleKey = DEFAULT_TITLE): number[] {
  return questionsToReview(loadHistoryForTitle(title))
}

/**
 * Question ids passed to the revision page by an exam detail (`location.state.reviewIds`).
 * Anything else than an array of known ids is ignored; duplicates are dropped.
 */
export function parseReviewIds(state: unknown, knownIds: ReadonlySet<number>): number[] {
  if (typeof state !== 'object' || state === null) return []
  const ids = (state as Record<string, unknown>).reviewIds
  if (!Array.isArray(ids)) return []
  const valid = ids.filter((id): id is number => typeof id === 'number' && knownIds.has(id))
  return [...new Set(valid)]
}
