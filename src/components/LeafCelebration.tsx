import { useEffect, useRef, useState } from 'react'
import { currentMotion } from '@/lib/motion'

const LEAF_COUNT = 26
const DURATION_MS = 2200
const FADE_MS = 500
// Brand leaves (logo): green and yellow
const COLORS = ['#8ED462', '#F5E211']

/**
 * Leaves falling over the result of a passed exam: canvas, about 2.2 s, once, never in the way
 * (aria-hidden, no pointer events). Nothing is drawn, and no loop starts, with animations off.
 * Stops and removes itself at the end.
 */
export function LeafCelebration() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [done, setDone] = useState(() => currentMotion() !== 'on')

  useEffect(() => {
    if (done) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    // No 2D context (very old browser): the empty, transparent canvas is harmless
    if (!canvas || !ctx) return
    // Capped pixel ratio: a full-screen canvas at 3x would cost more than it brings
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim() || '#2C2E2A'

    const leaves = Array.from({ length: LEAF_COUNT }, (_, i) => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.5,
      vy: 90 + Math.random() * 90,
      vx: -20 + Math.random() * 40,
      rot: Math.random() * Math.PI * 2,
      vr: -2 + Math.random() * 4,
      size: 9 + Math.random() * 7,
      color: COLORS[i % 2],
      sway: Math.random() * Math.PI * 2,
    }))

    function drawLeaf(l: (typeof leaves)[number]) {
      if (!ctx) return
      ctx.save()
      ctx.translate(l.x, l.y)
      ctx.rotate(l.rot)
      ctx.beginPath()
      ctx.moveTo(0, -l.size)
      ctx.bezierCurveTo(l.size * 0.9, -l.size * 0.6, l.size * 0.9, l.size * 0.6, 0, l.size)
      ctx.bezierCurveTo(-l.size * 0.9, l.size * 0.6, -l.size * 0.9, -l.size * 0.6, 0, -l.size)
      ctx.fillStyle = l.color
      ctx.fill()
      ctx.lineWidth = 1.6
      ctx.strokeStyle = ink
      ctx.stroke()
      ctx.restore()
    }

    let frame = 0
    const start = performance.now()
    let last = start
    function tick(now: number) {
      if (!ctx) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const age = now - start
      if (age >= DURATION_MS) {
        ctx.clearRect(0, 0, width, height)
        setDone(true)
        return
      }
      ctx.clearRect(0, 0, width, height)
      ctx.globalAlpha = age > DURATION_MS - FADE_MS ? Math.max(0, (DURATION_MS - age) / FADE_MS) : 1
      for (const l of leaves) {
        l.sway += dt * 3
        l.x += (l.vx + Math.sin(l.sway) * 30) * dt
        l.y += l.vy * dt
        l.rot += l.vr * dt
        drawLeaf(l)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [done])

  if (done) return null
  return (
    <canvas
      ref={canvasRef}
      data-testid="leaf-celebration"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 size-full"
    />
  )
}
