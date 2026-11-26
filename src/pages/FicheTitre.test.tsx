import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import FicheTitre from './FicheTitre'
import { resetTargetTitleForTests } from '@/lib/target-title'
import { ThemeProvider } from '@/components/ThemeProvider'

function makeLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
}
const ls = makeLocalStorageMock()

beforeEach(() => {
  vi.stubGlobal('localStorage', ls)
  ls.clear()
  resetTargetTitleForTests()
})
afterEach(() => {
  vi.unstubAllGlobals()
})

function Probe() {
  const location = useLocation()
  return <p data-testid="location">{location.pathname}</p>
}

function renderFiche(path: string, from?: string) {
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={from ? [from, path] : [path]} initialIndex={from ? 1 : 0}>
        <Routes>
          <Route path="/titres/:slug" element={<FicheTitre />} />
          <Route path="/titre" element={<><p>Écran du titre</p><Probe /></>} />
          <Route path="/" element={<><p>Accueil</p><Probe /></>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('Fiche d\'un titre', () => {
  it('carte de séjour pluriannuelle : contenu clé, titre d\'onglet, examen commun', () => {
    renderFiche('/titres/carte-de-sejour-pluriannuelle')
    expect(screen.getByRole('heading', { level: 1, name: 'Carte de séjour pluriannuelle' })).toBeInTheDocument()
    expect(document.title).toBe('Carte de séjour pluriannuelle · Futur Citoyen')
    expect(screen.getByText('Elle dure en général 4 ans.')).toBeInTheDocument()
    expect(screen.getByText(/niveau A2/)).toBeInTheDocument()
    expect(screen.getByText(/plus de 65 ans/)).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getByText('45 min')).toBeInTheDocument()
    expect(screen.getByText('32/40')).toBeInTheDocument()
    expect(screen.getByText('191')).toBeInTheDocument()
    expect(screen.getByText(/vérifiez sur service-public\.gouv\.fr/i)).toBeInTheDocument()
  })

  it('carte de résident : 10 ans, niveau B1, 209 questions', () => {
    renderFiche('/titres/carte-de-resident')
    expect(screen.getByRole('heading', { level: 1, name: 'Carte de résident' })).toBeInTheDocument()
    expect(screen.getByText(/Elle dure 10 ans/)).toBeInTheDocument()
    expect(screen.getByText(/niveau B1/)).toBeInTheDocument()
    expect(screen.getByText('209')).toBeInTheDocument()
  })

  it('naturalisation : niveau B2, 258 questions, rien sur le coût de l\'examen', () => {
    renderFiche('/titres/naturalisation')
    expect(screen.getByRole('heading', { level: 1, name: 'Naturalisation' })).toBeInTheDocument()
    expect(screen.getByText(/niveau B2/)).toBeInTheDocument()
    expect(screen.getByText('258')).toBeInTheDocument()
    expect(screen.getByText(/258 questions de connaissance/)).toBeInTheDocument()
    expect(screen.getByText(/Le dossier coûte 255 €/)).toBeInTheDocument()
  })

  it('liens officiels : https, nouvel onglet, mention lue aux lecteurs d\'écran', () => {
    renderFiche('/titres/carte-de-resident')
    const section = screen.getByRole('region', { name: 'Pour aller plus loin' })
    const links = within(section).getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(1)
    for (const a of links) {
      expect(a.getAttribute('href')).toMatch(/^https:\/\//)
      expect(a).toHaveAttribute('target', '_blank')
      expect(a.getAttribute('rel')).toContain('noopener')
      expect(a).toHaveTextContent('(nouvel onglet)')
    }
  })

  it('adresse inconnue : retour à l\'accueil', () => {
    renderFiche('/titres/inconnu')
    expect(screen.getByText('Accueil')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })

  describe('bouton d\'action', () => {
    it('« M\'entraîner pour ce titre » enregistre le titre et mène à l\'accueil, sans toucher aux autres données', () => {
      ls.setItem('quiz-history', '[]')
      renderFiche('/titres/carte-de-resident')
      fireEvent.click(screen.getByRole('button', { name: "M'entraîner pour ce titre" }))
      expect(ls.getItem('target-title')).toBe('resident')
      expect(ls.getItem('quiz-history')).toBe('[]')
      expect(screen.getByText('Accueil')).toBeInTheDocument()
    })

    it('le bouton est avant « Ce qu\'il faut » (en haut de la fiche)', () => {
      renderFiche('/titres/carte-de-resident')
      const button = screen.getByRole('button', { name: "M'entraîner pour ce titre" })
      const needs = screen.getByRole('heading', { name: "Ce qu'il faut" })
      expect(button.compareDocumentPosition(needs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('« Continuer mon entraînement » quand c\'est déjà le titre choisi, sans changer le choix', () => {
      ls.setItem('target-title', 'pluriannuelle')
      renderFiche('/titres/carte-de-sejour-pluriannuelle')
      expect(screen.queryByRole('button', { name: "M'entraîner pour ce titre" })).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Continuer mon entraînement' }))
      expect(ls.getItem('target-title')).toBe('pluriannuelle')
      expect(screen.getByText('Accueil')).toBeInTheDocument()
    })

    it('ancien utilisateur sans titre enregistré (historique) : « Continuer mon entraînement » sur la pluriannuelle', () => {
      ls.setItem('quiz-history', JSON.stringify([{ date: '2026-11-20T10:00:00.000Z', score: 30, total: 40 }]))
      renderFiche('/titres/carte-de-sejour-pluriannuelle')
      expect(screen.getByRole('button', { name: 'Continuer mon entraînement' })).toBeInTheDocument()
      renderFiche('/titres/carte-de-resident')
      expect(screen.getByRole('button', { name: "M'entraîner pour ce titre" })).toBeInTheDocument()
    })

    it('ancien utilisateur sans titre enregistré (examen en cours) : « Continuer mon entraînement » sur la pluriannuelle', () => {
      ls.setItem('exam-in-progress', JSON.stringify({
        questions: [{ id: 1, theme: 'T', question: 'Q ?', answer: 'A', explanation: 'E', choices: ['A', 'B', 'C', 'D'] }],
        index: 0,
        answers: [],
        timeLeft: 100,
        startedAt: '2026-11-20T10:00:00.000Z',
      }))
      renderFiche('/titres/carte-de-sejour-pluriannuelle')
      expect(screen.getByRole('button', { name: 'Continuer mon entraînement' })).toBeInTheDocument()
    })

    it('libellé « M\'entraîner » quand un autre titre est choisi', () => {
      ls.setItem('target-title', 'resident')
      renderFiche('/titres/carte-de-sejour-pluriannuelle')
      fireEvent.click(screen.getByRole('button', { name: "M'entraîner pour ce titre" }))
      expect(ls.getItem('target-title')).toBe('pluriannuelle')
    })

    it('première visite : le bouton enregistre le premier titre', () => {
      renderFiche('/titres/carte-de-resident', '/titre')
      expect(ls.getItem('target-title')).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: "M'entraîner pour ce titre" }))
      expect(ls.getItem('target-title')).toBe('resident')
    })

    it('premier passage : le bouton remplace l\'entrée (le retour arrière ne revient pas à la fiche)', () => {
      function Back() {
        const navigate = useNavigate()
        return <button onClick={() => navigate(-1)}>Précédent</button>
      }
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/titre', '/titres/carte-de-resident']} initialIndex={1}>
            <Routes>
              <Route path="/titres/:slug" element={<FicheTitre />} />
              <Route path="/titre" element={<p>Écran du titre</p>} />
              <Route path="/" element={<Back />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>,
      )
      fireEvent.click(screen.getByRole('button', { name: "M'entraîner pour ce titre" }))
      fireEvent.click(screen.getByRole('button', { name: 'Précédent' }))
      expect(screen.getByText('Écran du titre')).toBeInTheDocument()
    })

    it('titre déjà connu : navigation normale (le retour arrière revient à la fiche)', () => {
      ls.setItem('target-title', 'pluriannuelle')
      function Back() {
        const navigate = useNavigate()
        return <button onClick={() => navigate(-1)}>Précédent</button>
      }
      render(
        <ThemeProvider>
          <MemoryRouter initialEntries={['/titres/carte-de-resident']}>
            <Routes>
              <Route path="/titres/:slug" element={<><p>Fiche</p><FicheTitre /></>} />
              <Route path="/" element={<Back />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>,
      )
      fireEvent.click(screen.getByRole('button', { name: "M'entraîner pour ce titre" }))
      fireEvent.click(screen.getByRole('button', { name: 'Précédent' }))
      expect(screen.getByText('Fiche')).toBeInTheDocument()
    })

    it('naturalisation : bouton actif, enregistre le titre', () => {
      renderFiche('/titres/naturalisation')
      expect(screen.queryByText(/bientôt/i)).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: "M'entraîner pour ce titre" }))
      expect(ls.getItem('target-title')).toBe('naturalisation')
    })

    it('naturalisation déjà choisie : « Continuer mon entraînement »', () => {
      ls.setItem('target-title', 'naturalisation')
      renderFiche('/titres/naturalisation')
      expect(screen.getByRole('button', { name: 'Continuer mon entraînement' })).toBeEnabled()
    })
  })

  describe('« Retour »', () => {
    it('revient à la page d\'origine', () => {
      renderFiche('/titres/carte-de-resident', '/titre')
      fireEvent.click(screen.getByRole('link', { name: 'Retour' }))
      expect(screen.getByText('Écran du titre')).toBeInTheDocument()
    })

    it('arrivée directe sur la fiche : Retour mène à l\'accueil', () => {
      renderFiche('/titres/carte-de-resident')
      fireEvent.click(screen.getByRole('link', { name: 'Retour' }))
      expect(screen.getByText('Accueil')).toBeInTheDocument()
    })
  })
})
