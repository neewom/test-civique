import { Eye } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnswerBox } from '@/components/AnswerBox'
import { BackLink } from '@/components/BackLink'
import { SourceLink } from '@/components/SourceLink'
import { PageFrame } from '@/components/PageFrame'
import { QuestionPackStatus } from '@/components/QuestionPackStatus'
import { questionsForTitle, type ListedQuestion, type Question } from '@/lib/exam'
import { OFFICIAL_THEMES } from '@/lib/exam-review'
import { loadQuestionsToReview, parseReviewIds } from '@/lib/review-queue'
import { loadRevisionView, saveRevisionView, type RevisionView } from '@/lib/revision-memory'
import { DEFAULT_TITLE, isTitleKey, loadTargetTitle, TARGET_TITLE_LABELS, type TitleKey } from '@/lib/target-title'
import { useDocumentTitle } from '@/lib/use-document-title'
import { themeLabel } from '@/lib/themes'
import { TITLE_COUNTS } from '@/lib/title-counts'
import { useQuestionPack } from '@/lib/use-question-pack'
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
    // Forced colours (Windows high contrast) drop the backgrounds: the pressed filter shows as the system
    // highlight, the others keep an outline
    pressed
      ? 'bg-primary text-primary-foreground forced-colors:bg-[Highlight] forced-colors:text-[HighlightText] forced-colors:[forced-color-adjust:none]'
      : tone === 'coral'
        ? 'bg-coral text-coral-foreground hover:bg-coral/85'
        : 'bg-card text-card-foreground hover:bg-muted',
    !pressed && 'forced-colors:border forced-colors:border-[ButtonText]',
  )

/**
 * One question. With « Masquer les réponses » (`hidden`), only the statement and the « Afficher la réponse » button
 * are there: the answer is not in the page at all (screen readers do not read it). Once the user reveals it, the
 * focus goes to the revealed block, since the button that had it disappears.
 */
function QuestionCard({ question, hidden, onReveal }: { question: Question; hidden: boolean; onReveal: () => void }) {
  const answerRef = useRef<HTMLDivElement>(null)
  const questionId = useId()
  const revealedByUser = useRef(false)
  useEffect(() => {
    if (!hidden && revealedByUser.current) {
      revealedByUser.current = false
      answerRef.current?.focus()
    }
  }, [hidden])
  return (
    <li data-question-id={question.id} className="flex flex-col gap-2.5 rounded-2xl bg-card p-4 text-left text-card-foreground">
      <h3 id={questionId} className="text-lg leading-[1.35] font-bold">{question.question}</h3>
      {hidden ? (
        <button
          type="button"
          onClick={() => {
            revealedByUser.current = true
            onReveal()
          }}
          className="inline-flex min-h-11 max-w-full items-center gap-[6px] self-start rounded-[1.375rem] bg-muted px-[14px] py-2 text-left text-[0.9375rem] font-bold text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid forced-colors:border forced-colors:border-[ButtonText]"
        >
          <Eye aria-hidden="true" className="size-[1em] shrink-0" strokeWidth={2.2} />
          <span>
            Afficher la réponse<span className="sr-only"> à la question : {question.question}</span>
          </span>
        </button>
      ) : (
        <div
          ref={answerRef}
          tabIndex={-1}
          role="group"
          aria-labelledby={questionId}
          className="-m-2 flex flex-col gap-2.5 rounded-2xl p-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
        >
          <AnswerBox tone="right" label="Bonne réponse">{question.answers[0]}</AnswerBox>
          <p className="text-[0.9375rem] leading-normal">{question.explanation}</p>
          <SourceLink source={question.source} />
        </div>
      )}
    </li>
  )
}

function CheckOption({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: string }) {
  const id = useId()
  return (
    <div className="flex min-h-11 items-center gap-2.5 text-[0.9375rem]">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-[1.375rem] shrink-0 accent-primary dark:accent-action"
      />
      <label htmlFor={id} className="cursor-pointer py-2">
        {children}
      </label>
    </div>
  )
}

/** Back link, title and counts (from TITLE_COUNTS: shown before the questions are there). */
function RevisionHead({ title }: { title: TitleKey }) {
  return (
    <div className="flex flex-col gap-2.5">
      <BackLink>Mon parcours</BackLink>
      <h1 className="text-[2.125rem] leading-none font-bold tracking-[-0.04em] md:text-[3rem]">Réviser</h1>
      <p className="text-[0.9375rem] dark:text-muted-foreground">
        {TARGET_TITLE_LABELS[title]} · {TITLE_COUNTS[title].official} questions + {TITLE_COUNTS[title].situational} mises
        en situation
      </p>
    </div>
  )
}

/** Revision: loads the questions of the chosen title (one pack, at once), then shows them. */
export default function Revision() {
  useDocumentTitle('Révision')
  const location = useLocation()
  // Title of the visit: the one of the exam that sent us here (an exam of another title than the chosen one is
  // reviewed with its own questions, the chosen title is left untouched), else the chosen title.
  // The questions come with its pack (maquettes Lt1 and Lt2 while it loads or if it fails)
  const [title] = useState(() => {
    const fromExam = (location.state as { title?: unknown } | null)?.title
    return isTitleKey(fromExam) ? fromExam : (loadTargetTitle() ?? DEFAULT_TITLE)
  })
  const pack = useQuestionPack(title)
  if (pack.status !== 'ready') {
    return (
      <PageFrame>
        <div className="mx-auto flex w-full max-w-[30rem] flex-col gap-6 px-5 pt-0 pb-7 md:max-w-[36rem] md:px-8">
          <RevisionHead title={title} />
          <QuestionPackStatus pack={pack} />
        </div>
      </PageFrame>
    )
  }
  return <RevisionContent title={title} pack={pack.questions} />
}

/** Every question of the chosen title with its answer, filtered by theme or « À revoir » (maquette Pa8). */
function RevisionContent({ title, pack }: { title: TitleKey; pack: ListedQuestion[] }) {
  const location = useLocation()
  const pathname = location.pathname
  const [{ titlePool, poolIds, themes }] = useState(() => {
    const questions = questionsForTitle(title, pack)
    return { titlePool: questions, poolIds: new Set(questions.map((q) => q.id)), themes: themesOf(questions) }
  })
  const [examIds] = useState(() => parseReviewIds(location.state, poolIds))
  // Only questions of the pool: an id removed since the exam would count without a card
  const [reviewIds] = useState(() => loadQuestionsToReview(title).filter((id) => poolIds.has(id)))
  // Coming from an exam detail wins over the remembered view: nothing is restored then
  // The remembered view also gives « Masquer les réponses » to an arrival from an exam
  const [remembered] = useState(() => loadRevisionView(title, themes, reviewIds.length > 0))
  const [restored] = useState(() => (examIds.length > 0 ? null : remembered))
  const [filter, setFilterState] = useState<Filter>(() =>
    examIds.length > 0 ? { kind: 'exam' } : (restored?.filter ?? { kind: 'all' }),
  )
  const [excludeSituational, setExcludeSituationalState] = useState(restored?.excludeSituational ?? false)
  const [hideAnswers, setHideAnswersState] = useState(remembered?.hideAnswers ?? false)
  // Cards whose answer was shown by the user: kept until the page is left, never stored
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(() => new Set())
  // Set when the user (not the mount, not the restoration) changes the list: see the effect below
  const userChanged = useRef(false)
  const setFilter = (next: Filter) => {
    userChanged.current = true
    setFilterState(next)
  }
  const setExcludeSituational = (next: boolean) => {
    userChanged.current = true
    setExcludeSituationalState(next)
  }
  const setHideAnswers = (next: boolean) => {
    // Not `userChanged`: the list of questions stays the same, the page keeps its place
    setHideAnswersState(next)
    // Unchecking shows everything; checking again hides everything again
    setRevealed(new Set())
    // The exam filter is never remembered, but the box is: keep the rest of the remembered view as it was
    if (filter.kind === 'exam') {
      // Read the memory now (it may have changed since the mount, e.g. a filter chosen before the exam filter)
      const base: RevisionView = loadRevisionView(title, themes, reviewIds.length > 0) ?? {
        filter: { kind: 'all' },
        excludeSituational: false,
        hideAnswers: false,
        scrollY: 0,
      }
      saveRevisionView(title, { ...base, hideAnswers: next })
    }
  }
  const bandRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const scrollY = useRef(restored?.scrollY ?? 0)
  const anchor = useRef<{ id: number; offset: number } | null>(
    restored?.anchorId !== undefined ? { id: restored.anchorId, offset: restored.anchorOffset ?? 0 } : null,
  )
  const withAnchor = () => (anchor.current ? { anchorId: anchor.current.id, anchorOffset: anchor.current.offset } : {})
  // Height of what covers the top of the page once scrolled: the stuck band on a phone (its height, not its
  // position: it is not stuck yet when the page is back at the top), nothing elsewhere
  const coveredHeight = () => {
    const band = bandRef.current
    return band && getComputedStyle(band).position === 'sticky' ? band.getBoundingClientRect().height : 0
  }
  // The first card whose bottom is below the covered area, and where its top sits relative to it
  const measureAnchor = () => {
    const covered = coveredHeight()
    for (const li of cardsRef.current?.querySelectorAll<HTMLElement>('li[data-question-id]') ?? []) {
      const rect = li.getBoundingClientRect()
      if (rect.bottom > covered) return { id: Number(li.dataset.questionId), offset: rect.top - covered }
    }
    return null
  }
  // False until the saved position is back: the jump to the top of a new page must not overwrite it
  const tracking = useRef(false)

  // Remember filter, box and position on this device (not when the exam filter is on)
  useEffect(() => {
    if (filter.kind === 'exam') return
    // Revealing cards changes heights: when the box is the cause, the position is measured again on the new layout
    if (tracking.current) {
      scrollY.current = window.scrollY
      anchor.current = measureAnchor()
    }
    saveRevisionView(title, { filter, excludeSituational, hideAnswers, scrollY: scrollY.current, ...withAnchor() })
  }, [title, filter, excludeSituational, hideAnswers])

  // A new list starts at its top: from further down, go back to the top of the cards column (under the stuck band)
  useEffect(() => {
    if (!userChanged.current) return
    userChanged.current = false
    const column = cardsRef.current
    if (!column) return
    const band = bandRef.current
    const bandHeight = band && getComputedStyle(band).position === 'sticky' ? band.getBoundingClientRect().height : 0
    const top = column.getBoundingClientRect().top + window.scrollY - bandHeight
    if (window.scrollY > top) window.scrollTo(0, Math.max(0, top))
  }, [filter, excludeSituational])

  const latest = useRef({ filter, excludeSituational, hideAnswers })
  useEffect(() => {
    latest.current = { filter, excludeSituational, hideAnswers }
  })

  useEffect(() => {
    let frame = 0
    const remember = () => {
      frame = 0
      const { filter: f, excludeSituational: ex, hideAnswers: hide } = latest.current
      // Leaving pushes the new address before the router scrolls the next page to the top
      if (!tracking.current || window.location.pathname !== pathname || f.kind === 'exam') return
      scrollY.current = window.scrollY
      anchor.current = measureAnchor()
      saveRevisionView(title, { filter: f, excludeSituational: ex, hideAnswers: hide, scrollY: scrollY.current, ...withAnchor() })
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(remember)
    }
    // Wait for the page scroll reset of the router, then put the saved position back
    const timer = window.setTimeout(() => {
      // Back on the same card when it is still listed (the heights of the cards may differ from the last visit)
      const card = anchor.current
        ? cardsRef.current?.querySelector<HTMLElement>(`li[data-question-id="${anchor.current.id}"]`)
        : null
      if (card && anchor.current) {
        window.scrollTo(0, Math.max(0, card.getBoundingClientRect().top + window.scrollY - coveredHeight() - anchor.current.offset))
      } else if (scrollY.current > 0) window.scrollTo(0, scrollY.current)
      // The restored pill may be out of sight in the sideways band: bring it in without moving the page
      const band = bandRef.current
      const pressed = band?.querySelector<HTMLElement>('[aria-pressed="true"]')
      if (band && pressed && band.scrollWidth > band.clientWidth) {
        band.scrollLeft = pressed.offsetLeft - (band.clientWidth - pressed.offsetWidth) / 2
      }
      tracking.current = true
    }, 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      tracking.current = false
    }
  }, [title, pathname])

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
    <PageFrame>
      {/* data-restores-scroll: the page puts the remembered position back shortly after arriving; the page shell
          then leaves the focus alone (a title focus would make the next Tab jump away from that position) */}
      <div data-restores-scroll={(restored?.scrollY ?? 0) > 0 ? '' : undefined} className="mx-auto flex w-full max-w-[30rem] flex-col gap-3.5 px-5 pt-0 pb-7 md:max-w-[36rem] md:px-8 lg:grid lg:max-w-[62rem] lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-x-14 lg:px-10">
        {/* From 1024 px: a sticky side column with the header and the filters (side padding: room for the focus rings).
            Below: `contents` lets the pill band be a child of the page column, so that it can stay stuck at the top
            all along the cards (a sticky element only sticks inside its parent; no overflow-hidden above it either). */}
        <div className="contents lg:flex lg:flex-col lg:gap-3.5 lg:sticky lg:top-0 lg:-mx-2 lg:max-h-svh lg:overflow-y-auto lg:px-2 lg:py-8">
          <RevisionHead title={title} />

          {/* Pills scroll sideways on a phone and wrap on a wider screen; the vertical padding keeps the focus ring visible.
              Stuck at the top on a phone (below 640 px: page background, thin rule under it) while the cards scroll; the wrapped pills of a tablet would take a quarter of the screen. */}
          <div ref={bandRef} data-sticky-band className="sticky top-0 z-10 -mx-5 overflow-x-auto border-b border-border bg-background px-5 py-1.5 [scrollbar-width:none] sm:static sm:overflow-visible sm:border-b-0 md:-mx-8 md:px-8 lg:mx-0 lg:bg-transparent lg:px-0">
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
                  {themeLabel(theme)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <CheckOption checked={excludeSituational} onChange={setExcludeSituational}>
              Sans les mises en situation
            </CheckOption>
            <CheckOption checked={hideAnswers} onChange={setHideAnswers}>
              Masquer les réponses
            </CheckOption>
          </div>

        </div>

        {/* Cards on one reading column */}
        <div ref={cardsRef} className="flex flex-col gap-3.5 lg:max-w-[40rem] lg:pt-[7.25rem]">
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
              <section key={theme} aria-label={`Thème : ${themeLabel(theme)}`} className="flex flex-col gap-3 pt-2">
                <h2 className="text-base font-bold">
                  {themeLabel(theme)} <span className="font-normal tabular-nums">({items.length})</span>
                </h2>
                <ul className="flex flex-col gap-3">
                  {items.map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      hidden={hideAnswers && !revealed.has(q.id)}
                      onReveal={() => setRevealed((prev) => new Set(prev).add(q.id))}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </PageFrame>
  )
}
