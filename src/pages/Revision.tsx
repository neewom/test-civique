import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import questions from '@/data/questions.json'

interface Question {
  id: number
  theme: string
  question: string
  answer: string
  explanation: string
}

const THEME_COLORS: Record<string, string> = {
  'République & valeurs': 'bg-blue-100 text-blue-800',
  'Histoire de France': 'bg-amber-100 text-amber-800',
  'Institutions': 'bg-purple-100 text-purple-800',
  'Société française': 'bg-green-100 text-green-800',
  'Europe': 'bg-sky-100 text-sky-800',
}

function themeColor(theme: string) {
  return THEME_COLORS[theme] ?? 'bg-gray-100 text-gray-700'
}

const allQuestions = questions as Question[]
const themes = [...new Set(allQuestions.map((q) => q.theme))]

const byTheme = allQuestions.reduce<Record<string, Question[]>>(
  (acc, q) => {
    ;(acc[q.theme] ??= []).push(q)
    return acc
  },
  {}
)

export default function Revision() {
  const navigate = useNavigate()
  const [activeTheme, setActiveTheme] = useState<string | null>(null)

  const visibleThemes = activeTheme ? [activeTheme] : themes

  return (
    <div role="main" className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3 block"
          >
            ← Accueil
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Mode révision</h1>
          <p className="text-gray-600">{allQuestions.length} questions par thème</p>
        </div>

        {/* Filtre par thème */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par thème">
          <button
            onClick={() => setActiveTheme(null)}
            aria-pressed={activeTheme === null}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTheme === null
                ? 'bg-zinc-900 text-white'
                : 'bg-muted text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Tous
          </button>
          {themes.map((theme) => (
            <button
              key={theme}
              onClick={() => setActiveTheme(theme)}
              aria-pressed={activeTheme === theme}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeTheme === theme
                  ? 'bg-zinc-900 text-white'
                  : 'bg-muted text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>

        {/* Questions par thème */}
        {visibleThemes.map((theme) => (
          <section key={theme} aria-label={`Thème : ${theme}`} className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900 border-b pb-2">
              {theme}
              <span className="ml-2 text-sm font-normal text-gray-500">({byTheme[theme].length})</span>
            </h2>

            <div className="space-y-3">
              {byTheme[theme].map((q) => (
                <Card key={q.id} size="sm">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Badge className={themeColor(q.theme)}>{q.theme}</Badge>
                    </div>
                    <CardTitle className="text-zinc-900 mt-2">{q.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                      <p className="text-xs font-medium text-green-700 mb-0.5">Bonne réponse</p>
                      <p className="text-sm text-green-900">{q.answer}</p>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{q.explanation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}

      </div>
    </div>
  )
}
