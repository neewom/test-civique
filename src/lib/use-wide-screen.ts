import { useSyncExternalStore } from 'react'

/**
 * Large screen (Tailwind `lg`, 64rem): the two-column layouts of the home page, the
 * revision and the exam detail. Used where a block moves to another column, so that it is
 * rendered once, in the place that matches the visual order (screen readers, keyboard,
 * tests); pure styling stays in CSS classes.
 */
export const WIDE_SCREEN_QUERY = '(min-width: 64rem)'

function getMediaQuery(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(WIDE_SCREEN_QUERY)
    : null
}

function subscribe(onChange: () => void) {
  const mq = getMediaQuery()
  mq?.addEventListener('change', onChange)
  return () => mq?.removeEventListener('change', onChange)
}

/** True from 1024 px wide (at the default text size). Without matchMedia: phone layout. */
export function useWideScreen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getMediaQuery()?.matches ?? false,
    () => false,
  )
}
