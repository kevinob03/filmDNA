import { Route, Routes } from 'react-router-dom'
import AdminPage from '../modules/admin/pages/AdminPage.jsx'
import LoginPage from '../modules/auth/pages/LoginPage.jsx'
import LibraryPage from '../modules/library/pages/LibraryPage.jsx'
import RegisterPage from '../modules/auth/pages/RegisterPage.jsx'
import HomePage from '../modules/home/pages/HomePage.jsx'
import ExplorePage from '../modules/explore/pages/ExplorePage.jsx'
import MovieDetailPage from '../modules/movies/pages/MovieDetailPage.jsx'
import ProfilePage from '../modules/profile/pages/ProfilePage.jsx'
import RecommendationsPage from '../modules/recommendations/pages/RecommendationsPage.jsx'
import NotFoundPage from '../modules/errors/pages/NotFoundPage.jsx'
import { GuestRoute, PrivateRoute, RoleRoute } from './RouteGuards.jsx'
import UnauthorizedPage from '../modules/errors/pages/UnauthorizedPage.jsx'
import DiaryPage from '../modules/diary/pages/DiaryPage.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route path={'/recomendaciones'} element={<RecommendationsPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/explorar" element={<ExplorePage />} />
      <Route path="/pelicula/:id" element={<MovieDetailPage />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/registro" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/perfil" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/biblioteca" element={<PrivateRoute><LibraryPage /></PrivateRoute>} />
      <Route path="/diario" element={<PrivateRoute><DiaryPage /></PrivateRoute>} />
      <Route
        path="/admin"
        element={<RoleRoute allowedRoles={['admin']}><AdminPage /></RoleRoute>}
      />
      <Route
        path="/acceso-denegado"
        element={<PrivateRoute><UnauthorizedPage /></PrivateRoute>}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
