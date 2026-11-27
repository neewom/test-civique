import { questionsForTitle } from '@/lib/exam'
import type { TitleKey } from '@/lib/target-title'

export const FICHE_SLUGS = {
  pluriannuelle: 'carte-de-sejour-pluriannuelle',
  resident: 'carte-de-resident',
  naturalisation: 'naturalisation',
} as const satisfies Record<TitleKey, string>

export const FICHE_LABELS: Record<TitleKey, string> = {
  pluriannuelle: 'Carte de séjour pluriannuelle',
  resident: 'Carte de résident',
  naturalisation: 'Naturalisation',
}

/** Slug of a fiche address (`/titres/:slug`) → its title, or undefined for an unknown address. */
export function titleOfSlug(slug: string | undefined): TitleKey | undefined {
  return (Object.keys(FICHE_SLUGS) as TitleKey[]).find((k) => FICHE_SLUGS[k] === slug)
}

export const ficheUrl = (t: TitleKey) => `/titres/${FICHE_SLUGS[t]}`

export interface Fiche {
  summary: string
  details: string[]
  needs: string[]
  /** Short note under the list of requirements */
  needsNote: string
  examQuestions: number
  examParas: string[]
  goodToKnow: string[]
  links: { label: string; url: string }[]
}

// Official questions (not the situational ones written for the app) of a title's list, counted
// in the data (naturalisation: 259 rows in the official list, one repeated, so 258).
const officialCount = (t: TitleKey) => questionsForTitle(t).filter((q) => q.notion !== 'mise-en-situation').length

const SP = 'https://www.service-public.gouv.fr/particuliers/vosdroits/'
const FC_INFOS = 'https://formation-civique.interieur.gouv.fr/examen-civique/informations-g%C3%A9n%C3%A9rales-sur-lexamen-civique/'

export const FICHES: Record<TitleKey, Fiche> = {
  pluriannuelle: {
    summary: 'Elle dure en général 4 ans.',
    details: [
      "Pour certains motifs, elle est plus courte : 2 ans au plus pour un conjoint de Français ou un parent d'enfant français, par exemple. Pour un étudiant, elle dure le temps des études (4 ans au plus).",
    ],
    needs: [
      'Une première carte de séjour temporaire ou un visa long séjour.',
      'Parler et écrire le français au niveau A2.',
      "Réussir l'examen civique « carte de séjour pluriannuelle ».",
    ],
    needsNote:
      "Le français et l'examen sont demandés depuis le 1er janvier 2026, pour une première carte pluriannuelle. Si vous avez plus de 65 ans, vous n'avez pas besoin de l'examen ni du test de français.",
    examQuestions: officialCount('pluriannuelle'),
    examParas: [
      "Vous passez l’examen sur ordinateur ou tablette, dans un centre agréé par la Chambre de commerce et d'industrie de Paris (CCIP) ou par France Éducation international.",
      "Passez l'examen avant de déposer votre demande : on vous demande l'attestation de réussite.",
    ],
    goodToKnow: [
      'Certaines personnes ne sont pas concernées (par exemple les bénéficiaires de la protection subsidiaire et les apatrides).',
      "Pour renouveler la carte, vous n'avez pas besoin de repasser l'examen.",
      "Vous pouvez passer l'examen autant de fois que nécessaire. L'attestation n'a pas de date de fin.",
      'En cas de fraude, vous ne pouvez pas repasser l’examen pendant 2 ans.',
    ],
    links: [
      { label: 'La carte de séjour pluriannuelle', url: SP + 'F35799' },
      { label: "L'examen civique pour un titre de séjour", url: SP + 'F39530' },
      { label: "Informations générales sur l'examen civique", url: FC_INFOS },
    ],
  },
  resident: {
    summary: 'Elle dure 10 ans. Elle se renouvelle.',
    details: [
      "Elle n'est plus valable si vous quittez la France plus de 3 ans de suite (6 ans pour la carte de résident de longue durée-UE).",
    ],
    needs: [
      'Une durée de séjour qui dépend de votre situation : par exemple 5 ans de séjour régulier en France (longue durée-UE), ou 3 ans de mariage avec un Français ou une Française.',
      'Parler et écrire le français au niveau B1.',
      "Réussir l'examen civique « carte de résident ».",
    ],
    needsNote:
      "Le français et l'examen sont demandés depuis le 1er janvier 2026, en général, pour une première carte de résident. Si vous avez plus de 65 ans, vous n'avez pas besoin de l'examen ni du test de français.",
    examQuestions: officialCount('resident'),
    examParas: [
      "Les questions ne sont pas tout à fait les mêmes que pour la carte pluriannuelle. Si vous réussissez l'examen « carte de résident », il compte aussi pour une carte pluriannuelle.",
      "Vous passez l'examen dans un centre agréé par la Chambre de commerce et d'industrie de Paris (CCIP) ou par France Éducation international, avant de déposer votre demande.",
    ],
    goodToKnow: [
      'Toutes les cartes de résident ne sont pas concernées.',
      "Pour renouveler la carte, vous n'avez pas besoin de repasser l'examen.",
      "Vous pouvez passer l'examen autant de fois que nécessaire. L'attestation n'a pas de date de fin.",
      'En cas de fraude, vous ne pouvez pas repasser l’examen pendant 2 ans.',
    ],
    links: [
      { label: 'La carte de résident', url: SP + 'F2208' },
      { label: "L'examen civique pour un titre de séjour", url: SP + 'F39530' },
      { label: "Informations générales sur l'examen civique", url: FC_INFOS },
    ],
  },
  naturalisation: {
    summary: 'Vous devenez Français ou Française par décret.',
    details: ["La naturalisation n'est pas une carte de séjour."],
    needs: [
      'En général, 5 ans en France. Dans certains cas, c’est 2 ans, ou aucune durée.',
      'Une carte de séjour valable au dépôt de la demande, et au moins 18 ans (vous pouvez déposer la demande dès 17 ans).',
      'Parler et écrire le français au niveau B2.',
      "Réussir l'examen civique « naturalisation ».",
      'Passer un entretien à la préfecture.',
    ],
    needsNote: 'Le français et l’examen sont demandés depuis le 1er janvier 2026.',
    examQuestions: officialCount('naturalisation'),
    examParas: [
      `La liste officielle compte ${officialCount('naturalisation')} questions de connaissance. Les mises en situation ne sont pas publiées.`,
      "Vous passez l'examen dans un centre agréé par la Chambre de commerce et d'industrie de Paris (CCIP) ou par France Éducation international. Si vous vivez à l'étranger, adressez-vous à un institut français, une alliance française ou au consulat.",
    ],
    goodToKnow: [
      "Il n'y a pas de dispense d'examen liée à l'âge. Une dispense est possible seulement pour raison de santé ou de handicap, avec un certificat médical.",
      "L'attestation de réussite fait partie de votre dossier.",
      'Le dossier coûte 255 € en timbre fiscal (127,50 € en Guyane).',
      "L'administration a 18 mois au plus pour vous répondre (12 mois si vous vivez en France depuis au moins 10 ans).",
      'En cas de fraude, vous ne pouvez pas repasser l’examen pendant 2 ans.',
    ],
    links: [
      { label: 'La demande de naturalisation', url: SP + 'F2213' },
      { label: "L'examen civique pour la naturalisation", url: SP + 'F39426' },
      {
        label: 'Les étapes de la naturalisation',
        url: 'https://www.immigration.interieur.gouv.fr/devenir-francais/procedures-dacces-a-nationalite-francaise',
      },
    ],
  },
}
