// @vitest-environment-options { "url": "https://futurcitoyen.fr/" }
import { render, fireEvent, screen } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  trackPageView,
  trackEvent,
  resetAnalyticsForTests,
  EXAM_STARTED,
  EXAM_FINISHED_PASSED,
  EXAM_FINISHED_NOT_YET,
} from './analytics'
import { PageViewTracker } from '@/components/PageViewTracker'

let beacon: ReturnType<typeof vi.fn>

function stubBeacon(impl: () => boolean = () => true) {
  beacon = vi.fn(impl)
  Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true, writable: true })
}

function sentUrls(): URL[] {
  return beacon.mock.calls.map(([url]) => new URL(String(url), window.location.origin))
}

function setHostname(hostname: string) {
  vi.stubGlobal('location', { ...window.location, hostname, origin: `https://${hostname}` })
}

beforeEach(() => {
  resetAnalyticsForTests()
  stubBeacon()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('analytics — production (futurcitoyen.fr)', () => {
  it('envoie une page vue à /count avec les paramètres GoatCounter', () => {
    trackPageView('/revision')
    expect(beacon).toHaveBeenCalledTimes(1)
    const [url] = sentUrls()
    expect(url.origin).toBe('https://futurcitoyen.fr')
    expect(url.pathname).toBe('/count')
    expect(url.searchParams.get('p')).toBe('/revision')
    expect(url.searchParams.get('s')).toBe(String(window.screen.width))
    expect(url.searchParams.get('b')).toBe('0')
    expect(url.searchParams.get('rnd')).toMatch(/^[a-z0-9]{1,5}$/)
    expect(url.searchParams.has('e')).toBe(false)
  })

  it("n'envoie le référent qu'à la première page vue", () => {
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('https://www.google.com/')
    trackPageView('/')
    trackPageView('/regles')
    const [first, second] = sentUrls()
    expect(first.searchParams.get('r')).toBe('https://www.google.com/')
    expect(second.searchParams.has('r')).toBe(false)
  })

  it("n'envoie pas deux fois le même chemin d'affilée, mais recompte un retour", () => {
    trackPageView('/')
    trackPageView('/')
    trackPageView('/revision')
    trackPageView('/')
    expect(sentUrls().map((u) => u.searchParams.get('p'))).toEqual(['/', '/revision', '/'])
  })

  it.each([EXAM_STARTED, EXAM_FINISHED_PASSED, EXAM_FINISHED_NOT_YET] as const)(
    'envoie l’événement %s avec e=true',
    (name) => {
      trackEvent(name)
      const [url] = sentUrls()
      expect(url.pathname).toBe('/count')
      expect(url.searchParams.get('p')).toBe(name)
      expect(url.searchParams.get('e')).toBe('true')
    },
  )

  it('signale un navigateur piloté (navigator.webdriver) comme le fait count.js', () => {
    Object.defineProperty(navigator, 'webdriver', { get: () => true, configurable: true })
    try {
      trackPageView('/')
      expect(sentUrls()[0].searchParams.get('b')).toBe('153')
    } finally {
      Reflect.deleteProperty(navigator, 'webdriver')
    }
  })

  it('se replie sur fetch keepalive quand sendBeacon refuse', () => {
    stubBeacon(() => false)
    const fetchMock = vi.fn(() => Promise.resolve(new Response()))
    vi.stubGlobal('fetch', fetchMock)
    trackEvent(EXAM_STARTED)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url.startsWith('/count?')).toBe(true)
    expect(init).toMatchObject({ method: 'POST', keepalive: true })
  })

  it('avale les erreurs : sendBeacon qui lève, fetch rejeté', async () => {
    stubBeacon(() => {
      throw new Error('blocked')
    })
    expect(() => trackPageView('/')).not.toThrow()
    stubBeacon(() => false)
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    expect(() => trackEvent(EXAM_STARTED)).not.toThrow()
    await Promise.resolve()
  })

  it('fonctionne sans sendBeacon', () => {
    Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true, writable: true })
    const fetchMock = vi.fn(() => Promise.resolve(new Response()))
    vi.stubGlobal('fetch', fetchMock)
    trackPageView('/')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('analytics — hors production', () => {
  it.each(['localhost', '127.0.0.1', 'mac-mini-de-vichith.tail5a5a34.ts.net', 'deploy-preview-62--test-civique.netlify.app', 'test-civique.netlify.app', 'www.futurcitoyen.fr'])(
    "n'envoie rien sur %s",
    (hostname) => {
      setHostname(hostname)
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)
      trackPageView('/')
      trackEvent(EXAM_STARTED)
      expect(beacon).not.toHaveBeenCalled()
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )
})

function Navigator() {
  const navigate = useNavigate()
  return (
    <>
      <button onClick={() => navigate('/revision')}>Révision</button>
      <button onClick={() => navigate('/revision?theme=1', { state: { a: 1 } })}>Même page</button>
      <button onClick={() => navigate('/')}>Accueil</button>
    </>
  )
}

describe('PageViewTracker', () => {
  it('envoie une page vue au chargement et à chaque nouveau chemin, pas sur un changement de recherche ou d’état', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <PageViewTracker />
        <Navigator />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Révision' }))
    fireEvent.click(screen.getByRole('button', { name: 'Même page' }))
    fireEvent.click(screen.getByRole('button', { name: 'Accueil' }))
    expect(sentUrls().map((u) => u.searchParams.get('p'))).toEqual(['/', '/revision', '/'])
  })

  it("n'envoie pas la chaîne de recherche", () => {
    render(
      <MemoryRouter initialEntries={['/revision?theme=1']}>
        <PageViewTracker />
      </MemoryRouter>,
    )
    expect(sentUrls()[0].searchParams.get('p')).toBe('/revision')
  })
})
