import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Quiz from '@/pages/Quiz'
import Revision from '@/pages/Revision'
import Examen from '@/pages/Examen'
import Result from '@/pages/Result'
import History from '@/pages/History'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/examen" element={<Examen />} />
        <Route path="/revision" element={<Revision />} />
        <Route path="/result" element={<Result />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  )
}
