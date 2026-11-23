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

export function loadProgress(): ExamInProgress | null {
  try {
    const raw = localStorage.getItem(EXAM_PROGRESS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ExamInProgress
  } catch {
    return null
  }
}

// Index of the question an exam resumes on: a save made during the correction
// phase already holds the answer to `index`, so the exam resumes on the next one.
export function resumeIndex(progress: ExamInProgress): number {
  return progress.answers.length > progress.index ? progress.index + 1 : progress.index
}
