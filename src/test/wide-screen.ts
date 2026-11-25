import { vi } from 'vitest'
import { WIDE_SCREEN_QUERY } from '@/lib/use-wide-screen'

/**
 * Pretends the screen is at least 1024 px wide (jsdom has no matchMedia: phone layout by
 * default). Undone by `vi.unstubAllGlobals()`.
 */
export function stubWideScreen(wide = true) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: wide && query === WIDE_SCREEN_QUERY,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
}
