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
    expect(csp.get('connect-src')).toBe("'self'")
    expect(csp.get('object-src')).toBe("'none'")
    expect(csp.get('frame-ancestors')).toBe("'none'")
    expect(csp.get('base-uri')).toBe("'self'")
    expect(csp.get('form-action')).toBe("'self'")
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
