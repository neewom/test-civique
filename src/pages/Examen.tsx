import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import allQuestions from '@/data/questions.json'

export const EXAM_SIZE = 40
export const TIME_PER_QUESTION = 60

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

export function saveResult(score: number, total: number): void {
  try {
    const raw = localStorage.getItem('quiz-history')
    const history = raw ? JSON.parse(raw) : []
    history.push({ date: new Date().toISOString(), score, total })
    localStorage.setItem('quiz-history', JSON.stringify(history))
  } catch {
    // localStorage unavailable
  }
}

// 'question'   : timer actif, l'utilisateur choisit
// 'pending'    : réponse sélectionnée, en attente de validation
// 'correction' : correction affichée, en attente du clic "suivant"
// 'result'     : écran de résultat final
type Phase = 'question' | 'pending' | 'correction' | 'result'

export default function Examen() {
  const navigate = useNavigate()
  const [questions] = useState<ExamQuestion[]>(() => buildExam())
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION)
  const [selected, setSelected] = useState<string | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [phase, setPhase] = useState<Phase>('question')
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown tick (tourne aussi en phase 'pending' — réponse sélectionnée mais pas encore validée)
  useEffect(() => {
    if (phase !== 'question' && phase !== 'pending') return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, index])

  // Timer expiry → correction directe (pas de validation manuelle)
  useEffect(() => {
    if ((phase === 'question' || phase === 'pending') && timeLeft === 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      // Pas de point si la réponse sélectionnée n'a pas été validée
      setTimedOut(true)
      setPhase('correction')
    }
  }, [timeLeft, phase])

  function handleSelect(choice: string) {
    if (phase !== 'question' && phase !== 'pending') return
    setSelected(choice)
    setPhase('pending')
  }

  function handleValidate() {
    if (!selected || phase !== 'pending') return
    if (timerRef.current) clearInterval(timerRef.current)
    if (selected === questions[index].answer) {
      scoreRef.current += 1
      setScore(scoreRef.current)
    }
    setPhase('correction')
  }

  function handleNext() {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1)
      setSelected(null)
      setTimedOut(false)
      setTimeLeft(TIME_PER_QUESTION)
      setPhase('question')
    } else {
      saveResult(scoreRef.current, questions.length)
      setPhase('result')
    }
  }

  function restart() {
    window.location.reload()
  }

  const current = questions[index]
  const isLastQuestion = index === questions.length - 1
  const timerPct = (timeLeft / TIME_PER_QUESTION) * 100
  const timerColor =
    timeLeft > 30 ? 'bg-green-500' : timeLeft > 15 ? 'bg-amber-500' : 'bg-red-500'

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
            {!inCorrection && (
              <span
                className={timeLeft <= 10 ? 'text-red-600 font-semibold' : ''}
                aria-label={`Temps restant : ${timeLeft} secondes`}
              >
                {timeLeft}s
              </span>
            )}
          </div>

          {/* Timer bar */}
          {!inCorrection && (
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${timerColor}`}
                style={{ width: `${timerPct}%` }}
                role="progressbar"
                aria-valuenow={timeLeft}
                aria-valuemin={0}
                aria-valuemax={TIME_PER_QUESTION}
              />
            </div>
          )}

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
                {timedOut && (
                  <p className="text-sm text-amber-700 font-medium">Temps écoulé</p>
                )}
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
