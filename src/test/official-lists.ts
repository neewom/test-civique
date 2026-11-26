import crWording from '@/test/fixtures/official-cr-questions.json'
import natWording from '@/test/fixtures/official-nat-questions.json'
import type { ListedQuestion } from '@/lib/exam'

// Official lists of the « carte de résident » (CR) and naturalisation (NAT) knowledge
// questions, frozen copies (order = rank, typos included) used by the data tests:
// - CR, relevé le 2026-11-26 sur
//   https://formation-civique.interieur.gouv.fr/examen-civique/liste-officielle-des-questions-de-connaissance-cr/
// - NAT, relevé le 2026-11-26 sur le PDF officiel du 12/12/2025
//   https://www.immigration.interieur.gouv.fr/sites/dgef/files/medias/documents/2026-01/examen-civique-naturalisation-questions-de-connaissance-20251212.pdf
//   (15 intitulés en image transcrits à la main).

export interface OfficialList {
  key: 'resident' | 'naturalisation'
  label: string
  wording: string[]
  rankOf: (q: ListedQuestion) => number | undefined
  /** Official duplicates: rank → rank of the question that stands for both */
  duplicates: ReadonlyMap<number, number>
}

export const OFFICIAL_LISTS: readonly OfficialList[] = [
  {
    key: 'resident',
    label: 'CR',
    wording: crWording,
    rankOf: (q) => q.crNumber,
    duplicates: new Map(),
  },
  {
    key: 'naturalisation',
    label: 'NAT',
    wording: natWording,
    rankOf: (q) => q.natNumber,
    // NAT n 48 « Qui peut se présenter aux élections présidentielles ? » repeats n 40
    // word for word: a single question stands for both, with `natNumber` 40.
    duplicates: new Map([[48, 40]]),
  },
]

/** Questions of the data that carry a rank of the list. */
export function rankedQuestions(list: OfficialList, questions: readonly ListedQuestion[]): ListedQuestion[] {
  return questions.filter((q) => list.rankOf(q) !== undefined)
}

/** True once every rank of the list (official duplicates aside) is carried by a question. */
export function isListComplete(list: OfficialList, questions: readonly ListedQuestion[]): boolean {
  const ranks = new Set(rankedQuestions(list, questions).map((q) => list.rankOf(q)))
  return list.wording.every((_, i) => ranks.has(i + 1) || list.duplicates.has(i + 1))
}
