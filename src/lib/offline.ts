import type { TitleKey } from '@/lib/target-title'

// Offline mode: the service worker (built from sw/service-worker.template.js by
// vite-service-worker.ts) keeps the app and the pack of questions of the title in use on the
// device. This module registers it and talks to it; without service worker support (or in
// development and in the tests) every function is a harmless no-op.

const REPLY_TIMEOUT_MS = 2000

function supported(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}

// Where the worker is registered: the site, its deploy previews, and the local machine. Never the
// Tailscale host or any other server that may serve other builds from the same origin.
const WORKER_HOSTS = [/^futurcitoyen\.fr$/, /^deploy-preview-\d+--test-civique\.netlify\.app$/, /^localhost$/, /^127\.0\.0\.1$/]

export function isWorkerHost(hostname: string): boolean {
  return WORKER_HOSTS.some((re) => re.test(hostname))
}

/** Registers the service worker, once the page has loaded. Production builds on the hosts above only. */
export function registerServiceWorker(): void {
  if (!supported()) return
  if (import.meta.env.DEV) {
    // The dev server never has a worker: one left by a production build served from the same
    // address (localhost, `vite preview`) would hide the code being edited
    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
      .catch(() => {})
    return
  }
  if (!import.meta.env.PROD || !isWorkerHost(location.hostname)) return
  const register = () => {
    // A failure (private window, blocked storage) only means no offline mode
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}

async function activeWorker(): Promise<ServiceWorker | null> {
  if (!supported()) return null
  try {
    return (await navigator.serviceWorker.getRegistration())?.active ?? null
  } catch {
    return null
  }
}

/**
 * Asks the service worker to keep the pack of a title (normally the one in use, just loaded).
 * On a first visit the worker is not active yet: the request waits for it (`ready`), so the pack
 * is kept as soon as it takes over. Without any registration (development, tests) it never fires.
 */
export function keepPackOffline(title: TitleKey): void {
  if (!supported()) return
  void Promise.resolve(navigator.serviceWorker.ready)
    .then((registration) => registration?.active?.postMessage({ type: 'warm-pack', title }))
    .catch(() => {})
}

/** The titles whose pack of questions is in the service worker's cache (none without a worker). */
export async function cachedPackTitles(): Promise<TitleKey[]> {
  const worker = await activeWorker()
  if (!worker) return []
  return new Promise<TitleKey[]>((resolve) => {
    const channel = new MessageChannel()
    const timer = window.setTimeout(() => resolve([]), REPLY_TIMEOUT_MS)
    channel.port1.onmessage = (event: MessageEvent<TitleKey[]>) => {
      window.clearTimeout(timer)
      resolve(Array.isArray(event.data) ? event.data : [])
    }
    worker.postMessage({ type: 'cached-packs' }, [channel.port2])
  })
}

/**
 * Whether a title can be chosen: always when online (nothing changes); offline, only if its pack
 * is on the device (in the service worker's cache, or already loaded in memory) and did not fail
 * to load. `cached` is null while the service worker has not answered yet: nothing is greyed out
 * before it does.
 */
export function isTitleAvailable(
  title: TitleKey,
  state: { offline: boolean; cached: readonly TitleKey[] | null; loaded: boolean; failed: boolean },
): boolean {
  if (!state.offline) return true
  if (state.failed) return false
  if (state.loaded) return true
  return state.cached === null || state.cached.includes(title)
}
