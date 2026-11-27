import { Fragment, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { PageFrame } from '@/components/PageFrame'
import { ExamVerdict } from '@/components/ExamVerdict'
import { LeafCelebration } from '@/components/LeafCelebration'
import { OrganicBackground } from '@/components/OrganicBackground'
import { PillButton, PillLink } from '@/components/PillButton'
import { isPassed } from '@/lib/exam'
import { themeLabel } from '@/lib/themes'
import type { AnswerRecord } from '@/lib/exam-types'
import { mistakes, themeScores, weakestThemes, weakestThemesToShow } from '@/lib/exam-review'

export interface ExamOutcome {
  score: number
  total: number
  /** Every question of the exam, unanswered ones included */
  answers: AnswerRecord[]
  /** Id of the saved record, or null when the history could not be written */
  recordId: string | null
  /** « n sur 3 » message, from the journey counter (src/lib/readiness.ts) */
  journey: string
  /** Set when the 45 minutes ran out: questions left without an answer */
  timedOutUnanswered: number | null
}

interface ExamResultProps {
  outcome: ExamOutcome
  themeOf: (questionId: number) => string | undefined
  onRestart: () => void
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n > 1 ? 's' : ''}`
}

/** Result screen of a practice exam (maquettes Pa6 / Pd6). */
export function ExamResult({ outcome, themeOf, onRestart }: ExamResultProps) {
  const { score, total, answers, recordId, journey, timedOutUnanswered } = outcome
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Focus on the title on arrival: screen readers then read the time line and the verdict
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const errorCount = mistakes(answers).length
  const weakest = weakestThemesToShow(weakestThemes(themeScores(answers, themeOf)).map(themeLabel))

  return (
    <PageFrame className="relative overflow-hidden" background={<OrganicBackground shape="crest" />}>
      <div className="relative mx-auto flex grow w-full max-w-[30rem] flex-col gap-3 px-[22px] pt-0 pb-6 md:max-w-[44rem] md:px-8 md:pb-10">
        {/* Only for an exam just finished (this screen is never shown again for an old one) */}
        {isPassed(score, total) && <LeafCelebration />}
        <h1 ref={headingRef} tabIndex={-1} className="min-h-11 content-center self-start rounded-sm text-[0.9375rem] font-bold outline-none">
          Examen blanc terminé
        </h1>
        {timedOutUnanswered !== null && (
          <p className="text-base font-bold">
            {timedOutUnanswered > 0
              ? `Temps écoulé : ${plural(timedOutUnanswered, 'question')} sans réponse`
              : 'Temps écoulé'}
          </p>
        )}

        <p className="mt-[clamp(1rem,4svh,2.5rem)] flex md:mt-12 flex-wrap items-baseline gap-x-1.5 font-bold">
          <span aria-hidden="true" className="text-[6rem] leading-[0.9] tracking-[-0.04em] tabular-nums md:text-[8rem]">{score}</span>
          <span aria-hidden="true" className="text-[2rem] md:text-[2.75rem]">/{total}</span>
          <span className="sr-only">Score : {score} sur {total}</span>
        </p>

        <ExamVerdict score={score} total={total} />
        <p className="max-w-[19rem] text-base leading-[1.45] md:max-w-[26rem] md:text-[1.0625rem]">{journey}</p>

        <div className="mt-[clamp(1.5rem,7svh,4.5rem)] flex flex-col gap-3 md:max-w-[26rem]">
          {recordId !== null && (
            <PillLink
              to={`/examen/${recordId}`}
              // Replaces the finished /examen entry: going back must not draw a new exam
              replace
              tone="surface"
              size="lg"
              end={<ArrowRight strokeWidth={2.6} />}
              endClassName={errorCount > 0 ? 'bg-coral text-coral-foreground' : undefined}
            >
              <span className="flex flex-col">
                <span className="text-[1.0625rem]">
                  {errorCount === 0 ? "Revoir l'examen" : errorCount === 1 ? 'Voir la question à revoir' : `Voir les ${errorCount} questions à revoir`}
                </span>
                {(errorCount === 0 || weakest) && (
                  <span className="text-[0.8125rem] font-normal text-muted-foreground">
                    {errorCount === 0
                      ? 'Aucune erreur, bravo'
                      : weakest && (
                          <>
                            À travailler :{' '}
                            {weakest.map((t, i) => (
                              <Fragment key={t}>
                                {i > 0 && (
                                  <>
                                    <span aria-hidden="true"> | </span>
                                    <span className="sr-only">, </span>
                                  </>
                                )}
                                {t}
                              </Fragment>
                            ))}
                          </>
                        )}
                  </span>
                )}
              </span>
            </PillLink>
          )}
          <PillButton size="lg" onClick={onRestart} className="justify-center text-center">
            Nouvel examen blanc
          </PillButton>
          <Link
            to="/"
            replace
            className="inline-flex min-h-12 items-center justify-center rounded-sm text-base font-bold underline-offset-4 hover:underline"
          >
            Retour à mon parcours
          </Link>
        </div>
      </div>
    </PageFrame>
  )
}
