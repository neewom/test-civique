import { isPassed, passThreshold } from '@/lib/exam'
import { Verdict } from '@/components/Verdict'
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
  const label = passed ? 'Réussi' : 'Pas encore réussi'
  const compact = variant === 'compact'

  return (
    <div className={cn('flex flex-col items-center', compact ? 'gap-1' : 'gap-1.5')}>
      <Verdict tone={passed ? 'success' : 'pending'} size={compact ? 'default' : 'lg'}>
        {label}
        {compact && (
          <>
            {' · '}
            <span className="whitespace-nowrap">seuil {thresholdLabel}</span>
          </>
        )}
      </Verdict>
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
