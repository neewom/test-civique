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
