import { describe, it, expect } from 'vitest'
import { journeyMessage, passedInARow, READY_GOAL } from '@/lib/readiness'

const e = (score: number, total = 40) => ({ score, total })

describe('passedInARow', () => {
  it('vaut 0 sans historique', () => {
    expect(passedInARow([])).toBe(0)
  })

  it('compte depuis l\'examen le plus récent (fin de liste)', () => {
    expect(passedInARow([e(10), e(32), e(40)])).toBe(2)
  })

  it('un échec récent remet à 0', () => {
    expect(passedInARow([e(40), e(40), e(31)])).toBe(0)
  })

  it('31/40 n\'est pas une réussite, 32/40 l\'est', () => {
    expect(passedInARow([e(31)])).toBe(0)
    expect(passedInARow([e(32)])).toBe(1)
  })

  it('est plafonné à l\'objectif', () => {
    expect(READY_GOAL).toBe(3)
    expect(passedInARow([e(40), e(40), e(40), e(40), e(40)])).toBe(3)
  })

  it('un examen de total nul ne compte pas comme réussi', () => {
    expect(passedInARow([e(0, 0)])).toBe(0)
  })
})

describe('journeyMessage', () => {
  it('première, deuxième puis troisième réussite d\'affilée', () => {
    expect(journeyMessage(true, 1, 0)).toBe("Première réussite. Encore deux d'affilée, et vous êtes prêt(e) pour le jour J.")
    expect(journeyMessage(true, 2, 1)).toBe("Deuxième réussite d'affilée. Encore une, et vous êtes prêt(e) pour le jour J.")
    expect(journeyMessage(true, 3, 2)).toBe("Trois réussites d'affilée : vous êtes prêt(e) pour le jour J.")
  })

  it('au-delà de 3 réussites (compteur plafonné), reste vrai', () => {
    expect(journeyMessage(true, READY_GOAL, READY_GOAL)).toBe("Trois réussites d'affilée : vous êtes prêt(e) pour le jour J.")
  })

  it('un échec qui remet le compteur à 0 est dit avec un message rassurant', () => {
    expect(journeyMessage(false, 0, 2)).toMatch(/^Le compteur repart à 0 sur 3/)
  })

  it('un échec ne parle jamais de bon résultat ni de réussite', () => {
    for (const previous of [0, 1, 2, 3]) {
      const message = journeyMessage(false, 0, previous)
      expect(message).not.toMatch(/Bon résultat|réussite|prêt/)
    }
  })
})
