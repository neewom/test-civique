import { describe, it, expect } from 'vitest'
import allQuestions from './questions.json'
import type { Question } from '@/lib/exam'

// Sources acceptées pour justifier une réponse (docs/verificateur-contenu.md) :
// sites officiels seulement, jamais Wikipédia, un blog ou un site de préparation.
// Un domaine accepte aussi ses sous-domaines (ex. www.elysee.fr, code.travail.gouv.fr).
const ACCEPTED_DOMAINS = [
  'gouv.fr',
  'service-public.fr',
  'vie-publique.fr',
  'elysee.fr',
  'assemblee-nationale.fr',
  'senat.fr',
  'conseil-constitutionnel.fr',
  'europa.eu',
  // Commission d'accès aux documents administratifs (autorité administrative indépendante)
  'cada.fr',
  // Assurance maladie, site officiel de la CNAM
  'ameli.fr',
  // Insee, institut public de la statistique (seule source officielle sur la fréquentation touristique par département)
  'insee.fr',
]

function isAcceptedSourceUrl(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false
  const host = parsed.hostname
  return ACCEPTED_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`))
}

const questions = allQuestions as Question[]
const withSource = questions.filter((q) => q.source !== undefined)

describe('question sources', () => {
  it('every source is an https URL on an accepted official domain', () => {
    const outliers = withSource.filter((q) => !isAcceptedSourceUrl(q.source!.url))
    expect(outliers.map((q) => `${q.id}: ${q.source!.url}`)).toEqual([])
  })

  it('every source has a non-empty label', () => {
    const outliers = withSource.filter((q) => typeof q.source!.label !== 'string' || q.source!.label.trim() === '')
    expect(outliers.map((q) => q.id)).toEqual([])
  })

  it('rejects http, look-alike and unofficial domains', () => {
    expect(isAcceptedSourceUrl('https://www.service-public.gouv.fr/particuliers/vosdroits/F3132')).toBe(true)
    expect(isAcceptedSourceUrl('http://www.elysee.fr/')).toBe(false)
    expect(isAcceptedSourceUrl('https://fr.wikipedia.org/wiki/Marianne')).toBe(false)
    expect(isAcceptedSourceUrl('https://faux-gouv.fr/page')).toBe(false)
    expect(isAcceptedSourceUrl('https://elysee.fr.example.com/')).toBe(false)
    expect(isAcceptedSourceUrl('pas une url')).toBe(false)
  })
})
