import type { ReactNode } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { cn } from '@/lib/utils'

interface PageFrameProps {
  /** Classes of the outer box (height, colours, clipping, positioning of the shapes): formerly those of <main> */
  className?: string
  /** Decorative layer (organic shape), drawn behind the header and the content */
  background?: ReactNode
  /** The permanent header; `<AppHeader />` by default */
  header?: ReactNode
  /** Classes added to <main> (it is a column that fills the room left by the header) */
  mainClassName?: string
  /** After <main>: the page footer (a `contentinfo` landmark when it is a <footer>) */
  footer?: ReactNode
  children: ReactNode
}

/**
 * Frame of every page: the header (`banner` landmark, top level) comes BEFORE <main>, never
 * inside it, so that « go to main » skips the header and the footer stays a `contentinfo`.
 * The outer box keeps what <main> used to carry, so nothing moves on screen.
 */
export function PageFrame({ className, background, header, mainClassName, footer, children }: PageFrameProps) {
  return (
    <div className={cn('flex min-h-svh flex-col bg-background text-foreground', className)}>
      {background}
      {header ?? <AppHeader />}
      <main className={cn('flex grow flex-col', mainClassName)}>{children}</main>
      {footer}
    </div>
  )
}
