import { describe, it, expect } from 'vitest'
import allQuestions from '@/data/questions.json'
import { buildExam, EXAM_BLUEPRINT, EXAM_SIZE, type Question } from './exam'
import { questionsForTitle } from '@/test/questions'

// Draws go through the pluriannuelle pool, as the app does (ids 292+ belong to the resident card)
const POOL = allQuestions as Question[]
const byId = new Map(POOL.map((q) => [q.id, q]))
const SITUATIONAL_THEMES = ['Principes et valeurs de la République', 'Droits et devoirs']
const DRAWS = 1000

function lineKey(theme: string, notion: string): string {
  return `${theme}|${notion}`
}

function q(id: number, theme: string, notion: Question['notion'], group?: string): Question {
  return {
    id,
    theme,
    notion,
    question: `Q${id}`,
    answers: ['A'],
    distractors: ['B', 'C', 'D'],
    explanation: 'E',
    ...(group ? { group } : {}),
  }
}

describe('buildExam — répartition officielle', () => {
  // One loop of 1 000 draws checks every property, to keep the suite fast
  it(`${DRAWS} tirages : 40 questions, quota exact, groupes uniques, mises en situation de Principes / Droits seulement`, () => {
    const expected = new Map(EXAM_BLUEPRINT.map((l) => [lineKey(l.theme, l.notion), l.count]))
    for (let i = 0; i < DRAWS; i++) {
      const exam = buildExam(questionsForTitle('pluriannuelle'))
      expect(exam).toHaveLength(EXAM_SIZE)
      expect(new Set(exam.map((e) => e.id)).size).toBe(EXAM_SIZE)

      const counts = new Map<string, number>()
      const groups: string[] = []
      for (const e of exam) {
        const source = byId.get(e.id)!
        const key = lineKey(source.theme, source.notion)
        counts.set(key, (counts.get(key) ?? 0) + 1)
        if (source.group) groups.push(source.group)
        if (source.notion === 'mise-en-situation') expect(SITUATIONAL_THEMES).toContain(source.theme)
      }
      expect(counts).toEqual(expected)
      expect(new Set(groups).size).toBe(groups.length)
    }
  })

  it('12 mises en situation par examen (6 Principes, 6 Droits)', () => {
    const exam = buildExam(questionsForTitle('pluriannuelle'))
    const situational = exam.filter((e) => byId.get(e.id)!.notion === 'mise-en-situation')
    expect(situational).toHaveLength(12)
  })

  it('mélange l\'ordre final (les thèmes ne se suivent pas toujours dans l\'ordre du plan)', () => {
    const orders = new Set<string>()
    for (let i = 0; i < 20; i++) orders.add(buildExam(questionsForTitle('pluriannuelle')).map((e) => e.theme).join(','))
    expect(orders.size).toBeGreaterThan(1)
  })

  it('la règle des groupes vaut entre deux lignes du plan', () => {
    // Two lines of the plan, one group: never both in the same exam
    const theme1 = 'Principes et valeurs de la République'
    const theme2 = 'Droits et devoirs'
    const pool: Question[] = [
      q(1, theme1, 'devise-symboles', 'g'),
      q(2, theme2, 'droits-fondamentaux', 'g'),
    ]
    for (let i = 0; i < 50; i++) {
      const ids = buildExam(pool).map((e) => e.id)
      expect(ids).toHaveLength(1)
    }
  })

  it('une ligne en manque se complète d\'abord dans le même thème, puis ailleurs : toujours 40 questions', () => {
    const vie = 'Vie en société'
    // Vie en société: only 2 « soins » questions and 1 situational question for 4 slots
    const pool: Question[] = [
      ...POOL.filter((x) => x.theme !== vie),
      q(1001, vie, 'soins'),
      q(1002, vie, 'soins'),
      q(1003, vie, 'mise-en-situation'),
    ]
    const ids = buildExam(pool).map((e) => e.id)
    expect(ids).toHaveLength(EXAM_SIZE)
    expect(ids).toContain(1001)
    expect(ids).toContain(1002)
  })
})
