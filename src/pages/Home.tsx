import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, ChevronRight, MonitorSmartphone } from 'lucide-react'
import { isPassed } from '@/lib/exam'
import { hasProgress, loadProgressForTitle, clearProgress, resumeIndex } from '@/lib/exam-types'
import type { ExamInProgress } from '@/lib/exam-types'
import { loadHistory, loadHistoryForTitle, type HistoryEntry } from '@/lib/history'
import { passedInARow, READY_GOAL } from '@/lib/readiness'
import { revisionResumeLabel } from '@/lib/revision-memory'
import { ficheUrl } from '@/lib/fiches'
import { preloadQuestionPack } from '@/lib/question-packs'
import { DEFAULT_TITLE, loadTargetTitle, TARGET_TITLE_LABELS } from '@/lib/target-title'
import { Fraction } from '@/components/Fraction'
import { PageFrame } from '@/components/PageFrame'
import { OrganicBackground } from '@/components/OrganicBackground'
import { PillButton, PillLink } from '@/components/PillButton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDocumentTitle } from '@/lib/use-document-title'
import { useWideScreen } from '@/lib/use-wide-screen'
import { cn } from '@/lib/utils'

export const OFFICIAL_SITE_URL = 'https://formation-civique.interieur.gouv.fr'

// Journey steps that are not links (yet), as « Le jour J »: same pill shape, no interaction
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
            <Fraction value={entry.score} total={entry.total} />
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

  // First launch: no title chosen yet. Someone who already has exams (history or an
  // exam in progress, from before the title screen existed) keeps the multi-year
  // permit, the only title available, so the resume stays one tap away.
  const [storedTitle] = useState(() => loadTargetTitle())
  const targetTitle = storedTitle ?? DEFAULT_TITLE
  // Counter, last exams and resume: exams of the chosen title only
  const [history] = useState(() => loadHistoryForTitle(targetTitle))
  const [inProgress, setInProgress] = useState<ExamInProgress | null>(() => loadProgressForTitle(targetTitle))
  // Shortcut under step 1: only with a remembered revision position for the chosen title
  const [revisionLabel] = useState(() => revisionResumeLabel(targetTitle))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const stepTwoRef = useRef<HTMLButtonElement>(null)
  const wide = useWideScreen()
  const [mustChooseTitle] = useState(
    () => storedTitle === null && loadHistory().length === 0 && !hasProgress(),
  )

  // Once the home page is shown and the browser idle, the pack of the chosen title downloads quietly,
  // so that the exam and the revision open at once. Nothing is fetched without a chosen title.
  useEffect(() => {
    if (storedTitle === null) return
    return preloadQuestionPack(storedTitle)
  }, [storedTitle])

  if (mustChooseTitle) return <Navigate to="/titre" replace />

  const streak = passedInARow(history)
  const recent = history.slice(-3).reverse()

  // Question the exam will resume on (1-based), capped when every answer is given
  const resumeQuestion = inProgress
    ? Math.min(resumeIndex(inProgress), inProgress.questions.length - 1) + 1
    : 0

  function handleDeleteProgress() {
    clearProgress(targetTitle)
    setInProgress(null)
    setConfirmDelete(false)
  }

  // Resumes the exam in progress of the chosen title (never erased silently);
  // goes through the page before the exam only when there is none
  function startExam() {
    navigate(inProgress ? '/examen' : '/examen-blanc')
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

  const ficheLink = (
    <Link
      to={ficheUrl(targetTitle)}
      className="-mt-1 inline-flex min-h-11 items-center gap-1 self-start rounded-sm px-1 text-[0.9375rem] font-bold underline underline-offset-4"
    >
      Tout savoir sur ce titre
      <ArrowRight aria-hidden="true" className="size-[1em]" strokeWidth={2.6} />
    </Link>
  )

  const heading = (
    <h1 className="mt-[1.125rem] max-w-[18.75rem] text-[2.375rem] leading-[0.98] font-bold tracking-[-0.04em] text-balance md:max-w-[24rem] md:text-[3rem] lg:max-w-[26rem] lg:text-[3.5rem]">
      Votre chemin vers le jour J
    </h1>
  )

  const journey = (
    <nav aria-label="Votre parcours" className="mt-[clamp(1.5rem,6svh,3.25rem)] lg:order-2 lg:mt-10">
      <ol className="flex flex-col items-start gap-3 md:gap-3.5">
        <li className="flex max-w-full flex-col items-start">
          <PillLink to="/revision" tone="surface" end={<ArrowRight strokeWidth={2.6} />}>
            1 · Réviser les thèmes
          </PillLink>
          {revisionLabel && (
            <Link
              to="/revision"
              className="mt-1 inline-flex min-h-11 items-center gap-1 rounded-sm px-1 text-[0.9375rem] font-bold underline underline-offset-4"
            >
              Continuer où j'en étais : {revisionLabel}
              <ArrowRight aria-hidden="true" className="size-[1em] shrink-0" strokeWidth={2.6} />
            </Link>
          )}
        </li>

        <li className="flex w-full flex-col items-start">
          <PillButton
            size="lg"
            ref={stepTwoRef}
            onClick={startExam}
            end={`${streak} sur ${READY_GOAL}`}
            endIsText
            // The label wraps first (9rem basis); only with enlarged text, when even
            // that basis no longer fits, does the counter go below instead of overflowing
            className="max-w-full flex-wrap [&>span:first-child]:grow [&>span:first-child]:basis-36"
          >
            2 · Réussir {READY_GOAL} examens blancs d'affilée
          </PillButton>
        </li>

        <li className="max-w-full">
          <PillLink to="/centres" tone="surface" end={<ArrowRight strokeWidth={2.6} />}>
            3 · Trouver un centre d'examen
          </PillLink>
        </li>

        <li className="max-w-full">
          <span className={cn(staticStepClass, 'bg-goal text-goal-foreground')}>4 · Le jour J</span>
        </li>
      </ol>
    </nav>
  )

  const resume = inProgress && (
    <section
      aria-label="Examen en cours"
      className="mt-auto flex flex-col items-start gap-1 pt-8 lg:order-1 lg:mt-6 lg:max-w-[26rem] lg:pt-0"
    >
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
        ref={deleteButtonRef}
        onClick={() => setConfirmDelete(true)}
        className="min-h-11 rounded-sm px-1 text-left text-[0.875rem] underline underline-offset-4"
      >
        Supprimer l'examen en cours
      </button>
    </section>
  )

  const rulesLink = (
    <Link
      to="/regles"
      className={cn(
        'inline-flex min-h-11 items-center self-start rounded-sm text-[0.9375rem] font-bold underline underline-offset-4',
        // Phone: under the resume (2.5 gap instead of 3) or, without one, at the bottom of the page
        inProgress
          ? '-mt-0.5 lg:mt-0'
          : 'mt-auto min-h-[4.75rem] pt-8 lg:mt-0 lg:min-h-11 lg:pt-0',
        'lg:order-1',
      )}
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
    <p className="mt-4 flex items-start gap-2 text-[0.875rem] lg:mt-0 leading-normal">
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
          <span className="sr-only"> (nouvel onglet)</span>
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
    <>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent
          showCloseButton={false}
          // Cancel or Escape: back on the link that opened the box; after the deletion that
          // link is gone, the focus goes to step 2 (the exam can be started from there)
          finalFocus={() => deleteButtonRef.current ?? stepTwoRef.current}
          className="max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto rounded-2xl p-5 data-closed:animate-none data-open:animate-none"
        >
          <DialogHeader>
            <DialogTitle className="text-lg leading-snug font-bold">Supprimer l'examen en cours ?</DialogTitle>
            <DialogDescription className="text-base text-popover-foreground">
              L'examen en cours sera abandonné.
            </DialogDescription>
          </DialogHeader>
          {/* « Annuler » first, also on mobile (the default footer reverses the order) */}
          <DialogFooter className="-mx-5 -mb-5 flex-col p-5 sm:flex-row">
            <PillButton tone="action" onClick={() => setConfirmDelete(false)} className="justify-center text-center">
              Annuler
            </PillButton>
            <PillButton tone="ink" onClick={handleDeleteProgress} className="justify-center text-center">
              Supprimer l'examen
            </PillButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PageFrame
        className="relative overflow-hidden"
        background={<OrganicBackground shape="journey" className="lg:w-[calc(50%+1.5rem)]" />}
        // The footer is outside <main> (contentinfo): same column, same gap (mt-3) as when it was the column's last child
        footer={
          <footer className="relative mx-auto mt-3 flex w-full max-w-[30rem] flex-col gap-3 px-[22px] pb-6 md:max-w-[36rem] md:px-8 md:pb-10 lg:max-w-[62rem] lg:px-10 lg:pt-10">
            {deviceNotice}
            {legal}
          </footer>
        }
      >
      <div className="relative mx-auto flex grow w-full max-w-[30rem] flex-col gap-3 px-[22px] pt-0 md:max-w-[36rem] md:px-8 lg:max-w-[62rem] lg:px-10">

        {/* Rendered once, placed by CSS: the focused element must survive the switch at 1024 px.
            DOM order = the phone order (what screen readers and the Tab key follow). On a phone the
            groups and the footer are `contents` (every block is a direct child of the column). From
            1024 px: the journey on the left (resume moved under the title with `order`, never face
            to face with step 2), « Où vous en êtes » on the right (last exams before the rules),
            the mentions at the bottom. */}
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:items-start lg:gap-x-16">
          <div className="contents lg:flex lg:flex-col lg:gap-3">
            {titlePill}
            {ficheLink}
            {heading}
            {journey}
            {resume}
          </div>

          <section
            role={wide ? 'region' : undefined}
            aria-labelledby={wide ? 'progress' : undefined}
            className={cn(
              'contents lg:mt-[4.25rem] lg:flex lg:flex-col',
              recent.length > 0 ? 'lg:gap-5' : 'lg:gap-4',
            )}
          >
            {wide &&
              (recent.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <h2 id="progress" className="text-[1.0625rem] font-bold">
                    Où vous en êtes
                  </h2>
                  <p className="text-[0.9375rem] leading-normal">
                    <span className="mb-1 block text-[3.5rem] leading-none font-bold tracking-[-0.04em] tabular-nums">
                      {streak} sur {READY_GOAL}
                    </span>{' '}
                    {READY_GOAL - streak > 0
                      ? `examens blancs réussis d'affilée. Encore ${READY_GOAL - streak} pour atteindre l'objectif.`
                      : "examens blancs réussis d'affilée : objectif atteint."}
                  </p>
                </div>
              ) : (
                <>
                  <h2 id="progress" className="text-[1.0625rem] font-bold">
                    Où vous en êtes
                  </h2>
                  <p className="text-[0.9375rem] leading-normal">
                    Vos examens blancs s'afficheront ici, avec votre progression vers les {READY_GOAL} réussites
                    d'affilée.
                  </p>
                </>
              ))}
            {rulesLink}
            {recentExams}
          </section>
        </div>

      </div>
      </PageFrame>
    </>
  )
}
