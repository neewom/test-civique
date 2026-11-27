/// <reference types="node" />
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import { buildManifest, type SwManifest } from '../vite-service-worker'

const TEMPLATE = readFileSync(path.resolve(process.cwd(), 'sw/service-worker.template.js'), 'utf8')
const PACKS = { pluriannuelle: '/assets/pluri-AAA.js', resident: '/assets/resident-BBB.js' }

// --- Manifest of a build ------------------------------------------------------------------------
function fakeDist(files: Record<string, string>): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'sw-dist-'))
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    writeFileSync(path.join(dir, name), content)
  }
  return dir
}
const DIST = {
  'index.html': '<html>',
  'theme-init.js': 'a',
  'logo.svg': '<svg/>',
  'og-image.png': 'png',
  '_headers': 'h',
  '_redirects': 'r',
  'sw.js': 'old worker',
  'assets/index-XYZ.js': 'app',
  'assets/index-XYZ.css': 'css',
  'assets/font-1.woff2': 'f2',
  'assets/font-1.woff': 'f1',
  'assets/pluri-AAA.js': 'pack1',
  'assets/resident-BBB.js': 'pack2',
}

describe('manifeste du service worker', () => {
  const manifest = buildManifest(fakeDist(DIST), PACKS, TEMPLATE)
  it('précache l\'appli, jamais les paquets de questions', () => {
    expect(manifest.precache).toEqual(
      expect.arrayContaining(['/index.html', '/theme-init.js', '/logo.svg', '/assets/index-XYZ.js', '/assets/index-XYZ.css', '/assets/font-1.woff2']),
    )
    for (const url of Object.values(PACKS)) expect(manifest.precache).not.toContain(url)
  })
  it('laisse de côté le worker lui-même, les fichiers Netlify, l\'image sociale et les polices .woff', () => {
    for (const url of ['/sw.js', '/_headers', '/_redirects', '/og-image.png', '/assets/font-1.woff']) {
      expect(manifest.precache).not.toContain(url)
    }
  })
  it('la version change quand un fichier précaché change (même sans changer de nom), pas pour un paquet seul', () => {
    const same = buildManifest(fakeDist(DIST), PACKS, TEMPLATE)
    expect(same.version).toBe(manifest.version)
    const edited = buildManifest(fakeDist({ ...DIST, 'theme-init.js': 'b' }), PACKS, TEMPLATE)
    expect(edited.version).not.toBe(manifest.version)
    const newPack = buildManifest(fakeDist(DIST), { ...PACKS, resident: '/assets/resident-CCC.js' }, TEMPLATE)
    expect(newPack.version).not.toBe(manifest.version)
  })
})

// --- The worker itself, run against in-memory caches --------------------------------------------
type Listener = (event: Record<string, unknown>) => void

function makeCaches() {
  const stores = new Map<string, Map<string, Response>>()
  const keyOf = (r: Request | string) => new URL(typeof r === 'string' ? r : r.url, 'https://app.test').pathname
  const cacheApi = (store: Map<string, Response>) => ({
    match: async (r: Request | string) => store.get(keyOf(r))?.clone(),
    put: async (r: Request | string, res: Response) => void store.set(keyOf(r), res),
    delete: async (r: Request | string) => store.delete(keyOf(r)),
    keys: async () => [...store.keys()].map((k) => new Request('https://app.test' + k)),
    addAll: async (requests: Request[]) => {
      for (const r of requests) store.set(keyOf(r), new Response('cached:' + keyOf(r)))
    },
  })
  return {
    stores,
    api: {
      open: async (name: string) => {
        if (!stores.has(name)) stores.set(name, new Map())
        return cacheApi(stores.get(name)!)
      },
      keys: async () => [...stores.keys()],
      delete: async (name: string) => stores.delete(name),
    },
  }
}

type Network = Record<string, string | (() => Promise<Response>)>

function loadWorker(manifest: SwManifest, caches = makeCaches(), network: Network = {}) {
  const listeners: Record<string, Listener> = {}
  const fetched: string[] = []
  const self = {
    location: { origin: 'https://app.test' },
    addEventListener: (type: string, fn: Listener) => (listeners[type] = fn),
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  }
  const fetchStub = async (r: Request | string) => {
    const p = new URL(typeof r === 'string' ? r : r.url, 'https://app.test').pathname
    fetched.push(p)
    const answer = network[p]
    if (typeof answer === 'function') return answer()
    return answer !== undefined ? new Response(answer) : new Response('missing', { status: 404 })
  }
  const code = TEMPLATE.replace("'__SW_MANIFEST__'", JSON.stringify(manifest))
  // In a worker, a relative URL resolves against the worker's own address
  class WorkerRequest extends Request {
    constructor(input: string | Request, init?: RequestInit) {
      super(typeof input === 'string' ? new URL(input, 'https://app.test').href : input, init)
    }
  }
  vm.runInNewContext(code, { self, caches: caches.api, fetch: fetchStub, Request: WorkerRequest, Response, URL, Object, JSON, Promise, setTimeout, clearTimeout })
  const run = async (type: string, event: Record<string, unknown> = {}) => {
    let waited: Promise<unknown> = Promise.resolve()
    listeners[type]({ waitUntil: (p: Promise<unknown>) => (waited = p), ...event })
    await waited
  }
  const request = (url: string, mode = 'cors') => {
    const r = new Request('https://app.test' + url)
    return Object.defineProperty(r, 'mode', { value: mode })
  }
  const fetchEvent = async (req: Request): Promise<Response | null> => {
    let response: Promise<Response> | null = null
    listeners.fetch({ request: req, respondWith: (p: Promise<Response>) => (response = p) })
    return response ? await response : null
  }
  return { caches, fetched, run, request, fetchEvent }
}

const MANIFEST: SwManifest = { version: 'v1', precache: ['/index.html', '/assets/app.js'], packs: PACKS }

describe('service worker : comportement', () => {
  it('à l\'installation, met l\'appli en cache sans aucun paquet', async () => {
    const w = loadWorker(MANIFEST)
    await w.run('install')
    expect([...w.caches.stores.get('shell-v1')!.keys()]).toEqual(['/index.html', '/assets/app.js'])
    expect([...(w.caches.stores.get('packs')?.keys() ?? [])]).toEqual(['/__sw-packs.json'])
    expect(w.fetched).toEqual([])
  })

  it('une page se sert du réseau d\'abord, du cache si le réseau échoue ou si la réponse est une erreur', async () => {
    const online = loadWorker(MANIFEST, undefined, { '/revision': 'from network' })
    await online.run('install')
    expect(await (await online.fetchEvent(online.request('/revision', 'navigate')))!.text()).toBe('from network')

    const down = loadWorker(MANIFEST, undefined, { '/revision': () => Promise.reject(new TypeError('offline')) })
    await down.run('install')
    for (const p of ['/', '/revision', '/examen/123']) {
      const res = await down.fetchEvent(down.request(p, 'navigate'))
      expect(await res!.text()).toBe('cached:/index.html')
    }
    // An error answer (the network says 404 or 500): the cached page
    const broken = loadWorker(MANIFEST, undefined, { '/': () => Promise.resolve(new Response('x', { status: 500 })) })
    await broken.run('install')
    expect(await (await broken.fetchEvent(broken.request('/', 'navigate')))!.text()).toBe('cached:/index.html')
  })

  it('un réseau trop lent (plus de 3 s) cède la place au cache', async () => {
    vi.useFakeTimers()
    try {
      const w = loadWorker(MANIFEST, undefined, { '/': () => new Promise<Response>(() => {}) })
      await w.run('install')
      const pending = w.fetchEvent(w.request('/', 'navigate'))
      await vi.advanceTimersByTimeAsync(3100)
      expect(await (await pending)!.text()).toBe('cached:/index.html')
    } finally {
      vi.useRealTimers()
    }
  })

  it('un déploiement sans worker (retour en arrière) s\'affiche dès le premier chargement en ligne', async () => {
    // The server answers every address with the page of the other build, /sw.js included
    const w = loadWorker(MANIFEST, undefined, { '/': 'NEW BUILD' })
    await w.run('install')
    expect(await (await w.fetchEvent(w.request('/', 'navigate')))!.text()).toBe('NEW BUILD')
  })

  it('une redirection du réseau est transmise telle quelle', async () => {
    const redirect = { type: 'opaqueredirect', ok: false, status: 0 } as unknown as Response
    const w = loadWorker(MANIFEST, undefined, { '/': () => Promise.resolve(redirect) })
    await w.run('install')
    expect(await w.fetchEvent(w.request('/', 'navigate'))).toBe(redirect)
  })

  it('les fichiers précachés non hachés vont réseau d\'abord, les fichiers hachés de /assets/ cache d\'abord', async () => {
    const manifest = { ...MANIFEST, precache: ['/index.html', '/assets/app.js', '/theme-init.js'] }
    const w = loadWorker(manifest, undefined, { '/theme-init.js': 'fresh', '/assets/app.js': 'network app' })
    await w.run('install')
    expect(await (await w.fetchEvent(w.request('/theme-init.js')))!.text()).toBe('fresh')
    expect(await (await w.fetchEvent(w.request('/assets/app.js')))!.text()).toBe('cached:/assets/app.js')
    const down = loadWorker(manifest, undefined, { '/theme-init.js': () => Promise.reject(new TypeError('offline')) })
    await down.run('install')
    expect(await (await down.fetchEvent(down.request('/theme-init.js')))!.text()).toBe('cached:/theme-init.js')
  })

  it('la réponse du réseau ne remplace jamais index.html en cache (il reste le pendant des fichiers précachés)', async () => {
    const w = loadWorker(MANIFEST, undefined, { '/': 'NEW' })
    await w.run('install')
    await w.fetchEvent(w.request('/', 'navigate'))
    expect(await w.caches.stores.get('shell-v1')!.get('/index.html')!.text()).toBe('cached:/index.html')
  })

  it('laisse passer ce qu\'elle ne connaît pas (autre origine, POST, fichier inconnu, navigation vers un fichier)', async () => {
    const w = loadWorker(MANIFEST)
    await w.run('install')
    expect(await w.fetchEvent(new Request('https://goatcounter.example/count'))).toBeNull()
    expect(await w.fetchEvent(new Request('https://app.test/assets/app.js', { method: 'POST' }))).toBeNull()
    expect(await w.fetchEvent(w.request('/assets/unknown.js'))).toBeNull()
    expect(await w.fetchEvent(w.request('/logo.svg', 'navigate'))).toBeNull()
  })

  it('un paquet se met en cache à la première demande puis se sert du cache', async () => {
    const w = loadWorker(MANIFEST, undefined, { '/assets/pluri-AAA.js': 'pack1' })
    await w.run('install')
    expect(await (await w.fetchEvent(w.request(PACKS.pluriannuelle)))!.text()).toBe('pack1')
    expect(w.fetched).toEqual([PACKS.pluriannuelle])
    expect(await (await w.fetchEvent(w.request(PACKS.pluriannuelle)))!.text()).toBe('pack1')
    expect(w.fetched).toHaveLength(1)
  })

  it('une réponse en erreur n\'est pas mise en cache', async () => {
    const w = loadWorker(MANIFEST)
    await w.run('install')
    expect((await w.fetchEvent(w.request(PACKS.resident)))!.status).toBe(404)
    expect(w.caches.stores.get('packs')!.has(PACKS.resident)).toBe(false)
  })

  it('« warm-pack » garde le paquet du titre demandé seulement, et « cached-packs » dit lesquels sont en cache', async () => {
    const w = loadWorker(MANIFEST, undefined, { [PACKS.pluriannuelle]: 'pack1', [PACKS.resident]: 'pack2' })
    await w.run('install')
    await w.run('message', { data: { type: 'warm-pack', title: 'pluriannuelle' } })
    await w.run('message', { data: { type: 'warm-pack', title: 'inconnu' } })
    expect(w.fetched).toEqual([PACKS.pluriannuelle])
    const replies: unknown[] = []
    await w.run('message', { data: { type: 'cached-packs' }, ports: [{ postMessage: (m: unknown) => replies.push(m) }] })
    expect(replies).toEqual([['pluriannuelle']])
  })

  it('si le nouveau paquet d\'un titre en cache ne peut pas être récupéré, l\'installation échoue et rien n\'est perdu', async () => {
    const caches = makeCaches()
    const v1 = loadWorker(MANIFEST, caches, { [PACKS.pluriannuelle]: 'pack1' })
    await v1.run('install')
    await v1.run('activate')
    await v1.run('message', { data: { type: 'warm-pack', title: 'pluriannuelle' } })
    const v2 = loadWorker(
      { version: 'v2', precache: ['/index.html'], packs: { ...PACKS, pluriannuelle: '/assets/pluri-NEW.js' } },
      caches,
      { '/assets/pluri-NEW.js': () => Promise.reject(new TypeError('network lost')) },
    )
    await expect(v2.run('install')).rejects.toThrow()
    // The ancien pack and the record of the previous version are still there
    expect(caches.stores.get('packs')!.has(PACKS.pluriannuelle)).toBe(true)
    expect(JSON.parse(await caches.stores.get('packs')!.get('/__sw-packs.json')!.text())).toEqual(PACKS)
    expect(caches.stores.has('shell-v1')).toBe(true)
  })

  it('une nouvelle version remplace les anciens caches et les paquets périmés, sans toucher à ceux qui restent', async () => {
    const caches = makeCaches()
    const network = { [PACKS.pluriannuelle]: 'pack1', [PACKS.resident]: 'pack2', '/assets/pluri-NEW.js': 'pack1-new' }
    const v1 = loadWorker(MANIFEST, caches, network)
    await v1.run('install')
    await v1.run('activate')
    await v1.run('message', { data: { type: 'warm-pack', title: 'pluriannuelle' } })
    await v1.run('message', { data: { type: 'warm-pack', title: 'resident' } })

    // Version 2: the multi-year pack changed, the resident one did not
    const v2 = loadWorker(
      { version: 'v2', precache: ['/index.html'], packs: { ...PACKS, pluriannuelle: '/assets/pluri-NEW.js' } },
      caches,
      network,
    )
    await v2.run('install')
    // The pack already on the device is replaced by its new file; the title not cached is not fetched
    expect(v2.fetched).toEqual(['/assets/pluri-NEW.js'])
    await v2.run('activate')
    expect([...caches.stores.keys()].sort()).toEqual(['packs', 'shell-v2'])
    expect([...caches.stores.get('packs')!.keys()].sort()).toEqual(['/__sw-packs.json', PACKS.resident, '/assets/pluri-NEW.js'].sort())
  })

  it('ne recharge jamais une page ouverte : aucune demande de rechargement dans le worker', () => {
    expect(TEMPLATE).not.toMatch(/\.navigate\(|location\.reload/)
  })
})
