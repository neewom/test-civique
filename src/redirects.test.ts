import { describe, it, expect } from 'vitest'
import redirects from '../public/_redirects?raw'
import html from '../index.html?raw'

// Active rules only (comments and blank lines ignored, spaces normalised)
const rules = redirects
  .split('\n')
  .map((line) => line.trim().replace(/\s+/g, ' '))
  .filter((line) => line !== '' && !line.startsWith('#'))

const SPA_RULE = '/* /index.html 200'
const OLD_HOST_RULES = [
  'https://test-civique.netlify.app/* https://futurcitoyen.fr/:splat 301!',
  'http://test-civique.netlify.app/* https://futurcitoyen.fr/:splat 301!',
]

describe('public/_redirects — domaine futurcitoyen.fr', () => {
  it('garde la règle SPA', () => {
    expect(rules).toContain(SPA_RULE)
  })

  it.each(OLD_HOST_RULES)('redirige l’ancienne adresse avant la règle SPA : %s', (rule) => {
    expect(rules).toContain(rule)
    expect(rules.indexOf(rule)).toBeLessThan(rules.indexOf(SPA_RULE))
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

  it("n'a pas de canonique fixe (un seul index.html sert toutes les routes)", () => {
    expect(html).not.toContain('rel="canonical"')
  })

  it('ne référence plus l’ancienne adresse Netlify', () => {
    expect(html).not.toContain('test-civique.netlify.app')
  })
})
