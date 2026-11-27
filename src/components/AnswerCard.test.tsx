import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AnswerCard, type AnswerResult } from '@/components/AnswerCard'

const ANSWERS = ['Il est jugé comme tout citoyen', 'Il est révoqué', 'Il est amnistié', 'Rien']
const LETTERS = ['A', 'B', 'C', 'D']

function Question({
  results = {},
  disabled = false,
  initial = null,
}: {
  results?: Record<string, AnswerResult>
  disabled?: boolean
  initial?: string | null
}) {
  const [selected, setSelected] = useState<string | null>(initial)
  return (
    <div role="radiogroup" aria-label="Réponses">
      {ANSWERS.map((a, i) => (
        <AnswerCard
          key={a}
          letter={LETTERS[i]}
          name="answer"
          value={a}
          checked={selected === a}
          onSelect={setSelected}
          result={results[a]}
          disabled={disabled}
        >
          {a}
        </AnswerCard>
      ))}
    </div>
  )
}

function card(name: string) {
  return screen.getByRole('radio', { name: new RegExp(name) }).closest('label')!
}

// Carte de correction : du contenu (ni radio ni label), retrouvée par son texte
function resultCard(text: string) {
  return screen.getByText(text).closest('[data-state]')!
}

describe('AnswerCard', () => {
  it('expose 4 boutons radio dans un groupe, aucun coché au repos', () => {
    render(<Question />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(4)
    radios.forEach((r) => expect(r).not.toBeChecked())
    expect(card('Rien')).toHaveAttribute('data-state', 'idle')
    expect(card('Rien')).toHaveClass('bg-card')
  })

  it('affiche la lettre de chaque carte, cachée aux lecteurs d\'écran', () => {
    render(<Question />)
    const badge = screen.getByText('B')
    expect(badge).toHaveAttribute('aria-hidden', 'true')
  })

  it('sélectionne une carte au clic : fond encre et radio cochée', async () => {
    render(<Question />)
    await userEvent.click(screen.getByText('Il est révoqué'))
    expect(screen.getByRole('radio', { name: 'Il est révoqué' })).toBeChecked()
    expect(card('Il est révoqué')).toHaveAttribute('data-state', 'selected')
    expect(card('Il est révoqué')).toHaveClass('bg-primary', 'text-primary-foreground')
  })

  it('contraste forcé : la carte choisie prend le fond système (le fond d\'encre disparaît sinon)', async () => {
    render(<Question />)
    await userEvent.click(screen.getByText('Il est révoqué'))
    expect(card('Il est révoqué')).toHaveClass('forced-colors:bg-[Highlight]', 'forced-colors:text-[HighlightText]')
    expect(card('Rien')).not.toHaveClass('forced-colors:bg-[Highlight]')
  })

  it('passe d\'une carte à l\'autre aux flèches du clavier', async () => {
    render(<Question />)
    await userEvent.click(screen.getByText('Il est révoqué'))
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'Il est amnistié' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Il est révoqué' })).not.toBeChecked()
  })

  it('appelle onSelect avec la valeur de la carte', async () => {
    const onSelect = vi.fn()
    render(
      <AnswerCard letter="A" name="q" value="v1" checked={false} onSelect={onSelect}>
        Texte
      </AnswerCard>,
    )
    await userEvent.click(screen.getByText('Texte'))
    expect(onSelect).toHaveBeenCalledWith('v1')
  })

  it('montre la bonne réponse en texte, icône et couleur', () => {
    render(<Question disabled initial="Il est révoqué" results={{ [ANSWERS[0]]: 'correct', 'Il est révoqué': 'wrong' }} />)
    const correct = resultCard('Il est jugé comme tout citoyen')
    expect(correct).toHaveAttribute('data-state', 'correct')
    expect(correct).toHaveClass('bg-success')
    expect(correct).toHaveTextContent('Bonne réponse')
    expect(correct.querySelector('svg')).not.toBeNull()
  })

  it('montre la réponse fausse de l\'utilisateur en texte, icône et bordure corail', () => {
    render(<Question disabled initial="Il est révoqué" results={{ [ANSWERS[0]]: 'correct', 'Il est révoqué': 'wrong' }} />)
    const wrong = resultCard('Il est révoqué')
    expect(wrong).toHaveAttribute('data-state', 'wrong')
    expect(wrong).toHaveClass('border-coral')
    expect(wrong).toHaveTextContent('Votre réponse')
    expect(wrong.querySelector('svg')).not.toBeNull()
  })

  it('rend les cartes de correction comme du contenu : aucun radio (la bonne réponse ne se lit pas « non cochée »)', () => {
    render(<Question disabled initial="Il est révoqué" results={Object.fromEntries(ANSWERS.map((a) => [a, a === ANSWERS[0] ? 'correct' : 'wrong']))} />)
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(resultCard('Il est jugé comme tout citoyen').tagName).toBe('DIV')
  })

  it('verrouille les cartes une fois la réponse validée', async () => {
    render(<Question disabled results={{ [ANSWERS[0]]: 'correct' }} />)
    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled())
    await userEvent.click(screen.getByText('Rien'))
    expect(screen.getByRole('radio', { name: 'Rien' })).not.toBeChecked()
  })

  it('garde une bordure de 3 px sur tous les états : la validation ne décale pas le contenu', () => {
    const { rerender } = render(<Question initial="Il est révoqué" />)
    for (const name of ['Il est jugé', 'Il est révoqué']) {
      expect(card(name)).toHaveClass('border-3')
      expect(card(name)).toHaveClass('border-transparent')
    }
    rerender(<Question disabled initial="Il est révoqué" results={{ [ANSWERS[0]]: 'correct', 'Il est révoqué': 'wrong' }} />)
    expect(resultCard('Il est jugé comme tout citoyen')).toHaveClass('border-3')
    expect(resultCard('Il est jugé comme tout citoyen')).toHaveClass('border-transparent')
    expect(resultCard('Il est révoqué')).toHaveClass('border-3')
    expect(resultCard('Il est révoqué')).not.toHaveClass('border-transparent')
  })
})
