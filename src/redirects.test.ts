import { describe, it, expect } from 'vitest'
import redirects from '../public/_redirects?raw'
import sourceHtml from '../index.html?raw'
import { HOME_META, renderSeoBlock } from '@/lib/seo'

// og:url, title, description come from src/lib/seo.ts at build (vite-seo.ts): index.html as built
const html = sourceHtml.replace('<!-- seo -->', renderSeoBlock(HOME_META))

// Active rules only (comments and blank lines ignored, spaces normalised)
const rules = redirects
  .split('\n')
  .map((line) => line.trim().replace(/\s+/g, ' '))
  .filter((line) => line !== '' && !line.startsWith('#'))

// Since the SEO card (v1.33.0) the catch-all is no longer the SPA fallback: known pages have their own
// rules, /examen/<id> serves the app, and any other address gets the real 404 page
const SPA_RULE = '/examen/* /index.html 200'
const NOT_FOUND_RULE = '/* /404.html 404'
const OLD_HOST_RULES = [
  'https://test-civique.netlify.app/* https://futurcitoyen.fr/:splat 301!',
  'http://test-civique.netlify.app/* https://futurcitoyen.fr/:splat 301!',
]

describe('public/_redirects — domaine futurcitoyen.fr', () => {
  it('garde le repli SPA de /examen/<id> et finit par la vraie 404', () => {
    expect(rules).toContain(SPA_RULE)
    expect(rules[rules.length - 1]).toBe(NOT_FOUND_RULE)
  })

  it('un fichier de /assets/ introuvable répond 404 (avant la règle 404 finale), sans « ! » qui masquerait les fichiers existants', () => {
    const rule = '/assets/* /404.html 404'
    expect(rules).toContain(rule)
    expect(rules.indexOf(rule)).toBeLessThan(rules.indexOf(NOT_FOUND_RULE))
  })

  it.each(OLD_HOST_RULES)('redirige l’ancienne adresse avant la règle 404 : %s', (rule) => {
    expect(rules).toContain(rule)
    expect(rules.indexOf(rule)).toBeLessThan(rules.indexOf(NOT_FOUND_RULE))
  })

  it('ne redirige que l’hôte exact (aperçus deploy-preview épargnés)', () => {
    const hostRules = rules.filter((rule) => rule.includes('netlify.app'))
    expect(hostRules).toEqual(OLD_HOST_RULES)
  })
})

describe('public/_redirects — statistiques GoatCounter', () => {
  it('ne passe plus par un proxy /count (envoi direct depuis le navigateur)', () => {
    expect(rules.filter((rule) => rule.includes('/count') || rule.includes('goatcounter'))).toEqual([])
  })
})

describe('index.html — domaine futurcitoyen.fr', () => {
  it('annonce https://futurcitoyen.fr/ dans les balises de partage', () => {
    expect(html).toContain('<meta property="og:url" content="https://futurcitoyen.fr/" />')
    expect(html).toContain('<meta property="og:image" content="https://futurcitoyen.fr/og-image.png" />')
  })

  it("n'a pas de canonique en dur dans la source (elle vient de src/lib/seo.ts, une par page)", () => {
    expect(sourceHtml).not.toContain('rel="canonical"')
  })

  it('ne référence plus l’ancienne adresse Netlify', () => {
    expect(html).not.toContain('test-civique.netlify.app')
  })
})
