import { Route, Routes } from 'react-router-dom'
import HomePage from '../modules/home/HomePage.jsx'
import ExplorePage from '../modules/explore/ExplorePage.jsx'
import MovieDetailPage from '../modules/movies/MovieDetailPage.jsx'
import NotFoundPage from './NotFoundPage.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/explorar" element={<ExplorePage />} />
      <Route path="/pelicula/:id" element={<MovieDetailPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
