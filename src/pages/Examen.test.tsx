import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Examen, {
  buildExam,
  saveResult,
  shuffle,
  EXAM_SIZE,
  TIME_PER_QUESTION,
} from './Examen'

function renderExamen() {
  return render(
    <MemoryRouter>
      <Examen />
    </MemoryRouter>
  )
}

function getChoices() {
  return screen
    .getAllByRole('button')
    .filter((btn) => btn.closest('[data-slot="card-content"]') !== null
      && btn.textContent !== 'Valider'
      && btn.textContent !== 'Question suivante'
      && btn.textContent !== 'Voir les résultats')
}

// ─── Fonctions utilitaires ────────────────────────────────────────────────────

describe('shuffle', () => {
  it('retourne un tableau de même longueur', () => {
    expect(shuffle([1, 2, 3, 4, 5])).toHaveLength(5)
  })

  it('contient les mêmes éléments', () => {
    expect(shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5])
  })
})

describe('buildExam', () => {
  it(`retourne exactement ${EXAM_SIZE} questions`, () => {
    expect(buildExam()).toHaveLength(EXAM_SIZE)
  })

  it('chaque question a exactement 4 choix', () => {
    buildExam().forEach((q) => expect(q.choices).toHaveLength(4))
  })

  it('la bonne réponse est toujours dans les choix', () => {
    buildExam().forEach((q) => expect(q.choices).toContain(q.answer))
  })

  it('chaque question a une explication', () => {
    buildExam().forEach((q) => expect(q.explanation).toBeTruthy())
  })
})

describe('saveResult', () => {
  beforeEach(() => localStorage.clear())

  it('crée une entrée dans quiz-history', () => {
    saveResult(30, 40)
    const history = JSON.parse(localStorage.getItem('quiz-history')!)
    expect(history).toHaveLength(1)
    expect(history[0].score).toBe(30)
    expect(history[0].total).toBe(40)
  })

  it('accumule les résultats', () => {
    saveResult(20, 40)
    saveResult(35, 40)
    expect(JSON.parse(localStorage.getItem('quiz-history')!)).toHaveLength(2)
  })

  it('enregistre la date ISO', () => {
    saveResult(10, 40)
    const entry = JSON.parse(localStorage.getItem('quiz-history')!)[0]
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})

// ─── Composant Examen ─────────────────────────────────────────────────────────

describe('Examen', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('affiche "Question 1 / 40" au démarrage', () => {
    renderExamen()
    expect(screen.getByText(`Question 1 / ${EXAM_SIZE}`)).toBeInTheDocument()
  })

  it(`affiche le chronomètre à ${TIME_PER_QUESTION}s au démarrage`, () => {
    renderExamen()
    expect(screen.getByText(`${TIME_PER_QUESTION}s`)).toBeInTheDocument()
  })

  it('affiche 4 boutons de réponse', () => {
    renderExamen()
    expect(getChoices()).toHaveLength(4)
  })

  it('le bouton Valider n\'est pas visible sans sélection', () => {
    renderExamen()
    expect(screen.queryByRole('button', { name: 'Valider' })).not.toBeInTheDocument()
  })

  it('le bouton Valider apparaît après sélection d\'une réponse', async () => {
    renderExamen()
    await act(async () => { fireEvent.click(getChoices()[0]) })
    expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument()
  })

  it('les boutons de réponse restent actifs après sélection (avant validation)', async () => {
    renderExamen()
    await act(async () => { fireEvent.click(getChoices()[0]) })
    // Tous les choix encore cliquables (phase 'pending')
    getChoices().forEach((btn) => expect(btn).not.toBeDisabled())
  })

  it('après validation, les boutons sont désactivés et l\'explication apparaît', async () => {
    renderExamen()
    await act(async () => { fireEvent.click(getChoices()[0]) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider' })) })
    getChoices().forEach((btn) => expect(btn).toBeDisabled())
    expect(screen.getByText('Explication')).toBeInTheDocument()
  })

  it('après validation, le bouton "Question suivante" apparaît', async () => {
    renderExamen()
    await act(async () => { fireEvent.click(getChoices()[0]) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider' })) })
    expect(screen.getByRole('button', { name: 'Question suivante' })).toBeInTheDocument()
  })

  it('"Question suivante" avance à la question 2', async () => {
    renderExamen()
    await act(async () => { fireEvent.click(getChoices()[0]) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Valider' })) })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Question suivante' }))
    })
    expect(screen.getByText(`Question 2 / ${EXAM_SIZE}`)).toBeInTheDocument()
  })

  it('quand le temps expire, affiche directement la correction sans bouton Valider', async () => {
    renderExamen()
    await act(async () => { vi.advanceTimersByTime(TIME_PER_QUESTION * 1000) })
    expect(screen.getByText('Temps écoulé')).toBeInTheDocument()
    expect(screen.getByText('Explication')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Valider' })).not.toBeInTheDocument()
  })

  it('quand le temps expire, le bouton "Question suivante" est présent', async () => {
    renderExamen()
    await act(async () => { vi.advanceTimersByTime(TIME_PER_QUESTION * 1000) })
    expect(screen.getByRole('button', { name: 'Question suivante' })).toBeInTheDocument()
  })

  it('quand le temps expire avec une sélection en cours, passe en correction sans valider', async () => {
    renderExamen()
    await act(async () => { fireEvent.click(getChoices()[0]) })
    // Timer expire pendant la sélection
    await act(async () => { vi.advanceTimersByTime(TIME_PER_QUESTION * 1000) })
    expect(screen.getByText('Temps écoulé')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Valider' })).not.toBeInTheDocument()
  })

  it('affiche l\'écran de résultat après 40 questions', async () => {
    renderExamen()
    for (let i = 0; i < EXAM_SIZE; i++) {
      // Laisser expirer le timer
      await act(async () => { vi.advanceTimersByTime(TIME_PER_QUESTION * 1000) })
      // Cliquer sur "Question suivante" ou "Voir les résultats"
      const nextBtn = screen.queryByRole('button', { name: 'Question suivante' })
        ?? screen.getByRole('button', { name: 'Voir les résultats' })
      await act(async () => { fireEvent.click(nextBtn) })
    }
    expect(screen.getByText(/Résultat/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recommencer' })).toBeInTheDocument()
  })

  it('sauvegarde le résultat dans localStorage après la fin', async () => {
    renderExamen()
    for (let i = 0; i < EXAM_SIZE; i++) {
      await act(async () => { vi.advanceTimersByTime(TIME_PER_QUESTION * 1000) })
      const nextBtn = screen.queryByRole('button', { name: 'Question suivante' })
        ?? screen.getByRole('button', { name: 'Voir les résultats' })
      await act(async () => { fireEvent.click(nextBtn) })
    }
    const history = JSON.parse(localStorage.getItem('quiz-history') ?? '[]')
    expect(history.length).toBeGreaterThan(0)
    expect(history[0].total).toBe(EXAM_SIZE)
  })
})
