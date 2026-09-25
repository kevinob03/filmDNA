import { Route, Routes } from 'react-router-dom'
import AdminPage from '../modules/admin/AdminPage.jsx'
import LoginPage from '../modules/auth/LoginPage.jsx'
import RegisterPage from '../modules/auth/RegisterPage.jsx'
import HomePage from '../modules/home/HomePage.jsx'
import ExplorePage from '../modules/explore/ExplorePage.jsx'
import MovieDetailPage from '../modules/movies/MovieDetailPage.jsx'
import ProfilePage from '../modules/profile/ProfilePage.jsx'
import RecommendationsPage from '../modules/recommendations/RecommendationsPage.jsx'
import NotFoundPage from './NotFoundPage.jsx'
import { GuestRoute, PrivateRoute, RoleRoute } from './RouteGuards.jsx'
import UnauthorizedPage from './UnauthorizedPage.jsx'

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
