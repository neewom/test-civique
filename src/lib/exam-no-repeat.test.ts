import { describe, it, expect, beforeEach } from 'vitest'
import { buildExam, previousExamQuestionIds, questionsForTitle, EXAM_BLUEPRINT, EXAM_SIZE, type Question } from './exam'
import type { TitleKey } from './target-title'

const DRAWS = 300

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

// Pool with `perLine` distinct questions (own group) in every blueprint line
function syntheticPool(perLine: number): Question[] {
  const pool: Question[] = []
  let id = 1
  for (const line of EXAM_BLUEPRINT) {
    for (let i = 0; i < perLine; i++) pool.push(q(id, line.theme, line.notion, `g${id++}`))
  }
  return pool
}

describe('buildExam — évitement de l’examen précédent', () => {
  for (const title of ['pluriannuelle', 'resident'] as TitleKey[]) {
    it(`${title} : ${DRAWS} examens successifs sans question commune (vraies données)`, () => {
      const pool = questionsForTitle(title)
      let previous = buildExam(pool).map((e) => e.id)
      for (let i = 0; i < DRAWS; i++) {
        const exam = buildExam(pool, { avoid: previous })
        const ids = exam.map((e) => e.id)
        expect(ids).toHaveLength(EXAM_SIZE)
        expect(ids.filter((id) => previous.includes(id))).toEqual([])
        previous = ids
      }
    })

    it(`${title} : répartition et groupes respectés avec évitement`, () => {
      const pool = questionsForTitle(title)
      const byId = new Map(pool.map((p) => [p.id, p]))
      const expected = new Map(EXAM_BLUEPRINT.map((l) => [`${l.theme}|${l.notion}`, l.count]))
      let previous = buildExam(pool).map((e) => e.id)
      for (let i = 0; i < 100; i++) {
        const exam = buildExam(pool, { avoid: previous })
        const counts = new Map<string, number>()
        const groups: string[] = []
        for (const e of exam) {
          const s = byId.get(e.id)!
          const key = `${s.theme}|${s.notion}`
          counts.set(key, (counts.get(key) ?? 0) + 1)
          if (s.group) groups.push(s.group)
        }
        expect(counts).toEqual(expected)
        expect(new Set(groups).size).toBe(groups.length)
        previous = exam.map((e) => e.id)
      }
    })
  }

  it('repli : une case sans assez de questions reprend des questions évitées, examen complet et répartition respectée', () => {
    // Exactly `count` questions per line: avoiding anything leaves a line short
    const pool: Question[] = []
    let id = 1
    for (const line of EXAM_BLUEPRINT) {
      for (let i = 0; i < line.count; i++) pool.push(q(id, line.theme, line.notion, `g${id++}`))
    }
    const byId = new Map(pool.map((p) => [p.id, p]))
    const avoid = pool.slice(0, 10).map((p) => p.id)
    const expected = new Map(EXAM_BLUEPRINT.map((l) => [`${l.theme}|${l.notion}`, l.count]))
    for (let i = 0; i < 50; i++) {
      const exam = buildExam(pool, { avoid })
      expect(exam).toHaveLength(EXAM_SIZE)
      const counts = new Map<string, number>()
      for (const e of exam) {
        const s = byId.get(e.id)!
        const key = `${s.theme}|${s.notion}`
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
      expect(counts).toEqual(expected)
    }
  })

  it('repli partiel : seules les questions manquantes sont reprises parmi les évitées', () => {
    // Every line has count + 2 questions; for « devise-symboles » (3 per exam) 4 of its 5
    // are avoided, so 1 fresh question is left and exactly 2 avoided ones must come back
    const pool: Question[] = []
    let id = 1
    for (const line of EXAM_BLUEPRINT) {
      for (let i = 0; i < line.count + 2; i++) pool.push(q(id, line.theme, line.notion, `g${id++}`))
    }
    const target = pool.filter((p) => p.notion === 'devise-symboles')
    const avoid = target.slice(0, 4).map((p) => p.id)
    for (let i = 0; i < 50; i++) {
      const exam = buildExam(pool, { avoid })
      expect(exam).toHaveLength(EXAM_SIZE)
      expect(exam.filter((e) => avoid.includes(e.id))).toHaveLength(2)
    }
  })

  it('une question fraîche d’une case ne prend pas le groupe dont dépend la seule question (évitée) d’une autre case', () => {
    const THEME = 'Vie en société'
    const base = syntheticPool(8).filter(
      (p) => !(p.theme === THEME && (p.notion === 's-installer' || p.notion === 'soins')),
    )
    const maxId = Math.max(...base.map((p) => p.id))
    const b1 = q(maxId + 1, THEME, 's-installer', 'G')
    const a1 = q(maxId + 2, THEME, 'soins', 'G')
    const a2 = q(maxId + 3, THEME, 'soins')
    const pool = [...base, b1, a1, a2]
    const avoid = [b1.id, a2.id]
    for (let i = 0; i < 200; i++) {
      const exam = buildExam(pool, { avoid })
      const ids = exam.map((e) => e.id)
      expect(ids).toHaveLength(EXAM_SIZE)
      expect(ids).toContain(b1.id)
      expect(ids.filter((x) => x === a1.id || x === a2.id)).toHaveLength(1)
      expect(ids).toContain(a2.id)
    }
  })

  it('les groupes priment sur l’évitement : jamais deux questions d’un même groupe', () => {
    const pool = syntheticPool(4).map((p, i) => ({ ...p, group: `shared${i % 20}` }))
    for (let i = 0; i < 50; i++) {
      const exam = buildExam(pool, { avoid: pool.slice(0, 30).map((p) => p.id) })
      const byId = new Map(pool.map((p) => [p.id, p]))
      const groups = exam.map((e) => byId.get(e.id)!.group)
      expect(new Set(groups).size).toBe(groups.length)
    }
  })

  it('sans avoid ou avec avoid vide : comportement inchangé (40 questions)', () => {
    const pool = questionsForTitle('pluriannuelle')
    expect(buildExam(pool, { avoid: [] })).toHaveLength(EXAM_SIZE)
    expect(buildExam(pool, {})).toHaveLength(EXAM_SIZE)
  })
})

describe('previousExamQuestionIds', () => {
  const rec = (ids: number[]) => ({ answers: ids.map((questionId) => ({ questionId, chosen: null, correct: false })) })

  it('prend les questions du dernier examen (le plus récent en dernier)', () => {
    expect(previousExamQuestionIds([rec([1, 2]), rec([3, 4])])).toEqual([3, 4])
  })

  it('ignore les réponses corrompues (questionId non numérique)', () => {
    const bad = { answers: [null, { questionId: 5 }, { questionId: 'x' }, { questionId: 6 }] } as never
    expect(previousExamQuestionIds([bad])).toEqual([5, 6])
  })

  it('un examen ancien sans answers, ou un historique vide, n’évite rien', () => {
    expect(previousExamQuestionIds([rec([1]), {}])).toEqual([])
    expect(previousExamQuestionIds([])).toEqual([])
  })
})

describe('Historique du titre → évitement', () => {
  beforeEach(() => localStorage.clear())
  const rec = (title: string | undefined, ids: number[], date: string) => ({
    id: date,
    date,
    score: 1,
    total: 40,
    ...(title ? { title } : {}),
    answers: ids.map((questionId) => ({ questionId, chosen: null, correct: false })),
  })

  it('seul le dernier examen du même titre compte ; un autre titre n’est pas évité', async () => {
    const { loadHistoryForTitle } = await import('./history')
    localStorage.setItem(
      'quiz-history',
      JSON.stringify([rec('resident', [9, 9], '2026-01-01'), rec('pluriannuelle', [1, 2], '2026-01-02'), rec(undefined, [3, 4], '2026-01-03'), rec('resident', [7, 8], '2026-01-04')]),
    )
    expect(previousExamQuestionIds(loadHistoryForTitle('pluriannuelle'))).toEqual([3, 4]) // legacy = pluriannuelle
    expect(previousExamQuestionIds(loadHistoryForTitle('resident'))).toEqual([7, 8])
    expect(previousExamQuestionIds(loadHistoryForTitle('naturalisation'))).toEqual([])
  })

  it('historique illisible : aucun évitement', async () => {
    const { loadHistoryForTitle } = await import('./history')
    localStorage.setItem('quiz-history', '{not json')
    expect(previousExamQuestionIds(loadHistoryForTitle('pluriannuelle'))).toEqual([])
    localStorage.setItem('quiz-history', JSON.stringify([{ foo: 1 }, 'x']))
    expect(previousExamQuestionIds(loadHistoryForTitle('pluriannuelle'))).toEqual([])
  })
})
