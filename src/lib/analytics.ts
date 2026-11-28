// Privacy-friendly visit stats with GoatCounter (no cookie, no third-party script).
// Hits go straight from the browser to GoatCounter (site code: futurcitoyen, only
// here), allowed by connect-src in public/_headers. No Netlify proxy: GoatCounter
// flags requests from data-centre IP ranges as bots, so proxied hits were hidden.
// Parameters follow GoatCounter's count.js (arp242/goatcounter, public/count.js).

import { PUBLIC_ROUTES } from '@/lib/seo'
import type { TitleKey } from '@/lib/target-title'

// Only the production domain counts: nothing locally, on worktrees, on Netlify
// deploy previews or in tests
export const PRODUCTION_HOSTNAME = 'futurcitoyen.fr'
export const COUNT_ENDPOINT = 'https://futurcitoyen.goatcounter.com/count'

export const EXAM_STARTED = 'examen-commence'
export const EXAM_FINISHED_PASSED = 'examen-termine-reussi'
export const EXAM_FINISHED_NOT_YET = 'examen-termine-pas-encore'

// The resident card has its own suffixed names; the multi-year permit keeps the names above
export const EXAM_STARTED_RESIDENT = 'examen-commence-resident'
export const EXAM_FINISHED_PASSED_RESIDENT = 'examen-termine-reussi-resident'
export const EXAM_FINISHED_NOT_YET_RESIDENT = 'examen-termine-pas-encore-resident'

// Naturalisation too
export const EXAM_STARTED_NATURALISATION = 'examen-commence-naturalisation'
export const EXAM_FINISHED_PASSED_NATURALISATION = 'examen-termine-reussi-naturalisation'
export const EXAM_FINISHED_NOT_YET_NATURALISATION = 'examen-termine-pas-encore-naturalisation'

export type AnalyticsEvent =
  | typeof EXAM_STARTED
  | typeof EXAM_FINISHED_PASSED
  | typeof EXAM_FINISHED_NOT_YET
  | typeof EXAM_STARTED_RESIDENT
  | typeof EXAM_FINISHED_PASSED_RESIDENT
  | typeof EXAM_FINISHED_NOT_YET_RESIDENT
  | typeof EXAM_STARTED_NATURALISATION
  | typeof EXAM_FINISHED_PASSED_NATURALISATION
  | typeof EXAM_FINISHED_NOT_YET_NATURALISATION

const EXAM_EVENTS = {
  started: { pluriannuelle: EXAM_STARTED, resident: EXAM_STARTED_RESIDENT, naturalisation: EXAM_STARTED_NATURALISATION },
  passed: {
    pluriannuelle: EXAM_FINISHED_PASSED,
    resident: EXAM_FINISHED_PASSED_RESIDENT,
    naturalisation: EXAM_FINISHED_PASSED_NATURALISATION,
  },
  notYet: {
    pluriannuelle: EXAM_FINISHED_NOT_YET,
    resident: EXAM_FINISHED_NOT_YET_RESIDENT,
    naturalisation: EXAM_FINISHED_NOT_YET_NATURALISATION,
  },
} as const satisfies Record<string, Record<TitleKey, AnalyticsEvent>>

/** Event name of an exam step for a title: suffixed for the resident card and naturalisation, not the multi-year permit. */
export function examEvent(step: keyof typeof EXAM_EVENTS, title: TitleKey): AnalyticsEvent {
  return EXAM_EVENTS[step][title]
}

// Only the routes of App.tsx are sent as they are; the exam detail is grouped (the address holds
// the exam's timestamp) and any other address (unknown address, unknown fiche) is grouped too
export const EXAM_DETAIL_PATH = '/examen/detail'
export const UNKNOWN_PATH = '/adresse-inconnue'
const KNOWN_PATHS: ReadonlySet<string> = new Set([
  '/',
  '/examen-blanc',
  '/examen',
  '/revision',
  '/examen-civique',
  '/centres',
  '/titre',
  '/mentions-legales',
])
// Fiches are counted only for the exact address (the page compares the slug case-sensitively)
// (read from seo.ts, not fiches.ts: this module is also the one of the 404 page, which must stay light;
// seo.test.ts checks that every fiche address is in seo.ts)
const FICHE_PATHS: ReadonlySet<string> = new Set(PUBLIC_ROUTES.map((r) => r.path as string).filter((p) => p.startsWith('/titres/')))

/** Path sent to GoatCounter for an address: known routes as they are, `/examen/:id` as `/examen/detail`, anything else as `/adresse-inconnue`. Trailing slash never matters; case does not matter either (the router ignores it), except for the fiches, which must match exactly. */
export function countedPath(pathname: string): string {
  const exact = pathname.replace(/\/+$/, '') || '/'
  if (FICHE_PATHS.has(exact)) return exact
  const path = exact.toLowerCase()
  if (KNOWN_PATHS.has(path)) return path
  if (/^\/examen\/[^/]+$/.test(path)) return EXAM_DETAIL_PATH
  return UNKNOWN_PATH
}

const REDIRECTED_PATHS: ReadonlySet<string> = new Set(['/regles'])

// The external referrer only makes sense for the first page view: after a SPA
// navigation, document.referrer still names the page the visitor came from
let firstPageView = true
let lastPath: string | null = null

function shouldCount(): boolean {
  return typeof window !== 'undefined' && window.location.hostname === PRODUCTION_HOSTNAME
}

// Same values as count.js: 0 = not a bot, 150+ = headless browser detected
function botScore(): number {
  return typeof navigator !== 'undefined' && navigator.webdriver ? 153 : 0
}

function send(params: Record<string, string>): void {
  try {
    if (!shouldCount()) return
    const query = new URLSearchParams({
      ...params,
      s: String(window.screen.width),
      b: String(botScore()),
      // Browsers do not always honour Cache-Control
      rnd: Math.random().toString(36).slice(2, 7),
    })
    const url = `${COUNT_ENDPOINT}?${query.toString()}`
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(url)) return
    // Simple request (no body, no header): no CORS preflight. no-cors because
    // GoatCounter's reply is never read, so a missing CORS header cannot fail it
    fetch(url, { method: 'POST', keepalive: true, credentials: 'omit', mode: 'no-cors' }).catch(() => {})
  } catch {
    // Stats must never break the app
  }
}

// Page view for a pathname (no search string: nothing personal is sent; the path is grouped by `countedPath`).
// Repeated calls with the same pathname are ignored.
export function trackPageView(pathname: string): void {
  // Old address of /examen-civique: the app redirects at once, the page view is the one of the new address
  if (REDIRECTED_PATHS.has(pathname.replace(/\/+$/, '').toLowerCase())) return
  if (pathname === lastPath) return
  lastPath = pathname
  const params: Record<string, string> = { p: countedPath(pathname) }
  if (firstPageView) {
    firstPageView = false
    try {
      if (document.referrer) params.r = document.referrer
    } catch {
      // Referrer unavailable: sent without it
    }
  }
  send(params)
}

// Named event: GoatCounter counts it with e=true and the name as path
export function trackEvent(name: AnalyticsEvent): void {
  send({ p: name, e: 'true' })
}

// Tests only: forget the previous page view
export function resetAnalyticsForTests(): void {
  firstPageView = true
  lastPath = null
}
