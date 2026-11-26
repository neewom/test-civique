import { Check, CircleDot, ExternalLink, Info, ListChecks, Target, Timer } from 'lucide-react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { BackLink } from '@/components/BackLink'
import { OrganicBackground } from '@/components/OrganicBackground'
import { PillButton } from '@/components/PillButton'
import { EXAM_SIZE, passThreshold } from '@/lib/exam'
import { FICHES, FICHE_LABELS, titleOfSlug } from '@/lib/fiches'
import { hasProgress } from '@/lib/exam-types'
import { loadHistory } from '@/lib/history'
import { DEFAULT_TITLE, TARGET_TITLES, loadTargetTitle, saveTargetTitle, type TargetTitle, type TitleKey } from '@/lib/target-title'
import { useDocumentTitle } from '@/lib/use-document-title'
import { cn } from '@/lib/utils'

/** « Tout savoir sur ce titre »: one page per title (maquette). */
export default function FicheTitre() {
  const { slug } = useParams()
  const key = titleOfSlug(slug)
  if (!key) return <Navigate to="/" replace />
  return <Fiche titleKey={key} />
}

function Fiche({ titleKey }: { titleKey: TitleKey }) {
  const fiche = FICHES[titleKey]
  const label = FICHE_LABELS[titleKey]
  useDocumentTitle(label)
  const navigate = useNavigate()
  const location = useLocation()
  const target = (TARGET_TITLES as readonly string[]).includes(titleKey) ? (titleKey as TargetTitle) : null
  // Same rule as the home page: an existing user without a stored title has the default one
  const stored = loadTargetTitle()
  const existingUser = loadHistory().length > 0 || hasProgress()
  const chosen = stored ?? (existingUser ? DEFAULT_TITLE : null)
  const alreadyChosen = target !== null && chosen === target
  // First pass (nothing chosen, nothing known): the page is not one to come back to
  const firstPass = chosen === null

  const marks = [
    { icon: ListChecks, value: String(EXAM_SIZE), label: 'questions' },
    { icon: Timer, value: '45 min', label: 'au maximum' },
    { icon: CircleDot, value: '4 choix', label: 'une seule bonne réponse' },
    { icon: Target, value: `${passThreshold(EXAM_SIZE)}/${EXAM_SIZE}`, label: 'pour réussir', highlight: true },
  ]
  const h2 = 'text-[1.0625rem] font-bold'
  const body = 'text-[0.9375rem] leading-snug md:text-base md:leading-normal'

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-background text-foreground">
      <OrganicBackground shape="goal" />
      <AppHeader />
      <div className="relative mx-auto flex w-full max-w-[30rem] flex-col gap-3 px-[22px] pt-0 pb-8 md:max-w-[36rem] md:gap-3.5 md:px-8 md:pb-10">
        <BackLink
          onClick={(e) => {
            // Back to the page we came from (first visit, change of title, home)
            if (location.key !== 'default') {
              e.preventDefault()
              navigate(-1)
            }
          }}
        />
        <div className="flex flex-col items-start gap-2">
          <h1 className="text-[2.375rem] leading-[0.98] font-bold tracking-[-0.04em] text-balance break-words hyphens-auto md:text-[3rem]">
            {label}
          </h1>
          <p className="text-[1.0625rem] leading-snug font-bold">{fiche.summary}</p>
          {fiche.details.map((d) => (
            <p key={d} className={body}>
              {d}
            </p>
          ))}
        </div>

        <div className="mt-1 flex flex-col items-start gap-1">
          {target ? (
            <PillButton
              size="lg"
              className="w-full justify-center text-center"
              onClick={() => {
                saveTargetTitle(target)
                navigate('/', { replace: firstPass })
              }}
            >
              {alreadyChosen ? 'Continuer mon entraînement' : "M'entraîner pour ce titre"}
            </PillButton>
          ) : (
            <span className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-card px-5 text-center text-base font-bold text-card-foreground">
              Entraînement bientôt disponible
            </span>
          )}
        </div>

        <section aria-labelledby="needs" className="mt-2 flex flex-col gap-2">
          <h2 id="needs" className={h2}>
            Ce qu'il faut
          </h2>
          <ul className="flex flex-col gap-2.5 rounded-2xl bg-card p-3.5 text-card-foreground md:p-4">
            {fiche.needs.map((n) => (
              <li key={n} className={cn('flex items-start gap-3', body)}>
                <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success dark:text-primary" strokeWidth={2.8} />
                <span>{n}</span>
              </li>
            ))}
          </ul>
          <p className={cn('flex items-start gap-3 px-1', body)}>
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" strokeWidth={2.2} />
            <span>{fiche.needsNote}</span>
          </p>
        </section>

        <section aria-labelledby="exam" className="mt-2 flex flex-col gap-2">
          <h2 id="exam" className={h2}>
            L'examen civique pour ce titre
          </h2>
          <ul className="grid grid-cols-1 gap-2 min-[22rem]:grid-cols-2">
            {marks.map(({ icon: Icon, value, label: l, highlight }) => (
              <li
                key={l}
                className={cn(
                  'flex min-h-[5.75rem] flex-col justify-between gap-1.5 rounded-2xl p-3 md:min-h-[6.75rem] md:p-3.5',
                  highlight ? 'bg-success text-success-foreground' : 'bg-card text-card-foreground',
                )}
              >
                <Icon aria-hidden="true" className="size-5 md:size-6" strokeWidth={2.2} />
                <span className="flex flex-col">
                  <span className="text-[1.5rem] leading-tight font-bold tracking-[-0.02em] tabular-nums md:text-[1.625rem]">
                    {value}
                  </span>
                  <span className="text-[0.875rem] leading-snug md:text-[0.9375rem]">{l}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-3 rounded-2xl bg-card px-3.5 py-3 text-card-foreground">
            <span className="text-[1.5rem] leading-tight font-bold tracking-[-0.02em] tabular-nums">
              {fiche.examQuestions}
            </span>
            <span className="text-[0.9375rem] leading-snug">questions dans la liste officielle de ce titre</span>
          </p>
          {fiche.examParas.map((p) => (
            <p key={p} className={cn('px-1', body)}>
              {p}
            </p>
          ))}
        </section>

        <section aria-labelledby="good" className="mt-2 flex flex-col gap-2">
          <h2 id="good" className={h2}>
            Bon à savoir
          </h2>
          <ul className="flex flex-col divide-y divide-border rounded-2xl bg-card px-3.5 text-card-foreground md:px-4">
            {fiche.goodToKnow.map((g) => (
              <li key={g} className={cn('py-3', body)}>
                {g}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="more" className="mt-2 flex flex-col gap-2">
          <h2 id="more" className={h2}>
            Pour aller plus loin
          </h2>
          <ul className="flex flex-col gap-2">
            {fiche.links.map((l) => (
              <li key={l.url}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-14 items-center justify-between gap-3 rounded-[2rem] bg-card py-2 pr-3 pl-5 text-card-foreground no-underline"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="text-base leading-snug font-bold">{l.label}</span>
                    <span className="text-[0.8125rem] break-all text-muted-foreground">{new URL(l.url).hostname.replace('www.', '')}</span>
                  </span>
                  <ExternalLink aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.2} />
                  <span className="sr-only">(nouvel onglet)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-2 px-1 text-sm text-muted-foreground">
          Les conditions dépendent de votre situation. Vérifiez sur service-public.gouv.fr.
        </p>
      </div>
    </main>
  )
}
