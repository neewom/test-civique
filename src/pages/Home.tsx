import { useNavigate } from 'react-router-dom'

interface QuizResult {
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

export default function Home() {
  const navigate = useNavigate()
  const history = getRecentHistory()

  return (
    <div role="main" className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-lg space-y-12">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Test Civique</h1>
          <p className="text-gray-600">Préparez votre examen de naturalisation</p>
          <p className="text-sm text-gray-600 pt-1">191 questions officielles</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-4">
          <button
            aria-label="Démarrer un examen blanc"
            onClick={() => navigate('/examen')}
            className="group rounded-xl border border-border bg-card p-6 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="font-medium text-card-foreground">Examen blanc</p>
            <p className="mt-1 text-xs text-muted-foreground">40 questions · 60s par question</p>
          </button>

          <button
            aria-label="Accéder au mode révision"
            onClick={() => navigate('/revision')}
            className="group rounded-xl border border-border bg-card p-6 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="font-medium text-card-foreground">Mode révision</p>
            <p className="mt-1 text-xs text-muted-foreground">Toutes les questions par thème</p>
          </button>
        </div>

        {/* Historique */}
        <section aria-label="Historique des examens récents" className="space-y-3">
          <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
            Historique récent
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun examen passé</p>
          ) : (
            <ul className="space-y-2">
              {history.map((result, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {new Date(result.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="font-medium">
                    {result.score}/{result.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  )
}
