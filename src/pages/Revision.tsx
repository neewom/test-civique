import { useId, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnswerBox } from '@/components/AnswerBox'
import { BackLink } from '@/components/BackLink'
import { SourceLink } from '@/components/SourceLink'
import { ThemeSwitch } from '@/components/ThemeSwitch'
import { questionsForTitle, type Question } from '@/lib/exam'
import { OFFICIAL_THEMES } from '@/lib/exam-review'
import { loadQuestionsToReview, parseReviewIds } from '@/lib/review-queue'
import { DEFAULT_TITLE, loadTargetTitle, TARGET_TITLE_LABELS } from '@/lib/target-title'
import { useDocumentTitle } from '@/lib/use-document-title'
import { useWideScreen } from '@/lib/use-wide-screen'
import { cn } from '@/lib/utils'

// Official themes in the order of the programme, then any other theme of the pool
function themesOf(pool: Question[]): string[] {
  return [
    ...OFFICIAL_THEMES.filter((t) => pool.some((q) => q.theme === t)),
    ...[...new Set(pool.map((q) => q.theme))].filter((t) => !OFFICIAL_THEMES.includes(t)),
  ]
}

/** exam: the questions sent by an exam detail · review: « À revoir » · all · one theme */
type Filter = { kind: 'exam' } | { kind: 'review' } | { kind: 'all' } | { kind: 'theme'; theme: string }

const pillClass = (pressed: boolean, tone: 'surface' | 'coral' = 'surface') =>
  cn(
    'inline-flex min-h-11 shrink-0 items-center rounded-full px-4 py-1.5 text-[0.9375rem] font-bold whitespace-nowrap transition-colors',
    // From 1024 px: one full-width pill per line in the side column, long themes wrap
    'lg:w-full lg:rounded-[1.375rem] lg:text-left lg:whitespace-normal',
    'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid',
    pressed
      ? 'bg-primary text-primary-foreground'
      : tone === 'coral'
        ? 'bg-coral text-coral-foreground hover:bg-coral/85'
        : 'bg-card text-card-foreground hover:bg-muted',
  )

function QuestionCard({ question }: { question: Question }) {
  return (
    <li className="flex flex-col gap-2.5 rounded-2xl bg-card p-4 text-left text-card-foreground">
      <h3 className="text-lg leading-[1.35] font-bold">{question.question}</h3>
      <AnswerBox tone="right" label="Bonne réponse">{question.answers[0]}</AnswerBox>
      <p className="text-[0.9375rem] leading-normal">{question.explanation}</p>
      <SourceLink source={question.source} />
    </li>
  )
}

/** Revision: every question of the chosen title with its answer, filtered by theme or « À revoir » (maquette Pa8). */
export default function Revision() {
  useDocumentTitle('Révision')
  const location = useLocation()
  // Questions of the chosen title (`lists` of questions.json)
  const [title] = useState(() => loadTargetTitle() ?? DEFAULT_TITLE)
  const [{ titlePool, poolIds, themes }] = useState(() => {
    const questions = questionsForTitle(title)
    return { titlePool: questions, poolIds: new Set(questions.map((q) => q.id)), themes: themesOf(questions) }
  })
  const [examIds] = useState(() => parseReviewIds(location.state, poolIds))
  // Only questions of the pool: an id removed since the exam would count without a card
  const [reviewIds] = useState(() => loadQuestionsToReview(title).filter((id) => poolIds.has(id)))
  const [filter, setFilter] = useState<Filter>(() => (examIds.length > 0 ? { kind: 'exam' } : { kind: 'all' }))
  const [excludeSituational, setExcludeSituational] = useState(false)
  const checkboxId = useId()
  const wide = useWideScreen()

  const titleLabel = TARGET_TITLE_LABELS[title]
  const pool = excludeSituational ? titlePool.filter((q) => q.notion !== 'mise-en-situation') : titlePool
  const examSet = new Set(examIds)
  const reviewSet = new Set(reviewIds)
  const examCount = pool.filter((q) => examSet.has(q.id)).length
  const reviewCount = pool.filter((q) => reviewSet.has(q.id)).length

  const shown = pool.filter((q) => {
    switch (filter.kind) {
      case 'exam':
        return examSet.has(q.id)
      case 'review':
        return reviewSet.has(q.id)
      case 'theme':
        return q.theme === filter.theme
      case 'all':
        return true
    }
  })
  const sections = themes.map((theme) => ({ theme, items: shown.filter((q) => q.theme === theme) })).filter(
    (s) => s.items.length > 0,
  )

  const isPressed = (f: Filter) =>
    filter.kind === f.kind && (f.kind !== 'theme' || (filter.kind === 'theme' && filter.theme === f.theme))

  return (
    <main className="flex min-h-svh flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[30rem] flex-col gap-3.5 px-5 pt-5 pb-7 md:max-w-[36rem] md:px-8 md:pt-8 lg:grid lg:max-w-[62rem] lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-x-14 lg:px-10 lg:pt-0">
        {/* From 1024 px: a sticky side column with the header and the filters (side padding: room for the focus rings) */}
        <div className="flex flex-col gap-3.5 lg:sticky lg:top-0 lg:-mx-2 lg:max-h-svh lg:overflow-y-auto lg:px-2 lg:py-8">
          <div className="flex flex-col gap-2.5">
            {/* Right padding: room for the fixed theme switch in the top right corner; from 1024 px the switch is here */}
            <div className="flex items-center justify-between gap-3 pr-16 lg:pr-0">
              <BackLink>Mon parcours</BackLink>
              {wide && <ThemeSwitch />}
            </div>
            <h1 className="text-[2.125rem] leading-none font-bold tracking-[-0.04em] md:text-[3rem]">Réviser</h1>
            <p className="text-[0.9375rem] dark:text-muted-foreground">
              {titleLabel} · {pool.length} questions
            </p>
          </div>

          {/* Pills scroll sideways on a phone and wrap on a wider screen; the vertical padding keeps the focus ring visible */}
          <div className="-mx-5 overflow-x-auto px-5 py-1.5 [scrollbar-width:none] sm:overflow-visible lg:mx-0 lg:px-0">
            <div role="group" aria-label="Questions à afficher" className="flex w-max gap-2 sm:w-auto sm:flex-wrap lg:flex-col lg:items-stretch">
              {examIds.length > 0 && (
                <button
                  type="button"
                  aria-pressed={isPressed({ kind: 'exam' })}
                  onClick={() => setFilter({ kind: 'exam' })}
                  className={pillClass(isPressed({ kind: 'exam' }))}
                >
                  Cet examen ({examCount})
                </button>
              )}
              <button
                type="button"
                aria-pressed={isPressed({ kind: 'review' })}
                onClick={() => setFilter({ kind: 'review' })}
                className={pillClass(isPressed({ kind: 'review' }), 'coral')}
              >
                À revoir ({reviewCount})
              </button>
              <button
                type="button"
                aria-pressed={isPressed({ kind: 'all' })}
                onClick={() => setFilter({ kind: 'all' })}
                className={pillClass(isPressed({ kind: 'all' }))}
              >
                Tous les thèmes
              </button>
              {themes.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  aria-pressed={isPressed({ kind: 'theme', theme })}
                  onClick={() => setFilter({ kind: 'theme', theme })}
                  className={pillClass(isPressed({ kind: 'theme', theme }))}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-11 items-center gap-2.5 text-[0.9375rem]">
            <input
              id={checkboxId}
              type="checkbox"
              checked={excludeSituational}
              onChange={(e) => setExcludeSituational(e.target.checked)}
              className="size-[1.375rem] shrink-0 accent-primary dark:accent-action"
            />
            <label htmlFor={checkboxId} className="cursor-pointer py-2">
              Sans les mises en situation
            </label>
          </div>

        </div>

        {/* Cards on one reading column */}
        <div className="flex flex-col gap-3.5 lg:max-w-[40rem] lg:pt-[7.25rem]">
          <p aria-live="polite" className="sr-only">
            {shown.length} question{shown.length > 1 ? 's' : ''} affichée{shown.length > 1 ? 's' : ''}
          </p>

          {sections.length === 0 ? (
            <div className="flex flex-col gap-1.5 rounded-2xl bg-card p-4 text-card-foreground">
              {filter.kind === 'review' && reviewIds.length === 0 ? (
                <>
                  <p className="text-base font-bold">Aucune question à revoir pour l'instant.</p>
                  <p className="text-[0.9375rem] leading-normal">
                    Les questions ratées à vos examens blancs s'affichent ici, jusqu'à ce que vous les réussissiez.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-bold">Aucune question avec ces filtres.</p>
                  {excludeSituational && (
                    <p className="text-[0.9375rem] leading-normal">
                      Décochez « Sans les mises en situation » pour les afficher.
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            sections.map(({ theme, items }) => (
              <section key={theme} aria-label={`Thème : ${theme}`} className="flex flex-col gap-3 pt-2">
                <h2 className="text-base font-bold">
                  {theme} <span className="font-normal tabular-nums">({items.length})</span>
                </h2>
                <ul className="flex flex-col gap-3">
                  {items.map((q) => (
                    <QuestionCard key={q.id} question={q} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
