// Single source of the search-engine metadata of every public address. Read by the app (tab
// title, via use-document-title.ts) and by the build (vite-seo.ts: one HTML file per address,
// sitemap.xml). No import here: the Vite config loads this file without the "@/" alias.
// A change of text is a change of what search engines and link previews show: the texts were
// validated by the owner (card "Référencement : socle technique", 2026-11-28).

export const SITE_URL = 'https://futurcitoyen.fr'
export const SITE_NAME = 'Futur Citoyen'
export const SITE_LOGO_URL = `${SITE_URL}/icon-512.png`

export interface RouteMeta {
  /** Address of the page, "/" or "/segment" (no trailing slash) */
  path: string
  /** Full title, suffix included */
  title: string
  description: string
}

const SUFFIX = ` · ${SITE_NAME}`

export const PUBLIC_ROUTES = [
  {
    path: '/',
    title: `Examen civique : entraînement gratuit${SUFFIX}`,
    description:
      "Préparez l'examen civique : examens blancs de 40 questions, révision des questions officielles avec explications et sources. Gratuit, sans inscription.",
  },
  {
    path: '/examen-blanc',
    title: `Examen blanc de l'examen civique${SUFFIX}`,
    description:
      "40 questions en 45 minutes, comme le jour J : entraînez-vous à l'examen civique et voyez la correction expliquée après chaque question.",
  },
  {
    path: '/revision',
    title: `Questions de l'examen civique à réviser${SUFFIX}`,
    description:
      'Toutes les questions officielles de votre titre, par thème, avec la bonne réponse, une explication simple et la source officielle.',
  },
  {
    path: '/examen-civique',
    title: `L'examen civique 2026 : format et préparation${SUFFIX}`,
    description:
      "Qui doit passer l'examen civique, comment il se déroule (40 questions, 45 minutes, 32 bonnes réponses) et comment s'y préparer.",
  },
  {
    path: '/centres',
    title: `Où passer l'examen civique${SUFFIX}`,
    description:
      "Les deux organismes agréés par le ministère de l'Intérieur pour passer l'examen civique, et comment trouver une session près de chez vous.",
  },
  {
    path: '/titres/carte-de-sejour-pluriannuelle',
    title: `Carte de séjour pluriannuelle et examen civique${SUFFIX}`,
    description:
      "Durée, conditions principales et examen civique pour la carte de séjour pluriannuelle, avec les liens officiels.",
  },
  {
    path: '/titres/carte-de-resident',
    title: `Carte de résident et examen civique${SUFFIX}`,
    description: "Durée, conditions principales et examen civique pour la carte de résident, avec les liens officiels.",
  },
  {
    path: '/titres/naturalisation',
    title: `Naturalisation et examen civique${SUFFIX}`,
    description: "Conditions principales et examen civique pour la naturalisation, avec les liens officiels.",
  },
  {
    path: '/mentions-legales',
    title: `Mentions légales et confidentialité${SUFFIX}`,
    description:
      'Éditeur, hébergement et données : vos examens restent sur votre appareil. Statistiques sans cookie.',
  },
] as const satisfies readonly RouteMeta[]

export type PublicPath = (typeof PUBLIC_ROUTES)[number]['path']

/**
 * Pages served with `noindex`: private to the visitor (the exam in progress, its detail) or without
 * content of their own (/titre, the first-visit screen). Their canonical points to the home page.
 * /examen/:id (any id) cannot have a file: it gets the same ban from an X-Robots-Tag header
 * (public/_headers).
 */
export const NOINDEX_ROUTES: readonly RouteMeta[] = [
  { path: '/examen', title: `Examen blanc${SUFFIX}`, description: PUBLIC_ROUTES[0].description },
  { path: '/titre', title: PUBLIC_ROUTES[0].title, description: PUBLIC_ROUTES[0].description },
]

export const HOME_META: RouteMeta = PUBLIC_ROUTES[0]

export function routeMeta(path: string): RouteMeta {
  return PUBLIC_ROUTES.find((r) => r.path === path) ?? HOME_META
}

/** Canonical address: site + path, no trailing slash except for the home page. */
export const canonicalUrl = (path: string) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`)

/** File written in dist/ for an address ("/revision" → "revision.html"; the home page is index.html). */
export const htmlFileOf = (path: string) => (path === '/' ? 'index.html' : `${path.slice(1)}.html`)

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Structured data of the home page: the site and its publisher brand. */
export function structuredData(): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        description: HOME_META.description,
        inLanguage: 'fr-FR',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: SITE_LOGO_URL,
        description: HOME_META.description,
      },
    ],
  })
}

export const SEO_START = '<!-- seo:start -->'
export const SEO_END = '<!-- seo:end -->'

/**
 * The head block of an address (between the seo:start / seo:end markers of index.html):
 * title, description, canonical, share tags, and for the home page the structured data.
 * `noindex` adds the robots meta; `canonicalPath` overrides the canonical (noindex pages).
 */
export function renderSeoBlock(meta: RouteMeta, options: { noindex?: boolean; canonicalPath?: string } = {}): string {
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const canonical = canonicalUrl(options.canonicalPath ?? meta.path)
  const lines = [
    SEO_START,
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    ...(options.noindex ? ['<meta name="robots" content="noindex" />'] : []),
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    // A JSON-LD block is data, not a script: it does not need script-src
    ...(meta.path === '/' && !options.noindex
      ? [`<script type="application/ld+json">${structuredData().replace(/</g, '\\u003c')}</script>`]
      : []),
    SEO_END,
  ]
  return lines.join('\n    ')
}

/** sitemap.xml: the indexable pages only. */
export function renderSitemap(): string {
  const urls = PUBLIC_ROUTES.map((r) => `  <url><loc>${canonicalUrl(r.path)}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}
