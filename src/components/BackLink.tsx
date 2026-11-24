import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

/** « ← Retour » link at the top of a secondary page (maquettes Pa2, Pa3). */
export function BackLink({ to = '/' }: { to?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-sm text-[0.9375rem] font-bold no-underline hover:underline hover:underline-offset-4"
    >
      <ArrowLeft aria-hidden="true" className="size-[1.1em] shrink-0" strokeWidth={2.4} />
      Retour
    </Link>
  )
}
