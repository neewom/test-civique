import { useEffect, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigationType, type Location } from 'react-router-dom'
import { ScrollToTop } from '@/components/ScrollToTop'
import { shouldAnimateNavigation, transitionDirection } from '@/lib/page-transition'

/**
 * Holds the page on screen (`shown`) and swaps it for the new location inside a view
 * transition when the navigation deserves one. The page content gets its
 * `view-transition-name` from the CSS (`index.css`) only while the root carries the
 * `page-transition` class, so nothing is captured outside a transition.
 * `children` receives the location to show; the scroll follows it, not the router.
 */
export function PageShell({ children }: { children: (location: Location) => ReactNode }) {
  const location = useLocation()
  const navigationType = useNavigationType()
  const [shown, setShown] = useState<Location>(location)
  const startedKey = useRef<string>(location.key)

  // No transition for this navigation: the new page replaces the old one in the same render
  // (decided once per navigation, kept in state: the decision consumes the in-app-back mark)
  const [decision, setDecision] = useState<{ key: string; animate: boolean } | null>(null)
  const pending = location.key !== shown.key
  if (pending && decision?.key !== location.key) {
    setDecision({
      key: location.key,
      animate: shouldAnimateNavigation(shown.pathname, location.pathname, navigationType),
    })
  }
  const decided = pending && decision?.key === location.key
  const animate = decided && decision.animate
  if (decided && !animate) setShown(location)

  useEffect(() => {
    if (!animate || startedKey.current === location.key) return
    startedKey.current = location.key
    const previous = shown
    const root = document.documentElement
    root.dataset.direction = transitionDirection(previous.pathname, location.pathname, navigationType)
    root.classList.add('page-transition')
    const clear = () => {
      root.classList.remove('page-transition')
      root.style.removeProperty('--vt-old-offset')
    }
    // The group of the page content does not animate: it sits where the NEW page is. If the
    // scroll changes with the swap (back to the top, anchor), the old picture must be shifted
    // by the difference of the page's top edge, or it jumps by the scrolled height on frame 1.
    const topOfPage = () => document.getElementById('page-wrap')?.getBoundingClientRect().top ?? 0
    const oldTop = topOfPage()
    try {
      const transition = document.startViewTransition(() => {
        flushSync(() => setShown(location))
        root.style.setProperty('--vt-old-offset', `${oldTop - topOfPage()}px`)
      })
      // A transition skipped by a quicker navigation rejects these promises: nothing to report
      transition.ready?.catch(() => {})
      transition.updateCallbackDone?.catch(() => {})
      transition.finished.then(clear, clear)
    } catch {
      clear()
      queueMicrotask(() => setShown(location))
    }
  }, [animate, location, navigationType, shown])

  // A new page was swapped in after the visitor acted (click, key): the focus goes to its title, so
  // that the change is announced and the keyboard goes on from the top of the page. Not on the first
  // load (a redirection, an unknown address) nor when the page keeps a scroll position or an anchor
  // (the keyboard user would lose their place). A page that put the focus itself (result) keeps it.
  const shownPath = useRef(shown.pathname)
  const acted = useRef(false)
  useEffect(() => {
    const mark = () => {
      acted.current = true
    }
    const events = ['pointerdown', 'keydown', 'click'] as const
    events.forEach((e) => document.addEventListener(e, mark, true))
    return () => events.forEach((e) => document.removeEventListener(e, mark, true))
  }, [])
  useEffect(() => {
    if (shownPath.current === shown.pathname) return
    shownPath.current = shown.pathname
    if (!acted.current || shown.hash || window.scrollY > 0) return
    const wrap = document.getElementById('page-wrap')
    // The page restores a remembered scroll position itself (revision): keep the keyboard user's place
    if (wrap?.querySelector('[data-restores-scroll]')) return
    const active = document.activeElement
    if (active && active !== document.body && wrap?.contains(active)) return
    const target = wrap?.querySelector<HTMLElement>('h1') ?? wrap?.querySelector<HTMLElement>('main')
    if (!target) return
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  }, [shown.pathname, shown.hash])

  return (
    <>
      <ScrollToTop location={shown} />
      <div id="page-wrap">{children(shown)}</div>
    </>
  )
}
