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

const byTheme = (questions as Question[]).reduce<Record<string, Question[]>>(
  (acc, q) => {
    ;(acc[q.theme] ??= []).push(q)
    return acc
  },
  {}
)

export default function Revision() {
  const navigate = useNavigate()

  return (
    <div role="main" className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-10">

        {/* Header */}
        <div className="space-y-1">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3 block"
          >
            ← Accueil
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Mode révision</h1>
          <p className="text-gray-600">{(questions as Question[]).length} questions par thème</p>
        </div>

        {/* Questions par thème */}
        {Object.entries(byTheme).map(([theme, qs]) => (
          <section key={theme} aria-label={`Thème : ${theme}`} className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900 border-b pb-2">
              {theme}
              <span className="ml-2 text-sm font-normal text-gray-500">({qs.length})</span>
            </h2>

            <div className="space-y-3">
              {qs.map((q) => (
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
