import { render, screen, fireEvent, act, within, cleanup, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Home, { OFFICIAL_SITE_URL } from './Home'
import { ThemeProvider } from '@/components/ThemeProvider'
import { stubWideScreen } from '@/test/wide-screen'
import { loadQuestionPack, resetQuestionPacksForTests, setQuestionPackLoaderForTests } from '@/lib/question-packs'

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
  it('annonce que tout est gratuit pendant le lancement, sous le titre et avant le parcours', () => {
    renderHome()
    const notice = screen.getByTestId('launch-notice')
    expect(notice).toHaveTextContent("Tout est gratuit pendant le lancement. L'examen blanc restera toujours gratuit.")
    expect(notice.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    const heading = screen.getByRole('heading', { level: 1, name: 'Votre chemin vers le jour J' })
    const journey = screen.getByRole('navigation', { name: 'Votre parcours' })
    expect(heading.compareDocumentPosition(notice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(notice.compareDocumentPosition(journey) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

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
    expect(document.title).toBe('Examen civique : entraînement gratuit · Futur Citoyen')
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

  it('l\'étape 4 « Le jour J » est un lien vers /examen-civique, avec une flèche sans les 3 réussites', () => {
    renderHome()
    const link = screen.getByRole('link', { name: /4 · Le jour J/ })
    expect(link).toHaveAttribute('href', '/examen-civique')
    expect(link.className).toContain('bg-goal')
    expect(link.querySelector('svg')).not.toBeNull()
    expect(screen.queryByText(/Le jour J est à votre portée/)).toBeNull()
  })

  it('l\'étape 1 mène au mode révision', () => {
    renderHome()
    expect(screen.getByRole('link', { name: /Réviser les thèmes/ })).toHaveAttribute('href', '/revision')
  })

  it('l\'étape 3 mène à la page « Trouver un centre d\'examen », sans « bientôt »', () => {
    renderHome()
    expect(screen.getByRole('link', { name: /Trouver un centre/ })).toHaveAttribute('href', '/centres')
    expect(screen.queryByText(/bientôt/i)).toBeNull()
  })

  it('mène à la page « Comment se passe l\'examen »', () => {
    renderHome()
    expect(screen.getByRole('link', { name: "Comment se passe l'examen ?" })).toHaveAttribute('href', '/examen-civique')
  })

  it('affiche la mention non officielle avec le lien vers le site officiel', () => {
    renderHome()
    expect(screen.getByText(/Site indépendant, non officiel/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'formation-civique.interieur.gouv.fr (nouvel onglet)' })).toHaveAttribute('href', OFFICIAL_SITE_URL)
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
    expect(counter()).toHaveTextContent("2 · Réussir 3 examens blancs d'affilée, 0 sur 3")
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
    await act(async () => {
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: "Supprimer l'examen" }))
    })
    expect(screen.queryByRole('region', { name: 'Examen en cours' })).toBeNull()
    expect(localStorage.getItem('exam-in-progress')).toBeNull()
  })
})

describe('Accueil — confirmation avant de supprimer l\'examen en cours', () => {
  const deleteLink = () => screen.getByRole('button', { name: "Supprimer l'examen en cours" })

  function progress(title?: string, index = 4) {
    const questions = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1, theme: 'Test', question: `Question ${i + 1}`, answer: 'A', choices: ['A', 'B', 'C', 'D'], explanation: '',
    }))
    return { questions, index, answers: [], timeLeft: 1800, startedAt: '2026-11-23T10:00:00.000Z', ...(title ? { title } : {}) }
  }

  function seed() {
    localStorageMock.setItem('exam-in-progress', JSON.stringify(progress(undefined, 9)))
    localStorageMock.setItem('exam-in-progress-resident', JSON.stringify(progress('resident')))
  }

  it('ouvre la boîte sans rien supprimer', async () => {
    seed()
    renderHome()
    await act(async () => {
      fireEvent.click(deleteLink())
    })
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText("Supprimer l'examen en cours ?")).toBeInTheDocument()
    expect(within(dialog).getByText("L'examen en cours sera abandonné.")).toBeInTheDocument()
    const names = within(dialog).getAllByRole('button').map((b) => b.textContent)
    expect(names).toEqual(['Annuler', "Supprimer l'examen"])
    expect(localStorageMock.getItem('exam-in-progress')).not.toBeNull()
  })

  it('« Annuler » ne supprime rien et rend le focus au lien', async () => {
    seed()
    renderHome()
    deleteLink().focus()
    await act(async () => {
      fireEvent.click(deleteLink())
    })
    await act(async () => {
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Annuler' }))
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(localStorageMock.getItem('exam-in-progress')).not.toBeNull()
    expect(screen.getByRole('region', { name: 'Examen en cours' })).toBeInTheDocument()
    await waitFor(() => expect(deleteLink()).toHaveFocus())
  })

  it('Échap ne supprime rien et rend le focus au lien', async () => {
    seed()
    renderHome()
    deleteLink().focus()
    await act(async () => {
      fireEvent.click(deleteLink())
    })
    await act(async () => {
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(localStorageMock.getItem('exam-in-progress')).not.toBeNull()
    await waitFor(() => expect(deleteLink()).toHaveFocus())
  })

  it('« Supprimer l\'examen » supprime celui du titre choisi seulement et met le focus sur l\'étape 2', async () => {
    seed()
    localStorageMock.setItem('target-title', 'resident')
    renderHome()
    deleteLink().focus()
    await act(async () => {
      fireEvent.click(deleteLink())
    })
    await act(async () => {
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: "Supprimer l'examen" }))
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(localStorageMock.getItem('exam-in-progress-resident')).toBeNull()
    expect(localStorageMock.getItem('exam-in-progress')).not.toBeNull()
    expect(screen.queryByRole('region', { name: 'Examen en cours' })).toBeNull()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /2 · Réussir 3 examens blancs d'affilée/ })).toHaveFocus(),
    )
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
    expect(within(card).getByRole('link', { name: "Comment se passe l'examen ?" })).toHaveAttribute('href', '/examen-civique')
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

  // Changed (TL decision: the DOM follows the phone order, the wide screen reorders with CSS `order`):
  // the resume is no longer before the journey in the DOM, each block is still rendered once
  it('la reprise de l\'examen en cours : chaque bloc une seule fois', () => {
    seedHistory([exam(36, 'a')])
    const questions = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1, theme: 'Test', question: `Q${i + 1}`, answer: 'A', choices: ['A', 'B', 'C', 'D'], explanation: '',
    }))
    localStorageMock.setItem('exam-in-progress', JSON.stringify({ questions, index: 1, answers: [], timeLeft: 2700, startedAt: '2026-11-23T10:00:00.000Z' }))
    renderHome()
    expect(screen.getAllByRole('region', { name: 'Examen en cours' })).toHaveLength(1)
    expect(screen.getAllByRole('link', { name: "Comment se passe l'examen ?" })).toHaveLength(1)
    expect(screen.getAllByRole('region', { name: 'Derniers examens' })).toHaveLength(1)
    expect(screen.getAllByRole('navigation', { name: 'Votre parcours' })).toHaveLength(1)
  })
})

describe('Accueil — ordre du DOM = ordre affiché sur téléphone', () => {
  it('parcours, reprise, règles, derniers examens, mentions', () => {
    stubWideScreen(false)
    seedHistory([exam(36, 'a')])
    const questions = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1, theme: 'Test', question: `Q${i + 1}`, answer: 'A', choices: ['A', 'B', 'C', 'D'], explanation: '',
    }))
    localStorageMock.setItem('exam-in-progress', JSON.stringify({ questions, index: 1, answers: [], timeLeft: 2700, startedAt: '2026-11-23T10:00:00.000Z' }))
    renderHome()
    const blocks = [
      screen.getByRole('heading', { level: 1 }),
      screen.getByRole('navigation', { name: 'Votre parcours' }),
      screen.getByRole('region', { name: 'Examen en cours' }),
      screen.getByRole('link', { name: "Comment se passe l'examen ?" }),
      screen.getByRole('region', { name: 'Derniers examens' }),
      screen.getByText(/Votre progression reste sur cet appareil/),
      screen.getByRole('link', { name: 'Mentions légales et confidentialité' }),
    ]
    for (let i = 1; i < blocks.length; i++) {
      expect(blocks[i - 1].compareDocumentPosition(blocks[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
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
    await act(async () => {
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: "Supprimer l'examen" }))
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

describe('Accueil — naturalisation', () => {
  beforeEach(() => localStorageMock.setItem('target-title', 'naturalisation'))

  function progress(title?: string, index = 4) {
    const questions = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1, theme: 'Test', question: `Question ${i + 1}`, answer: 'A', choices: ['A', 'B', 'C', 'D'], explanation: '',
    }))
    return { questions, index, answers: [], timeLeft: 1500, startedAt: '2026-11-23T10:00:00.000Z', ...(title ? { title } : {}) }
  }

  it('la pastille du titre affiche « Naturalisation »', () => {
    renderHome()
    expect(screen.getByRole('link', { name: /Titre visé : Naturalisation/ })).toHaveAttribute('href', '/titre')
  })

  it('le compteur et « Derniers examens » ne portent que sur les examens de la naturalisation', () => {
    seedHistory([
      { ...exam(36, 'p1', '2026-11-01T10:00:00.000Z') },
      { ...exam(36, 'r1', '2026-11-02T10:00:00.000Z'), title: 'resident' },
      { ...exam(36, 'n1', '2026-11-03T10:00:00.000Z'), title: 'naturalisation' },
      { ...exam(10, 'n2', '2026-11-04T10:00:00.000Z'), title: 'naturalisation' },
    ])
    renderHome()
    expect(screen.getByRole('button', { name: /2 · Réussir 3 examens blancs/ })).toHaveTextContent('0 sur 3')
    const links = within(screen.getByRole('region', { name: 'Derniers examens' })).getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/examen/n2', '/examen/n1'])
  })

  it('propose la reprise de l\'examen en cours de la naturalisation seulement', () => {
    localStorageMock.setItem('exam-in-progress', JSON.stringify(progress(undefined, 9)))
    localStorageMock.setItem('exam-in-progress-resident', JSON.stringify(progress('resident', 8)))
    renderHome()
    expect(screen.queryByRole('region', { name: 'Examen en cours' })).toBeNull()
    localStorageMock.setItem('exam-in-progress-naturalisation', JSON.stringify(progress('naturalisation', 4)))
    cleanup()
    renderHome()
    expect(screen.getByRole('link', { name: /Reprendre l'examen en cours/ })).toHaveTextContent('Question 5 sur 40')
  })

  it('« Supprimer l\'examen en cours » ne supprime que celui de la naturalisation', async () => {
    const a = JSON.stringify(progress(undefined, 9))
    const b = JSON.stringify(progress('resident', 8))
    localStorageMock.setItem('exam-in-progress', a)
    localStorageMock.setItem('exam-in-progress-resident', b)
    localStorageMock.setItem('exam-in-progress-naturalisation', JSON.stringify(progress('naturalisation')))
    renderHome()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: "Supprimer l'examen en cours" }))
    })
    await act(async () => {
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: "Supprimer l'examen" }))
    })
    expect(localStorageMock.getItem('exam-in-progress-naturalisation')).toBeNull()
    expect(localStorageMock.getItem('exam-in-progress')).toBe(a)
    expect(localStorageMock.getItem('exam-in-progress-resident')).toBe(b)
  })

  it('sans titre choisi, un examen en cours de la naturalisation seul suffit à ne pas renvoyer vers le titre', () => {
    localStorageMock.removeItem('target-title')
    localStorageMock.setItem('exam-in-progress-naturalisation', JSON.stringify(progress('naturalisation')))
    renderHome()
    expect(screen.queryByTestId('location')).toBeNull()
  })
})

describe("Accueil — « Continuer où j'en étais » (révision)", () => {
  const shortcut = () => screen.queryByRole('link', { name: /Continuer où j'en étais/ })
  const view = (filter: unknown, scrollY: number, excludeSituational = false) =>
    JSON.stringify({ filter, excludeSituational, scrollY })

  it('sans vue gardée : pas de lien', () => {
    renderHome()
    expect(shortcut()).toBeNull()
  })

  it('position à 0 : pas de lien', () => {
    localStorageMock.setItem('revision-view:pluriannuelle', view({ kind: 'all' }, 0))
    renderHome()
    expect(shortcut()).toBeNull()
  })

  it('position gardée : lien vers /revision, sous l\'étape 1, avec « Tous les thèmes »', () => {
    localStorageMock.setItem('revision-view:pluriannuelle', view({ kind: 'all' }, 900))
    renderHome()
    const link = shortcut()!
    expect(link).toHaveTextContent("Continuer où j'en étais : Tous les thèmes")
    expect(link).toHaveAttribute('href', '/revision')
    const step1 = screen.getByRole('navigation', { name: 'Votre parcours' }).querySelector('li')!
    expect(step1).toContainElement(link)
  })

  it("affiche le libellé d'affichage du thème", () => {
    localStorageMock.setItem('revision-view:pluriannuelle', view({ kind: 'theme', theme: 'Vie en société' }, 300))
    renderHome()
    expect(shortcut()).toHaveTextContent("Continuer où j'en étais : Vivre dans la société française")
  })

  it('« À revoir » quand il reste des questions à revoir', () => {
    seedHistory([{ ...exam(30, 'a'), answers: [{ questionId: 1, correct: false }] }])
    localStorageMock.setItem('revision-view:pluriannuelle', view({ kind: 'review' }, 300))
    renderHome()
    expect(shortcut()).toHaveTextContent("Continuer où j'en étais : À revoir")
  })

  it('« À revoir » devenu vide ou thème inconnu : « Tous les thèmes »', () => {
    localStorageMock.setItem('revision-view:pluriannuelle', view({ kind: 'review' }, 300))
    renderHome()
    expect(shortcut()).toHaveTextContent('Tous les thèmes')
    cleanup()
    localStorageMock.setItem('revision-view:pluriannuelle', view({ kind: 'theme', theme: 'Inconnu' }, 300))
    renderHome()
    expect(shortcut()).toHaveTextContent('Tous les thèmes')
  })

  it('titre choisi seulement', () => {
    localStorageMock.setItem('revision-view:resident', view({ kind: 'all' }, 900))
    renderHome()
    expect(shortcut()).toBeNull()
    cleanup()
    localStorageMock.setItem('target-title', 'resident')
    renderHome()
    expect(shortcut()).not.toBeNull()
  })

  it.each(['pas du json{', 'null', '42', '{"filter":"all","scrollY":9}'])('valeur illisible ignorée (%s)', (raw) => {
    localStorageMock.setItem('revision-view:pluriannuelle', raw)
    renderHome()
    expect(shortcut()).toBeNull()
  })

  it('une ancienne valeur de sessionStorage est ignorée', () => {
    sessionStorage.setItem('revision-view:pluriannuelle', view({ kind: 'all' }, 900))
    renderHome()
    expect(shortcut()).toBeNull()
    sessionStorage.clear()
  })

  it('un stockage bloqué ne casse pas l\'accueil', () => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => (key === 'revision-view:pluriannuelle' ? (() => { throw new Error('blocked') })() : null),
      setItem: () => {},
    })
    renderHome()
    expect(shortcut()).toBeNull()
  })
})

describe('Accueil — jour J et « Vos thèmes »', () => {
  const THEME_IDS = [
    ['Principes et valeurs de la République', 10],
    ['Système institutionnel et politique', 20],
    ['Droits et devoirs', 30],
    ['Histoire, géographie et culture', 40],
    ['Vie en société', 50],
  ] as const
  const fakePack = THEME_IDS.flatMap(([theme, base]) =>
    Array.from({ length: 10 }, (_, n) => ({ id: base + n, theme })),
  )

  // An exam passed (or not), with answers: `right` of the 10 questions of each theme
  function examWith(right: number[], passed: boolean, id: string, day: number) {
    const answers = THEME_IDS.flatMap(([, base], i) =>
      Array.from({ length: 10 }, (_, n) => ({ questionId: base + n, chosen: 'x', correct: n < right[i] })),
    )
    return { id, date: `2026-11-${day}T10:00:00.000Z`, score: passed ? 33 : 20, total: 40, answers }
  }
  const passedExam = (id: string, day: number, right = [10, 10, 10, 10, 10]) => examWith(right, true, id, day)

  async function withPack() {
    setQuestionPackLoaderForTests('pluriannuelle', async () => ({ default: fakePack as never }))
    await loadQuestionPack('pluriannuelle')
  }

  beforeEach(() => resetQuestionPacksForTests())
  afterEach(() => resetQuestionPacksForTests())

  it('étape 4 : cochée avec la phrase à 3 réussites d\'affilée', () => {
    seedHistory([passedExam('a', 1), passedExam('b', 2), passedExam('c', 3)])
    renderHome()
    expect(screen.getByText("Le jour J est à votre portée : 3 examens blancs réussis d'affilée.")).toBeInTheDocument()
    expect(document.querySelector('nav li:nth-child(4) svg.lucide-check')).not.toBeNull()
    // The whole pastille stays a link, the check taking the place of the arrow
    const link = screen.getByRole('link', { name: /4 · Le jour J/ })
    expect(link).toHaveAttribute('href', '/examen-civique')
    expect(link.querySelector('svg')).not.toBeNull()
  })

  it('étape 4 : inchangée avec 2 réussites, ou après un échec récent', () => {
    seedHistory([passedExam('a', 1), passedExam('b', 2)])
    renderHome()
    expect(screen.queryByText(/à votre portée/)).toBeNull()
    expect(document.querySelector('nav li:nth-child(4) svg.lucide-check')).toBeNull()
    cleanup()
    seedHistory([passedExam('a', 1), passedExam('b', 2), passedExam('c', 3), examWith([1, 1, 1, 1, 1], false, 'd', 4)])
    renderHome()
    expect(screen.queryByText(/à votre portée/)).toBeNull()
  })

  it('étape 4 : le titre choisi seulement', () => {
    localStorageMock.setItem('target-title', 'resident')
    seedHistory([
      { ...passedExam('a', 1), title: 'pluriannuelle' },
      { ...passedExam('b', 2), title: 'pluriannuelle' },
      { ...passedExam('c', 3), title: 'pluriannuelle' },
    ])
    renderHome()
    expect(screen.queryByText(/à votre portée/)).toBeNull()
  })

  it('« Vos thèmes » : pourcentages, tri du plus faible au plus fort, « À travailler » sous 80 %', async () => {
    await withPack()
    seedHistory([passedExam('a', 1, [9, 7, 10, 8, 6])])
    renderHome()
    const card = screen.getByRole('region', { name: 'Vos thèmes' })
    expect(within(card).getByText('Bonnes réponses sur votre dernier examen blanc')).toBeInTheDocument()
    const rows = within(card).getAllByRole('listitem').map((li) => li.textContent?.replace(/\u00a0/g, ' '))
    expect(rows).toEqual([
      'Vivre dans la société française60 %À travailler',
      'Système institutionnel et politique70 %À travailler',
      'Histoire, géographie et culture80 %',
      'Principes et valeurs de la République90 %',
      'Droits et devoirs100 %',
    ])
  })

  it('« Vos thèmes » : sous-titre selon le nombre d\'examens lus (2, puis 3 sur les derniers)', async () => {
    await withPack()
    seedHistory([passedExam('a', 1), passedExam('b', 2)])
    renderHome()
    expect(screen.getByText('Bonnes réponses sur vos 2 derniers examens blancs')).toBeInTheDocument()
    cleanup()
    seedHistory([passedExam('z', 1, [0, 0, 0, 0, 0]), passedExam('a', 2), passedExam('b', 3), passedExam('c', 4)])
    renderHome()
    expect(screen.getByText('Bonnes réponses sur vos 3 derniers examens blancs')).toBeInTheDocument()
    expect(screen.queryByText('À travailler')).toBeNull()
  })

  it('« Vos thèmes » : absent sans examen exploitable (sans réponses) ou sans examen du titre choisi', async () => {
    await withPack()
    seedHistory([exam(35, 'a'), exam(35)])
    renderHome()
    expect(screen.queryByRole('region', { name: 'Vos thèmes' })).toBeNull()
    cleanup()
    seedHistory([{ ...passedExam('a', 1), title: 'resident' }])
    renderHome()
    expect(screen.queryByRole('region', { name: 'Vos thèmes' })).toBeNull()
  })

  it('« Vos thèmes » : absent tant que le paquet n\'est pas là, sans le charger tout de suite', () => {
    const loader = vi.fn(async () => ({ default: fakePack as never }))
    setQuestionPackLoaderForTests('pluriannuelle', loader)
    seedHistory([passedExam('a', 1)])
    renderHome()
    expect(screen.queryByRole('region', { name: 'Vos thèmes' })).toBeNull()
    expect(loader).not.toHaveBeenCalled()
  })

  it('« Vos thèmes » : rien si le chargement échoue, l\'accueil reste utilisable', async () => {
    setQuestionPackLoaderForTests('pluriannuelle', async () => {
      throw new Error('réseau')
    })
    await loadQuestionPack('pluriannuelle').catch(() => {})
    seedHistory([passedExam('a', 1)])
    renderHome()
    expect(screen.queryByRole('region', { name: 'Vos thèmes' })).toBeNull()
    expect(screen.getByRole('link', { name: /1 · Réviser les thèmes/ })).toBeInTheDocument()
  })

  it('« Vos thèmes » apparaît quand le préchargement au repos se termine', async () => {
    setQuestionPackLoaderForTests('pluriannuelle', async () => ({ default: fakePack as never }))
    seedHistory([passedExam('a', 1)])
    renderHome()
    expect(screen.queryByRole('region', { name: 'Vos thèmes' })).toBeNull()
    expect(await screen.findByRole('region', { name: 'Vos thèmes' }, { timeout: 4000 })).toBeInTheDocument()
  })
})
