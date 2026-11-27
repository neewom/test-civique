import { DEFAULT_TITLE, TARGET_TITLES, titleOf, type TitleKey } from '@/lib/target-title'

export interface AnswerRecord {
  questionId: number
  chosen: string | null  // null si le timer a expiré sans réponse
  correct: boolean
  /** Right answer offered in the exam (`ExamQuestion.answer`); missing on answers stored before the fix */
  answer?: string
}

export interface ExamRecord {
  id: string
  date: string
  score: number
  total: number
  answers: AnswerRecord[]
  /** Title the exam was taken for; missing on exams stored before titles existed */
  title?: TitleKey
}

/** Link to the official page that justifies an answer */
export interface QuestionSource {
  url: string
  label: string
}

export interface ExamQuestion {
  id: number
  theme: string
  question: string
  answer: string
  choices: string[]
  explanation: string
  source?: QuestionSource
}

export interface ExamInProgress {
  questions: ExamQuestion[]
  index: number
  answers: AnswerRecord[]
  timeLeft: number
  startedAt: string
  /** Title the exam is taken for; missing on progress stored before titles existed */
  title?: TitleKey
}

// One exam in progress per title. The multi-year permit keeps the original key (progress
// stored without a title or with an unknown one included): nothing already stored is
// moved or reshaped. Every other title has its own key, `exam-in-progress-<title>`.
export const EXAM_PROGRESS_KEY = 'exam-in-progress'

// The single place where the storage key of a title is computed
export function progressKey(title: TitleKey): string {
  return title === DEFAULT_TITLE ? EXAM_PROGRESS_KEY : `${EXAM_PROGRESS_KEY}-${title}`
}

// Saved in the key of its own title
export function saveProgress(state: ExamInProgress): void {
  try {
    localStorage.setItem(progressKey(titleOf(state)), JSON.stringify(state))
  } catch {
    // localStorage unavailable
  }
}

// Clears the progress of one title only; the other titles' progress is untouched
export function clearProgress(title: TitleKey): void {
  try {
    localStorage.removeItem(progressKey(title))
  } catch {
    // localStorage unavailable
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isExamQuestion(value: unknown): value is ExamQuestion {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.theme === 'string' &&
    typeof value.question === 'string' &&
    typeof value.answer === 'string' &&
    typeof value.explanation === 'string' &&
    Array.isArray(value.choices) &&
    value.choices.every((c) => typeof c === 'string')
  )
}

export function isAnswerRecord(value: unknown): value is AnswerRecord {
  return (
    isRecord(value) &&
    typeof value.questionId === 'number' &&
    Number.isFinite(value.questionId) &&
    (value.chosen === null || typeof value.chosen === 'string') &&
    typeof value.correct === 'boolean'
  )
}

// Shape check of a stored progress: the value comes from localStorage and may
// be corrupted or edited by hand, so the pages must never read it unchecked.
function isExamInProgress(value: unknown): value is ExamInProgress {
  if (!isRecord(value)) return false
  const { questions, index, answers, timeLeft, startedAt } = value
  return (
    Array.isArray(questions) &&
    questions.length > 0 &&
    questions.every(isExamQuestion) &&
    Number.isInteger(index) &&
    (index as number) >= 0 &&
    (index as number) < questions.length &&
    Array.isArray(answers) &&
    answers.every(isAnswerRecord) &&
    typeof timeLeft === 'number' &&
    Number.isFinite(timeLeft) &&
    typeof startedAt === 'string'
  )
}

// Saved progress stored in the key of the given title (required: no default title), or null when missing, unreadable or malformed.
export function loadProgress(title: TitleKey): ExamInProgress | null {
  try {
    const raw = localStorage.getItem(progressKey(title))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isExamInProgress(parsed) ? parsed : null
  } catch {
    return null
  }
}

// Saved progress of the given title: read from that title's key only, and only if it
// is really of that title (progress stored without a title, or with an unknown one,
// belongs to the multi-year permit). Anything else is not offered, and left in storage.
export function loadProgressForTitle(title: TitleKey): ExamInProgress | null {
  const progress = loadProgress(title)
  return progress && titleOf(progress) === title ? progress : null
}

// True when an exam is in progress for any title the user can choose
export function hasProgress(): boolean {
  return TARGET_TITLES.some((t) => loadProgress(t) !== null)
}

// Index of the question an exam resumes on: a save made during the correction
// phase already holds the answer to `index`, so the exam resumes on the next one.
export function resumeIndex(progress: ExamInProgress): number {
  return progress.answers.length > progress.index ? progress.index + 1 : progress.index
}
