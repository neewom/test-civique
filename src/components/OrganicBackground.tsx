import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion'
import { cn } from '@/lib/utils'

/*
 * The single organic « earth » shape of a screen (direction « la carte du parcours »).
 * It breathes very slowly (20 to 24 s cycles, sped up slightly at the user's request after testing), stays still when the device asks for
 * less motion, and pauses while the tab is hidden.
 * Never mount it on the question screens: no motion while the user answers.
 */

export type OrganicShape = 'journey' | 'crest' | 'goal' | 'info'

interface ShapeDef {
  // First value = resting shape; the animation loops back to it
  frames: string[]
  duration: string
  // Fill class (earth by default)
  fill?: string
}

// Paths drawn on a 390 × 844 phone canvas (maquettes Pa1 Accueil, Pa2 Titre, Pa3 Règles and Pa6 Résultat)
const SHAPES: Record<OrganicShape, ShapeDef> = {
  // Tall winding shape, home screen
  journey: {
    duration: '24s',
    frames: [
      'M-40 230 C 90 170, 270 190, 370 290 C 460 380, 430 520, 340 590 C 250 650, 300 740, 210 820 C 130 890, -20 880, -60 790 Z',
      'M-40 245 C 100 180, 280 180, 380 305 C 450 400, 420 505, 330 580 C 260 640, 310 755, 215 830 C 125 880, -25 870, -60 780 Z',
      'M-40 220 C 80 180, 260 205, 360 280 C 465 365, 440 530, 350 600 C 240 660, 290 730, 200 810 C 135 895, -15 885, -60 800 Z',
    ],
  },
  // Shape at the top of the screen, result screen
  crest: {
    duration: '22s',
    frames: [
      'M-50 60 C 120 0, 330 20, 430 120 C 470 260, 400 380, 270 410 C 150 440, 40 470, -50 430 Z',
      'M-50 70 C 130 10, 340 15, 430 130 C 465 275, 390 390, 260 420 C 145 445, 35 460, -50 420 Z',
    ],
  },
  // Lilac blob at the top right, target title screen. Muted in dark mode
  // (light text stays above 4.5:1 on it)
  goal: {
    duration: '22s',
    fill: 'fill-goal dark:fill-[#463858]',
    frames: [
      'M200 -40 C 330 -30, 440 60, 420 190 C 405 290, 320 320, 250 300 C 170 280, 120 210, 130 120 C 140 40, 150 -45, 200 -40 Z',
      'M210 -40 C 340 -20, 445 75, 415 200 C 395 300, 310 315, 240 295 C 165 270, 125 200, 135 110 C 145 35, 160 -50, 210 -40 Z',
    ],
  },
  // Blue band at the top, exam rules page. Muted in dark mode, as above
  info: {
    duration: '20s',
    fill: 'fill-info dark:fill-[#24496b]',
    frames: [
      'M-60 -40 C 120 -50, 300 -20, 430 40 C 450 150, 360 230, 240 240 C 130 250, 40 300, -60 260 Z',
      'M-60 -40 C 130 -45, 310 -15, 430 50 C 445 165, 350 240, 230 250 C 125 258, 35 290, -60 250 Z',
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
  const { frames, duration, fill = 'fill-earth' } = SHAPES[shape]

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
      preserveAspectRatio="none"
      className={cn(
        // Phones: the 390 × 844 canvas spans the screen width, from the top (a long
        // page scrolls past it) and keeps its proportions. From 768px wide it takes
        // the screen height and reaches from the left edge to a quarter of the
        // content column (30rem, centred): the shape is stretched sideways so it
        // still lies under the content, instead of filling the screen (scaled to the
        // full width) or sitting beside the column (kept in proportion).
        'pointer-events-none absolute top-0 left-0 aspect-[390/844] h-auto w-full overflow-visible md:aspect-auto md:h-svh md:w-[calc(50%+7.5rem)]',
        className,
      )}
    >
      <path className={fill} d={frames[0]}>
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
