import allQuestions from '@/data/questions.json'
import type { AnswerRecord, ExamRecord, ExamQuestion } from '@/lib/exam-types'

export const EXAM_SIZE = 40

export interface Question {
  id: number
  theme: string
  question: string
  answers: string[]
  distractors: string[]
  explanation: string
  group?: string
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function buildExam(pool: Question[] = allQuestions as Question[]): ExamQuestion[] {
  const seenGroups = new Set<string>()
  const selected: Question[] = []
  for (const q of shuffle(pool)) {
    if (selected.length === EXAM_SIZE) break
    if (q.group) {
      if (seenGroups.has(q.group)) continue
      seenGroups.add(q.group)
    }
    selected.push(q)
  }
  return selected.map((q) => {
    const answer = shuffle(q.answers)[0]
    return {
      id: q.id,
      theme: q.theme,
      question: q.question,
      answer,
      choices: shuffle([answer, ...shuffle(q.distractors).slice(0, 3)]),
      explanation: q.explanation,
    }
  })
}

export function saveResult(
  score: number,
  total: number,
  answers: AnswerRecord[],
): void {
  try {
    const raw = localStorage.getItem('quiz-history')
    const history: ExamRecord[] = raw ? JSON.parse(raw) : []
    history.push({
      id: String(Date.now()),
      date: new Date().toISOString(),
      score,
      total,
      answers,
    })
    localStorage.setItem('quiz-history', JSON.stringify(history))
  } catch {
    // localStorage unavailable
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
