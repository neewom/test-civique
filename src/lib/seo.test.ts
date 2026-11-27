/// <reference types="node" />
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { pageFor, seoFiles } from '../../vite-seo'
import { buildManifest } from '../../vite-service-worker'
import { FICHE_SLUGS, ficheUrl } from '@/lib/fiches'
import {
  HOME_META,
  NOINDEX_ROUTES,
  PUBLIC_ROUTES,
  SITE_URL,
  canonicalUrl,
  htmlFileOf,
  renderSeoBlock,
  renderSitemap,
  routeMeta,
  structuredData,
} from '@/lib/seo'

const root = process.cwd()
const read = (file: string) => readFileSync(path.resolve(root, file), 'utf8')
const SOURCE_INDEX = read('index.html')
// index.html as the build leaves it: the home block in place of the marker
const BUILT_INDEX = SOURCE_INDEX.replace('<!-- seo -->', renderSeoBlock(HOME_META))
const metaContent = (html: string, attr: string, name: string) =>
  new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`).exec(html)?.[1]
const titleOf = (html: string) => /<title>([^<]*)<\/title>/.exec(html)?.[1]
const canonicalOf = (html: string) => /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1]
const unescape = (text: string) => text.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&')

describe('source des métadonnées (src/lib/seo.ts)', () => {
  it('chaque adresse publique a un titre « … · Futur Citoyen » et une description, uniques', () => {
    for (const r of PUBLIC_ROUTES) {
      expect(r.path === '/' || /^\/[a-z0-9-]+(\/[a-z0-9-]+)?$/.test(r.path), r.path).toBe(true)
      expect(r.title, r.path).toMatch(/ · Futur Citoyen$/)
      expect(r.description.length, r.path).toBeGreaterThan(40)
    }
    expect(new Set(PUBLIC_ROUTES.map((r) => r.path)).size).toBe(PUBLIC_ROUTES.length)
    expect(new Set(PUBLIC_ROUTES.map((r) => r.title)).size).toBe(PUBLIC_ROUTES.length)
    expect(new Set(PUBLIC_ROUTES.map((r) => r.description)).size).toBe(PUBLIC_ROUTES.length)
  })

  it('les textes validés par l\'utilisateur, mot pour mot (accueil et une fiche)', () => {
    expect(routeMeta('/').title).toBe('Examen civique : entraînement gratuit · Futur Citoyen')
    expect(routeMeta('/titres/naturalisation')).toEqual({
      path: '/titres/naturalisation',
      title: 'Naturalisation et examen civique · Futur Citoyen',
      description: 'Conditions principales et examen civique pour la naturalisation, avec les liens officiels.',
    })
  })

  it('chaque fiche de titre, et chaque page de l\'appli, a sa métadonnée', () => {
    for (const key of Object.keys(FICHE_SLUGS) as (keyof typeof FICHE_SLUGS)[]) {
      expect(PUBLIC_ROUTES.map((r) => r.path as string)).toContain(ficheUrl(key))
    }
    const app = read('src/App.tsx')
    for (const r of PUBLIC_ROUTES) {
      const declared = r.path.startsWith('/titres/') ? '/titres/:slug' : r.path
      expect(app, r.path).toContain(`path="${declared}"`)
    }
  })

  it('une adresse inconnue retombe sur l\'accueil, l\'adresse canonique n\'a pas de barre finale (sauf /)', () => {
    expect(routeMeta('/n-importe-quoi')).toBe(HOME_META)
    expect(canonicalUrl('/')).toBe(`${SITE_URL}/`)
    expect(canonicalUrl('/revision')).toBe(`${SITE_URL}/revision`)
    expect(htmlFileOf('/')).toBe('index.html')
    expect(htmlFileOf('/titres/carte-de-resident')).toBe('titres/carte-de-resident.html')
  })
})

describe('bloc de balises', () => {
  it('titre, description, canonical et balises de partage de la même page', () => {
    const html = renderSeoBlock(routeMeta('/regles'))
    expect(titleOf(html)).toBe("L'examen civique 2026 : format et préparation · Futur Citoyen")
    expect(canonicalOf(html)).toBe('https://futurcitoyen.fr/regles')
    for (const [attr, name] of [['name', 'description'], ['property', 'og:description'], ['name', 'twitter:description']] as const) {
      expect(metaContent(html, attr, name), name).toBe(routeMeta('/regles').description)
    }
    expect(metaContent(html, 'property', 'og:title')).toBe(titleOf(html))
    expect(metaContent(html, 'name', 'twitter:title')).toBe(titleOf(html))
    expect(metaContent(html, 'property', 'og:url')).toBe(canonicalOf(html))
    expect(html).not.toContain('noindex')
    expect(html).not.toContain('ld+json')
  })

  it('les caractères HTML sont échappés', () => {
    const html = renderSeoBlock({ path: '/x', title: 'A & "B" <c>', description: 'a "b" & <c>' })
    expect(html).toContain('<title>A &amp; &quot;B&quot; &lt;c&gt;</title>')
    expect(html).not.toContain('<c>')
  })

  it('noindex : balise robots et canonical imposé', () => {
    const html = renderSeoBlock(NOINDEX_ROUTES[0], { noindex: true, canonicalPath: '/' })
    expect(html).toContain('<meta name="robots" content="noindex" />')
    expect(canonicalOf(html)).toBe('https://futurcitoyen.fr/')
  })
})

describe('données structurées', () => {
  it('WebSite et Organization, nom, URL, logo et description, dans la seule page d\'accueil', () => {
    const html = renderSeoBlock(HOME_META)
    const json = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)![1])
    expect(json['@context']).toBe('https://schema.org')
    const [site, org] = json['@graph']
    expect(site).toMatchObject({ '@type': 'WebSite', name: 'Futur Citoyen', url: 'https://futurcitoyen.fr/', inLanguage: 'fr-FR' })
    expect(org).toMatchObject({ '@type': 'Organization', name: 'Futur Citoyen', url: 'https://futurcitoyen.fr/' })
    expect(org.logo).toBe('https://futurcitoyen.fr/icon-512.png')
    expect(org.description).toBe(HOME_META.description)
    expect(site.publisher['@id']).toBe(org['@id'])
    expect(JSON.parse(structuredData())).toEqual(json)
    expect(renderSeoBlock(routeMeta('/revision'))).not.toContain('ld+json')
  })

  it('le logo du JSON-LD existe dans public/', () => {
    expect(() => read('public/icon-512.png')).not.toThrow()
  })
})

describe('HTML généré au build', () => {
  const files = seoFiles(BUILT_INDEX)

  it('une page par adresse publique (hors accueil) et par adresse noindex, avec ses propres balises', () => {
    for (const r of PUBLIC_ROUTES.filter((r) => r.path !== '/')) {
      const html = files[htmlFileOf(r.path)]
      expect(html, r.path).toBeDefined()
      expect(unescape(titleOf(html)!), r.path).toBe(r.title)
      expect(unescape(metaContent(html, 'name', 'description')!), r.path).toBe(r.description)
      expect(canonicalOf(html), r.path).toBe(`https://futurcitoyen.fr${r.path}`)
      expect(unescape(metaContent(html, 'property', 'og:title')!)).toBe(r.title)
      expect(metaContent(html, 'property', 'og:url')).toBe(`https://futurcitoyen.fr${r.path}`)
      expect(unescape(metaContent(html, 'name', 'twitter:description')!)).toBe(r.description)
      expect(html, r.path).not.toContain('noindex')
      expect(html, r.path).not.toContain('ld+json')
    }
  })

  it('le reste de la page est celui d\'index.html : script, écran de démarrage, image de partage', () => {
    const html = files['revision.html']
    expect(html.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, '')).toBe(
      BUILT_INDEX.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, ''),
    )
    expect(html).toContain('<script type="module" src="/src/main.tsx"></script>')
    expect(html).toContain('og:image')
  })

  it('/examen et /titre : noindex, canonical vers l\'accueil', () => {
    for (const r of NOINDEX_ROUTES) {
      const html = files[htmlFileOf(r.path)]
      expect(html, r.path).toContain('<meta name="robots" content="noindex" />')
      expect(canonicalOf(html), r.path).toBe('https://futurcitoyen.fr/')
    }
    expect(NOINDEX_ROUTES.map((r) => r.path)).toEqual(['/examen', '/titre'])
  })

  it('l\'index.html source porte le repère, aucune balise de titre ni de description en dur', () => {
    expect(SOURCE_INDEX).toContain('<!-- seo -->')
    expect(SOURCE_INDEX).not.toMatch(/<title>|name="description"|rel="canonical"|og:title|og:url|twitter:title/)
    expect(() => pageFor('<head></head>', 'x')).toThrow()
  })

  it('sitemap.xml : les pages publiques indexables seulement', () => {
    const sitemap = files['sitemap.xml']
    expect(sitemap).toBe(renderSitemap())
    const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1])
    expect(locs).toEqual(PUBLIC_ROUTES.map((r) => canonicalUrl(r.path)))
    expect(sitemap).not.toMatch(/\/examen<|\/titre<|404/)
    expect(sitemap).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/)
  })
})

describe('robots.txt, 404 et règles Netlify', () => {
  it('robots.txt autorise tout et indique le sitemap', () => {
    const robots = read('public/robots.txt')
    expect(robots).toMatch(/^User-agent: \*$/m)
    expect(robots).toMatch(/^Allow: \/$/m)
    expect(robots).not.toMatch(/^Disallow: ./m)
    expect(robots).toMatch(/^Sitemap: https:\/\/futurcitoyen\.fr\/sitemap\.xml$/m)
  })

  const rules = read('public/_redirects')
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => l.trim().split(/\s+/))

  it('chaque adresse publique et noindex est servie par son fichier HTML, en 200', () => {
    for (const r of [...PUBLIC_ROUTES.filter((r) => r.path !== '/'), ...NOINDEX_ROUTES]) {
      expect(rules, r.path).toContainEqual([r.path, `/${htmlFileOf(r.path)}`, '200'])
    }
  })

  it('/examen/<id> sert l\'appli, toute autre adresse la page 404 en code 404, en dernier', () => {
    expect(rules).toContainEqual(['/examen/*', '/index.html', '200'])
    expect(rules[rules.length - 1]).toEqual(['/*', '/404.html', '404'])
    expect(rules).toContainEqual(['/assets/*', '/404.html', '404'])
    expect(rules.findIndex((r) => r[0] === '/examen')).toBeLessThan(rules.findIndex((r) => r[0] === '/examen/*'))
  })

  it('aucune règle ne renvoie plus tout vers index.html (le repli SPA d\'avant)', () => {
    expect(rules).not.toContainEqual(['/*', '/index.html', '200'])
  })

  it('/examen/<id> est écarté de l\'index par un en-tête, sans bloquer les robots', () => {
    expect(read('public/_headers')).toMatch(/^\/examen\/\*\n {2}X-Robots-Tag: noindex$/m)
  })

  it('la page 404 : noindex, lien vers l\'accueil, feuille de style de l\'appli, aucun style en ligne', () => {
    const html = read('404.html')
    expect(html).toContain('<meta name="robots" content="noindex" />')
    expect(html).toContain('<title>Page introuvable · Futur Citoyen</title>')
    expect(html).toMatch(/<a href="\/"[^>]*>Retour à l'accueil<\/a>/)
    expect(html).not.toMatch(/ style=|<style/)
    expect(html).not.toContain('rel="canonical"')
  })
})

describe('service worker (#158) et pages générées', () => {
  const dist = mkdtempSync(path.join(tmpdir(), 'seo-dist-'))
  for (const f of ['index.html', 'revision.html', 'titres/carte-de-resident.html', 'examen.html', 'titre.html', '404.html', 'robots.txt', 'sitemap.xml', 'theme-init.js', 'assets/a.js']) {
    mkdirSync(path.dirname(path.join(dist, f)), { recursive: true })
    writeFileSync(path.join(dist, f), f)
  }
  const manifest = buildManifest(dist, {}, 'template')

  it('seul index.html est précaché : hors ligne, il répond à toute adresse (navigation « réseau d\'abord »)', () => {
    expect(manifest.precache).toContain('/index.html')
    for (const url of ['/revision.html', '/titres/carte-de-resident.html', '/examen.html', '/titre.html', '/404.html', '/robots.txt', '/sitemap.xml']) {
      expect(manifest.precache).not.toContain(url)
    }
    expect(manifest.precache).toEqual(expect.arrayContaining(['/theme-init.js', '/assets/a.js']))
  })

  it('le worker répond aux navigations par index.html, quelle que soit l\'adresse', () => {
    const sw = read('sw/service-worker.template.js')
    expect(sw).toContain("networkFirst(INDEX_URL, request)")
    expect(sw).toContain("const INDEX_URL = '/index.html'")
  })
})
