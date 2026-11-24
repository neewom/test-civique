import { isPassed, passThreshold } from '@/lib/exam'
import { Verdict } from '@/components/Verdict'
import { cn } from '@/lib/utils'

interface ExamVerdictProps {
  score: number
  total: number
  // 'full' : écran de résultat (grande pastille + ligne d'aide si pas encore réussi) ; 'compact' : détail d'un examen
  variant?: 'full' | 'compact'
}

/** « Réussi · seuil 32/40 » or « Pas encore réussi · seuil 32/40 » (maquettes Pa6 / Pd6). */
export function ExamVerdict({ score, total, variant = 'full' }: ExamVerdictProps) {
  const passed = isPassed(score, total)
  const threshold = passThreshold(total)
  const thresholdLabel = `${threshold}/${total}`
  const missing = threshold - score
  const label = passed ? 'Réussi' : 'Pas encore réussi'
  const compact = variant === 'compact'

  return (
    <div className={cn('flex flex-col items-start', compact ? 'gap-1' : 'gap-2')}>
      <Verdict tone={passed ? 'success' : 'pending'} size={compact ? 'default' : 'lg'}>
        {label}
        {' · '}
        <span className="whitespace-nowrap">seuil {thresholdLabel}</span>
      </Verdict>
      {!compact && !passed && (
        <p className="text-base">
          {`Encore ${missing} bonne${missing > 1 ? 's' : ''} réponse${missing > 1 ? 's' : ''} pour atteindre ${thresholdLabel}`}
        </p>
      )}
    </div>
  )
}
