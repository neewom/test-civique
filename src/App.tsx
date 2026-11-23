import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from '@/pages/Home'
import Revision from '@/pages/Revision'
import Examen from '@/pages/Examen'
import ExamenDetail from '@/pages/ExamenDetail'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeSwitch } from '@/components/ThemeSwitch'

export default function App() {
  return (
    <ThemeProvider>
      <div className="relative">
        <div className="fixed top-4 right-4 z-50">
          <ThemeSwitch />
        </div>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/examen" element={<Examen />} />
            <Route path="/examen/:id" element={<ExamenDetail />} />
            <Route path="/revision" element={<Revision />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  )
}
