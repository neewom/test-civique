import type { ThemeProgressSummary } from '@/lib/exam-review'
import { themeLabel } from '@/lib/themes'
import { cn } from '@/lib/utils'

function subtitle(examCount: number): string {
  if (examCount === 1) return 'Bonnes réponses sur votre dernier examen blanc'
  return `Bonnes réponses sur vos ${examCount} derniers examens blancs`
}

/**
 * « Vos thèmes » on the home page: right answers per official theme over the last practice exams,
 * weakest first. A theme under 80 % is flagged three ways (coral bar, bold label, « À travailler »
 * written out), never by colour alone.
 */
export function ThemeProgressCard({ summary, className }: { summary: ThemeProgressSummary; className?: string }) {
  return (
    <section aria-labelledby="theme-progress" className={cn('flex flex-col gap-2.5', className)}>
      <div className="flex flex-col gap-0.5">
        <h2 id="theme-progress" className="text-[1.0625rem] font-bold">
          Vos thèmes
        </h2>
        <p className="text-[0.9375rem] leading-normal text-muted-foreground">{subtitle(summary.examCount)}</p>
      </div>
      <ul className="flex flex-col gap-4 rounded-xl bg-card px-4 py-4 text-card-foreground">
        {summary.themes.map((t) => (
          <li key={t.theme} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className={cn('min-w-0 leading-snug', t.toWork && 'font-bold')}>{themeLabel(t.theme)}</span>
              <span className="shrink-0 font-bold tabular-nums">{t.percent}&nbsp;%</span>
            </div>
            <div aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full', t.toWork ? 'bg-coral' : 'bg-primary')}
                style={{ width: `${t.percent}%` }}
              />
            </div>
            {t.toWork && <span className="text-[0.875rem] font-bold">À travailler</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
