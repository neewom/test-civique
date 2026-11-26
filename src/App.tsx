import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from '@/pages/Home'
import Revision from '@/pages/Revision'
import Examen from '@/pages/Examen'
import ExamenDetail from '@/pages/ExamenDetail'
import ExamenBlanc from '@/pages/ExamenBlanc'
import Regles from '@/pages/Regles'
import FicheTitre from '@/pages/FicheTitre'
import TitreVise from '@/pages/TitreVise'
import MentionsLegales from '@/pages/MentionsLegales'
import { PageShell } from '@/components/PageShell'
import { PageViewTracker } from '@/components/PageViewTracker'
import { ThemeProvider } from '@/components/ThemeProvider'

export default function App() {
  return (
    <ThemeProvider>
      <div className="relative">
        <BrowserRouter>
          <PageViewTracker />
          <PageShell>
            {(location) => (
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/examen-blanc" element={<ExamenBlanc />} />
                <Route path="/examen" element={<Examen />} />
                <Route path="/examen/:id" element={<ExamenDetail />} />
                <Route path="/revision" element={<Revision />} />
                <Route path="/regles" element={<Regles />} />
                <Route path="/titre" element={<TitreVise />} />
                <Route path="/titres/:slug" element={<FicheTitre />} />
                <Route path="/mentions-legales" element={<MentionsLegales />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            )}
          </PageShell>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  )
}
