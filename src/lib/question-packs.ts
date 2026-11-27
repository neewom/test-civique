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

/** The pack of a title if it is already in memory, else undefined (nothing is fetched). */
export function getLoadedPack(title: TitleKey): ListedQuestion[] | undefined {
  return loaded.get(title)
}

/**
 * Loads the pack of a title (once: later calls share the same download). A failed load is
 * forgotten, so that calling again tries again.
 */
export function loadQuestionPack(title: TitleKey): Promise<ListedQuestion[]> {
  const ready = loaded.get(title)
  if (ready) return Promise.resolve(ready)
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
 * timer) and swallows a failure (the page that needs the pack tries again and shows the error).
 * Returns the function that cancels it.
 */
export function preloadQuestionPack(title: TitleKey): () => void {
  if (loaded.has(title)) return () => {}
  const run = () => {
    loadQuestionPack(title).catch(() => {})
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
}
