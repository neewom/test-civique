import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Home, { OFFICIAL_SITE_URL } from './Home'
import { ThemeProvider } from '@/components/ThemeProvider'

// localStorage mock (jsdom dans ce projet ne fournit pas une implémentation complète)
function makeLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
}
const localStorageMock = makeLocalStorageMock()

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageMock)
  localStorageMock.clear()
  // Titre déjà choisi : l'accueil s'affiche (le premier lancement est testé à part)
  localStorageMock.setItem('target-title', 'pluriannuelle')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function LocationProbe() {
  const location = useLocation()
  return (
    <p data-testid="location">
      {location.pathname}|{JSON.stringify(location.state)}
    </p>
  )
}

function renderHome(state?: unknown) {
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[{ pathname: '/', state }]}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

function seedHistory(entries: unknown[]) {
  localStorageMock.setItem('quiz-history', JSON.stringify(entries))
}

function exam(score: number, id?: string, date = '2026-11-20T10:00:00.000Z') {
  return { ...(id ? { id, answers: [] } : {}), date, score, total: 40 }
}

describe('Accueil — en-tête et parcours', () => {
  it('affiche le logo « Futur Citoyen », sans drapeau', () => {
    renderHome()
    const brand = screen.getByRole('banner')
    expect(brand).toHaveTextContent('Futur Citoyen')
    expect(brand.textContent).not.toMatch(/🇫🇷|test civique/i)
  })

  it('le titre de la page est « Votre chemin vers le jour J »', () => {
    renderHome()
    expect(screen.getByRole('heading', { level: 1, name: 'Votre chemin vers le jour J' })).toBeInTheDocument()
  })

  it('l\'interrupteur de thème est dans l\'en-tête', () => {
    renderHome()
    expect(screen.getByRole('banner')).toContainElement(screen.getByRole('switch'))
  })

  it('donne le titre "Accueil · Futur Citoyen" à l\'onglet', () => {
    renderHome()
    expect(document.title).toBe('Accueil · Futur Citoyen')
  })

  it('a un conteneur principal', () => {
    renderHome()
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('affiche le titre visé, avec un lien pour en changer', () => {
    renderHome()
    const link = screen.getByRole('link', { name: /Titre visé : Carte de séjour pluriannuelle/ })
    expect(link).toHaveAttribute('href', '/titre')
  })

  it('liste les 4 étapes du parcours dans l\'ordre', () => {
    renderHome()
    const list = screen.getByRole('navigation', { name: 'Votre parcours' }).querySelector('ol')!
    const steps = [...list.children]
    expect(steps).toHaveLength(4)
    expect(steps[0]).toHaveTextContent('1 · Réviser les thèmes')
    expect(steps[1]).toHaveTextContent('2 · Réussir 3 examens blancs')
    expect(steps[2]).toHaveTextContent("3 · Trouver un centre d'examen")
    expect(steps[3]).toHaveTextContent('4 · Le jour J')
  })

  it('l\'étape 1 mène au mode révision', () => {
    renderHome()
    expect(screen.getByRole('link', { name: /Réviser les thèmes/ })).toHaveAttribute('href', '/revision')
  })

  it('l\'étape 3 est annoncée « bientôt », sans lien', () => {
    renderHome()
    expect(screen.queryByRole('link', { name: /Trouver un centre/ })).toBeNull()
    expect(screen.getByText("3 · Trouver un centre d'examen")).toHaveTextContent('bientôt')
  })

  it('mène à la page « Comment se passe l\'examen »', () => {
    renderHome()
    expect(screen.getByRole('link', { name: "Comment se passe l'examen ?" })).toHaveAttribute('href', '/regles')
  })

  it('affiche la mention non officielle avec le lien vers le site officiel', () => {
    renderHome()
    expect(screen.getByText(/Site indépendant, non officiel/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'formation-civique.interieur.gouv.fr' })).toHaveAttribute('href', OFFICIAL_SITE_URL)
  })
})

describe('Accueil — choix de l\'examen blanc (étape 2)', () => {
  function step2() {
    return screen.getByRole('button', { name: /2 · Réussir 3 examens blancs/ })
  }

  it('est fermé par défaut, les deux jeux de questions inaccessibles', () => {
    renderHome()
    expect(step2()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: /Questions classiques/ })).toBeNull()
  })

  it('s\'ouvre et se referme au clic', () => {
    renderHome()
    fireEvent.click(step2())
    expect(step2()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /Questions classiques/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Avec mises en situation/ })).toBeInTheDocument()
    fireEvent.click(step2())
    expect(step2()).toHaveAttribute('aria-expanded', 'false')
  })

  it('s\'ouvre directement en venant de la page des règles', () => {
    renderHome({ openExam: true })
    expect(step2()).toHaveAttribute('aria-expanded', 'true')
  })

  it('« Questions classiques » lance un examen sans mises en situation', () => {
    renderHome()
    fireEvent.click(step2())
    fireEvent.click(screen.getByRole('button', { name: /Questions classiques/ }))
    expect(screen.getByTestId('location')).toHaveTextContent('/examen|{"start":"new","excludeSituational":true}')
  })

  it('« Avec mises en situation » lance un examen avec toutes les questions', () => {
    renderHome()
    fireEvent.click(step2())
    fireEvent.click(screen.getByRole('button', { name: /Avec mises en situation/ }))
    expect(screen.getByTestId('location')).toHaveTextContent('/examen|{"start":"new","excludeSituational":false}')
  })
})

describe('Accueil — compteur « n sur 3 »', () => {
  function counter() {
    return screen.getByRole('button', { name: /2 · Réussir 3 examens blancs/ })
  }

  it('affiche 0 sur 3 sans historique', () => {
    renderHome()
    expect(counter()).toHaveTextContent('2 · Réussir 3 examens blancs, 0 sur 3')
  })

  it('compte les réussites d\'affilée depuis l\'examen le plus récent', () => {
    seedHistory([exam(36, 'a'), exam(20, 'b'), exam(32, 'c'), exam(35, 'd')])
    renderHome()
    expect(counter()).toHaveTextContent('2 sur 3')
  })

  it('un échec récent remet le compteur à 0', () => {
    seedHistory([exam(36, 'a'), exam(36, 'b'), exam(31, 'c')])
    renderHome()
    expect(counter()).toHaveTextContent('0 sur 3')
  })

  it('reste plafonné à 3', () => {
    seedHistory([exam(36, 'a'), exam(36, 'b'), exam(36, 'c'), exam(36, 'd'), exam(40, 'e')])
    renderHome()
    expect(counter()).toHaveTextContent('3 sur 3')
  })

  it('compte les anciens examens sans détail', () => {
    seedHistory([exam(33), exam(34)])
    renderHome()
    expect(counter()).toHaveTextContent('2 sur 3')
  })
})

describe('Accueil — derniers examens', () => {
  it('n\'affiche pas la section sans historique', () => {
    renderHome()
    expect(screen.queryByRole('region', { name: 'Derniers examens' })).toBeNull()
  })

  it('affiche les 3 derniers, le plus récent en premier, avec lien vers le détail', () => {
    seedHistory([
      exam(20, 'a', '2026-11-01T10:00:00.000Z'),
      exam(25, 'b', '2026-11-02T10:00:00.000Z'),
      exam(30, 'c', '2026-11-03T10:00:00.000Z'),
      exam(35, 'd', '2026-11-04T10:00:00.000Z'),
    ])
    renderHome()
    const items = screen.getByRole('region', { name: 'Derniers examens' }).querySelectorAll('li')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('4 novembre 2026')
    expect(items[0]).toHaveTextContent('35/40')
    expect(items[0].querySelector('a')).toHaveAttribute('href', '/examen/d')
    expect(items[2]).toHaveTextContent('25/40')
  })

  it('indique « Réussi » à partir de 32/40 et « Pas encore réussi » en dessous', () => {
    seedHistory([exam(31, 'a', '2026-11-01T10:00:00.000Z'), exam(32, 'b', '2026-11-02T10:00:00.000Z')])
    renderHome()
    const items = screen.getByRole('region', { name: 'Derniers examens' }).querySelectorAll('li')
    expect(items[0]).toHaveTextContent('Réussi')
    expect(items[0]).not.toHaveTextContent('Pas encore')
    expect(items[1]).toHaveTextContent('Pas encore réussi')
  })

  it('affiche sans lien les anciens examens enregistrés sans id', () => {
    seedHistory([exam(30)])
    renderHome()
    const section = screen.getByRole('region', { name: 'Derniers examens' })
    expect(section).toHaveTextContent('30/40')
    expect(section.querySelector('a')).toBeNull()
  })

  it('s\'affiche avec un historique qui n\'est pas du JSON', () => {
    localStorageMock.setItem('quiz-history', 'pas du json{')
    renderHome()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Derniers examens' })).toBeNull()
  })

  it('s\'affiche avec un historique qui est un objet et non un tableau', () => {
    localStorageMock.setItem('quiz-history', JSON.stringify({ score: 30, total: 40 }))
    renderHome()
    expect(screen.queryByRole('region', { name: 'Derniers examens' })).toBeNull()
  })

  it('ignore les entrées incomplètes et garde les autres', () => {
    seedHistory([exam(30, '1'), { id: '2', date: new Date().toISOString(), total: 40 }])
    renderHome()
    expect(screen.getByRole('region', { name: 'Derniers examens' }).querySelectorAll('li')).toHaveLength(1)
  })
})

describe('Accueil — reprise de l\'examen en cours', () => {
  function storeProgress(index: number, answered: number, timeLeft = 1500) {
    const questions = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1,
      theme: 'Test',
      question: `Question ${i + 1}`,
      answer: 'A',
      choices: ['A', 'B', 'C', 'D'],
      explanation: '',
    }))
    localStorage.setItem('exam-in-progress', JSON.stringify({
      questions,
      index,
      answers: questions.slice(0, answered).map((q) => ({ questionId: q.id, chosen: 'A', correct: true })),
      timeLeft,
      startedAt: '2026-11-23T10:00:00.000Z',
    }))
  }

  function resumeLink() {
    return screen.getByRole('link', { name: /Reprendre l'examen en cours/ })
  }

  it('n\'affiche pas la reprise sans examen en cours', () => {
    renderHome()
    expect(screen.queryByRole('region', { name: 'Examen en cours' })).toBeNull()
  })

  it('affiche la question qui sera reprise et le temps restant', () => {
    storeProgress(2, 2, 1500)
    renderHome()
    expect(resumeLink()).toHaveAttribute('href', '/examen')
    expect(resumeLink()).toHaveTextContent('Question 3 sur 40 · 25 min restantes')
  })

  it('affiche la question suivante quand la sauvegarde date de la correction', () => {
    storeProgress(2, 3)
    renderHome()
    expect(resumeLink()).toHaveTextContent('Question 4 sur 40')
  })

  it('ne dépasse pas la dernière question quand toutes les réponses sont données', () => {
    storeProgress(39, 40)
    renderHome()
    expect(resumeLink()).toHaveTextContent('Question 40 sur 40')
  })

  it('arrondit le temps restant à la minute supérieure, au singulier sous une minute', () => {
    storeProgress(2, 2, 59)
    renderHome()
    expect(resumeLink()).toHaveTextContent('1 min restante')
  })

  it('ignore une sauvegarde corrompue sans planter', () => {
    localStorage.setItem('exam-in-progress', JSON.stringify({ index: 2 }))
    renderHome()
    expect(screen.queryByRole('region', { name: 'Examen en cours' })).not.toBeInTheDocument()
  })

  it('« Supprimer l\'examen en cours » retire la reprise et la sauvegarde', async () => {
    storeProgress(2, 2)
    renderHome()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: "Supprimer l'examen en cours" }))
    })
    expect(screen.queryByRole('region', { name: 'Examen en cours' })).toBeNull()
    expect(localStorage.getItem('exam-in-progress')).toBeNull()
  })
})

describe('Accueil — premier lancement', () => {
  it('sans titre choisi ni examen, renvoie vers l\'écran du titre', () => {
    localStorageMock.removeItem('target-title')
    renderHome()
    expect(screen.getByTestId('location')).toHaveTextContent('/titre|{"firstLaunch":true}')
  })

  it('un titre illisible compte comme pas de choix', () => {
    localStorageMock.setItem('target-title', 'inconnu')
    renderHome()
    expect(screen.getByTestId('location')).toHaveTextContent('/titre')
  })

  it('avec un historique mais sans titre choisi, garde l\'accueil sur la carte pluriannuelle', () => {
    localStorageMock.removeItem('target-title')
    seedHistory([exam(30, 'a')])
    renderHome()
    expect(screen.getByRole('link', { name: /Titre visé : Carte de séjour pluriannuelle/ })).toBeInTheDocument()
    expect(localStorageMock.getItem('target-title')).toBeNull()
  })

  it('avec un examen en cours mais sans titre choisi, garde la reprise accessible', () => {
    localStorageMock.removeItem('target-title')
    const questions = [{ id: 1, theme: 'T', question: 'Q', answer: 'A', choices: ['A', 'B', 'C', 'D'], explanation: '' }]
    localStorageMock.setItem('exam-in-progress', JSON.stringify({ questions, index: 0, answers: [], timeLeft: 600, startedAt: '2026-11-23T10:00:00.000Z' }))
    renderHome()
    expect(screen.getByRole('link', { name: /Reprendre l'examen en cours/ })).toBeInTheDocument()
  })
})
