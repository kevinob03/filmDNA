import { Route, Routes } from 'react-router-dom'
import AdminPage from '../pages/admin/AdminPage.jsx'
import LoginPage from '../pages/auth/LoginPage.jsx'
import RegisterPage from '../pages/auth/RegisterPage.jsx'
import DiaryPage from '../pages/diary/DiaryPage.jsx'
import NotFoundPage from '../pages/errors/NotFoundPage.jsx'
import UnauthorizedPage from '../pages/errors/UnauthorizedPage.jsx'
import ExplorePage from '../pages/explore/ExplorePage.jsx'
import FaqPage from '../pages/help/FaqPage.jsx'
import HomePage from '../pages/home/HomePage.jsx'
import LibraryPage from '../pages/library/LibraryPage.jsx'
import MovieDetailPage from '../pages/movies/MovieDetailPage.jsx'
import PersonalizationPage from '../pages/personalization/PersonalizationPage.jsx'
import ProfilePage from '../pages/profile/ProfilePage.jsx'
import PsychologistDashboardPage from '../pages/psychologist/PsychologistDashboardPage.jsx'
import RecommendationsPage from '../pages/recommendations/RecommendationsPage.jsx'
import RootPage from '../pages/root/RootPage.jsx'
import { GuestPage, PrivatePage, RolePage } from '../pages/routing/RouteAccessPages.jsx'
import StatisticsPage from '../pages/statistics/StatisticsPage.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootPage />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explorar" element={<ExplorePage />} />
        <Route path="/recomendaciones" element={<RecommendationsPage />} />
        <Route path="/pelicula/:id" element={<MovieDetailPage />} />
        <Route path="/ayuda" element={<FaqPage />} />

        <Route element={<GuestPage />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
        </Route>

        <Route element={<PrivatePage />}>
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/personalizacion" element={<PersonalizationPage />} />
          <Route path="/biblioteca" element={<LibraryPage />} />
          <Route path="/diario" element={<DiaryPage />} />
          <Route path="/estadisticas" element={<StatisticsPage />} />
          <Route path="/acceso-denegado" element={<UnauthorizedPage />} />

          <Route element={<RolePage allowedRoles={['psychologist']} />}>
            <Route path="/psicologo" element={<PsychologistDashboardPage />} />
          </Route>
          <Route element={<RolePage allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
