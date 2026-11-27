import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AnswerResult = 'correct' | 'wrong'

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
   * It is then plain content (no radio): « Bonne réponse » / « Votre réponse » says it all,
   * where a disabled radio read « not checked » on the right answer.
   */
  result?: AnswerResult
  /** Locked (selectable card) */
  disabled?: boolean
  children: ReactNode
}

const RESULT_LABEL: Record<AnswerResult, string> = {
  correct: 'Bonne réponse',
  wrong: 'Votre réponse',
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
  disabled = false,
  children,
}: AnswerCardProps) {
  const selected = checked && !result
  const ResultIcon = result === 'correct' ? Check : X

  const Root = result ? 'div' : 'label'

  return (
    <Root
      data-state={result ?? (checked ? 'selected' : 'idle')}
      className={cn(
        // 3px border on every state (transparent but on « wrong ») so that validating never
        // moves the content; the padding is reduced by as much (box of the maquette: 10 / 16 / 10 / 10)
        'flex min-h-15 items-center gap-3 rounded-xl border-3 border-transparent py-[7px] pr-[13px] pl-[7px] text-left text-base leading-[1.4]',
        'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid',
        disabled ? 'cursor-default' : 'cursor-pointer',
        !result && !checked && 'bg-card text-card-foreground',
        !result && !checked && !disabled && 'hover:bg-muted',
        // Forced colours (Windows high contrast) drop the background: the chosen card shows as the system highlight
        selected &&
          'bg-primary text-primary-foreground forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:[forced-color-adjust:none]',
        result === 'correct' && 'bg-success text-success-foreground',
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
      <span
        aria-hidden="true"
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full font-bold',
          selected
            ? 'bg-action text-action-foreground forced-colors:bg-[HighlightText] forced-colors:text-[Highlight]'
            : result
              ? 'bg-foreground text-background'
              : 'border-2 border-current',
        )}
      >
        {result ? <ResultIcon className="size-[1.125em]" strokeWidth={2.6} /> : letter}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        {result && <span className="text-[0.8125rem] font-bold">{RESULT_LABEL[result]}</span>}
        <span>{children}</span>
      </span>
    </Root>
  )
}
