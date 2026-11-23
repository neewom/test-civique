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
})()
