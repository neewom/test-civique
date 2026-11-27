import { useEffect, useState } from 'react'
import { Verdict } from '@/components/Verdict'
import { currentMotion } from '@/lib/motion'

/** Time the stamp stays fully visible once it has landed (after its 0.32 s arrival) */
const HOLD_MS = 1150
const OUT_MS = 350
/** Animations off: no movement, the stamp is just shown for this long */
const STILL_MS = 1300

interface VerdictStampProps {
  right: boolean
}

/**
 * Verdict of a validated answer, stamped over the screen: fixed at the centre, tilted,
 * above the content, never in the flow and never focusable (the announcement is a status
 * region of the exam screen). Arrives in 0.32 s, holds, fades out in 0.35 s and removes
 * itself. With animations off, it is shown 1.3 s without any movement, then removed.
 * Rendered with a `key` per correction: a new correction replaces the previous stamp.
 */
export function VerdictStamp({ right }: VerdictStampProps) {
  const [step, setStep] = useState<'in' | 'out' | 'gone'>('in')
  // The effective setting (stored choice, else the device preference), read once on arrival
  const [moving] = useState(() => currentMotion() === 'on')

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    if (moving) {
      timers.push(setTimeout(() => setStep('out'), HOLD_MS))
      timers.push(setTimeout(() => setStep('gone'), HOLD_MS + OUT_MS))
    } else {
      timers.push(setTimeout(() => setStep('gone'), STILL_MS))
    }
    return () => timers.forEach(clearTimeout)
  }, [moving])

  if (step === 'gone') return null

  return (
    <div
      data-testid="verdict-stamp"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
    >
      <Verdict
        decorative
        size="stamp"
        tone={right ? 'success' : 'error'}
        className={[
          'shadow-[0_10px_30px_rgba(0,0,0,0.18)]',
          // The tilt is part of the keyframes when moving (a rotate utility would add to it)
          moving ? (step === 'in' ? 'verdict-stamp-in' : 'verdict-stamp-out') : '-rotate-6',
        ].join(' ')}
      >
        {right ? 'Bien joué' : 'Pas tout à fait'}
      </Verdict>
    </div>
  )
}
