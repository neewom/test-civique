import { useRef, useState } from 'react'
import { ArrowRight, Check, CircleAlert } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { BrandSymbol } from '@/components/BrandLogo'
import { BackLink } from '@/components/BackLink'
import { OrganicBackground } from '@/components/OrganicBackground'
import { PillButton } from '@/components/PillButton'
import { ficheUrl, FICHE_LABELS } from '@/lib/fiches'
import { questionsForTitle } from '@/lib/exam'
import { hasProgress } from '@/lib/exam-types'
import { loadHistory } from '@/lib/history'
import { loadTargetTitle, saveTargetTitle, TARGET_TITLE_LABELS, TARGET_TITLES, type TargetTitle, type TitleKey } from '@/lib/target-title'
import { useDocumentTitle } from '@/lib/use-document-title'
import { cn } from '@/lib/utils'

// Official (non situational) questions of each title's list
const officialCount = (t: TargetTitle) => questionsForTitle(t).filter((q) => q.notion !== 'mise-en-situation').length

// Own link under each option (a separate target: it never changes the selection)
function MoreLink({ title }: { title: TitleKey }) {
  return (
    <Link
      to={ficheUrl(title)}
      className="inline-flex min-h-11 items-center gap-1 self-start rounded-sm px-5 text-[0.9375rem] font-bold underline underline-offset-4"
    >
      En savoir plus<span className="sr-only"> sur : {FICHE_LABELS[title]}</span>
      <ArrowRight aria-hidden="true" className="size-[1em]" strokeWidth={2.6} />
    </Link>
  )
}

const optionClass =
  'flex min-h-16 w-full items-center justify-between gap-3 rounded-[2rem] py-2 pr-2.5 pl-5 text-left'

/**
 * The titles to pick from (first visit and change of title share them), each with its
 * question count.
 */
function TitleChoices({
  selected,
  onSelect,
  firstVisit,
  groupRef,
}: {
  selected: TargetTitle | null
  onSelect: (t: TargetTitle) => void
  firstVisit: boolean
  groupRef?: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      ref={groupRef}
      role="group"
      aria-label="Titre visé"
      className={cn('flex flex-col', firstVisit ? 'gap-2.5' : 'mt-[clamp(2rem,16svh,8.75rem)] gap-3')}
    >
      {TARGET_TITLES.map((key) => {
        const on = selected === key
        return (
          <div key={key} className="flex flex-col">
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(key)}
              className={cn(
                optionClass,
                on
                  ? firstVisit
                    ? 'bg-earth text-[#2c2e2a] dark:text-[#f1eee4]'
                    : 'bg-primary text-primary-foreground'
                  : 'bg-card text-card-foreground',
              )}
            >
              <span className="flex min-w-0 flex-col hyphens-auto">
                <span className="text-[1.0625rem] leading-snug font-bold">{TARGET_TITLE_LABELS[key]}</span>
                <span className={cn('text-[0.8125rem]', on ? (firstVisit ? '' : 'opacity-90') : 'text-muted-foreground')}>
                  {officialCount(key)} questions officielles
                </span>
              </span>
              {firstVisit ? (
                // Same round mark on every option: a ring at rest, the check once chosen
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                    on
                      ? 'bg-[#2c2e2a] text-[#f5e211] dark:bg-[#f1eee4] dark:text-[#121814]'
                      : 'border-[3px] border-muted-foreground/40',
                  )}
                >
                  {on && <Check className="size-[1.125em]" strokeWidth={2.8} />}
                </span>
              ) : (
                on && (
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-earth text-foreground dark:bg-action dark:text-action-foreground"
                  >
                    <Check className="size-[1.125em]" strokeWidth={2.8} />
                  </span>
                )
              )}
            </button>
            <MoreLink title={key} />
          </div>
        )
      })}
    </div>
  )
}

// Fine contour lines of the meadow, anchored to the right edge. The yellow is a line,
// never a fill: the one yellow fill of the screen is « Continuer ».
function MeadowLines() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 390 420"
      preserveAspectRatio="xMaxYMid meet"
      className="pointer-events-none absolute inset-0 size-full"
    >
      <path
        d="M410 150 C 340 170, 322 240, 346 300 C 356 326, 380 340, 410 340"
        fill="none"
        className="stroke-[#f5e211] dark:stroke-[#a89a1c]"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M410 110 C 320 130, 296 230, 326 306 C 340 340, 372 362, 410 366"
        fill="none"
        className="stroke-[#2c2e2a]/25 dark:stroke-[#f1eee4]/20"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * First visit (maquettes Nv01 / Nv02): welcome and title choice on one page, on a
 * big green field. No « Retour » (nothing to go back to) and no name in the header
 * (the page shows the logo large).
 */
function FirstVisit({ selected, onSelect, onContinue, showError, groupRef }: ChoiceProps) {
  // <main> clips (overflow-clip) rather than hides: hidden would make it the scroll container and break the sticky bar
  return (
    <main className="relative flex min-h-svh flex-col overflow-clip bg-background text-foreground">
      <div className="relative bg-earth text-[#2c2e2a] dark:text-[#f1eee4]">
        <MeadowLines />
        <AppHeader hideBrand />
        <div className="relative mx-auto flex w-full max-w-[30rem] flex-col items-start gap-3 px-[22px] pt-0 pb-4 md:max-w-[34rem] md:px-8">
          <BrandSymbol large className="size-[4.25rem] shrink-0" />
          <p className="text-xl font-bold">
            <span className="text-[#1f4f15] dark:text-[#8ed462]">Futur</span> Citoyen
          </p>
          <h1 className="max-w-[19rem] text-[2.375rem] leading-[0.98] font-bold tracking-[-0.04em] text-balance md:max-w-[22rem] md:text-[3rem]">
            Préparez l'examen civique
          </h1>
          <p className="max-w-[17rem] text-base leading-[1.4] md:max-w-[22rem]">
            Entraînez-vous gratuitement, avec les questions officielles. Sans inscription.
          </p>
          <p className="rounded-full bg-background/80 px-3 py-0.5 text-xs text-foreground">
            Site indépendant, non officiel
          </p>
        </div>
      </div>
      {/* Wavy lower edge of the field, drawn in the field's own colour */}
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 390 50"
        preserveAspectRatio="none"
        className="-mt-px block h-10 w-full fill-earth"
      >
        <path d="M0 0 H390 V26 C 340 52, 270 54, 200 36 C 130 18, 60 30, 0 22 Z" />
      </svg>

      <div className="mx-auto flex w-full max-w-[30rem] grow flex-col gap-3 px-[22px] pt-4 pb-6 md:max-w-[34rem] md:px-8 md:pt-2 md:pb-4">
        <h2 className="text-[1.0625rem] font-bold">Quel titre préparez-vous ?</h2>
        <TitleChoices selected={selected} onSelect={onSelect} firstVisit groupRef={groupRef} />
        <p className="text-sm text-muted-foreground">Vous pourrez changer plus tard.</p>
      </div>
      {/* Action bar: « Continuer » stays on screen whatever the height (maquettes Lp1 / Lp2) */}
      <div
        data-testid="continue-bar"
        className="sticky bottom-0 z-10 border-t border-border bg-background pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto w-full max-w-[30rem] px-[22px] md:max-w-[34rem] md:px-8">
          <div role="alert">
            {showError && (
              <p className="mb-2.5 flex items-start gap-2 text-[0.9375rem] leading-snug font-bold text-destructive">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" strokeWidth={2.4} />
                Choisissez d'abord le titre que vous préparez.
              </p>
            )}
          </div>
          <PillButton size="lg" onClick={onContinue} className="w-full justify-center text-center">
            Continuer
          </PillButton>
        </div>
      </div>
    </main>
  )
}

interface ChoiceProps {
  selected: TargetTitle | null
  onSelect: (t: TargetTitle) => void
  onContinue: () => void
  showError: boolean
  groupRef: React.RefObject<HTMLDivElement | null>
}

/**
 * « Quel titre préparez-vous ? »: the first-visit page when nothing is known about
 * the visitor (no title, no exam, no history), whatever way they arrive; otherwise
 * the change of title, opened from the home page, with « Retour ».
 */
export default function TitreVise() {
  // Same rule as the home page's: nothing chosen, no history, no exam in progress
  const [firstVisit] = useState(() => loadTargetTitle() === null && loadHistory().length === 0 && !hasProgress())
  useDocumentTitle(firstVisit ? "Préparez l'examen civique" : 'Quel titre préparez-vous ?')
  const navigate = useNavigate()
  const location = useLocation()
  // The unsaved selection is kept in the history entry, so a round trip to a sheet
  // (« En savoir plus », then back) does not lose it
  // First visit: nothing is preselected, the visitor chooses
  const [selected, setSelected] = useState<TargetTitle | null>(() => {
    const kept = (location.state as { selected?: unknown } | null)?.selected
    if (typeof kept === 'string' && (TARGET_TITLES as readonly string[]).includes(kept)) return kept as TargetTitle
    return firstVisit ? null : (loadTargetTitle() ?? 'pluriannuelle')
  })
  const [showError, setShowError] = useState(false)
  const groupRef = useRef<HTMLDivElement>(null)
  function handleSelect(t: TargetTitle) {
    setShowError(false)
    setSelected(t)
    navigate('.', { replace: true, state: { selected: t } })
  }

  function handleContinue() {
    if (selected === null) {
      // Nothing chosen: say so, stay here, and put the focus on the first title
      setShowError(true)
      groupRef.current?.querySelector('button')?.focus()
      return
    }
    saveTargetTitle(selected)
    // The first visit is not a page to come back to
    navigate('/', { replace: firstVisit })
  }

  if (firstVisit) {
    return (
      <FirstVisit
        selected={selected}
        onSelect={handleSelect}
        onContinue={handleContinue}
        showError={showError}
        groupRef={groupRef}
      />
    )
  }

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-background text-foreground">
      <OrganicBackground shape="goal" />
      <AppHeader />
      <div className="relative mx-auto flex grow w-full max-w-[30rem] flex-col gap-3.5 px-[22px] pt-0 pb-6">
        <BackLink />
        <h1 className="mt-[3.75rem] max-w-[16.25rem] text-[2.25rem] leading-none font-bold tracking-[-0.04em] text-balance">
          Quel titre préparez-vous ?
        </h1>
        <p className="max-w-[19rem] text-base leading-[1.45]">
          Les questions officielles ne sont pas les mêmes selon le titre. Vous pourrez changer plus tard.
        </p>
        <TitleChoices selected={selected} onSelect={handleSelect} firstVisit={false} />
        <PillButton size="lg" onClick={handleContinue} className="mt-auto w-full justify-center text-center">
          Continuer
        </PillButton>
      </div>
    </main>
  )
}
