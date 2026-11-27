import { describe, expect, it } from 'vitest'
import { TITLE_COUNTS } from '@/lib/title-counts'
import { TITLE_KEYS } from '@/lib/target-title'
import { ALL_QUESTIONS, questionsForTitle } from '@/test/questions'

describe('TITLE_COUNTS : nombres précalculés, vérifiés contre les données', () => {
  it.each(TITLE_KEYS)('« %s » : questions officielles et mises en situation', (title) => {
    const pool = questionsForTitle(title, ALL_QUESTIONS)
    expect(TITLE_COUNTS[title].official).toBe(pool.filter((q) => q.notion !== 'mise-en-situation').length)
    expect(TITLE_COUNTS[title].situational).toBe(pool.filter((q) => q.notion === 'mise-en-situation').length)
  })

  it('les trois titres : 191, 209 et 258 questions officielles', () => {
    expect(TITLE_COUNTS.pluriannuelle.official).toBe(191)
    expect(TITLE_COUNTS.resident.official).toBe(209)
    expect(TITLE_COUNTS.naturalisation.official).toBe(258)
  })
})
