import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Quiz from '@/pages/Quiz'
import Revision from '@/pages/Revision'
import Examen from '@/pages/Examen'
import ExamenDetail from '@/pages/ExamenDetail'
import Result from '@/pages/Result'
import History from '@/pages/History'
import { ThemeProvider } from '@/lib/theme-context'
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
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/examen" element={<Examen />} />
            <Route path="/examen/:id" element={<ExamenDetail />} />
            <Route path="/revision" element={<Revision />} />
            <Route path="/result" element={<Result />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  )
}
