import { NavLink } from 'react-router-dom'
import { AUTH_STATUS, useAuth } from '../../context/AuthContext.jsx'

const NavIcon = ({ type }) => {
  const paths = {
    home: <path d="M3 10.75 12 3l9 7.75V21h-6v-6H9v6H3V10.75Z" />,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
    login: <><path d="M14 4h5v16h-5" /><path d="M3 12h12M11 8l4 4-4 4" /></>,
    register: <><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    admin: <><path d="M12 3 4 6v5c0 5 3.4 8.2 8 10 4.6-1.8 8-5 8-10V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    logout: <><path d="M10 4H5v16h5" /><path d="M21 12H9M17 8l4 4-4 4" /></>,
    session: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>
}

function MobileNavigation() {
  const { status, user, logout } = useAuth()
  const isAuthenticated = status === AUTH_STATUS.AUTHENTICATED
  const isAdmin = isAuthenticated && user.role === 'admin'
  const itemCount = status === AUTH_STATUS.CHECKING ? 3 : (isAdmin ? 5 : 4)

  return (
    <nav
      className="mobile-nav"
      aria-label="Navegación móvil"
      style={{ '--mobile-nav-columns': itemCount }}
    >
      <NavLink className="mobile-nav__item" to="/" end>
        <NavIcon type="home" />
        <span>Inicio</span>
      </NavLink>
      <NavLink className="mobile-nav__item" to="/explorar">
        <NavIcon type="compass" />
        <span>Explorar</span>
      </NavLink>

      {status === AUTH_STATUS.CHECKING && (
        <span className="mobile-nav__item mobile-nav__item--disabled" aria-label="Comprobando sesión">
          <NavIcon type="session" />
          <span>Sesión</span>
        </span>
      )}

      {status === AUTH_STATUS.UNAUTHENTICATED && (
        <>
          <NavLink className="mobile-nav__item" to="/login">
            <NavIcon type="login" />
            <span>Ingresar</span>
          </NavLink>
          <NavLink className="mobile-nav__item" to="/registro">
            <NavIcon type="register" />
            <span>Registro</span>
          </NavLink>
        </>
      )}

      {isAuthenticated && (
        <>
          <NavLink className="mobile-nav__item" to="/perfil">
            <NavIcon type="profile" />
            <span>Perfil</span>
          </NavLink>
          {isAdmin && (
            <NavLink className="mobile-nav__item" to="/admin">
              <NavIcon type="admin" />
              <span>Admin</span>
            </NavLink>
          )}
          <button className="mobile-nav__item" type="button" onClick={logout}>
            <NavIcon type="logout" />
            <span>Salir</span>
          </button>
        </>
      )}
    </nav>
  )
}

export default MobileNavigation
