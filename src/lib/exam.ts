import allQuestions from '@/data/questions.json'
import type { AnswerRecord, ExamQuestion, QuestionSource } from '@/lib/exam-types'
import { addExamRecord } from '@/lib/history'

export const EXAM_SIZE = 40

// Arrêté du 10 octobre 2025, art. 4 : réussite à 80 % des points (32/40)
export const PASS_RATIO = 0.8

// Nombre de bonnes réponses requis pour réussir un examen de `total` questions
export function passThreshold(total: number): number {
  return Math.ceil(total * PASS_RATIO)
}

export function isPassed(score: number, total: number): boolean {
  return total > 0 && score >= passThreshold(total)
}

/**
 * Official sub-theme of a question (arrêté du 10 octobre 2025, annexe).
 * Situational questions (id 192+) are always `mise-en-situation`, whatever their theme.
 */
export const NOTIONS = [
  'devise-symboles',
  'laicite',
  'democratie-vote',
  'organisation-republique',
  'institutions-europeennes',
  'droits-fondamentaux',
  'obligations-devoirs',
  'periodes-personnages',
  'territoires-geographie',
  'patrimoine',
  's-installer',
  'soins',
  'travail',
  'autorite-parentale-ecole',
  'mise-en-situation',
] as const

export type Notion = (typeof NOTIONS)[number]

export interface BlueprintLine {
  theme: string
  notion: Notion
  count: number
}

/**
 * Official breakdown of the 40 questions of an exam (arrêté du 10 octobre 2025),
 * with the theme labels of questions.json (« Vie en société » is shown as
 * « Vivre dans la société française » on the rules page).
 */
export const EXAM_BLUEPRINT: readonly BlueprintLine[] = [
  { theme: 'Principes et valeurs de la République', notion: 'devise-symboles', count: 3 },
  { theme: 'Principes et valeurs de la République', notion: 'laicite', count: 2 },
  { theme: 'Principes et valeurs de la République', notion: 'mise-en-situation', count: 6 },
  { theme: 'Système institutionnel et politique', notion: 'democratie-vote', count: 3 },
  { theme: 'Système institutionnel et politique', notion: 'organisation-republique', count: 2 },
  { theme: 'Système institutionnel et politique', notion: 'institutions-europeennes', count: 1 },
  { theme: 'Droits et devoirs', notion: 'droits-fondamentaux', count: 2 },
  { theme: 'Droits et devoirs', notion: 'obligations-devoirs', count: 3 },
  { theme: 'Droits et devoirs', notion: 'mise-en-situation', count: 6 },
  { theme: 'Histoire, géographie et culture', notion: 'periodes-personnages', count: 3 },
  { theme: 'Histoire, géographie et culture', notion: 'territoires-geographie', count: 3 },
  { theme: 'Histoire, géographie et culture', notion: 'patrimoine', count: 2 },
  { theme: 'Vie en société', notion: 's-installer', count: 1 },
  { theme: 'Vie en société', notion: 'soins', count: 1 },
  { theme: 'Vie en société', notion: 'travail', count: 1 },
  { theme: 'Vie en société', notion: 'autorite-parentale-ecole', count: 1 },
]

export interface Question {
  id: number
  theme: string
  notion: Notion
  question: string
  answers: string[]
  distractors: string[]
  explanation: string
  group?: string
  /** Official page that justifies the answer (optional, added by the « Contenu » card) */
  source?: QuestionSource
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
      ...(q.source ? { source: q.source } : {}),
    }
  })
}

/** Saves the finished exam in the history and returns its id (link to its detail page). */
export function saveResult(
  score: number,
  total: number,
  answers: AnswerRecord[],
): string {
  const id = String(Date.now())
  addExamRecord({
    id,
    date: new Date().toISOString(),
    score,
    total,
    answers,
  })
  return id
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
