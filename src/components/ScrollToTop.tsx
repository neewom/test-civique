import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * A new page starts at the top: without this, the router keeps the scroll position
 * of the previous page (e.g. the revision opened from the bottom of an exam detail).
 * Simple rule: every new pathname scrolls to the top, back navigation included.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
