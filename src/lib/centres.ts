/*
 * Texts and links of the « Trouver un centre d'examen » page (`/centres`).
 * Checked on the official page of the Ministry (formation-civique.interieur.gouv.fr, « Informations
 * générales sur l'examen civique », 2026-11-27), which names the two approved organisms and gives
 * these three links. Review them with the fiches when the law or the official pages change.
 */

export interface CentreLink {
  label: string
  url: string
  /** The main action of the card (dark pill); the other one is secondary */
  primary?: boolean
}

export interface Organisme {
  name: string
  description: string
  links: CentreLink[]
}

export const CENTRES_INTRO =
  "L'examen civique se passe dans un centre agréé. Deux organismes l'organisent, en métropole et en outre-mer : choisissez un centre près de chez vous sur leur site, puis inscrivez-vous en ligne."

export const ORGANISMES: Organisme[] = [
  {
    name: 'France Éducation International',
    description:
      "Établissement public du ministère de l'Éducation nationale. Plus de 230 centres en France, à chercher par adresse ou code postal sur sa carte.",
    links: [
      {
        label: 'Voir la carte des centres',
        url: 'https://www.france-education-international.fr/centres-d-examen/carte?type-centre=examen_civique',
        primary: true,
      },
      { label: "S'inscrire à l'examen", url: 'https://test-civique.fr/inscription' },
    ],
  },
  {
    name: 'CCI Paris Île-de-France',
    description: 'Réseau « Le français des affaires ». Des centres dans toute la France.',
    links: [
      {
        label: "Trouver un centre et s'inscrire",
        url: 'https://francais.cci-paris-idf.fr/candidat?produit=21',
        primary: true,
      },
    ],
  },
]

export const CENTRES_FOOTER =
  "Dates, tarifs et pièces à fournir : chaque organisme les indique sur son site. Futur Citoyen n'est lié à aucun d'eux."

export const OFFICIAL_ORGANISMES_LABEL = 'Liste officielle des organismes'
export const OFFICIAL_ORGANISMES_URL =
  'https://formation-civique.interieur.gouv.fr/examen-civique/informations-g%C3%A9n%C3%A9rales-sur-lexamen-civique/'
