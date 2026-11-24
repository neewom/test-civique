import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import allQuestions from '@/data/questions.json'
import { useDocumentTitle } from '@/lib/use-document-title'
import type { AnswerRecord, ExamQuestion, ExamInProgress } from '@/lib/exam-types'
import { saveProgress, clearProgress, loadProgress, resumeIndex } from '@/lib/exam-types'
import { buildExam, saveResult, isPassed, type Question } from '@/lib/exam'
import { AnswerCard } from '@/components/AnswerCard'
import { ExamResult, type ExamOutcome } from '@/components/ExamResult'
import { findExamRecord, loadHistory } from '@/lib/history'
import { journeyMessage, passedInARow, UNSAVED_MESSAGE } from '@/lib/readiness'
import { PillButton } from '@/components/PillButton'
import { Verdict } from '@/components/Verdict'
import { trackEvent, EXAM_STARTED, EXAM_FINISHED_PASSED, EXAM_FINISHED_NOT_YET } from '@/lib/analytics'

// Arrêté du 10 octobre 2025, art. 4 : 45 minutes au maximum
export const GLOBAL_EXAM_TIME = 45 * 60 // 2700 secondes

// Re-export for consumers (tests, Home)
export type { ExamQuestion }

// 'question'   : en attente d'une réponse
// 'pending'    : réponse sélectionnée, en attente de validation
// 'correction' : correction affichée, en attente du clic "suivant"
// 'result'     : écran de résultat final
type Phase = 'question' | 'pending' | 'correction' | 'result'

// `start: 'new'` is set by the home page to draw a new exam; it is consumed on
// arrival so that a reload resumes the stored progress instead of restarting.
type LocationState = {
  start?: 'new'
  excludeSituational?: boolean
} | null

type ExamSetup = {
  questions: ExamQuestion[]
  resume: ExamInProgress | null
}

// The stored progress always wins, except when a new exam is explicitly requested.
function setupExam(startNew: boolean, excludeSituational: boolean): ExamSetup {
  if (!startNew) {
    const saved = loadProgress()
    if (saved) return { questions: saved.questions, resume: saved }
  }
  clearProgress()
  const pool = excludeSituational
    ? (allQuestions as Question[]).filter((q) => q.id <= 191)
    : (allQuestions as Question[])
  return { questions: buildExam(pool), resume: null }
}

type Restart = { count: number; excludeSituational: boolean }

const LETTERS = ['A', 'B', 'C', 'D']

// Remaining time as a budget in minutes, rounded up: 44:59 still reads « 45 min »
function minutesLeft(seconds: number): number {
  return Math.ceil(seconds / 60)
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n > 1 ? 's' : ''}`
}

// Polite announcement once 5 minutes, then 1 minute, are left (screen readers)
function timeAnnouncement(seconds: number): string {
  if (seconds <= 0) return ''
  if (seconds < 60) return "Il reste moins d'une minute."
  if (seconds < 5 * 60) return 'Il reste moins de 5 minutes.'
  return ''
}

export default function Examen() {
  // "Recommencer" remounts the session through its key instead of reloading the page
  const [restart, setRestart] = useState<Restart>({ count: 0, excludeSituational: false })
  return (
    <ExamSession
      key={restart.count}
      restart={restart.count > 0 ? restart : null}
      onRestart={(excludeSituational) =>
        setRestart((r) => ({ count: r.count + 1, excludeSituational }))
      }
    />
  )
}

type ExamSessionProps = {
  restart: Restart | null
  onRestart: (excludeSituational: boolean) => void
}

function ExamSession({ restart, onRestart }: ExamSessionProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as LocationState

  const [setup] = useState<ExamSetup>(() =>
    restart
      ? setupExam(true, restart.excludeSituational)
      : setupExam(locationState?.start === 'new', locationState?.excludeSituational ?? false),
  )
  const { questions, resume } = setup
  const startIndex = resume ? resumeIndex(resume) : 0

  const [index, setIndex] = useState(startIndex)
  const [globalTimeLeft, setGlobalTimeLeft] = useState(resume?.timeLeft ?? GLOBAL_EXAM_TIME)
  const [selected, setSelected] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('question')
  const [showQuitDialog, setShowQuitDialog] = useState(false)
  // Finished exam shown on the result screen
  const [outcome, setOutcome] = useState<ExamOutcome | null>(null)
  useDocumentTitle(phase === 'result' ? 'Résultat' : 'Examen blanc')

  const scoreRef = useRef(resume ? resume.answers.filter((a) => a.correct).length : 0)
  const answersRef = useRef<AnswerRecord[]>(resume?.answers ?? [])
  const startedAtRef = useRef(resume?.startedAt ?? new Date().toISOString())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const finishedRef = useRef(false)
  const questionHeadingRef = useRef<HTMLHeadingElement>(null)
  const verdictRef = useRef<HTMLParagraphElement>(null)
  // Focus goes to the new question only after « Question suivante », not on arrival
  const focusQuestionRef = useRef(false)
  const questionId = useId()

  // A newly drawn exam (from the home page, « Nouvel examen blanc », or no stored
  // progress) is counted once; a resumed exam is not. The ref keeps StrictMode's
  // double effect from sending it twice
  const startTrackedRef = useRef(false)
  useEffect(() => {
    if (resume || startTrackedRef.current) return
    startTrackedRef.current = true
    trackEvent(EXAM_STARTED)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Consume the "new exam" marker: a reload must resume, not draw another exam
  useEffect(() => {
    if (locationState?.start) {
      navigate(location.pathname, {
        replace: true,
        state: { excludeSituational: locationState.excludeSituational },
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Progress saved while correcting the last question: every answer is given
  useEffect(() => {
    if (startIndex >= questions.length) finishExam()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Timer global — démarre une fois au montage et tourne jusqu'à la fin
  useEffect(() => {
    // A resumed exam already complete is finished on mount: no timer to start
    if (finishedRef.current) return
    timerRef.current = setInterval(() => {
      setGlobalTimeLeft((t) => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Sauvegarde de la progression à chaque tick du timer
  useEffect(() => {
    if (phase === 'result' || finishedRef.current) return
    saveProgress({
      questions,
      index,
      answers: answersRef.current,
      timeLeft: globalTimeLeft,
      startedAt: startedAtRef.current,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalTimeLeft, index])

  // Expiration du timer global → terminer l'examen immédiatement
  useEffect(() => {
    if (globalTimeLeft === 0 && phase !== 'result') {
      finishExam(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalTimeLeft, phase])

  // Termine l'examen : complète les réponses manquantes et sauvegarde
  function finishExam(timedOut = false) {
    if (finishedRef.current) return
    finishedRef.current = true
    const timedOutUnanswered = timedOut ? questions.length - answersRef.current.length : null
    if (timerRef.current) clearInterval(timerRef.current)
    clearProgress()
    const allAnswers = [...answersRef.current]
    // Questions non répondues (timer expiré avant d'y arriver)
    for (let i = allAnswers.length; i < questions.length; i++) {
      allAnswers.push({ questionId: questions[i].id, chosen: null, correct: false })
    }
    // Journey counter before and after this exam (no new stored data)
    const history = loadHistory()
    const previousStreak = passedInARow(history)
    const result = { score: scoreRef.current, total: questions.length }
    const streak = passedInARow([...history, result])
    const id = saveResult(result.score, result.total, allAnswers)
    // Once per exam (finishedRef), timed out included: only the verdict is sent
    trackEvent(isPassed(result.score, result.total) ? EXAM_FINISHED_PASSED : EXAM_FINISHED_NOT_YET)
    // Storage unavailable: no detail page to link to, and the home counter will not
    // count this exam, so the journey message must not announce a step forward
    const saved = findExamRecord(id) !== null
    setOutcome({
      ...result,
      answers: allAnswers,
      recordId: saved ? id : null,
      journey: saved
        ? journeyMessage(isPassed(result.score, result.total), streak, previousStreak)
        : UNSAVED_MESSAGE,
      timedOutUnanswered,
    })
    setPhase('result')
  }

  function handleSelect(choice: string) {
    if (phase !== 'question' && phase !== 'pending') return
    setSelected(choice)
    setPhase('pending')
  }

  function handleValidate() {
    if (!selected || phase !== 'pending') return
    const isCorrect = selected === questions[index].answer
    if (isCorrect) scoreRef.current += 1
    answersRef.current.push({
      questionId: questions[index].id,
      chosen: selected,
      correct: isCorrect,
    })
    saveProgress({
      questions,
      index,
      answers: answersRef.current,
      timeLeft: globalTimeLeft,
      startedAt: startedAtRef.current,
    })
    setPhase('correction')
  }

  function handleNext() {
    if (index < questions.length - 1) {
      const newIndex = index + 1
      saveProgress({
        questions,
        index: newIndex,
        answers: answersRef.current,
        timeLeft: globalTimeLeft,
        startedAt: startedAtRef.current,
      })
      focusQuestionRef.current = true
      setIndex(newIndex)
      setSelected(null)
      setPhase('question')
    } else {
      finishExam()
    }
  }

  // Focus: on the verdict once the answer is validated, then on the next question
  useEffect(() => {
    if (phase === 'correction') {
      verdictRef.current?.focus()
    } else if (phase === 'question' && focusQuestionRef.current) {
      focusQuestionRef.current = false
      questionHeadingRef.current?.focus()
    }
  }, [phase, index])

  function themeOf(questionId: number): string | undefined {
    return questions.find((q) => q.id === questionId)?.theme
  }

  function handleRestart() {
    clearProgress()
    onRestart(questions.every((q) => q.id <= 191))
  }

  const current = questions[index]
  const isLastQuestion = index === questions.length - 1
  // Borné à [0, 100] : un examen repris peut porter un timeLeft d'une autre durée
  const timerPct = Math.min(100, Math.max(0, (globalTimeLeft / GLOBAL_EXAM_TIME) * 100))
  const minutes = minutesLeft(globalTimeLeft)

  // ── Écran résultat (maquettes Pa6 / Pd6) ─────────────────────────────────────
  if (phase === 'result' && outcome) {
    return <ExamResult outcome={outcome} themeOf={themeOf} onRestart={handleRestart} />
  }

  // Resumed exam already complete: the result screen follows on the next render
  if (!current) return null

  // ── Écran question / correction (maquettes Pa4 / Pa5, Pd4 / Pd5) ─────────────
  // No animation and no organic shape on these screens
  const inCorrection = phase === 'correction'
  const isCorrect = inCorrection && selected === current.answer
  const eyebrow = 'text-[0.8125rem] font-bold tracking-[0.06em] uppercase dark:text-muted-foreground'

  return (
    <>
    <Dialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto rounded-2xl p-5 data-closed:animate-none data-open:animate-none"
      >
        <DialogHeader>
          <DialogTitle className="text-lg leading-snug font-bold">Quitter l'examen ?</DialogTitle>
          <DialogDescription className="text-base text-popover-foreground">
            Votre progression est sauvegardée. Vous pourrez reprendre depuis la page d'accueil.
          </DialogDescription>
        </DialogHeader>
        {/* « Annuler » first, also on mobile (the default footer reverses the order) */}
        <DialogFooter className="-mx-5 -mb-5 flex-col p-5 sm:flex-row">
          <PillButton tone="action" onClick={() => setShowQuitDialog(false)} className="justify-center text-center">
            Annuler
          </PillButton>
          <PillButton tone="ink" onClick={() => navigate('/')} className="justify-center text-center">
            Quitter
          </PillButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="rounded-b-[2rem] bg-earth">
        <div className="mx-auto flex w-full max-w-[30rem] flex-col gap-3 px-5 pt-4 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4">
            <button
              type="button"
              onClick={() => setShowQuitDialog(true)}
              aria-label="Quitter l'examen"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[0.9375rem] font-bold hover:underline hover:underline-offset-4"
            >
              <ArrowLeft aria-hidden="true" className="size-[1.1em] shrink-0" strokeWidth={2.4} />
              Quitter
            </button>
            <p className="text-[0.9375rem] font-bold">
              Question {index + 1} sur {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="text-sm font-bold whitespace-nowrap">Temps</span>
            <div className="h-3 grow overflow-hidden rounded-full bg-foreground/18">
              <div
                role="progressbar"
                aria-label="Temps restant"
                aria-valuenow={globalTimeLeft}
                aria-valuemin={0}
                aria-valuemax={GLOBAL_EXAM_TIME}
                aria-valuetext={`${plural(minutes, 'minute')} sur 45`}
                className="h-full bg-foreground"
                style={{ width: `${timerPct}%` }}
              />
            </div>
            <span aria-hidden="true" className="text-sm font-bold whitespace-nowrap">{minutes} min</span>
          </div>
        </div>
      </header>

      {/* Announced once at 5 minutes, then at 1 minute */}
      <p aria-live="polite" className="sr-only">{timeAnnouncement(globalTimeLeft)}</p>

      <div className="mx-auto flex w-full max-w-[30rem] grow flex-col px-5">
        {inCorrection ? (
          <div className="flex flex-col gap-3 pt-5">
            <Verdict
              ref={verdictRef}
              tabIndex={-1}
              tone={isCorrect ? 'success' : 'error'}
              className="self-start outline-none"
            >
              {isCorrect ? 'Bien joué' : 'Pas tout à fait'}
            </Verdict>
            <h1
              ref={questionHeadingRef}
              tabIndex={-1}
              className="text-[1.3125rem] leading-[1.3] font-bold outline-none"
            >
              {current.question}
            </h1>
            <AnswerCard
              letter={LETTERS[current.choices.indexOf(current.answer)]}
              name={`correction-${index}`}
              value={current.answer}
              checked={isCorrect}
              onSelect={() => {}}
              result="correct"
              disabled
            >
              {current.answer}
            </AnswerCard>
            {!isCorrect && selected && (
              <AnswerCard
                letter={LETTERS[current.choices.indexOf(selected)]}
                name={`correction-${index}`}
                value={selected}
                checked
                onSelect={() => {}}
                result="wrong"
                disabled
              >
                {selected}
              </AnswerCard>
            )}
            <section
              aria-labelledby={`${questionId}-why`}
              className="flex flex-col gap-2 rounded-xl bg-card p-3.5 text-card-foreground"
            >
              <h2 id={`${questionId}-why`} className={eyebrow}>Pourquoi</h2>
              <p className="text-base leading-normal">{current.explanation}</p>
              {current.source && (
                <a
                  href={current.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-[1.375rem] bg-background px-3 py-1.5 text-sm font-bold no-underline hover:underline hover:underline-offset-4"
                >
                  <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.2} />
                  <span>
                    Source : {current.source.label}
                    <span className="sr-only"> (nouvel onglet)</span>
                  </span>
                </a>
              )}
            </section>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-6">
            <p className={eyebrow}>{current.theme}</p>
            <h1
              id={questionId}
              ref={questionHeadingRef}
              tabIndex={-1}
              className="mb-2 text-[1.4375rem] leading-[1.3] font-bold outline-none"
            >
              {current.question}
            </h1>
            <div role="radiogroup" aria-labelledby={questionId} className="flex flex-col gap-3">
              {current.choices.map((choice, i) => (
                <AnswerCard
                  key={choice}
                  letter={LETTERS[i]}
                  name={`question-${index}`}
                  value={choice}
                  checked={choice === selected}
                  onSelect={handleSelect}
                >
                  {choice}
                </AnswerCard>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 pb-6">
          {phase === 'pending' && (
            <PillButton size="lg" onClick={handleValidate} className="mt-2 w-full justify-center text-center">
              Valider ma réponse
            </PillButton>
          )}
          {inCorrection && (
            <PillButton size="lg" onClick={handleNext} className="mt-2 w-full justify-center text-center">
              {isLastQuestion ? 'Voir les résultats' : 'Question suivante'}
            </PillButton>
          )}
        </div>
      </div>
    </main>
    </>
  )
}
