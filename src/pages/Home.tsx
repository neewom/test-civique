import { useNavigate } from 'react-router-dom'

interface QuizResult {
  id?: string
  date: string
  score: number
  total: number
}

function getRecentHistory(): QuizResult[] {
  try {
    const raw = localStorage.getItem('quiz-history')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(-3).reverse() : []
  } catch {
    return []
  }
}

function getScoreColor(pct: number): string {
  if (pct >= 75) return 'bg-green-500'
  if (pct >= 50) return 'bg-orange-400'
  return 'bg-red-500'
}

export default function Home() {
  const navigate = useNavigate()
  const history = getRecentHistory()

  return (
    <div role="main" className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-lg space-y-12">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Test Civique <span aria-hidden="true">🇫🇷</span>
          </h1>
          <p className="text-muted-foreground">Préparez votre examen de naturalisation</p>
          <p className="text-sm text-muted-foreground pt-1">191 questions officielles</p>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-4">
          <button
            aria-label="Démarrer un examen blanc"
            onClick={() => navigate('/examen')}
            className="group w-full rounded-xl border border-[#1a56db]/30 bg-[#1a56db]/5 px-8 py-6 text-left transition-all hover:bg-[#1a56db]/10 hover:border-[#1a56db]/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a56db] dark:border-[#1a56db]/40 dark:bg-[#1a56db]/10 dark:hover:bg-[#1a56db]/20"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl" aria-hidden="true">📝</span>
              <div>
                <p className="font-semibold text-base text-[#1a56db] dark:text-blue-400">Examen blanc</p>
                <p className="mt-0.5 text-sm text-muted-foreground">40 questions · 40 minutes</p>
              </div>
            </div>
          </button>

          <button
            aria-label="Accéder au mode révision"
            onClick={() => navigate('/revision')}
            className="group w-full rounded-xl border border-[#1a56db]/30 bg-[#1a56db]/5 px-8 py-6 text-left transition-all hover:bg-[#1a56db]/10 hover:border-[#1a56db]/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a56db] dark:border-[#1a56db]/40 dark:bg-[#1a56db]/10 dark:hover:bg-[#1a56db]/20"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl" aria-hidden="true">📚</span>
              <div>
                <p className="font-semibold text-base text-[#1a56db] dark:text-blue-400">Mode révision</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Toutes les questions par thème</p>
              </div>
            </div>
          </button>
        </div>

        {/* Historique */}
        <section aria-label="Historique des examens récents" className="space-y-3">
          <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">
            Historique récent
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun examen passé</p>
          ) : (
            <ul className="space-y-3">
              {history.map((result, i) => {
                const pct = Math.round((result.score / result.total) * 100)
                const barColor = getScoreColor(pct)
                const d = new Date(result.date)
                const dateLabel = d.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
                const timeLabel = d.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const ariaLabel = `Voir le détail de l'examen du ${dateLabel}`

                const content = (
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {dateLabel} · <span className="text-xs">{timeLabel}</span>
                      </span>
                      <span className="font-semibold">
                        {result.score}/{result.total}
                        <span className="ml-1.5 text-xs text-muted-foreground">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all`}
                        style={{ width: `${pct}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                )

                return (
                  <li key={i} className="rounded-lg border border-border bg-card px-4 py-3">
                    {result.id ? (
                      <button
                        aria-label={ariaLabel}
                        onClick={() => navigate(`/examen/${result.id}`)}
                        className="w-full text-left hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a56db] rounded"
                      >
                        {content}
                      </button>
                    ) : (
                      <div>{content}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

      </div>
    </div>
  )
}
