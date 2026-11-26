import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * A new page starts at the top: without this, the router keeps the scroll position
 * of the previous page (e.g. the revision opened from the bottom of an exam detail).
 * Simple rule: every new pathname scrolls to the top, back navigation included.
 * `location`: the page actually on screen when it lags behind the router (page transition).
 * An address with an anchor (`#vos-donnees`) scrolls to that element instead, when it exists.
 */
export function ScrollToTop({ location }: { location?: { pathname: string; hash: string } } = {}) {
  const routerLocation = useLocation()
  const { pathname, hash } = location ?? routerLocation
  useEffect(() => {
    const id = hash ? decodeURIComponent(hash.slice(1)) : ''
    const target = id ? document.getElementById(id) : null
    if (target) target.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}
