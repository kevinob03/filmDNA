import { Navigate, useLocation } from 'react-router-dom'
import { AUTH_STATUS, useAuth } from '../context/AuthContext.jsx'

function SessionChecking() {
  return (
    <main id="main-content" className="status-page" aria-live="polite">
      <p className="status-page__code">SESIÓN</p>
      <h1>Comprobando acceso</h1>
      <p>Estamos recuperando tu sesión local de FilmDNA.</p>
    </main>
  )
}

export function PrivateRoute({ children }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === AUTH_STATUS.CHECKING) return <SessionChecking />

  if (status !== AUTH_STATUS.AUTHENTICATED) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export function GuestRoute({ children }) {
  const { status } = useAuth()

  if (status === AUTH_STATUS.CHECKING) return <SessionChecking />
  if (status === AUTH_STATUS.AUTHENTICATED) return <Navigate to="/perfil" replace />

  return children
}

export function RoleRoute({ allowedRoles, children }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === AUTH_STATUS.CHECKING) return <SessionChecking />

  if (status !== AUTH_STATUS.AUTHENTICATED) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/acceso-denegado" replace />
  }

  return children
}
