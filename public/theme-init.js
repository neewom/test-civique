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
})()
