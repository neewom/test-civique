import type { ReactNode } from 'react'
import { ArrowRight, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type VerdictTone = 'success' | 'error' | 'pending'

interface VerdictProps {
  /** success: passed / right answer · error: wrong answer · pending: not passed yet (reassuring, not an error) */
  tone: VerdictTone
  /** default: answer feedback (40px) · lg: exam result (44px) */
  size?: 'default' | 'lg'
  className?: string
  children: ReactNode
}

// Pill and round icon colours, per tone (maquettes Pa5 / Pa6, Pd5 / Pd6)
const TONE: Record<VerdictTone, { pill: string; icon: string; Icon: typeof Check }> = {
  success: { pill: 'bg-primary text-primary-foreground', icon: 'bg-action text-action-foreground', Icon: Check },
  error: { pill: 'bg-coral text-coral-foreground', icon: 'bg-coral-foreground text-coral', Icon: X },
  pending: { pill: 'bg-card text-card-foreground', icon: 'bg-primary text-primary-foreground', Icon: ArrowRight },
}

/** Verdict pill: always text + icon + colour, announced as a status. */
export function Verdict({ tone, size = 'default', className, children }: VerdictProps) {
  const { pill, icon, Icon } = TONE[tone]
  const large = size === 'lg'

  return (
    <p
      role="status"
      data-tone={tone}
      className={cn(
        // Radius = half the minimum height: a pill on one line, a rounded block when wrapped
        'inline-flex max-w-full items-center gap-2 py-1.5 pl-2 font-bold',
        large ? 'min-h-11 rounded-[1.375rem] pr-[1.125rem] text-lg' : 'min-h-10 rounded-[1.25rem] pr-4 text-base',
        pill,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full',
          large ? 'size-[1.875rem]' : 'size-7',
          icon,
        )}
      >
        <Icon className="size-[1em]" strokeWidth={2.8} />
      </span>
      <span className="min-w-0">{children}</span>
    </p>
  )
}
