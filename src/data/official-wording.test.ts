import { describe, it, expect } from 'vitest'
import allQuestions from './questions.json'
import officialWording from '@/test/fixtures/official-csp-questions.json'

// Liste officielle des questions de connaissance CSP, figée le 2026-11-24 depuis
// https://formation-civique.interieur.gouv.fr/examen-civique/liste-officielle-des-questions-de-connaissance-csp/
// (ordre de la page = id, espaces insécables remplacés par des espaces simples).

const OFFICIAL_MAX_ID = 191

// Exceptions documentées (voir PR fix/official-csp-wording), avec le libellé attendu.
// La fixture reste la copie fidèle de la page du ministère.
const EXCEPTIONS = new Map<number, { reason: string; expected: string }>([
  [
    9,
    {
      // Officiel : « Lequel de ces symboles représente officiellement la République
      // française ? », qui ne correspond pas à nos réponses (allégorie, Marianne) ;
      // à traiter avec le contenu des questions.
      reason: 'sens différent',
      expected: "Lequel de ces personnages est l'allégorie de la République française ?",
    },
  ],
  [
    27,
    {
      // Officiel : « Qu'est ce qui … sur les Champs Élysées … » (traits d'union manquants).
      reason: 'faute corrigée',
      expected:
        "Qu'est-ce qui est traditionnellement organisé sur les Champs-Élysées le 14 juillet pour célébrer la fête nationale ?",
    },
  ],
  [
    133,
    {
      // Officiel : « Pourquoi l’année 1958 est importante pour la France ? » (inversion manquante).
      reason: 'faute corrigée',
      expected: 'Pourquoi l’année 1958 est-elle importante pour la France ?',
    },
  ],
  [
    189,
    {
      // Officiel : « Pour qui l'école est elle obligatoire ? », doublon de la 186 ;
      // libellé distinct pour ne pas afficher deux questions identiques.
      reason: 'doublon officiel',
      expected: "Pour qui l'école est-elle obligatoire ? (question complémentaire)",
    },
  ],
])

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

  it('uses the documented wording for each exception, distinct from the official one', () => {
    for (const [id, { expected }] of EXCEPTIONS) {
      const q = official.find((x) => x.id === id)
      expect(q?.question).toBe(expected)
      expect(expected).not.toBe(officialWording[id - 1])
    }
  })

  it('never shows two official questions with the same wording', () => {
    const wordings = official.map((q) => q.question)
    expect(new Set(wordings).size).toBe(wordings.length)
  })
})
