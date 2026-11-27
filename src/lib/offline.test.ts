import { afterEach, describe, expect, it, vi } from 'vitest'
import { cachedPackTitles, isTitleAvailable, isWorkerHost, keepPackOffline, registerServiceWorker } from '@/lib/offline'

afterEach(() => vi.unstubAllGlobals())

describe('isTitleAvailable', () => {
  const base = { offline: false, cached: [] as const, loaded: false, failed: false }
  it('en ligne, tout titre est disponible, quoi que dise le cache', () => {
    expect(isTitleAvailable('resident', { ...base, failed: true })).toBe(true)
  })
  it('hors ligne, un titre est disponible si son paquet est en cache ou en mémoire', () => {
    expect(isTitleAvailable('resident', { ...base, offline: true, cached: ['resident'] })).toBe(true)
    expect(isTitleAvailable('resident', { ...base, offline: true, loaded: true })).toBe(true)
    expect(isTitleAvailable('resident', { ...base, offline: true, cached: ['pluriannuelle'] })).toBe(false)
  })
  it('hors ligne, un paquet dont le chargement a échoué n\'est pas disponible', () => {
    expect(isTitleAvailable('resident', { ...base, offline: true, cached: ['resident'], failed: true })).toBe(false)
  })
  it('tant que le service worker n\'a pas répondu, rien n\'est grisé', () => {
    expect(isTitleAvailable('resident', { ...base, offline: true, cached: null })).toBe(true)
  })
})

describe('dialogue avec le service worker', () => {
  it('sans service worker : aucun titre en cache, aucun envoi', async () => {
    vi.stubGlobal('navigator', {})
    await expect(cachedPackTitles()).resolves.toEqual([])
    expect(() => keepPackOffline('resident')).not.toThrow()
  })
  it('sans worker actif : aucun titre en cache', async () => {
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: () => Promise.resolve(undefined) } })
    await expect(cachedPackTitles()).resolves.toEqual([])
  })
  it('keepPackOffline demande au worker de garder le paquet du titre', async () => {
    const postMessage = vi.fn()
    vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve({ active: { postMessage } }) } })
    keepPackOffline('naturalisation')
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledWith({ type: 'warm-pack', title: 'naturalisation' }))
  })
  it('sans réponse du worker, la lecture rend une liste vide au bout d\'un délai', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('navigator', { serviceWorker: { getRegistration: () => Promise.resolve({ active: { postMessage: () => {} } }) } })
    const result = cachedPackTitles()
    await vi.advanceTimersByTimeAsync(2100)
    await expect(result).resolves.toEqual([])
    vi.useRealTimers()
  })
})

describe('hôtes où le service worker est enregistré', () => {
  it.each(['futurcitoyen.fr', 'deploy-preview-158--test-civique.netlify.app', 'localhost', '127.0.0.1'])('%s : oui', (host) => {
    expect(isWorkerHost(host)).toBe(true)
  })
  it.each([
    'test-civique.netlify.app',
    'main--test-civique.netlify.app',
    'deploy-preview-abc--test-civique.netlify.app',
    'deploy-preview-1--other.netlify.app',
    'machine.tail1234.ts.net',
    'evilfuturcitoyen.fr',
    'futurcitoyen.fr.evil.com',
    'www.futurcitoyen.fr',
    '192.168.1.20',
  ])('%s : non', (host) => {
    expect(isWorkerHost(host)).toBe(false)
  })
})

describe('en développement', () => {
  it('désinscrit tout service worker existant et n\'en enregistre aucun', async () => {
    const unregister = vi.fn(() => Promise.resolve(true))
    const register = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { serviceWorker: { getRegistrations: () => Promise.resolve([{ unregister }, { unregister }]), register } })
    registerServiceWorker()
    await vi.waitFor(() => expect(unregister).toHaveBeenCalledTimes(2))
    expect(register).not.toHaveBeenCalled()
  })
})
