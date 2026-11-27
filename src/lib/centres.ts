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
  "L'examen civique se passe dans un centre agréé. Deux organismes, agréés par le ministère de l'Intérieur, ont chacun leur réseau de centres. L'examen est le même partout : choisissez simplement un centre près de chez vous, dans l'un ou l'autre réseau. C'est ce centre qui vous donne la date et le tarif. Des centres existent aussi en outre-mer : cherchez votre ville sur les deux cartes."

export const ORGANISMES: Organisme[] = [
  {
    name: "Chambre de commerce et d'industrie de Paris (CCIP)",
    description:
      'Malgré son nom, ce réseau a des centres dans toute la France. Cherchez une session par ville, puis inscrivez-vous directement auprès du centre.',
    links: [
      {
        label: 'Trouver une session',
        url: 'https://francais.cci-paris-idf.fr/candidat?produit=21',
        primary: true,
      },
    ],
  },
  {
    name: 'France Éducation International',
    description:
      'Trouvez un centre sur la carte, puis faites la pré-inscription en ligne, obligatoire dans ce réseau. Le centre vous contacte ensuite pour la date et le paiement.',
    links: [
      {
        label: 'Voir la carte des centres',
        url: 'https://www.france-education-international.fr/centres-d-examen/carte?type-centre=examen_civique',
        primary: true,
      },
      { label: 'Se pré-inscrire', url: 'https://test-civique.fr/inscription' },
    ],
  },
]

export const CENTRES_FOOTER =
  "Les pièces à fournir sont indiquées sur le site de chaque organisme. Futur Citoyen n'est lié à aucun d'eux."

export const OFFICIAL_ORGANISMES_LABEL = 'Liste officielle des organismes'
export const OFFICIAL_ORGANISMES_URL =
  'https://formation-civique.interieur.gouv.fr/examen-civique/informations-g%C3%A9n%C3%A9rales-sur-lexamen-civique/'
