// Kill switch of the service worker: NOT served by default (build only copies nothing from sw/ but
// the template). To remove the worker from every device, publish this file as /sw.js (replacing the
// generated one) in the same deploy that goes back to a version without the worker. Browsers fetch
// /sw.js (Cache-Control: no-cache) on their next visit; this worker deletes every cache and
// unregisters itself. Open pages are left alone: the next load is served by the network.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) await caches.delete(name)
      await self.registration.unregister()
    })(),
  )
})
