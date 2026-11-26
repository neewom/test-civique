import { useState } from 'react'
import { CircleDot, ListChecks, Target, Timer, RotateCcw, Eye } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { BackLink } from '@/components/BackLink'
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
import { EXAM_SIZE, passThreshold } from '@/lib/exam'
import { loadProgressForTitle, resumeIndex } from '@/lib/exam-types'
import { loadTargetTitle, DEFAULT_TITLE, TARGET_TITLE_LABELS } from '@/lib/target-title'
import { useDocumentTitle } from '@/lib/use-document-title'
import { cn } from '@/lib/utils'

/**
 * « Examen blanc »: what the mock exam is, before starting it. Opened from step 2 of the
 * home page and from « M'entraîner maintenant » (rules) when no exam is in progress.
 * Arriving here with an exam in progress (by the address) offers to resume it first.
 */
export default function ExamenBlanc() {
  useDocumentTitle('Examen blanc')
  const navigate = useNavigate()
  const [title] = useState(() => loadTargetTitle() ?? DEFAULT_TITLE)
  const [inProgress] = useState(() => loadProgressForTitle(title))
  const [confirmNew, setConfirmNew] = useState(false)

  const resumeQuestion = inProgress
    ? Math.min(resumeIndex(inProgress), inProgress.questions.length - 1) + 1
    : 0

  const marks = [
    { icon: ListChecks, value: String(EXAM_SIZE), label: 'questions' },
    { icon: Timer, value: '45 min', label: 'au maximum' },
    { icon: CircleDot, value: '4 choix', label: 'une seule bonne réponse' },
    { icon: Target, value: `${passThreshold(EXAM_SIZE)}/${EXAM_SIZE}`, label: 'pour réussir', highlight: true },
  ]

  const secondaryClass =
    'inline-flex min-h-11 items-center justify-center rounded-sm px-1 text-[0.9375rem] font-bold underline underline-offset-4'

  return (
    <>
      <Dialog open={confirmNew} onOpenChange={setConfirmNew}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto rounded-2xl p-5 data-closed:animate-none data-open:animate-none"
        >
          <DialogHeader>
            <DialogTitle className="text-lg leading-snug font-bold">Commencer un nouvel examen ?</DialogTitle>
            <DialogDescription className="text-base text-popover-foreground">
              L'examen en cours sera abandonné.
            </DialogDescription>
          </DialogHeader>
          {/* « Annuler » first, also on mobile (the default footer reverses the order) */}
          <DialogFooter className="-mx-5 -mb-5 flex-col p-5 sm:flex-row">
            <PillButton tone="action" onClick={() => setConfirmNew(false)} className="justify-center text-center">
              Annuler
            </PillButton>
            <PillButton
              tone="ink"
              onClick={() => navigate('/examen', { state: { start: 'new' } })}
              className="justify-center text-center"
            >
              Nouvel examen
            </PillButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
        <OrganicBackground shape="goal" />
        <div className="relative mx-auto flex w-full max-w-[30rem] flex-col gap-3 px-[22px] pt-2 pb-6 md:max-w-[36rem] md:gap-3.5 md:px-8 md:pb-10">
          <AppHeader />
          <BackLink />
          <div className="flex flex-col items-start gap-2">
            <h1 className="text-[2.375rem] leading-[0.98] font-bold tracking-[-0.04em] text-balance md:text-[3rem]">
              Examen blanc
            </h1>
            <span className="inline-flex min-h-8 items-center rounded-full bg-card px-3.5 text-[0.9375rem] font-bold text-card-foreground">
              {TARGET_TITLE_LABELS[title]}
            </span>
          </div>

          <section aria-labelledby="like-d-day" className="mt-[clamp(0.75rem,3svh,2.5rem)] flex flex-col gap-2">
            <h2 id="like-d-day" className="text-[1.0625rem] font-bold">
              Comme le jour J
            </h2>
            {/* One column when the text is enlarged (the rem breakpoint grows with it) */}
            <ul className="grid grid-cols-1 gap-2 min-[22rem]:grid-cols-2">
              {marks.map(({ icon: Icon, value, label, highlight }) => (
                <li
                  key={label}
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
                    <span className="text-[0.875rem] leading-snug md:text-[0.9375rem]">{label}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="what-changes" className="flex flex-col gap-2">
            <h2 id="what-changes" className="text-[1.0625rem] font-bold">
              Ce qui change ici
            </h2>
            <div className="flex flex-col gap-2.5 rounded-2xl bg-card p-3.5 text-card-foreground md:p-4">
              <p className="flex items-start gap-3 text-[0.9375rem] leading-snug md:text-base md:leading-normal">
                <Eye aria-hidden="true" className="mt-0.5 size-5 shrink-0" strokeWidth={2.2} />
                <span>
                  Vous voyez la correction et l'explication après chaque question. Le jour J, il n'y a aucune
                  correction : l'examen se passe sur ordinateur, dans un centre agréé.
                </span>
              </p>
              <p className="flex items-start gap-3 text-[0.9375rem] leading-snug md:text-base md:leading-normal">
                <RotateCcw aria-hidden="true" className="mt-0.5 size-5 shrink-0" strokeWidth={2.2} />
                <span>
                  Vous pouvez quitter et reprendre plus tard. Le résultat reste dans votre historique et vos
                  erreurs vont dans « À revoir ».
                </span>
              </p>
            </div>
          </section>

          <div className="mt-1 flex flex-col gap-0.5">
            {inProgress ? (
              <>
                <PillLink to="/examen" size="lg" className="justify-center text-center text-balance">
                  Reprendre l'examen (question {resumeQuestion} sur {inProgress.questions.length})
                </PillLink>
                <button type="button" onClick={() => setConfirmNew(true)} className={secondaryClass}>
                  Commencer un nouvel examen
                </button>
              </>
            ) : (
              <PillLink to="/examen" state={{ start: 'new' }} size="lg" className="justify-center text-center">
                Commencer l'examen blanc
              </PillLink>
            )}
            <Link to="/regles" className={secondaryClass}>
              Tout savoir sur l'examen
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
