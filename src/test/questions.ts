import allQuestions from '@/data/questions.json'
import { questionsForTitle as forTitle, type ListedQuestion } from '@/lib/exam'
import type { TitleKey } from '@/lib/target-title'

// The app loads the questions by title on demand (src/lib/question-packs.ts) and its code
// never imports questions.json; tests that need the data read it here.
export const ALL_QUESTIONS = allQuestions as ListedQuestion[]

/** Questions of a title, taken from all the data (as the pack of that title holds them). */
export function questionsForTitle(title: TitleKey, pool: ListedQuestion[] = ALL_QUESTIONS): ListedQuestion[] {
  return forTitle(title, pool)
}
