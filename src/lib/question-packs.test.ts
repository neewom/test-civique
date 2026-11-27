import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { ALL_QUESTIONS } from '@/test/questions'
import {
  getLoadedPack,
  hasPackFailed,
  loadQuestionPack,
  preloadQuestionPack,
  resetQuestionPacksForTests,
  setQuestionPackLoaderForTests,
} from '@/lib/question-packs'
import { TITLE_KEYS, type TitleKey } from '@/lib/target-title'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  resetQuestionPacksForTests()
})

describe('paquets de questions : découpe au build', () => {
  it.each(TITLE_KEYS)('le paquet « %s » contient exactement les questions de cette liste', async (title) => {
    resetQuestionPacksForTests()
    const pack = await loadQuestionPack(title)
    const expected = ALL_QUESTIONS.filter((q) => q.lists.includes(title))
    expect(pack.map((q) => q.id)).toEqual(expected.map((q) => q.id))
    expect(pack).toEqual(expected)
  })

  it('une question de plusieurs titres figure dans chacun de leurs paquets, une question d’un seul titre dans le sien seulement', async () => {
    resetQuestionPacksForTests()
    const ids = Object.fromEntries(
      await Promise.all(TITLE_KEYS.map(async (t) => [t, new Set((await loadQuestionPack(t)).map((q) => q.id))] as const)),
    ) as Record<TitleKey, Set<number>>
    const multi = ALL_QUESTIONS.find((q) => q.lists.length > 1)!
    for (const t of multi.lists) expect(ids[t].has(multi.id)).toBe(true)
    const single = ALL_QUESTIONS.find((q) => q.lists.length === 1)!
    for (const t of TITLE_KEYS) expect(ids[t].has(single.id)).toBe(single.lists.includes(t))
    // Every question of the data is in at least one pack
    for (const q of ALL_QUESTIONS) expect(TITLE_KEYS.some((t) => ids[t].has(q.id))).toBe(true)
  })

  it('aucun code de l’appli (hors tests) n’importe src/data/questions.json : seuls les paquets portent les questions', () => {
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const file = path.join(dir, name)
        if (statSync(file).isDirectory()) {
          if (name !== 'test' && name !== 'data') walk(file)
        } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) {
          if (/questions\.json/.test(readFileSync(file, 'utf8').replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ''))) offenders.push(file)
        }
      }
    }
    walk(path.resolve(import.meta.dirname, '..'))
    expect(offenders).toEqual([])
  })
})

describe('loadQuestionPack', () => {
  it('ne télécharge un paquet qu’une fois, même demandé deux fois en même temps', async () => {
    resetQuestionPacksForTests()
    const loader = vi.fn(async () => ({ default: [] }))
    setQuestionPackLoaderForTests('resident', loader)
    await Promise.all([loadQuestionPack('resident'), loadQuestionPack('resident')])
    await loadQuestionPack('resident')
    expect(loader).toHaveBeenCalledTimes(1)
    expect(getLoadedPack('resident')).toEqual([])
  })

  it('ne charge que le paquet demandé', async () => {
    resetQuestionPacksForTests()
    const make = () => vi.fn(async (): Promise<{ default: never[] }> => ({ default: [] }))
    const loaders = { pluriannuelle: make(), resident: make(), naturalisation: make() } satisfies Record<TitleKey, unknown>
    for (const t of TITLE_KEYS) setQuestionPackLoaderForTests(t, loaders[t])
    await loadQuestionPack('naturalisation')
    expect(loaders.naturalisation).toHaveBeenCalledTimes(1)
    expect(loaders.pluriannuelle).not.toHaveBeenCalled()
    expect(loaders.resident).not.toHaveBeenCalled()
    expect(getLoadedPack('resident')).toBeUndefined()
  })

  it('un échec est transmis puis gardé pour cette page : plus d’import (le navigateur ne le retenterait pas), seul un rechargement en sort', async () => {
    resetQuestionPacksForTests()
    const loader = vi.fn<() => Promise<{ default: never[] }>>()
    loader.mockRejectedValueOnce(new Error('réseau')).mockResolvedValueOnce({ default: [] })
    setQuestionPackLoaderForTests('pluriannuelle', loader)
    expect(hasPackFailed('pluriannuelle')).toBe(false)
    await expect(loadQuestionPack('pluriannuelle')).rejects.toThrow('réseau')
    expect(hasPackFailed('pluriannuelle')).toBe(true)
    expect(getLoadedPack('pluriannuelle')).toBeUndefined()
    await expect(loadQuestionPack('pluriannuelle')).rejects.toThrow('réseau')
    expect(loader).toHaveBeenCalledTimes(1)
    expect(hasPackFailed('resident')).toBe(false)
  })
})

describe('preloadQuestionPack', () => {
  beforeEach(() => resetQuestionPacksForTests())

  it('attend que le navigateur soit au repos (requestIdleCallback) avant de charger', () => {
    const loader = vi.fn(async () => ({ default: [] }))
    setQuestionPackLoaderForTests('pluriannuelle', loader)
    let idle: () => void = () => {}
    vi.stubGlobal('requestIdleCallback', (cb: () => void) => {
      idle = cb
      return 1
    })
    preloadQuestionPack('pluriannuelle')
    expect(loader).not.toHaveBeenCalled()
    idle()
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('sans requestIdleCallback, repli sur un délai', () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestIdleCallback', undefined)
    const loader = vi.fn(async () => ({ default: [] }))
    setQuestionPackLoaderForTests('resident', loader)
    preloadQuestionPack('resident')
    expect(loader).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('peut être annulé, et ne fait rien si le paquet est déjà en mémoire', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestIdleCallback', undefined)
    const loader = vi.fn(async () => ({ default: [] }))
    setQuestionPackLoaderForTests('resident', loader)
    preloadQuestionPack('resident')()
    vi.runAllTimers()
    expect(loader).not.toHaveBeenCalled()
    vi.useRealTimers()
    await loadQuestionPack('resident')
    loader.mockClear()
    vi.useFakeTimers()
    preloadQuestionPack('resident')
    vi.runAllTimers()
    expect(loader).not.toHaveBeenCalled()
  })

  it('avale un échec, qui reste connu : la page qui a besoin du paquet montre l’échec tout de suite', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestIdleCallback', undefined)
    const loader = vi.fn<() => Promise<{ default: never[] }>>()
    loader.mockRejectedValue(new Error('réseau'))
    setQuestionPackLoaderForTests('naturalisation', loader)
    preloadQuestionPack('naturalisation')
    vi.runAllTimers()
    await vi.advanceTimersByTimeAsync(0)
    expect(getLoadedPack('naturalisation')).toBeUndefined()
    expect(hasPackFailed('naturalisation')).toBe(true)
    vi.useRealTimers()
    await expect(loadQuestionPack('naturalisation')).rejects.toThrow('réseau')
    expect(loader).toHaveBeenCalledTimes(1)
  })
})
