import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import questions from '@/data/questions.json'

interface Question {
  id: number
  theme: string
  question: string
  answers: string[]
  explanation: string
}

const THEME_COLORS: Record<string, string> = {
  'République & valeurs': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Histoire de France': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'Institutions': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Société française': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Europe': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
}

function themeColor(theme: string) {
  return THEME_COLORS[theme] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300'
}

const allQuestionsData = questions as Question[]

export default function Revision() {
  const navigate = useNavigate()
  const [activeTheme, setActiveTheme] = useState<string | null>(null)
  const [excludeSituational, setExcludeSituational] = useState(false)

  const displayedQuestions = excludeSituational
    ? allQuestionsData.filter((q) => q.id <= 191)
    : allQuestionsData

  const themes = [...new Set(displayedQuestions.map((q) => q.theme))]

  const byTheme = displayedQuestions.reduce<Record<string, Question[]>>(
    (acc, q) => {
      ;(acc[q.theme] ??= []).push(q)
      return acc
    },
    {}
  )

  const visibleThemes = activeTheme && themes.includes(activeTheme) ? [activeTheme] : themes

  return (
    <div role="main" className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 block"
          >
            ← Accueil
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mode révision</h1>
          <p className="text-muted-foreground">{displayedQuestions.length} questions par thème</p>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtres">
          <button
            onClick={() => setActiveTheme(null)}
            aria-pressed={activeTheme === null}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTheme === null
                ? 'bg-foreground text-background'
                : 'bg-muted text-foreground hover:bg-muted'
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
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-foreground hover:bg-muted'
              }`}
            >
              {theme}
            </button>
          ))}
          <button
            onClick={() => {
              setExcludeSituational((v) => !v)
              setActiveTheme(null)
            }}
            aria-pressed={excludeSituational}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              excludeSituational
                ? 'bg-foreground text-background'
                : 'bg-muted text-foreground hover:bg-muted'
            }`}
          >
            Sans les questions de mise en situation
          </button>
        </div>

        {/* Questions par thème */}
        {visibleThemes.map((theme) => (
          <section key={theme} aria-label={`Thème : ${theme}`} className="space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b pb-2">
              {theme}
              <span className="ml-2 text-sm font-normal text-muted-foreground">({byTheme[theme].length})</span>
            </h2>

            <div className="space-y-3">
              {byTheme[theme].map((q) => (
                <Card key={q.id} size="sm">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Badge className={themeColor(q.theme)}>{q.theme}</Badge>
                    </div>
                    <CardTitle className="text-foreground mt-2">{q.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/30 px-3 py-2">
                      <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-0.5">Bonne réponse</p>
                      <p className="text-sm text-green-800 dark:text-green-200">{q.answers[0]}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
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
