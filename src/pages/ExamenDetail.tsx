import { useParams, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExamRecord } from '@/lib/exam-types'
import allQuestions from '@/data/questions.json'

interface Question {
  id: number
  theme: string
  question: string
  answer: string
  explanation: string
}

function getRecord(id: string): ExamRecord | null {
  try {
    const raw = localStorage.getItem('quiz-history')
    if (!raw) return null
    const history: ExamRecord[] = JSON.parse(raw)
    return history.find((r) => r.id === id) ?? null
  } catch {
    return null
  }
}

export default function ExamenDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const record = id ? getRecord(id) : null

  if (!record) {
    return (
      <div role="main" className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <p className="text-gray-600 mb-4">Examen introuvable.</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Retour à l'accueil
        </Button>
      </div>
    )
  }

  const questions = allQuestions as Question[]
  const pct = Math.round((record.score / record.total) * 100)
  const dateStr = new Date(record.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div role="main" className="min-h-screen bg-background flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-xl space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <p className="text-sm text-gray-500 uppercase tracking-wider">Résultat</p>
          <p
            className="text-4xl font-bold text-zinc-900"
            aria-label={`Score : ${record.score} sur ${record.total}`}
          >
            {record.score}
            <span className="text-2xl text-gray-400">/{record.total}</span>
            <span className="ml-3 text-xl text-gray-500 font-normal">{pct}%</span>
          </p>
          <p className="text-sm text-gray-500">{dateStr}</p>
        </div>

        <Button variant="outline" onClick={() => navigate('/')} className="w-full">
          Retour à l'accueil
        </Button>

        {/* Questions */}
        <div className="space-y-4">
          {record.answers.map((answer, i) => {
            const q = questions.find((qu) => qu.id === answer.questionId)
            if (!q) return null
            return (
              <Card key={answer.questionId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{q.theme}</Badge>
                    <span className="text-xs text-gray-500">Question {i + 1}</span>
                  </div>
                  <CardTitle className="text-zinc-900 mt-2 text-base leading-snug">
                    {q.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">

                  {/* Réponse choisie */}
                  {answer.chosen === null ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                      <p className="text-xs font-medium text-gray-500 mb-0.5">Réponse choisie</p>
                      <p className="text-sm text-gray-400 italic">Sans réponse (temps écoulé)</p>
                    </div>
                  ) : answer.correct ? (
                    <div className="rounded-lg border border-green-400 bg-green-50 px-4 py-2">
                      <p className="text-xs font-medium text-green-700 mb-0.5">Réponse choisie</p>
                      <p className="text-sm text-green-900">{answer.chosen}</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-red-400 bg-red-50 px-4 py-2">
                      <p className="text-xs font-medium text-red-700 mb-0.5">Réponse choisie</p>
                      <p className="text-sm text-red-900">{answer.chosen}</p>
                    </div>
                  )}

                  {/* Bonne réponse (si mauvaise ou sans réponse) */}
                  {!answer.correct && (
                    <div className="rounded-lg border border-green-400 bg-green-50 px-4 py-2">
                      <p className="text-xs font-medium text-green-700 mb-0.5">Bonne réponse</p>
                      <p className="text-sm text-green-900">{q.answer}</p>
                    </div>
                  )}

                  {/* Explication */}
                  <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3">
                    <p className="text-xs font-medium text-zinc-500 mb-1">Explication</p>
                    <p className="text-sm text-zinc-800 leading-relaxed">{q.explanation}</p>
                  </div>

                </CardContent>
              </Card>
            )
          })}
        </div>

        <Button variant="outline" onClick={() => navigate('/')} className="w-full">
          Retour à l'accueil
        </Button>

      </div>
    </div>
  )
}
