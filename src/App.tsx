import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Home from '@/pages/Home'
import Revision from '@/pages/Revision'
import Examen from '@/pages/Examen'
import ExamenDetail from '@/pages/ExamenDetail'
import Regles from '@/pages/Regles'
import TitreVise from '@/pages/TitreVise'
import { ScrollToTop } from '@/components/ScrollToTop'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeSwitch } from '@/components/ThemeSwitch'

// Theme switch fixed in the top right corner, except on the home page whose
// header holds it, on the exam (question, correction, result), where it would
// cover the verdict with enlarged text, and on the exam detail, where it covered
// the score per theme while scrolling; the maquettes Pa4 to Pa7 have none
function FixedThemeSwitch() {
  const { pathname } = useLocation()
  if (pathname === '/' || pathname === '/examen' || pathname.startsWith('/examen/')) return null
  return (
    <div className="fixed top-4 right-4 z-50">
      <ThemeSwitch />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <div className="relative">
        <BrowserRouter>
          <ScrollToTop />
          <FixedThemeSwitch />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/examen" element={<Examen />} />
            <Route path="/examen/:id" element={<ExamenDetail />} />
            <Route path="/revision" element={<Revision />} />
            <Route path="/regles" element={<Regles />} />
            <Route path="/titre" element={<TitreVise />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  )
}
