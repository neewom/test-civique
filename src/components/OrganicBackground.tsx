import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion'
import { cn } from '@/lib/utils'

/*
 * The single organic « earth » shape of a screen (direction « la carte du parcours »).
 * It breathes very slowly (26 to 32 s cycles), stays still when the device asks for
 * less motion, and pauses while the tab is hidden.
 * Never mount it on the question screens: no motion while the user answers.
 */

export type OrganicShape = 'journey' | 'crest'

interface ShapeDef {
  // First value = resting shape; the animation loops back to it
  frames: string[]
  duration: string
}

// Paths drawn on a 390 × 844 phone canvas (maquettes Pa1 Accueil and Pa6 Résultat)
const SHAPES: Record<OrganicShape, ShapeDef> = {
  // Tall winding shape, home screen
  journey: {
    duration: '32s',
    frames: [
      'M-40 230 C 90 170, 270 190, 370 290 C 460 380, 430 520, 340 590 C 250 650, 300 740, 210 820 C 130 890, -20 880, -60 790 Z',
      'M-40 245 C 100 180, 280 180, 380 305 C 450 400, 420 505, 330 580 C 260 640, 310 755, 215 830 C 125 880, -25 870, -60 780 Z',
      'M-40 220 C 80 180, 260 205, 360 280 C 465 365, 440 530, 350 600 C 240 660, 290 730, 200 810 C 135 895, -15 885, -60 800 Z',
    ],
  },
  // Shape at the top of the screen, result screen
  crest: {
    duration: '30s',
    frames: [
      'M-50 60 C 120 0, 330 20, 430 120 C 470 260, 400 380, 270 410 C 150 440, 40 470, -50 430 Z',
      'M-50 70 C 130 10, 340 15, 430 130 C 465 275, 390 390, 260 420 C 145 445, 35 460, -50 420 Z',
    ],
  },
}

const EASE = '0.45 0 0.55 1'

interface OrganicBackgroundProps {
  shape?: OrganicShape
  /** The parent must be positioned (relative) and clip its overflow */
  className?: string
}

export function OrganicBackground({ shape = 'journey', className }: OrganicBackgroundProps) {
  const reducedMotion = usePrefersReducedMotion()
  const svgRef = useRef<SVGSVGElement>(null)
  const { frames, duration } = SHAPES[shape]

  // Pause the SMIL animation while the tab is hidden
  useEffect(() => {
    if (reducedMotion) return
    const svg = svgRef.current
    if (!svg) return
    function sync() {
      if (!svg) return
      if (document.hidden) svg.pauseAnimations?.()
      else svg.unpauseAnimations?.()
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [reducedMotion])

  const values = [...frames, frames[0]]
  const keyTimes = values.map((_, i) => +(i / (values.length - 1)).toFixed(3)).join(';')
  const keySplines = values.slice(1).map(() => EASE).join(';')

  return (
    <svg
      ref={svgRef}
      data-slot="organic-background"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMin slice"
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
    >
      <path className="fill-earth" d={frames[0]}>
        {!reducedMotion && (
          <animate
            attributeName="d"
            dur={duration}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes={keyTimes}
            keySplines={keySplines}
            values={values.join(';')}
          />
        )}
      </path>
    </svg>
  )
}
