import { describe, it, expect } from 'vitest'
import { isPassed, passThreshold, PASS_RATIO } from '@/lib/exam'

describe('seuil de réussite (80 %)', () => {
  it('vaut 80 %', () => {
    expect(PASS_RATIO).toBe(0.8)
  })

  it('demande 32 bonnes réponses sur 40', () => {
    expect(passThreshold(40)).toBe(32)
  })

  it('31/40 : pas encore réussi', () => {
    expect(isPassed(31, 40)).toBe(false)
  })

  it('32/40 : réussi', () => {
    expect(isPassed(32, 40)).toBe(true)
  })

  it('40/40 : réussi', () => {
    expect(isPassed(40, 40)).toBe(true)
  })

  it('applique 80 % du total quand total ≠ 40, arrondi au supérieur', () => {
    expect(passThreshold(20)).toBe(16)
    expect(isPassed(16, 20)).toBe(true)
    expect(isPassed(15, 20)).toBe(false)
    // 80 % de 39 = 31,2 → il faut 32 bonnes réponses
    expect(passThreshold(39)).toBe(32)
    expect(isPassed(31, 39)).toBe(false)
  })

  it('un total nul ne vaut jamais réussite', () => {
    expect(isPassed(0, 0)).toBe(false)
  })
})
