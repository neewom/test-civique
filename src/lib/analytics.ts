// Privacy-friendly visit stats with GoatCounter (no cookie, no third-party script).
// Hits go to `/count` on our own domain, which `public/_redirects` rewrites to
// https://futurcitoyen.goatcounter.com/count: the CSP stays at connect-src 'self'.
// Parameters follow GoatCounter's count.js (arp242/goatcounter, public/count.js).

// Only the production domain counts: nothing locally, on worktrees, on Netlify
// deploy previews or in tests
export const PRODUCTION_HOSTNAME = 'futurcitoyen.fr'
export const COUNT_ENDPOINT = '/count'

export const EXAM_STARTED = 'examen-commence'
export const EXAM_FINISHED_PASSED = 'examen-termine-reussi'
export const EXAM_FINISHED_NOT_YET = 'examen-termine-pas-encore'

export type AnalyticsEvent =
  | typeof EXAM_STARTED
  | typeof EXAM_FINISHED_PASSED
  | typeof EXAM_FINISHED_NOT_YET

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
    fetch(url, { method: 'POST', keepalive: true, credentials: 'omit' }).catch(() => {})
  } catch {
    // Stats must never break the app
  }
}

// Page view for a pathname (no search string: nothing personal is sent).
// Repeated calls with the same pathname are ignored.
export function trackPageView(pathname: string): void {
  if (pathname === lastPath) return
  lastPath = pathname
  const params: Record<string, string> = { p: pathname }
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
