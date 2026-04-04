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
  const [filtersExpanded, setFiltersExpanded] = useState(false)

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

  const activeFiltersCount = (activeTheme !== null ? 1 : 0) + (excludeSituational ? 1 : 0)

  const filterBtnClass = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      active
        ? 'bg-foreground text-background'
        : 'bg-muted text-foreground hover:bg-muted/80'
    }`

  return (
    <div role="main" className="min-h-screen bg-background">

      {/* ── Sticky header ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-2xl px-4">

          {/* Ligne 1 : retour + espace pour le ThemeSwitch global (fixed top-4 right-4) */}
          <div className="flex items-center pt-3 pb-1 pr-20">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Accueil
            </button>
          </div>

          {/* Ligne 2 : titre + bouton Filtres */}
          <div className="flex items-end justify-between pb-3">
            <div className="space-y-0.5">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mode révision</h1>
              <p className="text-sm text-muted-foreground">{displayedQuestions.length} questions par thème</p>
            </div>

            <button
              aria-expanded={filtersExpanded}
              aria-label={
                activeFiltersCount > 0
                  ? `Filtres, ${activeFiltersCount} actif${activeFiltersCount > 1 ? 's' : ''}`
                  : 'Filtres'
              }
              onClick={() => setFiltersExpanded((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {/* Funnel icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M1.5 2a.5.5 0 000 1h13a.5.5 0 000-1h-13zM3 5.5a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5zM5 8.5a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5A.5.5 0 015 8.5zm2 2.5a.5.5 0 000 1h2a.5.5 0 000-1H7z" />
              </svg>
              Filtres
              {activeFiltersCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                  {activeFiltersCount}
                </span>
              )}
              <span
                className={`text-xs transition-transform duration-200 ${filtersExpanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                ▾
              </span>
            </button>
          </div>

          {/* Panneau de filtres expansible */}
          <div
            aria-hidden={!filtersExpanded}
            className={`overflow-hidden transition-all duration-200 ${filtersExpanded ? 'max-h-64' : 'max-h-0'}`}
          >
            <div
              role="group"
              aria-label="Filtres"
              className="flex flex-wrap gap-2 pb-4"
            >
              <button
                onClick={() => setActiveTheme(null)}
                aria-pressed={activeTheme === null}
                className={filterBtnClass(activeTheme === null)}
              >
                Tous
              </button>
              {themes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => setActiveTheme(theme)}
                  aria-pressed={activeTheme === theme}
                  className={filterBtnClass(activeTheme === theme)}
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
                className={filterBtnClass(excludeSituational)}
              >
                Sans les questions de mise en situation
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Contenu scrollable ───────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
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
