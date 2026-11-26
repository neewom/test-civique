import { render, screen, fireEvent, act, within, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Home, { OFFICIAL_SITE_URL } from './Home'
import { ThemeProvider } from '@/components/ThemeProvider'
import { stubWideScreen } from '@/test/wide-screen'

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

  it('le bouton « Affichage » est dans l\'en-tête, avec le logo', () => {
    renderHome()
    const header = document.querySelector('[data-app-header]') as HTMLElement
    expect(within(header).getByRole('button', { name: 'Affichage' })).toBeInTheDocument()
    expect(within(header).getByRole('link', { name: /Futur Citoyen/ })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('switch')).toBeNull()
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

  it('mène à la page des mentions légales depuis le pied de page', () => {
    renderHome()
    fireEvent.click(screen.getByRole('link', { name: 'Mentions légales et confidentialité' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/mentions-legales|')
  })
})

describe('Accueil — examen blanc (étape 2)', () => {
  function step2() {
    return screen.getByRole('button', { name: /2 · Réussir 3 examens blancs/ })
  }

  it('sans examen en cours, un clic mène à la page avant l\'examen blanc', () => {
    renderHome()
    fireEvent.click(step2())
    expect(screen.getByTestId('location')).toHaveTextContent('/examen-blanc|')
  })

  it('n\'est plus un dépliant : ni aria-expanded ni choix du jeu de questions', () => {
    renderHome()
    expect(step2()).not.toHaveAttribute('aria-expanded')
    expect(screen.queryByRole('button', { name: /Questions classiques/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Avec mises en situation/ })).toBeNull()
  })

  it('reprend l\'examen en cours du titre choisi au lieu de le remplacer', () => {
    const questions = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1, theme: 'Test', question: `Q${i + 1}`, answer: 'A', choices: ['A', 'B', 'C', 'D'], explanation: '',
    }))
    localStorageMock.setItem('exam-in-progress', JSON.stringify({ questions, index: 3, answers: [], timeLeft: 900, startedAt: '2026-11-23T10:00:00.000Z' }))
    renderHome()
    fireEvent.click(step2())
    expect(screen.getByTestId('location')).toHaveTextContent('/examen|null')
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
    expect(screen.getByTestId('location')).toHaveTextContent('/titre|null')
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

describe('Accueil — grand écran (1024 px et plus)', () => {
  beforeEach(() => stubWideScreen())

  it('sans historique : plus de carte « Ce qui vous attend le jour J », l\'étape 4 reste', () => {
    renderHome()
    expect(screen.queryByRole('region', { name: 'Ce qui vous attend le jour J' })).toBeNull()
    expect(screen.queryByText('questions à choix multiples')).toBeNull()
    expect(screen.getByText('4 · Le jour J')).toBeInTheDocument()
    const card = screen.getByRole('region', { name: 'Où vous en êtes' })
    expect(card).toHaveTextContent(
      "Vos examens blancs s'afficheront ici, avec votre progression vers les 3 réussites d'affilée.",
    )
    expect(within(card).getByRole('link', { name: "Comment se passe l'examen ?" })).toHaveAttribute('href', '/regles')
  })

  it('avec historique : « Où vous en êtes », le compteur, les derniers examens et les règles', () => {
    seedHistory([exam(20, 'a'), exam(33, 'b'), exam(35, 'c')])
    renderHome()
    const panel = screen.getByRole('region', { name: 'Où vous en êtes' })
    expect(panel).toHaveTextContent("2 sur 3 examens blancs réussis d'affilée. Encore 1 pour atteindre l'objectif.")
    expect(within(panel).getByRole('region', { name: 'Derniers examens' })).toBeInTheDocument()
    expect(within(panel).getByRole('link', { name: "Comment se passe l'examen ?" })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Ce qui vous attend le jour J' })).toBeNull()
  })

  it('après un échec : « Encore 3 »', () => {
    seedHistory([exam(36, 'a'), exam(10, 'b')])
    renderHome()
    expect(screen.getByRole('region', { name: 'Où vous en êtes' })).toHaveTextContent(
      "0 sur 3 examens blancs réussis d'affilée. Encore 3 pour atteindre l'objectif.",
    )
  })

  it('à 3 sur 3 : objectif atteint', () => {
    seedHistory([exam(36, 'a'), exam(36, 'b'), exam(36, 'c')])
    renderHome()
    const panel = screen.getByRole('region', { name: 'Où vous en êtes' })
    expect(panel).toHaveTextContent("3 sur 3 examens blancs réussis d'affilée : objectif atteint.")
    expect(panel).not.toHaveTextContent('Encore')
  })

  it('la reprise de l\'examen en cours vient avant le parcours, chaque bloc une seule fois', () => {
    seedHistory([exam(36, 'a')])
    const questions = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1, theme: 'Test', question: `Q${i + 1}`, answer: 'A', choices: ['A', 'B', 'C', 'D'], explanation: '',
    }))
    localStorageMock.setItem('exam-in-progress', JSON.stringify({ questions, index: 1, answers: [], timeLeft: 2700, startedAt: '2026-11-23T10:00:00.000Z' }))
    renderHome()
    const resume = screen.getByRole('region', { name: 'Examen en cours' })
    const nav = screen.getByRole('navigation', { name: 'Votre parcours' })
    expect(resume.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getAllByRole('link', { name: "Comment se passe l'examen ?" })).toHaveLength(1)
    expect(screen.getAllByRole('region', { name: 'Derniers examens' })).toHaveLength(1)
    expect(screen.getAllByRole('navigation', { name: 'Votre parcours' })).toHaveLength(1)
  })
})

describe('Accueil — téléphone et tablette (moins de 1024 px)', () => {
  it('n\'affiche ni « Où vous en êtes » ni « Ce qui vous attend le jour J »', () => {
    stubWideScreen(false)
    seedHistory([exam(36, 'a')])
    renderHome()
    expect(screen.queryByRole('region', { name: 'Où vous en êtes' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Ce qui vous attend le jour J' })).toBeNull()
  })
})

describe('Accueil — progression sur cet appareil', () => {
  const sentence = 'Votre progression reste sur cet appareil, dans ce navigateur.'

  function expectNotice() {
    const paragraph = screen.getByText((_, el) => el?.tagName === 'P' && !!el.textContent?.startsWith(sentence))
    const link = within(paragraph).getByRole('link', { name: 'En savoir plus' })
    expect(link).toHaveAttribute('href', '/mentions-legales#vos-donnees')
    return paragraph
  }

  it('prévient, sans historique, que la progression reste sur cet appareil', () => {
    renderHome()
    expectNotice()
  })

  it('prévient aussi avec un historique, une seule fois', () => {
    seedHistory([exam(34, 'e1')])
    renderHome()
    expectNotice()
    expect(screen.getAllByRole('link', { name: 'En savoir plus' })).toHaveLength(1)
  })

  it('en grand écran, la phrase ouvre le pied de page', () => {
    stubWideScreen()
    renderHome()
    const footer = screen.getByRole('contentinfo')
    expect(footer.firstElementChild).toBe(expectNotice())
    expect(screen.getAllByRole('link', { name: 'En savoir plus' })).toHaveLength(1)
  })

  it('« En savoir plus » mène aux mentions légales', () => {
    renderHome()
    fireEvent.click(screen.getByRole('link', { name: 'En savoir plus' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/mentions-legales|')
  })
})

describe('Accueil — examens du titre choisi', () => {
  function counter() {
    return screen.getByRole('button', { name: /2 · Réussir 3 examens blancs/ })
  }

  function progress(title?: string) {
    const questions = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1,
      theme: 'Test',
      question: `Question ${i + 1}`,
      answer: 'A',
      choices: ['A', 'B', 'C', 'D'],
      explanation: '',
    }))
    return { questions, index: 4, answers: [], timeLeft: 1500, startedAt: '2026-11-23T10:00:00.000Z', ...(title ? { title } : {}) }
  }

  it('le compteur ne compte que les examens de la carte pluriannuelle (sans titre = pluriannuelle)', () => {
    seedHistory([
      exam(36, 'a'),
      { ...exam(36, 'b'), title: 'pluriannuelle' },
      // Échec d'un autre titre : ne remet pas le compteur à 0
      { ...exam(10, 'c'), title: 'resident' },
    ])
    renderHome()
    expect(counter()).toHaveTextContent('2 sur 3')
  })

  it('« Derniers examens » ne liste que les examens du titre choisi', () => {
    seedHistory([
      exam(33, 'old', '2026-11-01T10:00:00.000Z'),
      { ...exam(36, 'nat', '2026-11-02T10:00:00.000Z'), title: 'naturalisation' },
      { ...exam(31, 'unk', '2026-11-03T10:00:00.000Z'), title: 'inconnu' },
    ])
    renderHome()
    const links = within(screen.getByRole('region', { name: 'Derniers examens' })).getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/examen/unk', '/examen/old'])
  })

  it('ne propose pas la reprise d\'un examen en cours d\'un autre titre, sans l\'effacer', () => {
    const stored = JSON.stringify(progress('resident'))
    localStorageMock.setItem('exam-in-progress', stored)
    renderHome()
    expect(screen.queryByRole('region', { name: 'Examen en cours' })).toBeNull()
    expect(localStorageMock.getItem('exam-in-progress')).toBe(stored)
  })

  it('propose la reprise d\'un examen en cours enregistré sans titre', () => {
    localStorageMock.setItem('exam-in-progress', JSON.stringify(progress()))
    renderHome()
    expect(screen.getByRole('link', { name: /Reprendre l'examen en cours/ })).toHaveTextContent('Question 5 sur 40')
  })
})

describe('Accueil — carte de résident', () => {
  beforeEach(() => localStorageMock.setItem('target-title', 'resident'))

  function progress(title?: string, index = 4) {
    const questions = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1, theme: 'Test', question: `Question ${i + 1}`, answer: 'A', choices: ['A', 'B', 'C', 'D'], explanation: '',
    }))
    return { questions, index, answers: [], timeLeft: 1500, startedAt: '2026-11-23T10:00:00.000Z', ...(title ? { title } : {}) }
  }

  it('la pastille du titre affiche « Carte de résident »', () => {
    renderHome()
    expect(screen.getByRole('link', { name: /Titre visé : Carte de résident/ })).toHaveAttribute('href', '/titre')
  })

  it('le compteur et « Derniers examens » ne portent que sur les examens de la carte de résident', () => {
    seedHistory([
      { ...exam(36, 'p1', '2026-11-01T10:00:00.000Z') },
      { ...exam(36, 'r1', '2026-11-02T10:00:00.000Z'), title: 'resident' },
      { ...exam(10, 'r2', '2026-11-03T10:00:00.000Z'), title: 'resident' },
      { ...exam(36, 'r3', '2026-11-04T10:00:00.000Z'), title: 'resident' },
    ])
    renderHome()
    expect(screen.getByRole('button', { name: /2 · Réussir 3 examens blancs/ })).toHaveTextContent('1 sur 3')
    const links = within(screen.getByRole('region', { name: 'Derniers examens' })).getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/examen/r3', '/examen/r2', '/examen/r1'])
  })

  it('propose la reprise de l\'examen en cours de la carte de résident, pas celui de la pluriannuelle', () => {
    localStorageMock.setItem('exam-in-progress', JSON.stringify(progress(undefined, 9)))
    renderHome()
    expect(screen.queryByRole('region', { name: 'Examen en cours' })).toBeNull()
    localStorageMock.setItem('exam-in-progress-resident', JSON.stringify(progress('resident', 4)))
    cleanup()
    renderHome()
    expect(screen.getByRole('link', { name: /Reprendre l'examen en cours/ })).toHaveTextContent('Question 5 sur 40')
  })

  it('avec la pluriannuelle choisie, l\'examen en cours de la carte de résident n\'est pas proposé', () => {
    localStorageMock.setItem('target-title', 'pluriannuelle')
    localStorageMock.setItem('exam-in-progress-resident', JSON.stringify(progress('resident')))
    renderHome()
    expect(screen.queryByRole('region', { name: 'Examen en cours' })).toBeNull()
  })

  it('« Supprimer l\'examen en cours » ne supprime que celui de la carte de résident', async () => {
    const other = JSON.stringify(progress(undefined, 9))
    localStorageMock.setItem('exam-in-progress', other)
    localStorageMock.setItem('exam-in-progress-resident', JSON.stringify(progress('resident')))
    renderHome()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: "Supprimer l'examen en cours" }))
    })
    expect(localStorageMock.getItem('exam-in-progress-resident')).toBeNull()
    expect(localStorageMock.getItem('exam-in-progress')).toBe(other)
  })

  it('sans titre choisi, un examen en cours de la carte de résident seul suffit à ne pas renvoyer vers le titre', () => {
    localStorageMock.removeItem('target-title')
    localStorageMock.setItem('exam-in-progress-resident', JSON.stringify(progress('resident')))
    renderHome()
    expect(screen.queryByTestId('location')).toBeNull()
    expect(screen.getByRole('link', { name: /Titre visé : Carte de séjour pluriannuelle/ })).toBeInTheDocument()
  })

  it('premier passage : aucun titre, aucun historique, aucun examen en cours dans aucune clé renvoie vers le titre', () => {
    localStorageMock.removeItem('target-title')
    renderHome()
    expect(screen.getByTestId('location')).toHaveTextContent('/titre|null')
  })
})
