/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')
const indexHtml = read('index.html')
const themeInit = read('public/theme-init.js')

describe('écran de démarrage (index.html)', () => {
  const root = indexHtml.slice(indexHtml.indexOf('<div id="root">'), indexHtml.indexOf('<script type="module"'))

  it('est dans #root, caché aux lecteurs d\'écran, sans lien ni bouton ni texte de chargement', () => {
    expect(root).toContain('aria-hidden="true"')
    expect(root).not.toMatch(/<(a|button|input|img)\b/)
    expect(root).not.toMatch(/chargement|loading/i)
  })

  it('ne contient aucun style en ligne (style-src \'self\') ni script', () => {
    expect(root).not.toMatch(/\sstyle=/)
    expect(root).not.toMatch(/<script/)
  })

  it('reprend les classes de position de AppHeader et du logo (aucun saut au montage)', () => {
    const header = read('src/components/AppHeader.tsx')
    const logo = read('src/components/BrandLogo.tsx')
    // Wrapper, row, logo link, button circle
    for (const cls of [
      'mx-auto w-full max-w-[62rem] px-[22px] md:px-8 lg:px-10',
      'pt-3 pb-3 md:pt-4',
      'inline-flex min-h-11 min-w-0 items-center',
      'flex w-full items-center',
      'size-11',
    ]) {
      for (const token of cls.split(' ')) {
        expect(root, token).toContain(token)
        expect(header, token).toContain(token)
      }
    }
    for (const token of ['gap-[0.4em]', 'size-[1.25em]', 'text-[#3a7a2c]', 'dark:text-[#8ed462]']) {
      expect(root, token).toContain(token)
      expect(logo, token).toContain(token)
    }
    expect(root).toContain('Futur</span> <span')
  })
})

describe('écran de démarrage : en-tête fin de l\'examen', () => {
  it('reprend les tailles de AppHeader thin (pt-1, logo text-base, bouton 36 px)', () => {
    const header = read('src/components/AppHeader.tsx')
    for (const token of ['pt-1', 'text-base', 'size-9', 'size-4']) {
      expect(indexHtml, token).toContain(`[html[data-thin]_&]:${token}`)
      expect(header, token).toContain(token)
    }
  })
})

describe('theme-init.js : première visite', () => {
  function run(path: string, store: Record<string, string>) {
    document.documentElement.removeAttribute('data-first-visit')
    window.history.pushState({}, '', path)
    const fake = {
      getItem: (k: string) => (k in store ? store[k] : null),
    }
    Object.defineProperty(window, 'localStorage', { value: fake, configurable: true })
    new Function(themeInit)()
    return document.documentElement.hasAttribute('data-first-visit')
  }
  beforeEach(() => {
    window.matchMedia = ((q: string) => ({ matches: false, media: q })) as typeof window.matchMedia
  })

  it('pose data-first-visit sur / et /titre quand rien n\'est connu', () => {
    expect(run('/', {})).toBe(true)
    expect(run('/titre', { 'quiz-history': '[]' })).toBe(true)
  })
  it('ne le pose pas sur une autre page', () => {
    expect(run('/revision', {})).toBe(false)
    expect(run('/regles', {})).toBe(false)
  })
  it('ne le pose pas si un titre, un historique ou un examen en cours existe', () => {
    expect(run('/', { 'target-title': 'resident' })).toBe(false)
    expect(run('/', { 'quiz-history': '[{"date":"x"}]' })).toBe(false)
    expect(run('/', { 'exam-in-progress-resident': '{}' })).toBe(false)
    expect(run('/', { 'exam-in-progress': '{}' })).toBe(false)
    expect(run('/', { 'exam-in-progress-naturalisation': '{}' })).toBe(false)
  })

  it('pose data-thin sur /examen exactement', () => {
    const thin = (path: string) => {
      document.documentElement.removeAttribute('data-thin')
      run(path, {})
      return document.documentElement.hasAttribute('data-thin')
    }
    expect(thin('/examen')).toBe(true)
    expect(thin('/examen-blanc')).toBe(false)
    expect(thin('/examen/abc')).toBe(false)
    expect(thin('/')).toBe(false)
  })
})
