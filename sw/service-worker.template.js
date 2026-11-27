// Service worker of Futur Citoyen (offline mode). This is a template: at build time,
// vite-service-worker.ts replaces the MANIFEST placeholder below with the files of the build
// and writes the result as dist/sw.js. Nothing here runs in development or in the tests.
//
// What it does:
// - precaches the app (HTML, JS, CSS, fonts, logo, icons), never the packs of questions;
// - caches a pack of questions (one per title, see vite-question-packs.ts) the first time it is
//   asked for, or when the page asks for it for the title in use (message `warm-pack`);
//   the other titles are never fetched in the background;
// - pages (index.html for every page address, the SPA fallback of public/_redirects) and the
//   precached files that are not hashed (theme-init.js, icons, manifest) go network first, then the
//   cache after NETWORK_TIMEOUT_MS or on a failure: a deploy that no longer ships this worker (a
//   rollback, another server on the same origin) is seen at the first online load, never an old
//   version for ever. Hashed files (/assets/) and the packs go cache first: their name is their version.
//   The cache is never refreshed from a network answer: index.html and what it loads stay a pair,
//   written together by the install of one version;
// - a new version installs in the background and takes over at once (skipWaiting + claim) but
//   never reloads an open page: the page in front of the user keeps running as it was, the next
//   page load gets the new version. Old caches are deleted when the new version activates.
// - when a new version installs, the packs already cached are replaced by the new ones if they changed.

const MANIFEST = '__SW_MANIFEST__'

const SHELL_CACHE = 'shell-' + MANIFEST.version
const PACKS_CACHE = 'packs'
// The title -> pack address mapping of the version that last installed, kept in the packs cache
const META_URL = '/__sw-packs.json'
const INDEX_URL = '/index.html'
const NETWORK_TIMEOUT_MS = 3000

const precached = new Set(MANIFEST.precache)
const packUrls = new Set(Object.values(MANIFEST.packs))

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE)
      // `reload`: never fill the cache from the HTTP cache (files that are not hashed)
      await shell.addAll(MANIFEST.precache.map((url) => new Request(url, { cache: 'reload' })))
      await refreshCachedPacks()
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith('shell-') && name !== SHELL_CACHE) await caches.delete(name)
      }
      const packs = await caches.open(PACKS_CACHE)
      for (const request of await packs.keys()) {
        const path = new URL(request.url).pathname
        if (path !== META_URL && !packUrls.has(path)) await packs.delete(request)
      }
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    // A page address, not a file (a path with an extension goes to the network as usual)
    if (!/\.[a-z0-9]+$/i.test(url.pathname)) event.respondWith(networkFirst(INDEX_URL, request))
    return
  }
  if (packUrls.has(url.pathname)) event.respondWith(packResponse(url.pathname, request))
  else if (precached.has(url.pathname)) {
    // A hashed file never changes under its name: cache first. The others: network first
    event.respondWith(url.pathname.startsWith('/assets/') ? cacheFirst(url.pathname, request) : networkFirst(url.pathname, request))
  }
})

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || typeof data !== 'object') return
  if (data.type === 'warm-pack' && Object.hasOwn(MANIFEST.packs, data.title)) {
    event.waitUntil(warmPack(MANIFEST.packs[data.title]))
  } else if (data.type === 'cached-packs' && event.ports[0]) {
    const port = event.ports[0]
    event.waitUntil(cachedTitles().then((titles) => port.postMessage(titles)))
  }
})

async function cacheFirst(path, request) {
  const shell = await caches.open(SHELL_CACHE)
  return (await shell.match(path)) ?? fetch(request)
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

async function networkFirst(path, request) {
  let answer = null
  try {
    answer = await withTimeout(fetch(request), NETWORK_TIMEOUT_MS)
    // A redirect (the old Netlify address) is passed on as it is
    if (answer.ok || answer.type === 'opaqueredirect') return answer
  } catch {
    // Offline, failing or too slow: the cache answers
  }
  const shell = await caches.open(SHELL_CACHE)
  return (await shell.match(path)) ?? answer ?? fetch(request)
}

async function packResponse(path, request) {
  const packs = await caches.open(PACKS_CACHE)
  const cached = await packs.match(path)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) await packs.put(path, response.clone())
  return response
}

async function warmPack(path) {
  const packs = await caches.open(PACKS_CACHE)
  if (await packs.match(path)) return
  try {
    const response = await fetch(path)
    if (response.ok) await packs.put(path, response)
  } catch {
    // Offline or failing network: nothing cached, the page goes on without
  }
}

async function cachedTitles() {
  const packs = await caches.open(PACKS_CACHE)
  const titles = []
  for (const [title, path] of Object.entries(MANIFEST.packs)) {
    if (await packs.match(path)) titles.push(title)
  }
  return titles
}

// A pack already on the device whose file changed with this version is replaced (online, since
// an update installs from the network), so the title in use stays available offline. If one
// cannot be fetched, the whole install fails: the previous version stays in charge with its own
// packs (nothing is deleted before the activation) and the next page load tries again.
async function refreshCachedPacks() {
  const packs = await caches.open(PACKS_CACHE)
  const metaResponse = await packs.match(META_URL)
  const previous = metaResponse ? await metaResponse.json().catch(() => ({})) : {}
  for (const [title, path] of Object.entries(MANIFEST.packs)) {
    const before = previous[title]
    if (before && before !== path && (await packs.match(before)) && !(await packs.match(path))) {
      const response = await fetch(path)
      if (!response.ok) throw new Error('pack ' + path + ' not available')
      await packs.put(path, response)
    }
  }
  await packs.put(META_URL, new Response(JSON.stringify(MANIFEST.packs), { headers: { 'Content-Type': 'application/json' } }))
}
