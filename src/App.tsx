import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from '@/pages/Home'
import Revision from '@/pages/Revision'
import Examen from '@/pages/Examen'
import ExamenDetail from '@/pages/ExamenDetail'
import Regles from '@/pages/Regles'
import TitreVise from '@/pages/TitreVise'
import MentionsLegales from '@/pages/MentionsLegales'
import { ScrollToTop } from '@/components/ScrollToTop'
import { PageViewTracker } from '@/components/PageViewTracker'
import { ThemeProvider } from '@/components/ThemeProvider'

export default function App() {
  return (
    <ThemeProvider>
      <div className="relative">
        <BrowserRouter>
          <ScrollToTop />
          <PageViewTracker />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/examen" element={<Examen />} />
            <Route path="/examen/:id" element={<ExamenDetail />} />
            <Route path="/revision" element={<Revision />} />
            <Route path="/regles" element={<Regles />} />
            <Route path="/titre" element={<TitreVise />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  )
}
