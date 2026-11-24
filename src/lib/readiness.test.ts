import { describe, it, expect } from 'vitest'
import { passedInARow, READY_GOAL } from '@/lib/readiness'

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
