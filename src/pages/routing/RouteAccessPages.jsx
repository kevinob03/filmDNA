import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AUTH_STATUS, useAuth } from '../../context/AuthContext.jsx'

function SessionChecking() {
  return (
    <main id="main-content" className="status-page" aria-live="polite">
      <p className="status-page__code">SESIÓN</p>
      <h1>Comprobando acceso</h1>
      <p>Estamos recuperando tu sesión local de FilmDNA.</p>
    </main>
  )
}

export function PrivatePage() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === AUTH_STATUS.CHECKING) return <SessionChecking />

  if (status !== AUTH_STATUS.AUTHENTICATED) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function GuestPage() {
  const { status, user } = useAuth()

  if (status === AUTH_STATUS.CHECKING) return <SessionChecking />
  if (status === AUTH_STATUS.AUTHENTICATED) {
    return <Navigate to={user?.personalizationCompleted === false ? '/personalizacion' : '/perfil'} replace />
  }

  return <Outlet />
}

export function RolePage({ allowedRoles }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === AUTH_STATUS.CHECKING) return <SessionChecking />

  if (status !== AUTH_STATUS.AUTHENTICATED) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/acceso-denegado" replace />
  }

  return <Outlet />
}
