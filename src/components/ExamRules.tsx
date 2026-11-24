import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Source : arrêté du 10 octobre 2025, art. 1 à 4 et annexes
export const LEGIFRANCE_URL = 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000052381620'

const KEY_FIGURES = [
  { value: '40', label: 'questions' },
  { value: '45 min', label: 'au maximum' },
  { value: '32/40', label: 'pour réussir', highlight: true },
]

const THEME_SPLIT = [
  { theme: 'Principes et valeurs de la République', count: '11, dont 6 situations' },
  { theme: 'Système institutionnel et politique', count: '6' },
  { theme: 'Droits et devoirs', count: '11, dont 6 situations' },
  { theme: 'Histoire, géographie et culture', count: '8' },
  { theme: 'Vivre dans la société française', count: '4' },
]

/** Official exam rules (maquette Pa3), shown on the « Comment se passe l'examen » page. */
export function ExamRules() {
  return (
    <div className="flex flex-col gap-4 text-base leading-relaxed">
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2" aria-label="L'examen en bref">
        {KEY_FIGURES.map((f) => (
          <li
            key={f.label}
            className={cn(
              'flex flex-col gap-0.5 rounded-xl px-3 py-3.5',
              f.highlight ? 'bg-success text-success-foreground' : 'bg-card text-card-foreground',
            )}
          >
            <span className="text-2xl leading-tight font-bold tabular-nums">{f.value}</span>
            <span className="text-sm">{f.label}</span>
          </li>
        ))}
      </ul>

      <ul className="mt-1.5 flex list-disc flex-col gap-2 pl-5">
        <li>QCM en français, sur ordinateur : 4 choix, une seule bonne réponse.</li>
        <li>1 point par bonne réponse. Une erreur ou une absence de réponse vaut 0 : pas de point en moins.</li>
        <li>Réussite à 80 % de bonnes réponses, soit 32 sur 40.</li>
        <li>Des aménagements sont possibles pour les personnes en situation de handicap.</li>
      </ul>

      <section aria-labelledby="exam-rules-split" className="flex flex-col gap-2 rounded-xl bg-card p-4 text-card-foreground">
        <h2 id="exam-rules-split" className="text-[1.0625rem] leading-snug font-bold">
          Répartition des 40 questions
        </h2>
        <dl className="flex flex-col gap-2 text-[0.9375rem]">
          {THEME_SPLIT.map((t) => (
            <div key={t.theme} className="flex flex-wrap justify-between gap-x-3">
              <dt>{t.theme}</dt>
              <dd className="ml-auto text-right font-bold">{t.count}</dd>
            </div>
          ))}
        </dl>
      </section>

      <a
        href={LEGIFRANCE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="min-h-11 self-start rounded-sm py-2.5 text-[0.9375rem] leading-snug font-bold underline underline-offset-4"
      >
        Source officielle : arrêté du 10 octobre 2025 (Légifrance)
        <ArrowUpRight aria-hidden="true" className="ml-1 inline-block size-[1em] align-[-0.125em]" />
        <span className="sr-only">(nouvel onglet)</span>
      </a>
    </div>
  )
}
