import { Check, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type AnswerBoxTone = 'right' | 'wrong' | 'none'

/** Answer shown after the fact (exam detail, revision): label with icon, then the answer. */
export function AnswerBox({ tone, label, children }: { tone: AnswerBoxTone; label: string; children: ReactNode }) {
  const Icon = tone === 'right' ? Check : X
  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 rounded-xl px-3 py-2.5',
        tone === 'right' && 'bg-success text-success-foreground',
        // 3px border, padding reduced by as much (box of the maquette: 10 / 12)
        tone === 'wrong' && 'border-3 border-coral px-[9px] py-[7px]',
        tone === 'none' && 'bg-muted',
      )}
    >
      <span className="inline-flex items-center gap-1 text-[0.8125rem] font-bold">
        <Icon aria-hidden="true" className="size-[1.1em] shrink-0" strokeWidth={2.8} />
        {label}
      </span>
      <div className={cn('text-base', tone === 'none' && 'italic')}>{children}</div>
    </div>
  )
}
