import { useState } from 'react'
import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { BrandSymbol } from '@/components/BrandLogo'
import { BackLink } from '@/components/BackLink'
import { OrganicBackground } from '@/components/OrganicBackground'
import { PillButton } from '@/components/PillButton'
import { questionsForTitle } from '@/lib/exam'
import { hasProgress } from '@/lib/exam-types'
import { loadHistory } from '@/lib/history'
import { loadTargetTitle, saveTargetTitle, TARGET_TITLE_LABELS, TARGET_TITLES, type TargetTitle } from '@/lib/target-title'
import { useDocumentTitle } from '@/lib/use-document-title'
import { cn } from '@/lib/utils'

// Official (non situational) questions of each title's list
const officialCount = (t: TargetTitle) => questionsForTitle(t).filter((q) => q.notion !== 'mise-en-situation').length

// Titles not available yet: shown, but they cannot be chosen
const COMING_SOON = [{ label: 'Naturalisation', detail: 'Bientôt' }]

const optionClass =
  'flex min-h-16 w-full items-center justify-between gap-3 rounded-[2rem] py-2 pr-2.5 pl-5 text-left'

/**
 * The titles to pick from (first visit and change of title share them): the open ones
 * with their question count, and the ones that are not available yet.
 */
function TitleChoices({
  selected,
  onSelect,
  firstVisit,
}: {
  selected: TargetTitle
  onSelect: (t: TargetTitle) => void
  firstVisit: boolean
}) {
  return (
    <div
      role="group"
      aria-label="Titre visé"
      className={cn('flex flex-col', firstVisit ? 'gap-2.5' : 'mt-[clamp(2rem,16svh,8.75rem)] gap-3')}
    >
      {TARGET_TITLES.map((key) => {
        const on = selected === key
        return (
          <button
            key={key}
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
            <span className="flex min-w-0 flex-col">
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
        )
      })}
      {COMING_SOON.map((t) => (
        <button
          key={t.label}
          type="button"
          disabled
          aria-pressed={false}
          className={cn(optionClass, 'cursor-not-allowed bg-card text-card-foreground', firstVisit && 'bg-card/70')}
        >
          <span className="flex min-w-0 flex-col">
            <span className="text-[1.0625rem] leading-snug font-bold">{t.label}</span>
            {!firstVisit && <span className="text-[0.8125rem] text-muted-foreground">{t.detail}</span>}
          </span>
          {firstVisit && (
            <span className="rounded-full bg-muted px-2.5 text-[0.8125rem] leading-6 font-bold text-muted-foreground">
              {t.detail}
            </span>
          )}
        </button>
      ))}
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
function FirstVisit({ selected, onSelect, onContinue }: ChoiceProps) {
  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-background text-foreground">
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
        <TitleChoices selected={selected} onSelect={onSelect} firstVisit />
        <p className="text-sm text-muted-foreground">Vous pourrez changer plus tard.</p>
        <PillButton size="lg" onClick={onContinue} className="mt-auto w-full justify-center text-center">
          Continuer
        </PillButton>
      </div>
    </main>
  )
}

interface ChoiceProps {
  selected: TargetTitle
  onSelect: (t: TargetTitle) => void
  onContinue: () => void
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
  const [selected, setSelected] = useState<TargetTitle>(() => loadTargetTitle() ?? 'pluriannuelle')

  function handleContinue() {
    saveTargetTitle(selected)
    // The first visit is not a page to come back to
    navigate('/', { replace: firstVisit })
  }

  if (firstVisit) return <FirstVisit selected={selected} onSelect={setSelected} onContinue={handleContinue} />

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
        <TitleChoices selected={selected} onSelect={setSelected} firstVisit={false} />
        <PillButton size="lg" onClick={handleContinue} className="mt-auto w-full justify-center text-center">
          Continuer
        </PillButton>
      </div>
    </main>
  )
}
