import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AnswerResult = 'correct' | 'wrong'

interface AnswerCardProps {
  /** Letter shown in the round badge: A, B, C or D */
  letter: string
  /** Radio group name, shared by the 4 cards of a question */
  name: string
  value: string
  checked: boolean
  onSelect: (value: string) => void
  /** After validation: the card shows whether it was the right answer or the user's wrong answer */
  result?: AnswerResult
  /** Locked once the answer is validated */
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
  value,
  checked,
  onSelect,
  result,
  disabled = false,
  children,
}: AnswerCardProps) {
  const selected = checked && !result
  const ResultIcon = result === 'correct' ? Check : X

  return (
    <label
      data-state={result ?? (checked ? 'selected' : 'idle')}
      className={cn(
        // 3px border on every state (transparent but on « wrong ») so that validating never
        // moves the content; the padding is reduced by as much (box of the maquette: 10 / 16 / 10 / 10)
        'flex min-h-15 items-center gap-3 rounded-xl border-3 border-transparent py-[7px] pr-[13px] pl-[7px] text-left text-base leading-[1.4]',
        'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-solid',
        disabled ? 'cursor-default' : 'cursor-pointer',
        !result && !checked && 'bg-card text-card-foreground',
        !result && !checked && !disabled && 'hover:bg-muted',
        selected && 'bg-primary text-primary-foreground',
        result === 'correct' && 'bg-success text-success-foreground',
        result === 'wrong' && 'border-coral bg-card text-card-foreground',
      )}
    >
      <input
        type="radio"
        className="sr-only"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
      />
      <span
        aria-hidden="true"
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full font-bold',
          selected
            ? 'bg-action text-action-foreground'
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
    </label>
  )
}
