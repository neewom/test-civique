import { useId, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { BackLink } from '@/components/BackLink'
import { ExamVerdict } from '@/components/ExamVerdict'
import { PillLink } from '@/components/PillButton'
import { findExamRecord } from '@/lib/history'
import { themeScores, weakestThemes } from '@/lib/exam-review'
import type { AnswerRecord } from '@/lib/exam-types'
import allQuestions from '@/data/questions.json'
import { useDocumentTitle } from '@/lib/use-document-title'
import { cn } from '@/lib/utils'

interface Question {
  id: number
  theme: string
  question: string
  answers: string[]
  explanation: string
}

const QUESTIONS = new Map((allQuestions as Question[]).map((q) => [q.id, q]))

/**
 * Navigation state given to the revision page by « Réviser ces n questions »: the ids
 * of the questions to review. The revision page reads it from Refonte 5 on (« À revoir »).
 */
export interface ReviewState {
  reviewIds: number[]
}

type Filter = 'mistakes' | 'all'

interface Reviewed {
  answer: AnswerRecord
  number: number
  question: Question
}

const toggleClass = (pressed: boolean) =>
  cn(
    'inline-flex min-h-11 items-center rounded-[1.375rem] px-4 py-1.5 text-[0.9375rem] font-bold transition-colors',
    'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid',
    pressed ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground hover:bg-muted',
  )

function AnswerBox({ tone, label, children }: { tone: 'right' | 'wrong' | 'none'; label: string; children: string }) {
  const Icon = tone === 'right' ? Check : X
  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 rounded-xl px-3 py-2.5',
        tone === 'right' && 'bg-success text-success-foreground',
        // 3px border, padding reduced by as much (box of the maquette: 10 / 12)
        tone === 'wrong' && 'border-3 border-coral px-[9px] py-[7px]',
        tone === 'none' && 'bg-muted',
      )}
    >
      <span className="inline-flex items-center gap-1 text-[0.8125rem] font-bold">
        <Icon aria-hidden="true" className="size-[1.1em] shrink-0" strokeWidth={2.8} />
        {label}
      </span>
      <span className={cn('text-base', tone === 'none' && 'italic')}>{children}</span>
    </div>
  )
}

function QuestionReview({ answer, number, question }: Reviewed) {
  return (
    <li className="flex flex-col gap-2.5 rounded-2xl bg-card p-4 text-card-foreground">
      <p className="text-[0.8125rem] font-bold tracking-[0.06em] uppercase dark:text-muted-foreground">
        Question {number} · {question.theme}
      </p>
      <h3 className="text-lg leading-[1.35] font-bold">{question.question}</h3>
      {answer.correct ? (
        <AnswerBox tone="right" label="Bonne réponse, la vôtre">{answer.chosen ?? question.answers[0]}</AnswerBox>
      ) : (
        <>
          {answer.chosen === null ? (
            <AnswerBox tone="none" label="Votre réponse">Sans réponse (temps écoulé)</AnswerBox>
          ) : (
            <AnswerBox tone="wrong" label="Votre réponse">{answer.chosen}</AnswerBox>
          )}
          <AnswerBox tone="right" label="Bonne réponse">{question.answers[0]}</AnswerBox>
        </>
      )}
      <p className="text-[0.9375rem] leading-normal">{question.explanation}</p>
    </li>
  )
}

/** Detail of a past exam: mistakes first, score per theme (maquette Pa7). */
export default function ExamenDetail() {
  useDocumentTitle("Détail de l'examen")
  const { id } = useParams<{ id: string }>()
  const record = id ? findExamRecord(id) : null

  // Exam order is kept; the number is the place of the question in the exam.
  // Questions removed from the data since the exam are skipped.
  const reviewed: Reviewed[] = (record?.answers ?? []).flatMap((answer, i) => {
    const question = QUESTIONS.get(answer.questionId)
    return question ? [{ answer, number: i + 1, question }] : []
  })
  const errors = reviewed.filter((r) => !r.answer.correct)

  const [filter, setFilter] = useState<Filter>(errors.length > 0 ? 'mistakes' : 'all')
  const themesId = useId()
  const questionsId = useId()

  if (!record) {
    return (
      <main className="flex min-h-svh flex-col bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-[30rem] flex-col gap-4 px-5 pt-5 pb-7">
          <div className="pr-16">
            <BackLink />
          </div>
          <h1 className="mt-4 text-[1.875rem] leading-none font-bold tracking-[-0.03em]">Examen introuvable</h1>
          <p className="text-base">
            Cet examen n'est pas dans l'historique de ce navigateur, ou son détail n'a pas été enregistré.
          </p>
          <PillLink to="/" size="lg" className="justify-center text-center">
            Retour à mon parcours
          </PillLink>
        </div>
      </main>
    )
  }

  const shown = filter === 'mistakes' ? errors : reviewed
  const scores = themeScores(
    reviewed.map((r) => r.answer),
    (qid) => QUESTIONS.get(qid)?.theme,
  )
  const weakest = new Set(weakestThemes(scores))
  const dateStr = new Date(record.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const reviewState: ReviewState = { reviewIds: errors.map((r) => r.answer.questionId) }

  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[30rem] grow flex-col gap-3.5 px-5 pt-5 pb-7">
        {/* Right padding: room for the fixed theme switch in the top right corner */}
        <div className="pr-16">
          <BackLink />
        </div>

        <div className="flex flex-col items-start gap-2">
          <div className="flex flex-col gap-0.5">
            <h1
              className="text-[1.875rem] leading-none font-bold tracking-[-0.03em] tabular-nums"
              aria-label={`Score : ${record.score} sur ${record.total}`}
            >
              {record.score}/{record.total}
            </h1>
            <p className="text-[0.9375rem]">{dateStr}</p>
          </div>
          <ExamVerdict score={record.score} total={record.total} variant="compact" />
        </div>

        {errors.length > 0 ? (
          <div role="group" aria-label="Questions affichées" className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={filter === 'mistakes'}
              onClick={() => setFilter('mistakes')}
              className={toggleClass(filter === 'mistakes')}
            >
              Mes erreurs ({errors.length})
            </button>
            <button
              type="button"
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
              className={toggleClass(filter === 'all')}
            >
              Toutes ({reviewed.length})
            </button>
          </div>
        ) : (
          <p className="text-base font-bold">Aucune erreur sur cet examen, bravo.</p>
        )}

        {scores.length > 0 && (
          <section
            aria-labelledby={themesId}
            className="flex flex-col gap-2 rounded-2xl bg-card px-4 py-3.5 text-card-foreground"
          >
            <h2 id={themesId} className="text-base font-bold">Par thème</h2>
            <ul className="flex flex-col gap-2">
              {scores.map((s) => {
                const weak = weakest.has(s.theme)
                return (
                  <li
                    key={s.theme}
                    className={cn('flex items-start justify-between gap-3 text-[0.9375rem]', weak && 'font-bold')}
                  >
                    <span className="min-w-0">
                      {s.theme}
                      {weak && <span className="sr-only"> (thème le plus faible)</span>}
                    </span>
                    <span
                      className={cn('shrink-0 rounded-full px-2 tabular-nums', weak && 'bg-coral text-coral-foreground')}
                    >
                      {s.correct}/{s.total}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section aria-labelledby={questionsId}>
          <h2 id={questionsId} className="sr-only">
            {filter === 'mistakes' ? 'Mes erreurs' : 'Toutes les questions'}
          </h2>
          <ol className="flex flex-col gap-3.5">
            {shown.map((r) => (
              <QuestionReview key={r.answer.questionId} {...r} />
            ))}
          </ol>
        </section>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          {errors.length > 0 && (
            <PillLink to="/revision" state={reviewState} size="lg" className="justify-center text-center">
              {errors.length === 1 ? 'Réviser cette question' : `Réviser ces ${errors.length} questions`}
            </PillLink>
          )}
          <PillLink to="/" tone="surface" className="justify-center text-center">
            Retour à mon parcours
          </PillLink>
        </div>
      </div>
    </main>
  )
}
