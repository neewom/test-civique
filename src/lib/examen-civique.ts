/*
 * Texts and links of the « L'examen civique » page (`/examen-civique`).
 * Written and checked against the official sources (arrêté du 10 octobre 2025 on Légifrance, and the
 * « Informations générales sur l'examen civique » page of formation-civique.interieur.gouv.fr), then
 * validated by the owner (2026-11-28). Review them with the fiches and `centres.ts` when the law or
 * the official pages change; any change of text goes through a check on the official sources.
 * In-text markup: **bold** and [label](address); an address starting with « / » is an internal link,
 * otherwise an external one (new tab).
 */
import { EXAM_MINUTES, EXAM_SIZE, passThreshold } from '@/lib/exam'

const FC = 'https://formation-civique.interieur.gouv.fr'
export const INFOS_URL = `${FC}/examen-civique/informations-g%C3%A9n%C3%A9rales-sur-lexamen-civique/`
// Source: arrêté du 10 octobre 2025, art. 1 à 4 et annexes
export const LEGIFRANCE_URL = 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000052381620'

export const PAGE_TITLE = "L'examen civique\u00a0: ce qu'il faut savoir"

export const INTRO_LEAD =
  "L'examen civique est un test de 40 questions sur la France et ses valeurs. Depuis le 1er janvier 2026, il faut le réussir pour obtenir certains titres de séjour ou pour être naturalisé."
export const INTRO_MORE = 'Cette page explique qui le passe, comment il se déroule et comment vous préparer.'
export const INDEPENDENT_NOTE = 'Futur Citoyen est un site indépendant, non officiel.'

export const MARKS = [
  { icon: 'questions', value: String(EXAM_SIZE), label: 'questions' },
  { icon: 'time', value: `${EXAM_MINUTES} min`, label: 'au maximum' },
  { icon: 'choices', value: '4 choix', label: 'une seule bonne réponse' },
  { icon: 'pass', value: `${passThreshold(EXAM_SIZE)}/${EXAM_SIZE}`, label: 'pour réussir', highlight: true },
] as const

export const CTA_NOW = "M'entraîner maintenant"
export const CTA_BLANC = "M'entraîner à l'examen blanc"
export const CTA_CENTRES = "Trouver un centre d'examen"

export const WHAT = {
  title: "Qu'est-ce que l'examen civique\u00a0?",
  paragraphs: [
    "L'examen civique vient de la loi du 26 janvier 2024 «\u00a0pour contrôler l'immigration, améliorer l'intégration\u00a0». Il vérifie que vous connaissez les valeurs de la République et le fonctionnement de la société française. Les questions portent sur cinq thèmes, de l'histoire à la vie quotidienne.",
    "Il existe trois versions de l'examen\u00a0: «\u00a0carte de séjour pluriannuelle\u00a0», «\u00a0carte de résident\u00a0» et «\u00a0naturalisation\u00a0». Les questions ne sont pas exactement les mêmes.",
  ],
}

export const WHO = {
  title: "Qui doit passer l'examen civique\u00a0?",
  lead: 'Vous devez le passer dans ces trois cas\u00a0:',
  cases: [
    'pour une **première carte de séjour pluriannuelle**\u00a0;',
    'pour une **première carte de résident**\u00a0;',
    'pour une **naturalisation par décret**, demandée à partir du 1er janvier 2026.',
  ],
  paragraph:
    "Vous n'avez pas besoin de le passer pour un renouvellement de carte. Une demande de nationalité par déclaration, après un mariage par exemple, n'est pas concernée. Certaines personnes ne sont pas concernées, par exemple les bénéficiaires de la protection subsidiaire et les apatrides pour la carte pluriannuelle.",
  notes: [
    "Si vous avez plus de 65 ans, l'examen n'est pas demandé pour une carte pluriannuelle ou de résident. Pour la naturalisation, il n'y a pas de dispense liée à l'âge.",
    "En cas de handicap ou de problème de santé, l'épreuve peut être aménagée. Par exemple, la durée peut être allongée. Vous pouvez aussi être dispensé, c'est-à-dire ne pas passer l'examen, si votre état rend l'évaluation impossible. Dans les deux cas, il faut un certificat médical.",
  ],
  fichesLead: 'Pour les détails de chaque titre, lisez nos fiches\u00a0:',
  fiches: [
    { to: '/titres/carte-de-sejour-pluriannuelle', label: 'Carte de séjour pluriannuelle' },
    { to: '/titres/carte-de-resident', label: 'Carte de résident' },
    { to: '/titres/naturalisation', label: 'Naturalisation' },
  ],
}

export const HOW = {
  title: "Comment se passe l'examen civique\u00a0?",
  points: [
    '40 questions en français, sur ordinateur ou tablette.',
    '4 choix par question, une seule bonne réponse.',
    '45 minutes au maximum.',
    '1 point par bonne réponse. Une erreur ou une absence de réponse vaut 0\u00a0: pas de point en moins.',
    'Il faut 32 bonnes réponses sur 40 pour réussir, soit 80 %.',
  ],
  situations:
    "Sur les 40 questions, 28 testent vos connaissances et 12 sont des mises en situation. Une mise en situation décrit un cas de la vie de tous les jours. Vous choisissez la bonne attitude. Ces questions ne sont pas publiées à l'avance.",
  splitTitle: 'Répartition des 40 questions',
  split: [
    ['Principes et valeurs de la République', '11, dont 6 situations'],
    ['Système institutionnel et politique', '6'],
    ['Droits et devoirs', '11, dont 6 situations'],
    ['Histoire, géographie et culture', '8'],
    ['Vivre dans la société française', '4'],
  ] as [string, string][],
  rules:
    "Le jour de l'examen, votre téléphone doit être éteint et rangé. Les écouteurs sont interdits, sauf les appareils pour mieux entendre. Si vous ne respectez pas le règlement, vous êtes exclu tout de suite.",
}

export const AFTER = {
  title: "Que se passe-t-il après l'examen civique\u00a0?",
  paragraphs: [
    "Si vous réussissez, vous recevez une attestation de réussite. Vous la joignez à votre demande de titre ou de naturalisation. Pour une carte pluriannuelle ou une carte de résident, elle n'a pas de date de fin.",
    "Pour une carte pluriannuelle ou une carte de résident, si vous échouez, vous pouvez repasser l'examen autant de fois que nécessaire.",
    "En cas de fraude, vous ne pouvez pas repasser l'examen pendant 2 ans.",
  ],
}

export const PREPARE = {
  title: "Comment se préparer à l'examen civique\u00a0?",
  lead: `Le ministère de l'Intérieur publie gratuitement sur [formation-civique.interieur.gouv.fr](${FC}/)\u00a0:`,
  published: [
    'des fiches sur les cinq thèmes\u00a0;',
    `la liste officielle des questions de connaissance, sans les réponses\u00a0: [carte de séjour pluriannuelle](${FC}/examen-civique/liste-officielle-des-questions-de-connaissance-csp/) et [carte de résident](${FC}/examen-civique/liste-officielle-des-questions-de-connaissance-cr/).`,
  ],
  naturalisation: `La liste pour la naturalisation est indiquée sur la page [Informations générales sur l'examen civique](${INFOS_URL}).`,
  appLead: 'Futur Citoyen vous aide à vous entraîner avec ces questions\u00a0:',
  app: [
    "l'examen blanc suit la répartition officielle\u00a0: 40 questions, 45 minutes\u00a0;",
    'la révision se fait par thème, avec une explication et un lien vers la source officielle.',
  ],
  caveat: "Un examen blanc ne garantit pas le résultat du jour J. Il vous aide à vous habituer au format.",
}

export const WHERE = {
  title: "Où passer l'examen civique\u00a0?",
  paragraph:
    "Vous passez l'examen dans un centre agréé, c'est-à-dire autorisé, par le ministère de l'Intérieur. Deux organismes ont chacun leur réseau de centres. Ce sont la Chambre de commerce et d'industrie de Paris (CCIP) et France Éducation International. Si vous vivez à l'étranger et préparez une naturalisation, adressez-vous à un institut français, une alliance française ou au consulat.",
}

export const FAQ_TITLE = "Questions fréquentes sur l'examen civique"
export const FAQ: [string, string][] = [
  ["Faut-il repasser l'examen civique pour renouveler sa carte\u00a0?", "Non. L'attestation de réussite n'est pas demandée pour un renouvellement."],
  ["Combien de fois peut-on passer l'examen civique\u00a0?", "Pour une carte pluriannuelle ou une carte de résident, autant de fois que nécessaire. Il n'y a pas de limite."],
  ["L'attestation de réussite a-t-elle une date de fin\u00a0?", "Pour une carte pluriannuelle ou une carte de résident, non. L'attestation n'a pas de durée de validité."],
  ["Que faut-il apporter le jour de l'examen\u00a0?", "Votre titre de séjour en cours de validité. Pour la naturalisation, une personne de l'Union européenne peut montrer son passeport ou sa carte d'identité. Les pièces à fournir sont aussi indiquées sur le site de chaque organisme."],
  ['Un examen «\u00a0carte de résident\u00a0» vaut-il aussi pour la carte pluriannuelle\u00a0?', "Oui. Si vous réussissez l'examen «\u00a0carte de résident\u00a0», il compte aussi pour une carte de séjour pluriannuelle."],
  ["Où trouver les questions de l'examen\u00a0?", "Le ministère de l'Intérieur publie gratuitement la liste officielle des questions de connaissance, pour les trois titres. Les mises en situation ne sont pas publiées."],
]

export const SOURCES = `Sources officielles\u00a0: [arrêté du 10 octobre 2025 (Légifrance)](${LEGIFRANCE_URL}) et [Informations générales sur l'examen civique](${INFOS_URL}).`
