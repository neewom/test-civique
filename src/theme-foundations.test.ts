/// <reference types="node" />
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import html from '../index.html?raw'
import pkg from '../package.json'

// Read from disk: Vitest does not process CSS
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

function block(selector: string): string {
  const start = css.indexOf(`${selector} {`)
  expect(start, selector).toBeGreaterThanOrEqual(0)
  let depth = 0
  for (let i = start; i < css.length; i++) {
    if (css[i] === '{') depth++
    if (css[i] === '}' && --depth === 0) return css.slice(start, i + 1)
  }
  return css.slice(start)
}

function token(source: string, name: string) {
  return source.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim().toLowerCase()
}

describe('thème « la carte du parcours »', () => {
  const light = block(':root')
  const dark = block('.dark')

  it.each([
    ['background', '#f5f1e4', '#121814'],
    ['foreground', '#2c2e2a', '#f1eee4'],
    ['card', '#ffffff', '#1e2621'],
    ['muted-foreground', '#4b4d47', '#b9b5a9'],
    ['action', '#f5e211', '#f2de2e'],
    ['earth', '#8ed462', '#2e5a2c'],
    ['success', '#8ed462', '#2f6b2c'],
    ['coral', '#ff705d', '#ff8a78'],
    ['info', '#2ba0ff', '#5db8ff'],
    ['goal', '#ebc1ff', '#cba6e8'],
  ])('définit --%s en clair (%s) et en sombre (%s)', (name, lightValue, darkValue) => {
    expect(token(light, name)).toBe(lightValue)
    expect(token(dark, name)).toBe(darkValue)
  })

  it('inverse la sélection en sombre : fond clair, texte encre', () => {
    expect(token(light, 'primary')).toBe('#2c2e2a')
    expect(token(dark, 'primary')).toBe('#f1eee4')
    expect(token(dark, 'primary-foreground')).toBe('#121814')
  })

  it('expose les couleurs de marque à Tailwind', () => {
    const theme = block('@theme inline')
    for (const name of ['action', 'earth', 'success', 'coral', 'info', 'goal']) {
      expect(theme).toContain(`--color-${name}: var(--${name});`)
    }
  })

  it('donne des coins de 16 px aux cartes', () => {
    expect(block('@theme inline')).toMatch(/--radius-xl:\s*1rem;/)
  })
})

describe('police Atkinson Hyperlegible', () => {
  it('est auto-hébergée via @fontsource (CSP font-src \'self\'), en 400, 400 italique et 700', () => {
    expect(css).toContain('@import "@fontsource/atkinson-hyperlegible/400.css";')
    expect(css).toContain('@import "@fontsource/atkinson-hyperlegible/400-italic.css";')
    expect(css).toContain('@import "@fontsource/atkinson-hyperlegible/700.css";')
    expect(pkg.dependencies).toHaveProperty('@fontsource/atkinson-hyperlegible')
  })

  it('est la police du texte', () => {
    expect(token(block(':root'), 'sans')).toMatch(/^'atkinson hyperlegible'/)
    expect(block('@theme inline')).toMatch(/--font-sans:\s*var\(--sans\);/)
  })

  it('ne charge rien depuis Google Fonts ni Geist', () => {
    expect(css).not.toMatch(/fonts\.googleapis|fonts\.gstatic/)
    expect(html).not.toMatch(/fonts\.googleapis|fonts\.gstatic/)
    expect(css.toLowerCase()).not.toContain('geist')
    expect(JSON.stringify(pkg).toLowerCase()).not.toContain('geist')
  })
})

describe('nettoyage du gabarit Vite', () => {
  it('ne garde ni #root centré, ni text-align: center, ni les variables du gabarit', () => {
    expect(css).not.toMatch(/#root/)
    expect(css).not.toMatch(/text-align:\s*center/)
    expect(css).not.toMatch(/#social|--text-h|--accent-bg|--social-bg|--code-bg/)
    expect(css).not.toMatch(/--text:/)
  })

  it('a retiré App.css, les images et les icônes du gabarit', () => {
    for (const file of ['src/App.css', 'src/assets/react.svg', 'src/assets/vite.svg', 'src/assets/hero.png', 'public/icons.svg']) {
      expect(existsSync(resolve(process.cwd(), file)), file).toBe(false)
    }
  })
})

describe('index.html', () => {
  it('déclare la langue française', () => {
    expect(html).toMatch(/<html lang="fr">/)
  })
})
