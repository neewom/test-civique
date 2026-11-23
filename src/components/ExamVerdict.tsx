import { ArrowRight, Check } from 'lucide-react'
import { isPassed, passThreshold } from '@/lib/exam'
import { cn } from '@/lib/utils'

interface ExamVerdictProps {
  score: number
  total: number
  // 'full' : écran de résultat (pastille + ligne d'aide) ; 'compact' : détail d'un examen
  variant?: 'full' | 'compact'
}

export function ExamVerdict({ score, total, variant = 'full' }: ExamVerdictProps) {
  const passed = isPassed(score, total)
  const threshold = passThreshold(total)
  const thresholdLabel = `${threshold}/${total}`
  const missing = threshold - score
  const Icon = passed ? Check : ArrowRight
  const label = passed ? 'Réussi' : 'Pas encore réussi'
  const compact = variant === 'compact'

  return (
    <div className={cn('flex flex-col items-center', compact ? 'gap-1' : 'gap-1.5')}>
      <p
        className={cn(
          'inline-flex max-w-full items-center justify-center gap-2 rounded-full font-semibold',
          compact ? 'px-3 py-1 text-sm' : 'px-4 py-2 text-base',
          passed
            ? 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300'
            : 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
        )}
      >
        <Icon
          aria-hidden="true"
          className={cn('shrink-0', compact ? 'size-[1em]' : 'size-[1.125em]')}
          strokeWidth={2.4}
        />
        <span className="text-center">
          {label}
          {compact && (
            <>
              {'\u00a0· '}
              <span className="whitespace-nowrap">seuil {thresholdLabel}</span>
            </>
          )}
        </span>
      </p>
      {!compact && (
        <p className="text-sm text-muted-foreground">
          {passed
            ? `Seuil de réussite : ${thresholdLabel}`
            : `Encore ${missing} bonne${missing > 1 ? 's' : ''} réponse${missing > 1 ? 's' : ''} pour atteindre ${thresholdLabel}`}
        </p>
      )}
    </div>
  )
}
