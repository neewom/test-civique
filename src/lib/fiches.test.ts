import { describe, it, expect } from 'vitest'
import { FICHES, FICHE_LABELS, FICHE_SLUGS, ficheUrl, titleOfSlug } from '@/lib/fiches'
import { TITLE_KEYS } from '@/lib/target-title'
import { questionsForTitle } from '@/lib/exam'

// Domaine officiel accepté (comme `src/data/sources.test.ts`) : gouv.fr et ses sous-domaines
const isOfficial = (host: string) => host === 'gouv.fr' || host.endsWith('.gouv.fr')

describe('fiches des titres', () => {
  it('chaque titre a une fiche, un libellé et une adresse /titres/<slug>', () => {
    for (const key of TITLE_KEYS) {
      expect(FICHES[key]).toBeDefined()
      expect(FICHE_LABELS[key]).toBeTruthy()
      expect(ficheUrl(key)).toBe(`/titres/${FICHE_SLUGS[key]}`)
      expect(titleOfSlug(FICHE_SLUGS[key])).toBe(key)
    }
  })

  it('une adresse inconnue ne correspond à aucun titre', () => {
    expect(titleOfSlug('inconnu')).toBeUndefined()
    expect(titleOfSlug(undefined)).toBeUndefined()
  })

  it('chaque fiche a de 1 à 3 liens officiels en https, nommés, sur un domaine accepté', () => {
    for (const key of TITLE_KEYS) {
      const { links } = FICHES[key]
      expect(links.length).toBeGreaterThanOrEqual(1)
      expect(links.length).toBeLessThanOrEqual(3)
      for (const l of links) {
        const url = new URL(l.url)
        expect(url.protocol).toBe('https:')
        expect(isOfficial(url.hostname), url.hostname).toBe(true)
        expect(l.label.trim()).not.toBe('')
      }
    }
  })

  it('chaque fiche a au plus 5 conditions', () => {
    for (const key of TITLE_KEYS) expect(FICHES[key].needs.length).toBeLessThanOrEqual(5)
  })

  it('le nombre de questions de la liste vient des données (191 et 209) ; 258 pour la naturalisation', () => {
    const official = (t: 'pluriannuelle' | 'resident') =>
      questionsForTitle(t).filter((q) => q.notion !== 'mise-en-situation').length
    expect(FICHES.pluriannuelle.examQuestions).toBe(official('pluriannuelle'))
    expect(FICHES.resident.examQuestions).toBe(official('resident'))
    expect(FICHES.pluriannuelle.examQuestions).toBe(191)
    expect(FICHES.resident.examQuestions).toBe(209)
    expect(FICHES.naturalisation.examQuestions).toBe(258)
    expect(FICHES.naturalisation.examParas.join(' ')).toContain('258 questions')
  })

  it("rien sur le coût de l'examen ni sur la validité du résultat pour la naturalisation", () => {
    for (const key of TITLE_KEYS) {
      const text = JSON.stringify(FICHES[key])
      expect(text).not.toMatch(/\b(prix|tarif|coût de l'examen)\b/i)
    }
  })
})
