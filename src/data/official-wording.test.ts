import { describe, it, expect } from 'vitest'
import allQuestions from './questions.json'
import officialWording from '@/test/fixtures/official-csp-questions.json'

// Liste officielle des questions de connaissance CSP, figée le 2026-11-24 depuis
// https://formation-civique.interieur.gouv.fr/examen-civique/liste-officielle-des-questions-de-connaissance-csp/
// (ordre de la page = id, espaces insécables remplacés par des espaces simples).

const OFFICIAL_MAX_ID = 191

// Exceptions documentées (voir PR fix/official-csp-wording) :
// - 9 : le libellé officiel « Lequel de ces symboles représente officiellement la
//   République française ? » ne correspond pas à nos réponses (allégorie, Marianne) ;
//   à traiter avec le contenu des questions.
// - 189 : doublon officiel de la 186 (« Pour qui l'école est elle obligatoire ? ») ;
//   on garde un libellé distinct pour ne pas afficher deux questions identiques.
const EXCEPTIONS = new Set([9, 189])

const official = (allQuestions as { id: number; question: string }[]).filter(
  (q) => q.id <= OFFICIAL_MAX_ID,
)

describe('official CSP wording', () => {
  it('has one frozen official wording per official question', () => {
    expect(officialWording).toHaveLength(OFFICIAL_MAX_ID)
    expect(official).toHaveLength(OFFICIAL_MAX_ID)
  })

  it('uses the exact official wording for every official question except documented exceptions', () => {
    const mismatches = official
      .filter((q) => !EXCEPTIONS.has(q.id))
      .filter((q) => q.question !== officialWording[q.id - 1])
      .map((q) => ({ id: q.id, ours: q.question, official: officialWording[q.id - 1] }))
    expect(mismatches).toEqual([])
  })

  it('keeps the documented exceptions distinct from the official wording', () => {
    for (const id of EXCEPTIONS) {
      const q = official.find((x) => x.id === id)
      expect(q?.question).not.toBe(officialWording[id - 1])
    }
  })

  it('never shows two official questions with the same wording', () => {
    const wordings = official.map((q) => q.question)
    expect(new Set(wordings).size).toBe(wordings.length)
  })
})
