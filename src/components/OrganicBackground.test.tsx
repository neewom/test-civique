import { render } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { OrganicBackground } from '@/components/OrganicBackground'

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? reduce : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  document.dispatchEvent(new Event('visibilitychange'))
}

// jsdom implements neither SMIL nor pauseAnimations: they are added on the prototype
function spyOnSmil() {
  const proto = SVGSVGElement.prototype as SVGSVGElement & Record<string, unknown>
  const pause = vi.fn()
  const unpause = vi.fn()
  proto.pauseAnimations = pause
  proto.unpauseAnimations = unpause
  return { pause, unpause }
}

describe('OrganicBackground', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setHidden(false)
  })

  it('est décoratif : caché aux lecteurs d\'écran, sans interaction', () => {
    mockReducedMotion(false)
    const { container } = render(<OrganicBackground />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveClass('pointer-events-none')
    expect(container.querySelector('path')).toHaveClass('fill-earth')
  })

  it('respire lentement, en cycle de 26 à 32 s qui revient à sa forme de départ', () => {
    mockReducedMotion(false)
    const { container } = render(<OrganicBackground />)
    const animate = container.querySelector('animate')!
    expect(animate).not.toBeNull()
    const seconds = parseFloat(animate.getAttribute('dur')!)
    expect(seconds).toBeGreaterThanOrEqual(26)
    expect(seconds).toBeLessThanOrEqual(32)
    const values = animate.getAttribute('values')!.split(';')
    expect(values[0]).toBe(values[values.length - 1])
    expect(values[0]).toBe(container.querySelector('path')!.getAttribute('d'))
  })

  it('a deux formes, chacune dans la plage de durée', () => {
    mockReducedMotion(false)
    const { container } = render(<OrganicBackground shape="crest" />)
    const seconds = parseFloat(container.querySelector('animate')!.getAttribute('dur')!)
    expect(seconds).toBeGreaterThanOrEqual(26)
    expect(seconds).toBeLessThanOrEqual(32)
  })

  it('reste immobile quand l\'appareil demande moins d\'animations', () => {
    mockReducedMotion(true)
    const { container } = render(<OrganicBackground />)
    expect(container.querySelector('path')).not.toBeNull()
    expect(container.querySelector('animate')).toBeNull()
  })

  it('reste immobile si le navigateur ne sait pas dire sa préférence', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { container } = render(<OrganicBackground />)
    expect(container.querySelector('animate')).toBeNull()
  })

  it('se met en pause quand l\'onglet est caché et reprend quand il revient', () => {
    mockReducedMotion(false)
    const { pause, unpause } = spyOnSmil()
    render(<OrganicBackground />)
    pause.mockClear()
    unpause.mockClear()
    setHidden(true)
    expect(pause).toHaveBeenCalledOnce()
    setHidden(false)
    expect(unpause).toHaveBeenCalledOnce()
  })

  it('cesse d\'écouter la visibilité une fois démonté', () => {
    mockReducedMotion(false)
    const { pause } = spyOnSmil()
    const { unmount } = render(<OrganicBackground />)
    unmount()
    pause.mockClear()
    setHidden(true)
    expect(pause).not.toHaveBeenCalled()
  })
})

describe('OrganicBackground — formes des pages titre et règles', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    ['goal', 'fill-goal'],
    ['info', 'fill-info'],
  ] as const)('la forme %s a sa couleur et respire entre 26 et 32 s', (shape, fill) => {
    mockReducedMotion(false)
    const { container } = render(<OrganicBackground shape={shape} />)
    expect(container.querySelector('path')).toHaveClass(fill)
    const seconds = parseFloat(container.querySelector('animate')!.getAttribute('dur')!)
    expect(seconds).toBeGreaterThanOrEqual(26)
    expect(seconds).toBeLessThanOrEqual(32)
  })
})
