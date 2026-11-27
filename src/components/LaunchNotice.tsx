import { GiftSymbol } from '@/components/BrandLogo'
import { LAUNCH_FREE_DETAIL, LAUNCH_FREE_HEADLINE } from '@/lib/launch-message'
import { cn } from '@/lib/utils'

/** The « free during the launch » message: a small card with the gift symbol (home). */
export function LaunchNotice({ className }: { className?: string }) {
  return (
    <p
      data-testid="launch-notice"
      className={cn(
        'flex max-w-[24rem] items-start gap-2.5 rounded-2xl bg-card px-3.5 py-3 text-sm leading-snug text-card-foreground',
        className,
      )}
    >
      <GiftSymbol className="mt-px size-5 shrink-0" />
      <span>
        <strong className="font-bold">{LAUNCH_FREE_HEADLINE}</strong> {LAUNCH_FREE_DETAIL}
      </span>
    </p>
  )
}
