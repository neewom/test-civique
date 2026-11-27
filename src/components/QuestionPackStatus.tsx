import { LoaderCircle, WifiOff } from 'lucide-react'
import { PillButton } from '@/components/PillButton'
import type { QuestionPack } from '@/lib/use-question-pack'

/**
 * State of a page waiting for its questions (maquettes Lt1 to Lt3, lot 3): « Chargement des
 * questions… » while the pack downloads, then a calm message and « Réessayer » if it failed.
 * The spinner turns only with animations on (data-motion, src/lib/motion.ts).
 */
export function QuestionPackStatus({ pack }: { pack: QuestionPack }) {
  if (pack.status === 'idle' || pack.status === 'ready') return null
  if (pack.status === 'loading') {
    return (
      <p role="status" className="flex min-h-11 items-center gap-3 text-base font-bold">
        <LoaderCircle aria-hidden="true" className="size-6 shrink-0 animate-spin" strokeWidth={2.4} />
        Chargement des questions…
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <div role="alert" className="flex flex-col gap-1.5 rounded-2xl bg-card p-4 text-card-foreground">
        <p className="flex items-start gap-3 text-lg leading-[1.35] font-bold">
          <WifiOff aria-hidden="true" className="mt-0.5 size-6 shrink-0" strokeWidth={2.2} />
          Les questions n'ont pas pu être chargées.
        </p>
        <p className="text-[0.9375rem] leading-normal">Vérifiez votre connexion à Internet, puis réessayez.</p>
      </div>
      <PillButton size="lg" className="w-full justify-center" onClick={pack.retry}>
        Réessayer
      </PillButton>
    </div>
  )
}
