import allQuestions from '@/data/questions.json'
import type { AnswerRecord, ExamQuestion, QuestionSource } from '@/lib/exam-types'
import { addExamRecord } from '@/lib/history'
import { DEFAULT_TITLE, type TitleKey } from '@/lib/target-title'

export const EXAM_SIZE = 40

// Arrêté du 10 octobre 2025, art. 4 : 45 minutes au maximum
export const EXAM_MINUTES = 45
export const GLOBAL_EXAM_TIME = EXAM_MINUTES * 60 // 2700 secondes

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
 * Situational questions (ids 192-291) are always `mise-en-situation`, whatever their theme.
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

/** Question of questions.json: a drawable question, with the official lists that hold it. */
export interface ListedQuestion extends Question {
  /** Titles whose official list holds the question (situational ones: every title) */
  lists: TitleKey[]
  /** Rank in the official « carte de résident » list, on questions identical to it */
  crNumber?: number
  /** Rank in the official naturalisation list, on questions identical to it */
  natNumber?: number
}

/** Questions of a title: those whose `lists` holds it. */
export function questionsForTitle(
  title: TitleKey,
  pool: ListedQuestion[] = allQuestions as ListedQuestion[],
): ListedQuestion[] {
  return pool.filter((q) => q.lists.includes(title))
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Draws an exam that follows `EXAM_BLUEPRINT`: the exact count of each (theme, notion)
 * line, the lines with the smallest stock drawn first. Two questions of the same `group`
 * never meet in an exam, across lines too. A line short of questions (not expected with
 * questions.json) is completed within its theme, then from the rest of the pool, so the
 * exam keeps 40 questions whenever the pool allows it. Final order is shuffled.
 *
 * `avoid` lists question ids (those of the previous exam) kept out as long as possible:
 * they come last in each draw order, so they are used only when a line cannot be
 * filled without them, and never at the expense of the blueprint counts or the group rule.
 */
export function buildExam(
  pool: Question[] = allQuestions as Question[],
  { avoid = [] }: { avoid?: Iterable<number> } = {},
): ExamQuestion[] {
  const avoided = new Set(avoid)
  // Candidates in draw order: the not-avoided ones first (shuffled), then the avoided ones
  const prefer = (list: Question[]) => [
    ...shuffle(list.filter((q) => !avoided.has(q.id))),
    ...shuffle(list.filter((q) => avoided.has(q.id))),
  ]
  const seenGroups = new Set<string>()
  const selectedIds = new Set<number>()
  const selected: Question[] = []

  function take(candidates: Question[], count: number): number {
    let missing = count
    for (const q of prefer(candidates)) {
      if (missing === 0 || selected.length === EXAM_SIZE) break
      if (selectedIds.has(q.id)) continue
      if (q.group) {
        if (seenGroups.has(q.group)) continue
        seenGroups.add(q.group)
      }
      selectedIds.add(q.id)
      selected.push(q)
      missing--
    }
    return missing
  }

  const lines = EXAM_BLUEPRINT.map((line) => ({
    line,
    candidates: pool.filter((q) => q.theme === line.theme && q.notion === line.notion),
  })).sort((a, b) => a.candidates.length - b.candidates.length)

  const shortByTheme = new Map<string, number>()
  for (const { line, candidates } of lines) {
    const missing = take(candidates, line.count)
    if (missing > 0) shortByTheme.set(line.theme, (shortByTheme.get(line.theme) ?? 0) + missing)
  }

  // Fallbacks: same theme first (no situational question of a theme the blueprint
  // gives none), then anything left in the pool
  const situationalThemes = new Set(
    EXAM_BLUEPRINT.filter((l) => l.notion === 'mise-en-situation').map((l) => l.theme),
  )
  for (const [theme, missing] of shortByTheme) {
    const themePool = pool.filter(
      (q) => q.theme === theme && (q.notion !== 'mise-en-situation' || situationalThemes.has(theme)),
    )
    take(themePool, missing)
  }
  take(pool, EXAM_SIZE - selected.length)

  return shuffle(selected).map((q) => {
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

/**
 * Ids of the questions of the last finished exam of a title (`history`: oldest first).
 * An old record without `answers` avoids nothing.
 */
export function previousExamQuestionIds(history: { answers?: AnswerRecord[] }[]): number[] {
  const last = history[history.length - 1]
  return (last?.answers ?? []).flatMap((a) =>
    typeof a?.questionId === 'number' ? [a.questionId] : [],
  )
}

/** Saves the finished exam in the history and returns its id (link to its detail page). */
export function saveResult(
  score: number,
  total: number,
  answers: AnswerRecord[],
  title: TitleKey = DEFAULT_TITLE,
): string {
  const id = String(Date.now())
  addExamRecord({
    id,
    date: new Date().toISOString(),
    score,
    total,
    answers,
    title,
  })
  return id
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
