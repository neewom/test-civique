import { describe, it, expect } from 'vitest'
import { buildExam, EXAM_SIZE } from '../pages/Examen'
import allQuestions from '@/data/questions.json'

const SITUATIONAL_MIN_ID = 192

interface Question {
  id: number
  theme: string
  question: string
  answers: string[]
  distractors: string[]
  explanation: string
  group?: string
}

// Pool filtré : uniquement les questions officielles (id < 192)
const officialPool = (allQuestions as Question[]).filter((q) => q.id < SITUATIONAL_MIN_ID)

// Pool fictif incluant des questions de mise en situation pour tester l'isolation
const mockSituationalQuestions: Question[] = Array.from({ length: 10 }, (_, i) => ({
  id: SITUATIONAL_MIN_ID + i,
  theme: 'Mise en situation',
  question: `Question de mise en situation ${i + 1}`,
  answers: [`Réponse ${i + 1}`],
  distractors: [`Distractor A ${i}`, `Distractor B ${i}`, `Distractor C ${i}`],
  explanation: `Explication ${i + 1}`,
}))

const mixedPool = [...officialPool, ...mockSituationalQuestions]

describe('filtrage des questions de mise en situation', () => {
  it('le pool officiel ne contient que des questions avec id < 192', () => {
    officialPool.forEach((q) => {
      expect(q.id).toBeLessThan(SITUATIONAL_MIN_ID)
    })
  })

  it('le pool officiel contient au moins EXAM_SIZE questions', () => {
    expect(officialPool.length).toBeGreaterThanOrEqual(EXAM_SIZE)
  })

  it('buildExam avec pool officiel retourne uniquement des questions officielles', () => {
    const exam = buildExam(officialPool)
    exam.forEach((q) => {
      expect(q.id).toBeLessThan(SITUATIONAL_MIN_ID)
    })
  })

  it(`buildExam avec pool officiel retourne toujours ${EXAM_SIZE} questions`, () => {
    const exam = buildExam(officialPool)
    expect(exam).toHaveLength(EXAM_SIZE)
  })

  it('buildExam avec pool mixte peut inclure des questions de mise en situation', () => {
    // Avec un pool de 10 questions situationnelles sur un total réduit, elles apparaissent forcément
    const smallOfficial = officialPool.slice(0, EXAM_SIZE - mockSituationalQuestions.length)
    const smallMixed = [...smallOfficial, ...mockSituationalQuestions]
    const exam = buildExam(smallMixed)
    const hasSituational = exam.some((q) => q.id >= SITUATIONAL_MIN_ID)
    expect(hasSituational).toBe(true)
  })

  it('filtrer le pool mixte exclut bien les questions de mise en situation', () => {
    const filtered = mixedPool.filter((q) => q.id < SITUATIONAL_MIN_ID)
    filtered.forEach((q) => {
      expect(q.id).toBeLessThan(SITUATIONAL_MIN_ID)
    })
    expect(filtered.length).toBeLessThan(mixedPool.length)
  })

  it('la somme pool officiel + pool situationnel = pool total dans un jeu mixte', () => {
    const official = mixedPool.filter((q) => q.id < SITUATIONAL_MIN_ID)
    const situational = mixedPool.filter((q) => q.id >= SITUATIONAL_MIN_ID)
    expect(official.length + situational.length).toBe(mixedPool.length)
  })
})
