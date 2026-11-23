import { describe, it, expect } from 'vitest'
import html from '../index.html?raw'
import manifestRaw from '../public/site.webmanifest?raw'

const manifest = JSON.parse(manifestRaw)

// Files present in public/ (keys only: nothing is loaded)
const publicFiles = new Set(
  Object.keys(import.meta.glob('../public/*', { query: '?url' })).map((p) => p.replace('../public', '')),
)

function localAsset(path: string) {
  return publicFiles.has(path)
}

describe('index.html — marque Futur Citoyen', () => {
  it('a le titre par défaut "Futur Citoyen · Préparez l\'examen civique"', () => {
    expect(html).toContain("<title>Futur Citoyen · Préparez l'examen civique</title>")
  })

  it.each([
    ['favicon SVG', /<link rel="icon" type="image\/svg\+xml" href="\/favicon.svg"/],
    ['favicon PNG 32', /<link rel="icon" type="image\/png" sizes="32x32" href="\/favicon-32.png"/],
    ['apple-touch-icon', /<link rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon.png"/],
    ['manifest', /<link rel="manifest" href="\/site.webmanifest"/],
    ['theme-color', /<meta name="theme-color" content="#8ed462"/],
    ['og:title', /<meta property="og:title" content="Futur Citoyen/],
    ['og:description', /<meta property="og:description" content="/],
    ['og:image', /<meta property="og:image" content="https:\/\/[^"]+\/og-image.png"/],
    ['twitter:card', /<meta name="twitter:card" content="summary_large_image"/],
  ])('déclare %s', (_label, pattern) => {
    expect(html).toMatch(pattern)
  })

  it('ne référence que des icônes présentes dans public/', () => {
    const hrefs = [...html.matchAll(/<link rel="(?:icon|apple-touch-icon|manifest)"[^>]*href="([^"]+)"/g)].map((m) => m[1])
    expect(hrefs.length).toBeGreaterThan(0)
    hrefs.forEach((href) => expect(localAsset(href), href).toBe(true))
    expect(localAsset('/og-image.png')).toBe(true)
  })

  it('a un manifest nommé Futur Citoyen avec des icônes présentes', () => {
    expect(manifest.name).toBe('Futur Citoyen')
    expect(manifest.short_name).toBe('Futur Citoyen')
    manifest.icons.forEach((icon: { src: string }) => expect(localAsset(icon.src), icon.src).toBe(true))
  })
})
