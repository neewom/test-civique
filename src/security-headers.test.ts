/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

// Netlify serves these headers once deployed; this test guards their content.
const headersFile = readFileSync(resolve(process.cwd(), 'public/_headers'), 'utf8')
const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')

function header(name: string): string | undefined {
  const line = headersFile
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.toLowerCase().startsWith(`${name.toLowerCase()}:`))
  return line?.slice(name.length + 1).trim()
}

function cspDirectives(): Map<string, string> {
  const csp = header('Content-Security-Policy') ?? ''
  return new Map(
    csp
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [name, ...values] = d.split(/\s+/)
        return [name, values.join(' ')] as [string, string]
      }),
  )
}

describe('public/_headers', () => {
  it('s\'applique à toutes les pages', () => {
    expect(headersFile).toMatch(/^\/\*$/m)
  })

  it('définit une CSP stricte', () => {
    const csp = cspDirectives()
    expect(csp.get('default-src')).toBe("'self'")
    expect(csp.get('script-src')).toBe("'self'")
    // Visit stats go straight to GoatCounter (see AGENTS.md, Stack)
    expect(csp.get('connect-src')).toBe("'self' https://futurcitoyen.goatcounter.com")
    expect(csp.get('object-src')).toBe("'none'")
    expect(csp.get('frame-ancestors')).toBe("'none'")
    expect(csp.get('base-uri')).toBe("'self'")
    expect(csp.get('form-action')).toBe("'self'")
  })

  it('ne nomme GoatCounter que dans connect-src', () => {
    const others = [...cspDirectives()].filter(([name]) => name !== 'connect-src')
    expect(others.length).toBeGreaterThan(5)
    for (const [, values] of others) expect(values).not.toContain('goatcounter')
  })

  it('n\'autorise ni script en ligne ni eval', () => {
    const csp = header('Content-Security-Policy') ?? ''
    expect(csp).not.toContain("'unsafe-eval'")
    expect(cspDirectives().get('script-src')).not.toContain("'unsafe-inline'")
  })

  it('définit les autres en-têtes de sécurité', () => {
    expect(header('X-Content-Type-Options')).toBe('nosniff')
    expect(header('X-Frame-Options')).toBe('DENY')
    expect(header('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    const permissions = header('Permissions-Policy') ?? ''
    for (const feature of ['camera', 'microphone', 'geolocation']) {
      expect(permissions).toContain(`${feature}=()`)
    }
  })
})

describe('index.html', () => {
  // script-src 'self' blocks inline scripts: every script must be a file
  it('ne contient aucun script en ligne', () => {
    const inlineScripts = [...indexHtml.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)]
    expect(inlineScripts).toHaveLength(0)
  })
})

describe('public/_headers : service worker', () => {
  it('le fichier du service worker n\'est jamais gardé par le navigateur ni le CDN', () => {
    const lines = headersFile.split('\n').map((l) => l.trim())
    const start = lines.indexOf('/sw.js')
    expect(start).toBeGreaterThan(-1)
    expect(lines[start + 1]).toBe('Cache-Control: no-cache')
  })

  it('la CSP laisse le worker se charger depuis le site seulement (worker-src retombe sur script-src \'self\')', () => {
    const csp = cspDirectives()
    expect(csp.has('worker-src')).toBe(false)
    expect(csp.has('child-src')).toBe(false)
    expect(csp.get('script-src')).toBe("'self'")
  })
})
