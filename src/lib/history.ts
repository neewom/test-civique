import type { AnswerRecord, ExamRecord } from '@/lib/exam-types'

// Single place that reads and writes the exam history in localStorage.
export const HISTORY_KEY = 'quiz-history'

// Records saved before the detail page existed have neither `id` nor `answers`:
// they stay listed on the home page, without a link to a detail view.
export type HistoryEntry = Omit<ExamRecord, 'id' | 'answers'> & {
  id?: string
  answers?: AnswerRecord[]
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Record<string, unknown>
  return (
    isFiniteNumber(entry.score) &&
    isFiniteNumber(entry.total) &&
    typeof entry.date === 'string' &&
    (entry.id === undefined || typeof entry.id === 'string') &&
    (entry.answers === undefined || Array.isArray(entry.answers))
  )
}

// Stored history, oldest first. Unreadable data or malformed entries are skipped.
export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isHistoryEntry) : []
  } catch {
    return []
  }
}

// Exam with its answers, for the detail page; null when missing or incomplete.
export function findExamRecord(id: string): ExamRecord | null {
  const entry = loadHistory().find((e) => e.id === id)
  if (!entry || entry.id === undefined || entry.answers === undefined) return null
  return { ...entry, id: entry.id, answers: entry.answers }
}

export function addExamRecord(record: ExamRecord): void {
  try {
    const history = loadHistory()
    history.push(record)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // localStorage unavailable
  }
}
