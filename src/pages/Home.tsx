import { useId, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { isPassed } from '@/lib/exam'
import { loadProgress, clearProgress, resumeIndex } from '@/lib/exam-types'
import type { ExamInProgress } from '@/lib/exam-types'
import { loadHistory, type HistoryEntry } from '@/lib/history'
import { passedInARow, READY_GOAL } from '@/lib/readiness'
import { loadTargetTitle, TARGET_TITLE_LABELS } from '@/lib/target-title'
import { BrandLogo } from '@/components/BrandLogo'
import { ThemeSwitch } from '@/components/ThemeSwitch'
import { OrganicBackground } from '@/components/OrganicBackground'
import { PillButton, PillLink } from '@/components/PillButton'
import { useDocumentTitle } from '@/lib/use-document-title'
import { cn } from '@/lib/utils'

export const OFFICIAL_SITE_URL = 'https://formation-civique.interieur.gouv.fr'

interface HomeLocationState {
  // Set by the exam rules page (« M'entraîner maintenant »): opens the exam choice
  openExam?: boolean
}

// Journey steps that are not links (yet): same pill shape, no interaction
const staticStepClass =
  'inline-flex min-h-12 max-w-full items-center gap-2.5 rounded-[1.5rem] px-[1.125rem] py-1.5 text-base font-bold'

function minutesLeftLabel(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  return `${minutes} min ${minutes > 1 ? 'restantes' : 'restante'}`
}

function RecentExam({ entry }: { entry: HistoryEntry }) {
  const passed = isPassed(entry.score, entry.total)
  const d = new Date(entry.date)
  const dateLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeLabel = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const content = (
    <>
      <span className="flex min-w-0 flex-col">
        <span className="font-bold">
          {dateLabel}
          <span className="font-normal text-muted-foreground"> · {timeLabel}</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-2 text-[0.9375rem]">
          <span className="font-bold tabular-nums">
            {entry.score}/{entry.total}
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              aria-hidden="true"
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full',
                passed ? 'bg-action text-action-foreground' : 'bg-muted text-foreground',
              )}
            >
              {passed ? (
                <Check className="size-3" strokeWidth={3} />
              ) : (
                <ArrowRight className="size-3" strokeWidth={3} />
              )}
            </span>
            {passed ? 'Réussi' : 'Pas encore réussi'}
          </span>
        </span>
      </span>
      {entry.id && <ChevronRight aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.4} />}
    </>
  )

  const boxClass = 'flex min-h-16 items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 text-card-foreground'

  return (
    <li>
      {entry.id ? (
        <Link to={`/examen/${entry.id}`} className={cn(boxClass, 'no-underline transition-colors hover:bg-muted')}>
          {content}
        </Link>
      ) : (
        <div className={boxClass}>{content}</div>
      )}
    </li>
  )
}

export default function Home() {
  useDocumentTitle('Accueil')
  const navigate = useNavigate()
  const location = useLocation()
  const examChoiceId = useId()

  const [history] = useState(() => loadHistory())
  const [inProgress, setInProgress] = useState<ExamInProgress | null>(() => loadProgress())
  const [examExpanded, setExamExpanded] = useState(
    () => (location.state as HomeLocationState | null)?.openExam === true,
  )
  // First launch: no title chosen yet. Someone who already has exams (history or an
  // exam in progress, from before the title screen existed) keeps the multi-year
  // permit, the only title available, so the resume stays one tap away.
  const [storedTitle] = useState(() => loadTargetTitle())
  const [mustChooseTitle] = useState(() => storedTitle === null && history.length === 0 && inProgress === null)

  if (mustChooseTitle) return <Navigate to="/titre" replace state={{ firstLaunch: true }} />

  const targetTitle = storedTitle ?? 'pluriannuelle'
  const streak = passedInARow(history)
  const recent = history.slice(-3).reverse()

  // Question the exam will resume on (1-based), capped when every answer is given
  const resumeQuestion = inProgress
    ? Math.min(resumeIndex(inProgress), inProgress.questions.length - 1) + 1
    : 0

  function handleDeleteProgress() {
    clearProgress()
    setInProgress(null)
  }

  function startExam(excludeSituational: boolean) {
    navigate('/examen', { state: { start: 'new', excludeSituational } })
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <OrganicBackground shape="journey" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-[30rem] flex-col gap-3 px-[22px] pt-5 pb-6">
        <header className="flex min-h-11 items-center justify-between gap-3">
          <span className="min-w-0 text-xl font-bold">
            <BrandLogo />
          </span>
          <ThemeSwitch />
        </header>

        <PillLink
          to="/titre"
          tone="surface"
          end={<ChevronDown strokeWidth={2.6} />}
          className="min-h-11 self-start text-[0.9375rem]"
        >
          <span className="sr-only">Titre visé : </span>
          {TARGET_TITLE_LABELS[targetTitle]}
          <span className="sr-only"> (changer)</span>
        </PillLink>

        <h1 className="mt-[1.125rem] max-w-[18.75rem] text-[2.375rem] leading-[0.98] font-bold tracking-[-0.04em] text-balance">
          Votre chemin vers le jour J
        </h1>

        <nav aria-label="Votre parcours" className="mt-[clamp(1.5rem,6svh,3.25rem)]">
          <ol className="flex flex-col items-start gap-3">
            <li className="max-w-full">
              <PillLink to="/revision" tone="surface" end={<ArrowRight strokeWidth={2.6} />}>
                1 · Réviser les thèmes
              </PillLink>
            </li>

            <li className="flex w-full flex-col items-start">
              <PillButton
                size="lg"
                aria-expanded={examExpanded}
                aria-controls={examChoiceId}
                onClick={() => setExamExpanded((v) => !v)}
                end={`${streak} sur ${READY_GOAL}`}
                endIsText
                // The label wraps first (9rem basis); only with enlarged text, when even
                // that basis no longer fits, does the counter go below instead of overflowing
                className="max-w-full flex-wrap [&>span:first-child]:grow [&>span:first-child]:basis-36"
              >
                2 · Réussir {READY_GOAL} examens blancs
              </PillButton>
              <div
                id={examChoiceId}
                aria-hidden={!examExpanded}
                inert={!examExpanded}
                className={cn(
                  'grid w-full transition-[grid-template-rows] duration-200 motion-reduce:transition-none',
                  examExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col items-start gap-2 pt-2 pl-5">
                    <PillButton tone="surface" onClick={() => startExam(true)} end={<ArrowRight strokeWidth={2.6} />}>
                      <span className="flex flex-col">
                        <span>Questions classiques</span>
                        <span className="text-[0.8125rem] font-normal">191 questions officielles</span>
                      </span>
                    </PillButton>
                    <PillButton tone="surface" onClick={() => startExam(false)} end={<ArrowRight strokeWidth={2.6} />}>
                      <span className="flex flex-col">
                        <span>Avec mises en situation</span>
                        <span className="text-[0.8125rem] font-normal">191 questions + 100 mises en situation</span>
                      </span>
                    </PillButton>
                  </div>
                </div>
              </div>
            </li>

            <li className="max-w-full">
              <span className={cn(staticStepClass, 'flex-wrap bg-card text-card-foreground')}>
                3 · Trouver un centre d'examen
                <span className="rounded-full bg-muted px-2.5 text-[0.8125rem] leading-6 font-bold">bientôt</span>
              </span>
            </li>

            <li className="max-w-full">
              <span className={cn(staticStepClass, 'bg-goal text-goal-foreground')}>4 · Le jour J</span>
            </li>
          </ol>
        </nav>

        <div className="mt-auto flex flex-col gap-2.5 pt-8">
          {inProgress && (
            <section aria-label="Examen en cours" className="flex flex-col items-start gap-1">
              <PillLink to="/examen" tone="ink" size="lg" end={<ArrowRight strokeWidth={2.6} />} className="w-full">
                <span className="flex flex-col">
                  <span className="text-base">Reprendre l'examen en cours</span>
                  <span className="text-[0.8125rem] font-normal opacity-85">
                    Question {resumeQuestion} sur {inProgress.questions.length} ·{' '}
                    {minutesLeftLabel(inProgress.timeLeft)}
                  </span>
                </span>
              </PillLink>
              <button
                type="button"
                onClick={handleDeleteProgress}
                className="min-h-11 rounded-sm px-1 text-left text-[0.875rem] underline underline-offset-4"
              >
                Supprimer l'examen en cours
              </button>
            </section>
          )}

          <Link
            to="/regles"
            className="inline-flex min-h-11 items-center self-start rounded-sm text-[0.9375rem] font-bold underline underline-offset-4"
          >
            Comment se passe l'examen ?
          </Link>
        </div>

        {recent.length > 0 && (
          <section aria-labelledby="recent-exams" className="mt-4 flex flex-col gap-2.5">
            <h2 id="recent-exams" className="text-[1.0625rem] font-bold">
              Derniers examens
            </h2>
            <ul className="flex flex-col gap-2">
              {recent.map((entry, i) => (
                <RecentExam key={entry.id ?? `${entry.date}-${i}`} entry={entry} />
              ))}
            </ul>
          </section>
        )}

        <p className="mt-2 text-xs leading-relaxed">
          Site indépendant, non officiel. Informations officielles sur{' '}
          <a
            href={OFFICIAL_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm break-words underline underline-offset-4"
          >
            formation-civique.interieur.gouv.fr
          </a>
        </p>
        <Link
          to="/mentions-legales"
          className="inline-flex min-h-11 items-center self-start rounded-sm text-xs underline underline-offset-4"
        >
          Mentions légales et confidentialité
        </Link>
      </div>
    </main>
  )
}
