import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { BrandLogo } from '@/components/BrandLogo'
import { saveMotion } from '@/lib/motion'
import { useMotion } from '@/lib/use-motion'
import { useTheme } from '@/lib/theme-context'
import { cn } from '@/lib/utils'

/** Two-choice setting: a label and two pills (the pressed one is the current choice). */
function Setting({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: [string, string]
  value: 0 | 1
  onChange: (v: 0 | 1) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      <p className="text-[0.8125rem] font-bold text-muted-foreground" aria-hidden="true">
        {label}
      </p>
      <div className="flex flex-wrap gap-1 rounded-[1.375rem] bg-muted p-1">
        {options.map((option, i) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === i}
            onClick={() => onChange(i as 0 | 1)}
            className={cn(
              'min-h-11 flex-auto rounded-full px-3 text-[0.9375rem] font-bold whitespace-nowrap transition-colors',
              value === i
                ? 'bg-earth text-[#2c2e2a] dark:text-[#f1eee4]'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Content of the « Affichage » panel: theme and animations. */
function DisplaySettings() {
  const { theme, toggle } = useTheme()
  const motion = useMotion()
  return (
    <>
      <p className="text-[1.0625rem] font-bold">Affichage</p>
      <Setting
        label="Thème"
        options={['Clair', 'Sombre']}
        value={theme === 'dark' ? 1 : 0}
        onChange={(v) => (v === 1) !== (theme === 'dark') && toggle()}
      />
      <Setting
        label="Animations"
        options={['Activées', 'Désactivées']}
        value={motion === 'on' ? 0 : 1}
        onChange={(v) => saveMotion(v === 0 ? 'on' : 'off')}
      />
    </>
  )
}

/** « Affichage » button and its small panel. */
function DisplayMenu() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    // Focus lands on the first setting
    wrapRef.current?.querySelector<HTMLButtonElement>('[role=group] button')?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={(e) => {
        // Keyboard focus left the button and the panel: close it (a hidden focus is a trap)
        const next = e.relatedTarget as Node | null
        if (open && next && !e.currentTarget.contains(next)) setOpen(false)
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label="Affichage"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-full text-card-foreground transition-colors hover:bg-muted',
          open ? 'bg-muted' : 'bg-card',
        )}
      >
        <SlidersHorizontal aria-hidden="true" className="size-5" strokeWidth={2.2} />
      </button>
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label="Affichage"
          className="absolute top-[calc(100%+0.5rem)] right-0 z-50 flex w-[min(17.5rem,calc(100vw-2.75rem))] flex-col gap-4 rounded-[1.5rem] bg-card p-4 text-card-foreground shadow-[0_6px_28px_rgba(44,46,42,0.18)] ring-1 ring-border dark:shadow-[0_6px_28px_rgba(0,0,0,0.5)]"
        >
          <DisplaySettings />
        </div>
      )}
    </div>
  )
}

interface AppHeaderProps {
  /** Thin variant (exam): smaller logo and tighter spacing, the question keeps the room */
  thin?: boolean
  /** The logo asks for confirmation instead of leaving (exam in progress) */
  onLogoClick?: () => void
}

/**
 * Permanent header, on every page, first child of <main> (outside the page's column):
 * same maximum width, gutters and position everywhere, whatever the page grid, so the
 * logo and the « Affichage » button never move from one page to the next. Holds the
 * logo (a link to the home page) and the « Affichage » button (theme, animations).
 */
export function AppHeader({ thin = false, onLogoClick }: AppHeaderProps) {
  const logoClass = cn(
    'inline-flex min-h-11 min-w-0 items-center rounded-sm font-bold no-underline',
    thin ? 'text-base' : 'text-xl',
  )
  return (
    <div
      className={cn(
        'relative z-40 mx-auto w-full max-w-[62rem] px-[22px] md:px-8 lg:px-10',
        thin ? 'pt-1' : 'pt-3 pb-3 md:pt-4',
      )}
    >
      <header
        // Explicit landmark: the header sits inside <main>, where <header> alone has no banner role
        role="banner"
        data-app-header
        className="flex w-full items-center justify-between gap-3"
      >
        {onLogoClick ? (
          <button
            type="button"
            onClick={onLogoClick}
            aria-label="Futur Citoyen, retour à l'accueil"
            className={logoClass}
          >
            <BrandLogo />
          </button>
        ) : (
          <Link to="/" className={logoClass}>
            <BrandLogo />
          </Link>
        )}
        <DisplayMenu />
      </header>
    </div>
  )
}
