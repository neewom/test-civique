import { useEffect, useState, useSyncExternalStore } from 'react'
import { cachedPackTitles, isTitleAvailable } from '@/lib/offline'
import { getLoadedPack, hasPackFailed } from '@/lib/question-packs'
import type { TitleKey } from '@/lib/target-title'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

/** True when the browser says it has no network (and again false as soon as it comes back). */
export function useOffline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false,
  )
}

/**
 * Which titles can be chosen right now. Online: all of them. Offline: those whose pack of
 * questions is on this device, read from the service worker's cache each time the connection drops.
 */
export function useTitleAvailability(): { offline: boolean; isAvailable: (title: TitleKey) => boolean } {
  const offline = useOffline()
  const [cached, setCached] = useState<TitleKey[] | null>(null)

  useEffect(() => {
    if (!offline) return
    let cancelled = false
    void cachedPackTitles().then((titles) => {
      if (!cancelled) setCached(titles)
    })
    return () => {
      cancelled = true
      setCached(null)
    }
  }, [offline])

  return {
    offline,
    isAvailable: (title) =>
      isTitleAvailable(title, {
        offline,
        cached,
        loaded: getLoadedPack(title) !== undefined,
        failed: hasPackFailed(title),
      }),
  }
}
