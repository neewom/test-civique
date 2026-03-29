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
    expect(() => new Date(entry.date)).not.toThrow()
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
    const choices = screen
      .getAllByRole('button')
      .filter((btn) => btn.closest('[data-slot="card-content"]') !== null)
    expect(choices).toHaveLength(4)
  })

  it('désactive les boutons après sélection d\'une réponse', async () => {
    renderExamen()
    const choices = screen
      .getAllByRole('button')
      .filter((btn) => btn.closest('[data-slot="card-content"]') !== null)

    await act(async () => {
      fireEvent.click(choices[0])
    })

    choices.forEach((btn) => expect(btn).toBeDisabled())
  })

  it('quand le temps expire, affiche le message de timeout', async () => {
    renderExamen()
    await act(async () => {
      vi.advanceTimersByTime(TIME_PER_QUESTION * 1000)
    })
    expect(screen.getByText('Temps écoulé — question suivante…')).toBeInTheDocument()
  })

  it('quand le temps expire, avance à la question suivante après 1.2s', async () => {
    renderExamen()
    await act(async () => {
      vi.advanceTimersByTime(TIME_PER_QUESTION * 1000)
    })
    await act(async () => {
      vi.advanceTimersByTime(1200)
    })
    expect(screen.getByText(`Question 2 / ${EXAM_SIZE}`)).toBeInTheDocument()
  })

  it('après sélection, avance à la question suivante après 1.2s', async () => {
    renderExamen()
    const choices = screen
      .getAllByRole('button')
      .filter((btn) => btn.closest('[data-slot="card-content"]') !== null)

    await act(async () => {
      fireEvent.click(choices[0])
    })
    await act(async () => {
      vi.advanceTimersByTime(1200)
    })
    expect(screen.getByText(`Question 2 / ${EXAM_SIZE}`)).toBeInTheDocument()
  })

  it('affiche l\'écran de résultat après 40 questions', async () => {
    renderExamen()
    // React diffère les effets entre deux appels advanceTimersByTime :
    // 1er appel : ticks du chrono → timeLeft=0 + flush → phase=feedback + timeout set
    // 2ème appel : avance le timeout feedback → question suivante
    for (let i = 0; i < EXAM_SIZE; i++) {
      await act(async () => { vi.advanceTimersByTime(TIME_PER_QUESTION * 1000) })
      await act(async () => { vi.advanceTimersByTime(1200) })
    }
    expect(screen.getByText(/Résultat/i)).toBeInTheDocument()
    expect(screen.getByText(/Recommencer/i)).toBeInTheDocument()
  })

  it('sauvegarde le résultat dans localStorage après la fin', async () => {
    renderExamen()
    for (let i = 0; i < EXAM_SIZE; i++) {
      await act(async () => { vi.advanceTimersByTime(TIME_PER_QUESTION * 1000) })
      await act(async () => { vi.advanceTimersByTime(1200) })
    }
    const history = JSON.parse(localStorage.getItem('quiz-history') ?? '[]')
    expect(history.length).toBeGreaterThan(0)
    expect(history[0].total).toBe(EXAM_SIZE)
  })
})
