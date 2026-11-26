import { describe, it, expect } from 'vitest'
import allQuestions from './questions.json'
import officialWording from '@/test/fixtures/official-csp-questions.json'
import type { ListedQuestion } from '@/lib/exam'
import { OFFICIAL_LISTS, rankedQuestions } from '@/test/official-lists'

// Liste officielle des questions de connaissance CSP, figée le 2026-11-24 depuis
// https://formation-civique.interieur.gouv.fr/examen-civique/liste-officielle-des-questions-de-connaissance-csp/
// (ordre de la page = id, espaces insécables remplacés par des espaces simples).

const OFFICIAL_MAX_ID = 191

// Exceptions documentées (voir PR fix/official-csp-wording), avec le libellé attendu.
// La fixture reste la copie fidèle de la page du ministère.
const EXCEPTIONS = new Map<number, { reason: string; expected: string }>([
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

// ─── Listes officielles carte de résident (CR) et naturalisation (NAT) ─────────
// Fixtures et dates de relevé : src/test/official-lists.ts. Une question porte
// `crNumber` (ou `natNumber`) quand elle est identique à la question de ce rang.

// Normalisation tolérée entre listes : apostrophes droites / courbes, guillemets
// droits / courbes / chevrons, espaces insécables. Toute autre différence (casse,
// ponctuation, mots) est une exception documentée ci-dessous ou une erreur.
function normalizeTypography(s: string): string {
  return s
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d\u00ab\u00bb]/g, '"')
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Exceptions par liste : rang officiel → libellé attendu dans nos données. Seules
// celles des questions présentes figurent ici. Aucune coquille officielle présente
// n'est gardée telle quelle sans décision : toute exception est listée ci-dessous avec
// sa raison. Gardées telles quelles (décision du lot 4, signalées en PR) : CR 153 « Qu'est ce »,
// 144 « l'euro est-elle ». Coquilles connues, pas encore présentes dans nos données :
// CR 73 et 122 « lorsque qu'on » ; NAT 151 « fondée? », 198 « océan indien »,
// 213 « 101ème », 225 « les parents peuvent inscrire ».
const LIST_EXCEPTIONS: Record<string, Map<number, { reason: string; expected: string }>> = {
  CR: new Map([
    [
      28,
      {
        // Officiel : « … des Églises et de l'Etat … » (accent manquant) ; notre question 31.
        reason: 'coquille officielle',
        expected: "En quelle année la loi de séparation des Églises et de l'État a-t-elle été votée ?",
      },
    ],
    [
      39,
      {
        // Officiel : « Qu'est ce qui est interdit par la Charte de la laïcité à l'école ? »
        // (trait d'union manquant, comme CSP 27) ; notre question 321.
        reason: 'faute corrigée',
        expected: "Qu'est-ce qui est interdit par la Charte de la laïcité à l'école ?",
      },
    ],
  ]),
  NAT: new Map([
    [
      137,
      {
        // Officiel : « Pourquoi l’année 1958 est importante pour la France ? », même
        // faute que la liste CSP ; libellé corrigé dans nos données (question 133).
        reason: 'faute corrigée',
        expected: 'Pourquoi l’année 1958 est-elle importante pour la France ?',
      },
    ],
    [
      152,
      {
        // Officiel : « … la Seconde guerre mondiale ? » (casse de la liste NAT) ; notre question 121
        // garde le libellé de la liste CSP, verrouillé par le contrôle CSP.
        reason: 'casse de la liste NAT',
        expected: "Quand a eu lieu la Seconde Guerre mondiale ?",
      },
    ],
    [
      153,
      {
        // Officiel : « … la Première guerre mondiale ? » (casse de la liste NAT) ; notre question 122
        // garde le libellé de la liste CSP, verrouillé par le contrôle CSP.
        reason: 'casse de la liste NAT',
        expected: "Quand a eu lieu la Première Guerre mondiale ?",
      },
    ],
    [
      242,
      {
        // Officiel : « Une personne étrangère, en situation régulière, peut … » (virgules de la liste
        // NAT) ; notre question 172 garde le libellé de la liste CSP, verrouillé par le contrôle CSP.
        reason: 'virgules de la liste NAT',
        expected: "Une personne étrangère en situation régulière peut créer son entreprise :",
      },
    ],
  ]),
}

const listed = allQuestions as ListedQuestion[]

describe.each(OFFICIAL_LISTS)('official $label wording', (list) => {
  const ranked = rankedQuestions(list, listed)
  const exceptions = LIST_EXCEPTIONS[list.label]

  it(`${list.label}: ${ranked.length} questions couvertes sur ${list.wording.length}`, () => {
    // Coverage only: no failure while the list is incomplete
    expect(ranked.length).toBeLessThanOrEqual(list.wording.length)
  })

  it('has a rank within the list on every ranked question, each rank used once', () => {
    const ranks = ranked.map((q) => list.rankOf(q)!)
    expect(ranks.filter((n) => !Number.isInteger(n) || n < 1 || n > list.wording.length)).toEqual([])
    expect(new Set(ranks).size).toBe(ranks.length)
  })

  it('never uses the rank of an official duplicate, which stays on the question it repeats', () => {
    for (const [duplicate, kept] of list.duplicates) {
      expect(list.wording[duplicate - 1]).toBe(list.wording[kept - 1])
      expect(ranked.filter((q) => list.rankOf(q) === duplicate)).toEqual([])
    }
  })

  it('uses the official wording at its rank, typography aside, except documented exceptions', () => {
    const mismatches = ranked
      .filter((q) => !exceptions.has(list.rankOf(q)!))
      .filter((q) => normalizeTypography(q.question) !== normalizeTypography(list.wording[list.rankOf(q)! - 1]))
      .map((q) => ({ id: q.id, ours: q.question, official: list.wording[list.rankOf(q)! - 1] }))
    expect(mismatches).toEqual([])
  })

  it('uses the documented wording for each exception, distinct from the official one', () => {
    for (const [rank, { expected }] of exceptions) {
      const q = ranked.find((x) => list.rankOf(x) === rank)
      expect(q?.question).toBe(expected)
      expect(normalizeTypography(expected)).not.toBe(normalizeTypography(list.wording[rank - 1]))
    }
  })

  it(`has "${list.key}" in lists exactly on the official questions that carry a rank`, () => {
    const official = listed.filter((q) => q.notion !== 'mise-en-situation')
    const inList = official.filter((q) => q.lists.includes(list.key)).map((q) => q.id)
    expect(inList).toEqual(ranked.map((q) => q.id))
  })
})
