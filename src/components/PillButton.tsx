import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import type { Button as ButtonPrimitive } from '@base-ui/react/button'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PillTone = 'action' | 'ink' | 'surface'

interface PillOptions {
  /** action: yellow main action · ink: strong dark pill · surface: white pill */
  tone?: PillTone
  /** default: 48px · lg: 56px (main action) */
  size?: 'default' | 'lg'
  /** Round « pastille » at the end: an icon (decorative) or a counter such as « 1 sur 3 » */
  end?: ReactNode
  /** The end holds text (a counter): it is read by screen readers and grows to fit */
  endIsText?: boolean
  /** Overrides the colour of the end pastille (e.g. coral on « Voir mes erreurs », maquette Pa6) */
  endClassName?: string
  className?: string
  children?: ReactNode
}

const TONE_VARIANT = { action: 'pill', ink: 'pill-ink', surface: 'pill-surface' } as const

// Colour of the end pastille, per tone (maquettes Pa1 / Pd1)
const END_TONE: Record<PillTone, string> = {
  action: 'bg-action-foreground text-action',
  ink: 'bg-action text-action-foreground dark:bg-primary-foreground dark:text-action',
  surface: 'bg-primary text-primary-foreground',
}

function pillClassName({ tone = 'action', size = 'default', end, className }: PillOptions) {
  return cn(
    buttonVariants({ variant: TONE_VARIANT[tone], size: size === 'lg' ? 'pill-lg' : 'pill' }),
    end != null && 'justify-between',
    className,
  )
}

function PillContent({ tone = 'action', size = 'default', end, endIsText = false, endClassName, children }: PillOptions) {
  return (
    <>
      <span className="min-w-0">{children}</span>
      {end != null && endIsText && <span className="sr-only">, </span>}
      {end != null && (
        <span
          data-slot="pill-end"
          aria-hidden={endIsText ? undefined : true}
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full font-bold [&_svg:not([class*=size-])]:size-[1.125em]',
            size === 'lg' ? 'min-h-10 min-w-10' : 'min-h-8 min-w-8',
            endIsText && 'px-2.5 text-[0.9375rem] whitespace-nowrap',
            END_TONE[tone],
            endClassName,
          )}
        >
          {end}
        </span>
      )}
    </>
  )
}

type PillButtonProps = PillOptions & Omit<ButtonPrimitive.Props, 'className' | 'children' | 'render'>

/** Journey-map button: a pill 48 to 56px high, with an optional round pastille at the end. */
export function PillButton({ tone, size, end, endIsText, endClassName, className, children, ...props }: PillButtonProps) {
  return (
    <Button className={pillClassName({ tone, size, end, className })} {...props}>
      <PillContent tone={tone} size={size} end={end} endIsText={endIsText} endClassName={endClassName}>
        {children}
      </PillContent>
    </Button>
  )
}

type PillLinkProps = PillOptions & Omit<LinkProps, 'className' | 'children'>

/** Same pill, as a navigation link (keeps the link role). */
export function PillLink({ tone, size, end, endIsText, endClassName, className, children, ...props }: PillLinkProps) {
  return (
    <Link data-slot="button" className={pillClassName({ tone, size, end, className })} {...props}>
      <PillContent tone={tone} size={size} end={end} endIsText={endIsText} endClassName={endClassName}>
        {children}
      </PillContent>
    </Link>
  )
}
