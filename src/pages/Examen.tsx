import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import allQuestions from '@/data/questions.json'
import type { AnswerRecord, ExamRecord } from '@/lib/exam-types'

export const EXAM_SIZE = 40
export const GLOBAL_EXAM_TIME = 40 * 60 // 2400 secondes

interface Question {
  id: number
  theme: string
  question: string
  answer: string
  distractors: string[]
  explanation: string
}

export interface ExamQuestion {
  id: number
  theme: string
  question: string
  answer: string
  choices: string[]
  explanation: string
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function buildExam(pool: Question[] = allQuestions as Question[]): ExamQuestion[] {
  return shuffle(pool)
    .slice(0, EXAM_SIZE)
    .map((q) => ({
      id: q.id,
      theme: q.theme,
      question: q.question,
      answer: q.answer,
      choices: shuffle([q.answer, ...shuffle(q.distractors).slice(0, 3)]),
      explanation: q.explanation,
    }))
}

export function saveResult(
  score: number,
  total: number,
  answers: AnswerRecord[],
): void {
  try {
    const raw = localStorage.getItem('quiz-history')
    const history: ExamRecord[] = raw ? JSON.parse(raw) : []
    history.push({
      id: String(Date.now()),
      date: new Date().toISOString(),
      score,
      total,
      answers,
    })
    localStorage.setItem('quiz-history', JSON.stringify(history))
  } catch {
    // localStorage unavailable
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 'question'   : en attente d'une réponse
// 'pending'    : réponse sélectionnée, en attente de validation
// 'correction' : correction affichée, en attente du clic "suivant"
// 'result'     : écran de résultat final
type Phase = 'question' | 'pending' | 'correction' | 'result'

export default function Examen() {
  const navigate = useNavigate()
  const [questions] = useState<ExamQuestion[]>(() => buildExam())
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [globalTimeLeft, setGlobalTimeLeft] = useState(GLOBAL_EXAM_TIME)
  const [selected, setSelected] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('question')
  const scoreRef = useRef(0)
  const answersRef = useRef<AnswerRecord[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer global — démarre une fois au montage et tourne jusqu'à la fin
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setGlobalTimeLeft((t) => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Expiration du timer global → terminer l'examen immédiatement
  useEffect(() => {
    if (globalTimeLeft === 0 && phase !== 'result') {
      finishExam()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalTimeLeft, phase])

  // Termine l'examen : complète les réponses manquantes et sauvegarde
  function finishExam() {
    if (timerRef.current) clearInterval(timerRef.current)
    const allAnswers = [...answersRef.current]
    // Questions non répondues (timer expiré avant d'y arriver)
    for (let i = allAnswers.length; i < questions.length; i++) {
      allAnswers.push({ questionId: questions[i].id, chosen: null, correct: false })
    }
    saveResult(scoreRef.current, questions.length, allAnswers)
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
    if (isCorrect) {
      scoreRef.current += 1
      setScore(scoreRef.current)
    }
    answersRef.current.push({
      questionId: questions[index].id,
      chosen: selected,
      correct: isCorrect,
    })
    setPhase('correction')
  }

  function handleNext() {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1)
      setSelected(null)
      setPhase('question')
    } else {
      finishExam()
    }
  }

  function restart() {
    window.location.reload()
  }

  const current = questions[index]
  const isLastQuestion = index === questions.length - 1
  const timerPct = (globalTimeLeft / GLOBAL_EXAM_TIME) * 100
  const timerColor =
    globalTimeLeft > 1200 ? 'bg-green-500'
    : globalTimeLeft > 600 ? 'bg-amber-500'
    : 'bg-red-500'

  // ── Écran résultat ──────────────────────────────────────────────────────────
  if (phase === 'result') {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div
        role="main"
        className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-2">
            <p className="text-sm text-gray-500 uppercase tracking-wider">Résultat</p>
            <p
              className="text-6xl font-bold text-zinc-900"
              aria-label={`Score : ${score} sur ${questions.length}`}
            >
              {score}
              <span className="text-3xl text-gray-400">/{questions.length}</span>
            </p>
            <p className="text-lg text-gray-600">{pct}%</p>
          </div>

          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">
                {pct >= 80
                  ? 'Excellent résultat ! Vous êtes prêt(e).'
                  : pct >= 60
                  ? 'Bon résultat, continuez à réviser.'
                  : 'Continuez à vous entraîner, vous progresserez !'}
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button onClick={restart} className="w-full">
              Recommencer
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Écran question / correction ─────────────────────────────────────────────
  const inCorrection = phase === 'correction'

  return (
    <div role="main" className="min-h-screen bg-background flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-xl space-y-6">

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Question {index + 1} / {questions.length}</span>
            <span
              className={globalTimeLeft <= 300 ? 'text-red-600 font-semibold tabular-nums' : 'tabular-nums'}
              aria-label={`Temps restant : ${formatTime(globalTimeLeft)}`}
            >
              {formatTime(globalTimeLeft)}
            </span>
          </div>

          {/* Timer bar global */}
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${timerColor}`}
              style={{ width: `${timerPct}%` }}
              role="progressbar"
              aria-valuenow={globalTimeLeft}
              aria-valuemin={0}
              aria-valuemax={GLOBAL_EXAM_TIME}
            />
          </div>

          {/* Progression globale */}
          <Progress
            value={(index / questions.length) * 100}
            aria-label="Progression de l'examen"
          />
        </div>

        {/* Carte question */}
        <Card>
          <CardHeader>
            <Badge variant="secondary">{current.theme}</Badge>
            <CardTitle className="text-zinc-900 mt-2 text-base leading-snug">
              {current.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">

            {/* Choix */}
            {current.choices.map((choice) => {
              let style =
                'w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

              if (inCorrection) {
                if (choice === current.answer) {
                  style += ' border-green-400 bg-green-50 text-green-900'
                } else if (choice === selected) {
                  style += ' border-red-400 bg-red-50 text-red-900'
                } else {
                  style += ' border-border bg-card text-gray-400'
                }
              } else if (choice === selected) {
                style += ' border-zinc-900 bg-zinc-50 text-zinc-900 ring-1 ring-zinc-900'
              } else {
                style += ' border-border bg-card text-zinc-900 hover:bg-muted cursor-pointer'
              }

              return (
                <button
                  key={choice}
                  className={style}
                  onClick={() => handleSelect(choice)}
                  disabled={inCorrection}
                  aria-pressed={!inCorrection && choice === selected}
                >
                  {choice}
                </button>
              )
            })}

            {/* Bouton Valider */}
            {phase === 'pending' && (
              <Button onClick={handleValidate} className="w-full mt-2">
                Valider
              </Button>
            )}

            {/* Correction */}
            {inCorrection && (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3">
                  <p className="text-xs font-medium text-zinc-500 mb-1">Explication</p>
                  <p className="text-sm text-zinc-800 leading-relaxed">
                    {current.explanation}
                  </p>
                </div>
                <Button onClick={handleNext} className="w-full">
                  {isLastQuestion ? 'Voir les résultats' : 'Question suivante'}
                </Button>
              </div>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  )
}
