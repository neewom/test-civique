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
// sa raison.
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
    [
      73,
      {
        // Officiel : « Depuis quand l'euro est-elle la monnaie unique ? » (accord fautif) ;
        // corrigé sur décision de l'utilisateur (2026-11-26), notre question 342.
        reason: 'faute corrigée',
        expected: "Depuis quand l'euro est-il la monnaie unique ?",
      },
    ],
    [
      122,
      {
        // Officiel : « … lorsque qu'on est témoin de violences ? » ; notre question 382.
        reason: 'faute corrigée',
        expected: "Quelle est l’attitude à avoir lorsqu'on est témoin de violences ?",
      },
    ],
    [
      144,
      {
        // Officiel : « En quelle année l'euro est-elle devenue … » (accord fautif) ; notre question 403.
        reason: 'faute corrigée',
        expected: "En quelle année l'euro est-il devenu la monnaie utilisée en France ?",
      },
    ],
    [
      153,
      {
        // Officiel : « Qu'est ce que la France d'outre-mer ? » (trait d'union manquant) ; notre question 412.
        reason: 'faute corrigée',
        expected: "Qu'est-ce que la France d'outre-mer ?",
      },
    ],
  ]),
  NAT: new Map([
    [
      22,
      {
        // Officiel : « … est l'Égalité. … » (majuscule de la liste NAT) ; notre question 312
        // garde le libellé de la liste CR, verrouillé par le contrôle CR.
        reason: 'casse de la liste NAT',
        expected: "Une des valeurs de la devise républicaine est l'égalité. Qu'est-ce que cela signifie ?",
      },
    ],
    [
      62,
      {
        // Officiel : « … l'action du gouvernement ? » (casse de la liste NAT) ; notre question 331
        // garde le libellé de la liste CR, verrouillé par le contrôle CR.
        reason: 'casse de la liste NAT',
        expected: "Qui dirige l'action du Gouvernement ?",
      },
    ],
    [
      76,
      {
        // Officiel : « … le rôle du Président de la République ? » (casse de la liste NAT) ; notre question 337
        // garde le libellé de la liste CR, verrouillé par le contrôle CR.
        reason: 'casse de la liste NAT',
        expected: 'Quel est le rôle du président de la République ?',
      },
    ],
    [
      90,
      {
        // Officiel : « … l'Union Européenne en 2020 ? » (casse de la liste NAT) ; notre question 347
        // garde le libellé de la liste CR, verrouillé par le contrôle CR.
        reason: 'casse de la liste NAT',
        expected: "Quel État a quitté l'Union européenne en 2020 ?",
      },
    ],
    [
      92,
      {
        // Officiel : « … l'hymne de l'Union Européenne ? » (casse de la liste NAT) ; notre question 349
        // garde le libellé de la liste CR, verrouillé par le contrôle CR.
        reason: 'casse de la liste NAT',
        expected: "Quel est l'hymne de l'Union européenne ?",
      },
    ],
    [
      98,
      {
        // Officiel : « … Droits de l'Homme et du Citoyen de 1789 ? » (casse de la liste NAT) ; notre question 358
        // garde le libellé de la liste CR, verrouillé par le contrôle CR.
        reason: 'casse de la liste NAT',
        expected: "Laquelle de ces citations est inscrite dans la Déclaration des Droits de l'homme et du Citoyen de 1789 ?",
      },
    ],
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
      151,
      {
        // Officiel : « … a-t-elle été fondée? » (espace manquant avant le point d'interrogation) ; libellé corrigé dans nos données (question 567).
        reason: 'faute corrigée',
        expected: "En quelle année l'Union européenne a-t-elle été fondée ?",
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
      198,
      {
        // Officiel : « … dans l'océan indien ? » (casse de « Indien ») ; libellé corrigé dans nos données (question 593).
        reason: 'faute corrigée',
        expected: "Quelle île française est située dans l'océan Indien ?",
      },
    ],
    [
      213,
      {
        // Officiel : « … le 101ème département … » (« 101e » en français correct) ; libellé corrigé dans nos données (question 602).
        reason: 'faute corrigée',
        expected: "Quel est le 101e département français depuis 2011 ?",
      },
    ],
    [
      225,
      {
        // Officiel : « … les parents peuvent inscrire leurs enfants … » (inversion manquante) ;
        // libellé corrigé dans nos données (question 610) ; la question 438 reste celle de la liste CR.
        reason: 'faute corrigée',
        expected: "Auprès de quelle institution les parents peuvent-ils inscrire leurs enfants à l'école publique ?",
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
