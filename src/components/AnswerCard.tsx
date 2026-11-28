import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AnswerResult = 'correct' | 'wrong' | 'other'

interface AnswerCardProps {
  /** Letter shown in the round badge: A, B, C or D */
  letter: string
  /** Radio group name, shared by the 4 cards of a question (selectable card only) */
  name?: string
  value?: string
  checked?: boolean
  onSelect?: (value: string) => void
  /**
   * Correction: the card shows whether it was the right answer or the user's wrong answer.
   * It is then plain content (no radio): the tag says it all, where a disabled radio read
   * « not checked » on the right answer. `other`: one of the two cards that are neither the
   * right answer nor the user's (stays in place, set back).
   */
  result?: AnswerResult
  /** Correction, right answer only: the user chose it (« Votre réponse · bonne réponse ») */
  chosen?: boolean
  /** Locked (selectable card) */
  disabled?: boolean
  children: ReactNode
}

function resultLabel(result: 'correct' | 'wrong', chosen: boolean): string {
  if (result === 'wrong') return 'Votre réponse'
  return chosen ? 'Votre réponse · bonne réponse' : 'Bonne réponse'
}

/**
 * Answer card of the journey map: a native radio (role radio, arrow keys between
 * the cards of a group) drawn as a white card with a lettered badge.
 * States: rest, selected (ink background), correct (earth green), wrong (coral border).
 * The result is always given as text + icon + colour.
 */
export function AnswerCard({
  letter,
  name,
  value = '',
  checked = false,
  onSelect,
  result,
  chosen = false,
  disabled = false,
  children,
}: AnswerCardProps) {
  const selected = checked && !result
  const ResultIcon = result === 'correct' ? Check : X
  const marked = result === 'correct' || result === 'wrong'

  const Root = result ? 'div' : 'label'

  return (
    <Root
      data-state={result ?? (checked ? 'selected' : 'idle')}
      className={cn(
        // 3px border on every state (transparent but on « wrong ») so that validating never
        // moves the content; the padding is reduced by as much (top padding in rem: room for the tag laid on the edge, on two lines at 200 % too, in both phases)
        'relative flex min-h-15 items-center gap-3 rounded-xl border-3 border-transparent pt-[1.125rem] pr-[13px] pb-[7px] pl-[7px] text-left text-base leading-[1.4]',
        'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid',
        // Press: the card sinks slightly, then fills in softly (animations on only)
        'transition-[transform,scale,background-color,color,opacity] duration-150 ease-out',
        !result && !disabled && '[:root[data-motion=on]_&]:active:scale-[0.98]',
        disabled ? 'cursor-default' : 'cursor-pointer',
        (!result || result === 'other') && !checked && 'bg-card text-card-foreground',
        result === 'other' && 'opacity-65',
        !result && !checked && !disabled && 'hover:bg-muted',
        // Forced colours (Windows high contrast) drop the background: the chosen card shows as the system highlight
        selected &&
          'bg-primary text-primary-foreground forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:[forced-color-adjust:none]',
        result === 'correct' && 'answer-correct-in bg-success text-success-foreground',
        result === 'correct' && chosen && 'answer-glow',
        result === 'wrong' && 'border-coral bg-card text-card-foreground',
      )}
    >
      {!result && (
        <input
          type="radio"
          className="sr-only"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={() => onSelect?.(value)}
        />
      )}
      {marked && (
        <span
          className={cn(
            // Tag laid on the top edge, out of the flow: the card never changes height
            // Centred on the top edge (rem only, it follows the enlarged text), may wrap, never wider than the card
            'absolute top-0 right-3.5 max-w-[calc(100%-1.75rem)] -translate-y-1/2 rounded-full px-2.5 py-0.5 text-right text-xs leading-[1.15] font-bold whitespace-normal',
            result === 'correct' ? 'bg-foreground text-background' : 'bg-coral text-coral-foreground',
          )}
        >
          {resultLabel(result, chosen)}
        </span>
      )}
      <span
        aria-hidden="true"
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full font-bold',
          selected
            ? 'bg-action text-action-foreground forced-colors:bg-[HighlightText] forced-colors:text-[Highlight]'
            : marked
              ? 'bg-foreground text-background'
              : 'border-2 border-current',
          result === 'correct' && 'answer-mark-pop',
        )}
      >
        {marked ? <ResultIcon className="size-[1.125em]" strokeWidth={2.6} /> : letter}
      </span>
      <span className="min-w-0">{children}</span>
    </Root>
  )
}
