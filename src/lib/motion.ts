/**
 * Animations preference, « Affichage » panel of the header. Stored under the
 * `motion` key of localStorage (`on` | `off`); without a usable stored value, it
 * follows the device (`prefers-reduced-motion: reduce` → `off`). Applied on the
 * root element as `data-motion`.
 */
export type Motion = 'on' | 'off'

export const MOTION_KEY = 'motion'
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'
const CHANGE_EVENT = 'motion-change'

export function getReducedMotionQuery(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(REDUCED_QUERY)
    : null
}

/** Device default. Without matchMedia, motion is considered reduced. */
export function defaultMotion(): Motion {
  return (getReducedMotionQuery()?.matches ?? true) ? 'off' : 'on'
}

/** Stored choice, or null when absent or unreadable. */
export function loadMotion(): Motion | null {
  try {
    const raw = localStorage.getItem(MOTION_KEY)
    return raw === 'on' || raw === 'off' ? raw : null
  } catch {
    return null
  }
}

export function currentMotion(): Motion {
  return loadMotion() ?? defaultMotion()
}

export function applyMotion(motion: Motion = currentMotion()): void {
  document.documentElement.dataset.motion = motion
}

export function saveMotion(motion: Motion): void {
  try {
    localStorage.setItem(MOTION_KEY, motion)
  } catch {
    // localStorage unavailable: the choice holds for this visit only
  }
  applyMotion(motion)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function subscribeMotion(onChange: () => void): () => void {
  const mq = getReducedMotionQuery()
  mq?.addEventListener('change', onChange)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    mq?.removeEventListener('change', onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}
