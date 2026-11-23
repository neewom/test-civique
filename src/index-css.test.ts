/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

// Read from disk: Vitest does not process CSS, so a `?raw` import would be empty
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

// The root font size must stay relative: a size in px on :root overrides the
// text size chosen in the browser or phone settings (accessibility).
function rootBlock(source: string): string {
  const start = source.indexOf(':root {')
  let depth = 0
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') depth++
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1)
  }
  return source.slice(start)
}

describe('index.css root font size', () => {
  const root = rootBlock(css)

  it('finds the :root block', () => {
    expect(root).toContain('--sans')
  })

  it('sets no font size in px on :root, including inside media queries', () => {
    expect(root).not.toMatch(/font-size:\s*[\d.]+px/)
    expect(root).not.toMatch(/font:\s*[\d.]+px/)
  })

  it('keeps 16px by default on mobile and 18px above 1024px, as relative sizes', () => {
    expect(root).toMatch(/font:\s*100%\/145%/)
    expect(root).toMatch(/@media \(min-width: 1025px\)\s*{\s*font-size: 112\.5%;/)
  })
})
