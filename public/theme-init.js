// Applies the saved theme before the first paint. Kept as a separate file
// (not an inline script) so the Content-Security-Policy can stay script-src 'self'.
;(function () {
  var saved = null
  try {
    saved = localStorage.getItem('theme')
  } catch (e) {
    // localStorage unavailable: fall back to the system preference
  }
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.classList.add('dark')
  }
  // Animations preference: stored choice, else the device's
  var motion = null
  try {
    motion = localStorage.getItem('motion')
  } catch (e) {
    // localStorage unavailable: fall back to the system preference
  }
  if (motion !== 'on' && motion !== 'off') {
    motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'off' : 'on'
  }
  document.documentElement.dataset.motion = motion
  // First visit (same rule as TitreVise: no title chosen, no history, no exam in progress), on the
  // pages that open on the first-visit screen: the start screen in index.html then shows no name in
  // its header, as that screen does. Any storage error: not a first visit (the usual header).
  try {
    var path = location.pathname
    if (path === '/' || path === '/titre') {
      var history = localStorage.getItem('quiz-history')
      var empty =
        localStorage.getItem('target-title') === null &&
        localStorage.getItem('exam-in-progress') === null &&
        localStorage.getItem('exam-in-progress-resident') === null &&
        localStorage.getItem('exam-in-progress-naturalisation') === null &&
        (history === null || history === '[]')
      if (empty) document.documentElement.setAttribute('data-first-visit', '')
    }
  } catch (e) {
    // localStorage unavailable
  }
})()
