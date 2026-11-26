import { useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, ChevronRight, MonitorSmartphone } from 'lucide-react'
import { EXAM_SIZE, isPassed, passThreshold } from '@/lib/exam'
import { hasProgress, loadProgressForTitle, clearProgress, resumeIndex } from '@/lib/exam-types'
import type { ExamInProgress } from '@/lib/exam-types'
import { loadHistory, loadHistoryForTitle, type HistoryEntry } from '@/lib/history'
import { passedInARow, READY_GOAL } from '@/lib/readiness'
import { DEFAULT_TITLE, loadTargetTitle, TARGET_TITLE_LABELS } from '@/lib/target-title'
import { BrandLogo } from '@/components/BrandLogo'
import { ThemeSwitch } from '@/components/ThemeSwitch'
import { OrganicBackground } from '@/components/OrganicBackground'
import { PillButton, PillLink } from '@/components/PillButton'
import { GLOBAL_EXAM_TIME } from '@/pages/Examen'
import { useDocumentTitle } from '@/lib/use-document-title'
import { useWideScreen } from '@/lib/use-wide-screen'
import { cn } from '@/lib/utils'

export const OFFICIAL_SITE_URL = 'https://formation-civique.interieur.gouv.fr'

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

interface ProgressPanelProps {
  streak: number
  recentExams: ReactNode
  rulesLink: ReactNode
}

/**
 * Right column of the home page from 1024 px. With exams: the « n sur 3 » counter in large,
 * the last exams and the rules. Without any: what the exam day holds, in a card.
 */
function ProgressPanel({ streak, recentExams, rulesLink }: ProgressPanelProps) {
  if (!recentExams) {
    const facts = [
      { value: String(EXAM_SIZE), label: 'questions à choix multiples' },
      { value: `${GLOBAL_EXAM_TIME / 60} min`, label: 'pour tout le questionnaire' },
      { value: String(passThreshold(EXAM_SIZE)), label: 'bonnes réponses pour réussir' },
    ]
    return (
      <section
        aria-labelledby="exam-day"
        className="mt-[4.25rem] flex flex-col gap-4 rounded-2xl bg-card p-6 text-card-foreground"
      >
        <h2 id="exam-day" className="text-[1.375rem] leading-tight font-bold">
          Ce qui vous attend le jour J
        </h2>
        <dl className="flex flex-col gap-3">
          {facts.map(({ value, label }) => (
            <div key={label} className="flex flex-wrap items-baseline gap-x-3">
              <dt className="min-w-[5.5rem] text-[1.75rem] leading-none font-bold tracking-[-0.03em] tabular-nums">
                {value}
              </dt>
              <dd className="text-[0.9375rem]">{label}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[0.9375rem] leading-normal">
          Vos examens blancs s'afficheront ici, avec votre progression vers les {READY_GOAL} réussites d'affilée.
        </p>
        {rulesLink}
      </section>
    )
  }

  const left = READY_GOAL - streak
  return (
    <section aria-labelledby="progress" className="mt-[4.25rem] flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 id="progress" className="text-[1.0625rem] font-bold">
          Où vous en êtes
        </h2>
        <p className="text-[0.9375rem] leading-normal">
          <span className="mb-1 block text-[3.5rem] leading-none font-bold tracking-[-0.04em] tabular-nums">
            {streak} sur {READY_GOAL}
          </span>{' '}
          {left > 0
            ? `examens blancs réussis d'affilée. Encore ${left} pour atteindre l'objectif.`
            : "examens blancs réussis d'affilée : objectif atteint."}
        </p>
      </div>
      {recentExams}
      {rulesLink}
    </section>
  )
}

export default function Home() {
  useDocumentTitle('Accueil')
  const navigate = useNavigate()

  // First launch: no title chosen yet. Someone who already has exams (history or an
  // exam in progress, from before the title screen existed) keeps the multi-year
  // permit, the only title available, so the resume stays one tap away.
  const [storedTitle] = useState(() => loadTargetTitle())
  const targetTitle = storedTitle ?? DEFAULT_TITLE
  // Counter, last exams and resume: exams of the chosen title only
  const [history] = useState(() => loadHistoryForTitle(targetTitle))
  const [inProgress, setInProgress] = useState<ExamInProgress | null>(() => loadProgressForTitle(targetTitle))
  const wide = useWideScreen()
  const [mustChooseTitle] = useState(
    () => storedTitle === null && loadHistory().length === 0 && !hasProgress(),
  )

  if (mustChooseTitle) return <Navigate to="/titre" replace state={{ firstLaunch: true }} />

  const streak = passedInARow(history)
  const recent = history.slice(-3).reverse()

  // Question the exam will resume on (1-based), capped when every answer is given
  const resumeQuestion = inProgress
    ? Math.min(resumeIndex(inProgress), inProgress.questions.length - 1) + 1
    : 0

  function handleDeleteProgress() {
    clearProgress(targetTitle)
    setInProgress(null)
  }

  // Always a new exam, even with one in progress (its resume stays at the bottom)
  function startExam() {
    navigate('/examen', { state: { start: 'new' } })
  }

  const titlePill = (
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
  )

  const heading = (
    <h1 className="mt-[1.125rem] max-w-[18.75rem] text-[2.375rem] leading-[0.98] font-bold tracking-[-0.04em] text-balance md:max-w-[24rem] md:text-[3rem] lg:max-w-[26rem] lg:text-[3.5rem]">
      Votre chemin vers le jour J
    </h1>
  )

  const journey = (
    <nav aria-label="Votre parcours" className="mt-[clamp(1.5rem,6svh,3.25rem)] lg:mt-10">
      <ol className="flex flex-col items-start gap-3 md:gap-3.5">
        <li className="max-w-full">
          <PillLink to="/revision" tone="surface" end={<ArrowRight strokeWidth={2.6} />}>
            1 · Réviser les thèmes
          </PillLink>
        </li>

        <li className="flex w-full flex-col items-start">
          <PillButton
            size="lg"
            onClick={startExam}
            end={`${streak} sur ${READY_GOAL}`}
            endIsText
            // The label wraps first (9rem basis); only with enlarged text, when even
            // that basis no longer fits, does the counter go below instead of overflowing
            className="max-w-full flex-wrap [&>span:first-child]:grow [&>span:first-child]:basis-36"
          >
            2 · Réussir {READY_GOAL} examens blancs
          </PillButton>
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
  )

  const resume = inProgress && (
    <section aria-label="Examen en cours" className="flex flex-col items-start gap-1 lg:mt-6 lg:max-w-[26rem]">
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
  )

  const rulesLink = (
    <Link
      to="/regles"
      className="inline-flex min-h-11 items-center self-start rounded-sm text-[0.9375rem] font-bold underline underline-offset-4"
    >
      Comment se passe l'examen ?
    </Link>
  )

  const recentExams = recent.length > 0 && (
    <section aria-labelledby="recent-exams" className="mt-4 flex flex-col gap-2.5 lg:mt-0">
      <h2 id="recent-exams" className="text-[1.0625rem] font-bold">
        Derniers examens
      </h2>
      <ul className="flex flex-col gap-2">
        {recent.map((entry, i) => (
          <RecentExam key={entry.id ?? `${entry.date}-${i}`} entry={entry} />
        ))}
      </ul>
    </section>
  )

  // Progress lives in localStorage only: say so on every visit, history or not
  const deviceNotice = (
    <p className="flex items-start gap-2 text-[0.875rem] leading-normal">
      <MonitorSmartphone aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={2.2} />
      <span>
        Votre progression reste sur cet appareil, dans ce navigateur.{' '}
        <Link
          to="/mentions-legales#vos-donnees"
          className="rounded-sm font-bold whitespace-nowrap underline underline-offset-4"
        >
          En savoir plus
        </Link>
      </span>
    </p>
  )

  const legal = (
    <>
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
    </>
  )

  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <OrganicBackground shape="journey" className="lg:w-[calc(50%+1.5rem)]" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-[30rem] flex-col gap-3 px-[22px] pt-5 pb-6 md:max-w-[36rem] md:px-8 md:pt-8 md:pb-10 lg:max-w-[62rem] lg:px-10">
        <header className="flex min-h-11 items-center justify-between gap-3">
          <span className="min-w-0 text-xl font-bold">
            <BrandLogo />
          </span>
          <ThemeSwitch />
        </header>

        {wide ? (
          // From 1024 px: the journey on the left (resume under the title, never face to
          // face with step 2), « Où vous en êtes » on the right, the mentions at the bottom
          <>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,23rem)] items-start gap-x-16">
              <div className="flex flex-col gap-3">
                {titlePill}
                {heading}
                {resume}
                {journey}
              </div>
              <ProgressPanel streak={streak} recentExams={recentExams} rulesLink={rulesLink} />
            </div>
            <footer className="mt-auto flex flex-col gap-3 pt-10">
              {deviceNotice}
              {legal}
            </footer>
          </>
        ) : (
          <>
            {titlePill}
            {heading}
            {journey}

            <div className="mt-auto flex flex-col gap-2.5 pt-8">
              {resume}
              {rulesLink}
            </div>

            {recentExams}
            <div className="mt-4">{deviceNotice}</div>
            {legal}
          </>
        )}
      </div>
    </main>
  )
}
