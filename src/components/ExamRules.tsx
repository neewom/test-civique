import { useId, useState } from 'react'
import { ArrowUpRight, ChevronDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// Source : arrêté du 10 octobre 2025, art. 1 à 4 et annexes
export const LEGIFRANCE_URL = 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000052381620'

const KEY_FIGURES = [
  { value: '40', label: 'questions' },
  { value: '45 min', label: 'au maximum' },
  { value: '32/40', label: 'pour réussir' },
]

const THEME_SPLIT = [
  { theme: 'Principes et valeurs de la République', count: '11, dont 6 situations' },
  { theme: 'Système institutionnel et politique', count: '6' },
  { theme: 'Droits et devoirs', count: '11, dont 6 situations' },
  { theme: 'Histoire, géographie et culture', count: '8' },
  { theme: 'Vivre dans la société française', count: '4' },
]

export function ExamRules() {
  const [open, setOpen] = useState(false)
  const contentId = useId()

  return (
    <section aria-label="Règles de l'examen" className="rounded-xl border border-border bg-card text-left">
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-xl px-4 py-4 text-left text-base font-semibold text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a56db]',
            open && 'rounded-b-none',
          )}
        >
          <span className="flex items-center gap-2.5">
            <Info aria-hidden="true" className="size-[1.25em] shrink-0" strokeWidth={1.8} />
            Comment se passe l'examen
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn('size-[1em] shrink-0 transition-transform duration-200', open && 'rotate-180')}
            strokeWidth={2}
          />
        </button>
      </h2>

      {open && (
        <div id={contentId} className="flex flex-col gap-4 px-4 pb-4 text-sm leading-relaxed text-foreground">
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-2" aria-label="L'examen en bref">
            {KEY_FIGURES.map((f) => (
              <li key={f.label} className="flex flex-col gap-0.5 rounded-lg bg-muted px-1.5 py-2.5 text-center">
                <span className="text-xl font-semibold tabular-nums">{f.value}</span>
                <span className="text-xs text-muted-foreground">{f.label}</span>
              </li>
            ))}
          </ul>

          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            <li>QCM en français, sur ordinateur : 4 choix, une seule bonne réponse.</li>
            <li>1 point par bonne réponse. Une erreur ou une absence de réponse vaut 0 : pas de point en moins.</li>
            <li>Réussite à 80 % de bonnes réponses, soit 32 sur 40.</li>
            <li>Des aménagements sont possibles pour les personnes en situation de handicap.</li>
          </ul>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold">Répartition des 40 questions</h3>
            <dl className="flex flex-col">
              {THEME_SPLIT.map((t, i) => (
                <div
                  key={t.theme}
                  className={cn(
                    'flex flex-wrap justify-between gap-x-3 py-1.5',
                    i < THEME_SPLIT.length - 1 && 'border-b border-border',
                  )}
                >
                  <dt>{t.theme}</dt>
                  <dd className="ml-auto text-right text-muted-foreground">{t.count}</dd>
                </div>
              ))}
            </dl>
          </div>

          <a
            href={LEGIFRANCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 self-start text-[0.8125rem] text-[#1a56db] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a56db] rounded-sm dark:text-blue-400"
          >
            Source : arrêté du 10 octobre 2025 (Légifrance)
            <ArrowUpRight aria-hidden="true" className="size-[1em] shrink-0" />
            <span className="sr-only">(nouvel onglet)</span>
          </a>
        </div>
      )}
    </section>
  )
}
