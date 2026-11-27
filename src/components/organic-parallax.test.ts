import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

// jsdom does not run scroll-driven animations: the CSS contract is checked on the source
const css = readFileSync('src/index.css', 'utf8')

describe('parallaxe des formes de fond', () => {
  it('est une animation liée au défilement, gardée par @supports, sans JavaScript', () => {
    const block = css.slice(css.indexOf('@supports (animation-timeline: scroll())'))
    expect(block).toContain("svg[data-slot='organic-background']")
    expect(block).toContain('animation-timeline: scroll(root block)')
    expect(block).toContain('translateY(15%)')
  })

  it("est coupée avec « Animations : Désactivées » (animation: none !important sur tout)", () => {
    expect(css).toMatch(/:root\[data-motion='off'\] \*,[\s\S]*?animation: none !important/)
  })
})
