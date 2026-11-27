import type { ListedQuestion } from '@/lib/exam'
import type { TitleKey } from '@/lib/target-title'

// The questions live in one pack per title (virtual modules cut at build time from
// src/data/questions.json by vite-question-packs.ts). A pack is imported dynamically, so it
// is a chunk of its own: no screen that needs no question downloads any.
type PackModule = { default: ListedQuestion[] }
type PackLoader = () => Promise<PackModule>

const DEFAULT_LOADERS: Record<TitleKey, PackLoader> = {
  pluriannuelle: () => import('virtual:question-pack/pluriannuelle'),
  resident: () => import('virtual:question-pack/resident'),
  naturalisation: () => import('virtual:question-pack/naturalisation'),
}

let loaders: Record<TitleKey, PackLoader> = { ...DEFAULT_LOADERS }
const loaded = new Map<TitleKey, ListedQuestion[]>()
const pending = new Map<TitleKey, Promise<ListedQuestion[]>>()
// Titles whose import failed. A browser remembers a failed dynamic import() of a URL until the page is
// reloaded (Chromium: no new request, whatever the network), so trying again in memory is useless:
// a failure sticks for this page load and only a reload (« Réessayer ») gets out of it.
const failed = new Map<TitleKey, unknown>()

/** True if the pack of a title failed to load in this page load (a reload is then the only way out). */
export function hasPackFailed(title: TitleKey): boolean {
  return failed.has(title)
}

/** The pack of a title if it is already in memory, else undefined (nothing is fetched). */
export function getLoadedPack(title: TitleKey): ListedQuestion[] | undefined {
  return loaded.get(title)
}

/**
 * Loads the pack of a title (once: later calls share the same download). A failure is kept
 * for this page load: later calls fail at once, without a new import (see `failed`).
 */
export function loadQuestionPack(title: TitleKey): Promise<ListedQuestion[]> {
  const ready = loaded.get(title)
  if (ready) return Promise.resolve(ready)
  if (failed.has(title)) return Promise.reject(failed.get(title))
  let promise = pending.get(title)
  if (!promise) {
    promise = loaders[title]().then(
      (module) => {
        loaded.set(title, module.default)
        pending.delete(title)
        return module.default
      },
      (error: unknown) => {
        pending.delete(title)
        failed.set(title, error)
        throw error
      },
    )
    pending.set(title, promise)
  }
  return promise
}

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

// The browser must be idle to start; after this delay it starts anyway (a busy phone still gets its pack)
const IDLE_TIMEOUT_MS = 4000
const FALLBACK_DELAY_MS = 1500

/**
 * Discreet preload of a pack: starts when the browser is idle (`requestIdleCallback`, else a
 * timer) and swallows a failure, which is kept: the page that needs the pack then shows the
 * failure screen at once, and its « Réessayer » reloads the page (a new import() of the same URL
 * would not even be attempted by the browser).
 * `onSettled` is called once the pack is in memory or has failed (not when cancelled before the start).
 * Returns the function that cancels it.
 */
export function preloadQuestionPack(title: TitleKey, onSettled?: () => void): () => void {
  if (loaded.has(title)) return () => {}
  const run = () => {
    loadQuestionPack(title).then(
      () => onSettled?.(),
      () => onSettled?.(),
    )
  }
  const w = window as IdleWindow
  if (typeof w.requestIdleCallback === 'function') {
    const handle = w.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS })
    return () => w.cancelIdleCallback?.(handle)
  }
  const handle = window.setTimeout(run, FALLBACK_DELAY_MS)
  return () => window.clearTimeout(handle)
}

// Tests only: replace the loader of a title (null restores the real one) and forget what is in memory
export function setQuestionPackLoaderForTests(title: TitleKey, loader: PackLoader | null): void {
  loaders = { ...loaders, [title]: loader ?? DEFAULT_LOADERS[title] }
}

export function resetQuestionPacksForTests(): void {
  loaders = { ...DEFAULT_LOADERS }
  loaded.clear()
  pending.clear()
  failed.clear()
}
