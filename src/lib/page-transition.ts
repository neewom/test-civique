import { currentMotion } from '@/lib/motion'

/**
 * Page transitions (View Transitions API, variant B: the content slides, the
 * background shapes cross-fade in place, the header stays put).
 *
 * Depth of a page in the journey: 0 = title choice (`/titre`), 1 = home,
 * 2 = side pages (revision, rules, legal notice), 3 = exam and exam detail.
 * Going deeper slides the old page to the left; going up, the other way round.
 */
export type TransitionDirection = 'forward' | 'back'

export function pageDepth(pathname: string): number {
  if (pathname === '/titre') return 0
  if (pathname === '/') return 1
  if (pathname === '/examen' || pathname.startsWith('/examen/')) return 3
  return 2
}

/** Same depth: a push goes forward, a browser back/forward (POP) goes back. */
export function transitionDirection(
  from: string,
  to: string,
  navigationType: 'PUSH' | 'POP' | 'REPLACE',
): TransitionDirection {
  const a = pageDepth(from)
  const b = pageDepth(to)
  return b < a || (b === a && navigationType === 'POP') ? 'back' : 'forward'
}

/** iPhone / iPad Safari (iPadOS reports itself as a Mac with touch points). */
function isIosWebKit(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

let inAppBack = false

/**
 * Call right before the app itself goes back (`navigate(-1)` from a "Retour" button):
 * that POP is not the browser's back gesture, so it must animate even on iOS.
 * The mark is consumed by the next navigation decision.
 */
export function markInAppBack(): void {
  inAppBack = true
}

/**
 * Whether a change of location gets a transition: only to another path (not between
 * two exam questions), with animations on, with the API available, and never on a
 * browser back/forward on iOS (unless the app marked it with `markInAppBack`), where the swipe-back gesture already animates.
 */
export function shouldAnimateNavigation(
  from: string,
  to: string,
  navigationType: 'PUSH' | 'POP' | 'REPLACE',
): boolean {
  const markedBack = inAppBack
  inAppBack = false
  if (from === to) return false
  if (currentMotion() === 'off') return false
  if (typeof document.startViewTransition !== 'function') return false
  if (navigationType === 'POP' && !markedBack && isIosWebKit()) return false
  return true
}
