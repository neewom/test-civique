export interface AnswerRecord {
  questionId: number
  chosen: string | null  // null si le timer a expiré sans réponse
  correct: boolean
}

export interface ExamRecord {
  id: string
  date: string
  score: number
  total: number
  answers: AnswerRecord[]
}

export interface ExamQuestion {
  id: number
  theme: string
  question: string
  answer: string
  choices: string[]
  explanation: string
}

export interface ExamInProgress {
  questions: ExamQuestion[]
  index: number
  answers: AnswerRecord[]
  timeLeft: number
  startedAt: string
}

export const EXAM_PROGRESS_KEY = 'exam-in-progress'

export function saveProgress(state: ExamInProgress): void {
  try {
    localStorage.setItem(EXAM_PROGRESS_KEY, JSON.stringify(state))
  } catch {
    // localStorage unavailable
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(EXAM_PROGRESS_KEY)
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

function isAnswerRecord(value: unknown): value is AnswerRecord {
  return (
    isRecord(value) &&
    typeof value.questionId === 'number' &&
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

// Saved progress, or null when missing, unreadable or malformed.
export function loadProgress(): ExamInProgress | null {
  try {
    const raw = localStorage.getItem(EXAM_PROGRESS_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isExamInProgress(parsed) ? parsed : null
  } catch {
    return null
  }
}

// Index of the question an exam resumes on: a save made during the correction
// phase already holds the answer to `index`, so the exam resumes on the next one.
export function resumeIndex(progress: ExamInProgress): number {
  return progress.answers.length > progress.index ? progress.index + 1 : progress.index
}
