import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import ExamenCivique from './ExamenCivique'
import { FAQ, LEGIFRANCE_URL, INFOS_URL } from '@/lib/examen-civique'
import { EXAM_MINUTES, EXAM_SIZE, passThreshold } from '@/lib/exam'
import { buildExam } from '@/lib/exam'
import { saveProgress } from '@/lib/exam-types'
import { questionsForTitle } from '@/test/questions'

function Probe() {
  return <p>chemin : {useLocation().pathname}</p>
}

function renderPage(path = '/examen-civique') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/examen-civique" element={<ExamenCivique />} />
        <Route path="/examen-blanc" element={<Probe />} />
        <Route path="/examen" element={<Probe />} />
        <Route path="/centres" element={<Probe />} />
        <Route path="/titres/:slug" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => localStorage.clear())

describe('Page « L\'examen civique »', () => {
  it('a son titre de page et d\'onglet', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: "L'examen civique\u00a0: ce qu'il faut savoir" })).toBeInTheDocument()
    expect(document.title).toBe("L'examen civique 2026 : format et préparation · Futur Citoyen")
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute('href', '/')
  })

  it('affiche les six sections, dans l\'ordre', () => {
    renderPage()
    const names = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.replace(/\u00a0/g, ' '))
    expect(names).toEqual([
      "Qu'est-ce que l'examen civique ?",
      "Qui doit passer l'examen civique ?",
      "Comment se passe l'examen civique ?",
      "Que se passe-t-il après l'examen civique ?",
      "Comment se préparer à l'examen civique ?",
      "Où passer l'examen civique ?",
      "Questions fréquentes sur l'examen civique",
    ])
  })

  it('reprend les chiffres officiels : 40 questions, 45 minutes, 32/40', () => {
    renderPage()
    const marks = within(screen.getByRole('list', { name: "L'examen en bref" }))
    expect(marks.getByText(String(EXAM_SIZE))).toBeInTheDocument()
    expect(marks.getByText(`${EXAM_MINUTES} min`)).toBeInTheDocument()
    expect(marks.getByText('4 choix')).toBeInTheDocument()
    expect(marks.getByText(`${passThreshold(EXAM_SIZE)}/${EXAM_SIZE}`)).toBeInTheDocument()
    expect(screen.getByText(/Il faut 32 bonnes réponses sur 40 pour réussir, soit 80 %/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Répartition des 40 questions' })).toBeInTheDocument()
    expect(screen.getByText('Vivre dans la société française')).toBeInTheDocument()
  })

  it('renvoie vers les trois fiches et vers /centres', () => {
    renderPage()
    expect(screen.getByRole('link', { name: 'Carte de séjour pluriannuelle' })).toHaveAttribute('href', '/titres/carte-de-sejour-pluriannuelle')
    expect(screen.getByRole('link', { name: 'Carte de résident' })).toHaveAttribute('href', '/titres/carte-de-resident')
    expect(screen.getByRole('link', { name: 'Naturalisation' })).toHaveAttribute('href', '/titres/naturalisation')
    expect(screen.getByRole('link', { name: /Trouver un centre d'examen/ })).toHaveAttribute('href', '/centres')
  })

  it('met en forme les liens officiels (nouvel onglet) et cite les sources en bas', () => {
    renderPage()
    const legifrance = screen.getByRole('link', { name: /arrêté du 10 octobre 2025/ })
    expect(legifrance).toHaveAttribute('href', LEGIFRANCE_URL)
    expect(legifrance).toHaveAttribute('target', '_blank')
    const infos = screen.getAllByRole('link', { name: /Informations générales sur l'examen civique/ })
    expect(infos.length).toBeGreaterThanOrEqual(2)
    infos.forEach((l) => expect(l).toHaveAttribute('href', INFOS_URL))
    expect(screen.getByRole('link', { name: /formation-civique\.interieur\.gouv\.fr/ })).toHaveAttribute('href', 'https://formation-civique.interieur.gouv.fr/')
    expect(screen.queryByText(/\*\*|\]\(/)).toBeNull()
  })

  it('met en gras les trois cas de la section « Qui doit passer »', () => {
    renderPage()
    expect(screen.getByText('première carte de séjour pluriannuelle').tagName).toBe('B')
    expect(screen.getByText('naturalisation par décret').tagName).toBe('B')
  })

  it('la FAQ a six questions en détails, seule la première est ouverte', () => {
    renderPage()
    const details = document.querySelectorAll('details')
    expect(details).toHaveLength(FAQ.length)
    expect([...details].map((d) => d.open)).toEqual([true, false, false, false, false, false])
    expect(details[0].querySelector('summary')).toHaveTextContent(/renouveler sa carte/)
  })

  it('les espaces insécables du texte validé sont en place', () => {
    renderPage()
    expect(document.body.textContent).toContain('« pour contrôler l\'immigration, améliorer l\'intégration »'.replace(/« /, '«\u00a0').replace(/ »/, '\u00a0»'))
    expect(document.body.textContent).not.toMatch(/\S [:;?]/)
  })

  it('« M\'entraîner » mène à /examen-blanc quand aucun examen n\'est en cours (trois boutons)', async () => {
    renderPage()
    const buttons = [
      ...screen.getAllByRole('link', { name: "M'entraîner maintenant" }),
      screen.getByRole('link', { name: "M'entraîner à l'examen blanc" }),
    ]
    expect(buttons).toHaveLength(3)
    buttons.forEach((b) => expect(b).toHaveAttribute('href', '/examen-blanc'))
    await userEvent.click(buttons[0])
    expect(screen.getByText('chemin : /examen-blanc')).toBeInTheDocument()
  })

  it('les trois boutons reprennent l\'examen en cours du titre choisi', () => {
    localStorage.setItem('target-title', 'pluriannuelle')
    const questions = buildExam(questionsForTitle('pluriannuelle'))
    saveProgress({ questions, index: 2, answers: [], timeLeft: 1500, startedAt: '2026-11-01T10:00:00.000Z', title: 'pluriannuelle' })
    renderPage()
    const buttons = [
      ...screen.getAllByRole('link', { name: "M'entraîner maintenant" }),
      screen.getByRole('link', { name: "M'entraîner à l'examen blanc" }),
    ]
    buttons.forEach((b) => expect(b).toHaveAttribute('href', '/examen'))
  })
})
