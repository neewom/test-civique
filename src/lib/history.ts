import { isAnswerRecord, type AnswerRecord, type ExamRecord } from '@/lib/exam-types'
import { isTitleKey, titleOf, type TitleKey } from '@/lib/target-title'

// Single place that reads and writes the exam history in localStorage.
export const HISTORY_KEY = 'quiz-history'

// Records saved before the detail page existed have neither `id` nor `answers`:
// they stay listed on the home page, without a link to a detail view.
// Records saved before titles existed have no `title`: they belong to the multi-year
// permit (`titleOf`). The stored `title` is never checked nor rewritten, so an unknown
// value stays as is and counts for the multi-year permit too.
export type HistoryEntry = Omit<ExamRecord, 'id' | 'answers' | 'title'> & {
  id?: string
  answers?: AnswerRecord[]
  title?: unknown
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

// Raw stored value; throws when localStorage cannot be read.
function readStored(): unknown {
  const raw = localStorage.getItem(HISTORY_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return [] // unparsable data: treated as an empty history
  }
}

function toEntries(stored: unknown): HistoryEntry[] {
  return Array.isArray(stored) ? stored.filter(isHistoryEntry) : []
}

// Stored history, oldest first. Unreadable data or malformed entries are skipped.
export function loadHistory(): HistoryEntry[] {
  try {
    return toEntries(readStored())
  } catch {
    return []
  }
}

// Stored history of the given title, oldest first.
export function loadHistoryForTitle(title: TitleKey): HistoryEntry[] {
  return loadHistory().filter((entry) => titleOf(entry) === title)
}

// Exam with its answers, for the detail page; null when missing or incomplete.
export function findExamRecord(id: string): ExamRecord | null {
  const entry = loadHistory().find((e) => e.id === id)
  if (!entry || entry.id === undefined || entry.answers === undefined) return null
  // A stored title is kept only when known (no default added: the record reads as stored)
  const { title, ...rest } = entry
  // Unreadable answers (not objects, wrong types) are skipped, and an unreadable `answer` (not a
  // string) is ignored: in memory only, never rewritten in storage
  const answers = entry.answers.filter(isAnswerRecord).map((a) => {
    if (a.answer === undefined || typeof a.answer === 'string') return a
    const { answer, ...others } = a
    void answer
    return others
  })
  return { ...rest, id: entry.id, answers, ...(isTitleKey(title) ? { title } : {}) }
}

export function addExamRecord(record: ExamRecord): void {
  let history: HistoryEntry[]
  try {
    history = toEntries(readStored())
  } catch {
    return // storage unreadable: its content is unknown, so nothing is overwritten
  }
  try {
    history.push(record)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // localStorage unavailable
  }
}
