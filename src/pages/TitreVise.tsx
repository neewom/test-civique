import { useState } from 'react'
import { Check } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { BackLink } from '@/components/BackLink'
import { OrganicBackground } from '@/components/OrganicBackground'
import { PillButton } from '@/components/PillButton'
import { questionsForTitle } from '@/lib/exam'
import { loadTargetTitle, saveTargetTitle, TARGET_TITLE_LABELS, TARGET_TITLES, type TargetTitle } from '@/lib/target-title'
import { useDocumentTitle } from '@/lib/use-document-title'
import { cn } from '@/lib/utils'

// Official (non situational) questions of each title's list
const officialCount = (t: TargetTitle) => questionsForTitle(t).filter((q) => q.notion !== 'mise-en-situation').length

// Titles not available yet: shown, but they cannot be chosen
const COMING_SOON = [{ label: 'Naturalisation', detail: 'Bientôt' }]

const optionClass =
  'flex min-h-16 w-full items-center justify-between gap-3 rounded-[2rem] py-2 pr-2.5 pl-5 text-left'

/** « Quel titre préparez-vous ? » (maquette Pa2): first launch, then from the home page. */
export default function TitreVise() {
  useDocumentTitle('Quel titre préparez-vous ?')
  const navigate = useNavigate()
  const location = useLocation()
  // First launch = sent here by the home page (no title chosen, no exam yet):
  // there is no home page to go back to. Opened from the home pill, « Retour » shows.
  const firstLaunch = (location.state as { firstLaunch?: boolean } | null)?.firstLaunch === true
  const [selected, setSelected] = useState<TargetTitle>(() => loadTargetTitle() ?? 'pluriannuelle')

  function handleContinue() {
    saveTargetTitle(selected)
    navigate('/', { replace: firstLaunch })
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <OrganicBackground shape="goal" />
      <div className="relative mx-auto flex min-h-svh w-full max-w-[30rem] flex-col gap-3.5 px-[22px] pt-3 pb-6">
        <AppHeader />
        {firstLaunch ? <div className="min-h-11" aria-hidden="true" /> : <BackLink />}
        <h1 className="mt-[3.75rem] max-w-[16.25rem] text-[2.25rem] leading-none font-bold tracking-[-0.04em] text-balance">
          Quel titre préparez-vous ?
        </h1>
        <p className="max-w-[19rem] text-base leading-[1.45]">
          Les questions officielles ne sont pas les mêmes selon le titre. Vous pourrez changer plus tard.
        </p>

        <div role="group" aria-label="Titre visé" className="mt-[clamp(2rem,16svh,8.75rem)] flex flex-col gap-3">
          {TARGET_TITLES.map((key) => {
            const on = selected === key
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => setSelected(key)}
                className={cn(optionClass, on ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground')}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-[1.0625rem] leading-snug font-bold">{TARGET_TITLE_LABELS[key]}</span>
                  <span className={cn('text-[0.8125rem]', on ? 'opacity-90' : 'text-muted-foreground')}>
                    {officialCount(key)} questions officielles
                  </span>
                </span>
                {on && (
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-earth text-foreground dark:bg-action dark:text-action-foreground"
                  >
                    <Check className="size-[1.125em]" strokeWidth={2.8} />
                  </span>
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
              className={cn(optionClass, 'cursor-not-allowed bg-card text-card-foreground')}
            >
              <span className="flex min-w-0 flex-col">
                <span className="text-[1.0625rem] leading-snug font-bold">{t.label}</span>
                <span className="text-[0.8125rem] text-muted-foreground">{t.detail}</span>
              </span>
            </button>
          ))}
        </div>

        <PillButton size="lg" onClick={handleContinue} className="mt-auto w-full justify-center text-center">
          Continuer
        </PillButton>
      </div>
    </main>
  )
}
