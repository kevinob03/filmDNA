import { NavLink } from 'react-router-dom'
import { AUTH_STATUS, useAuth } from '../../context/AuthContext.jsx'

function Header() {
  const { status, user, logout } = useAuth()
  const isAuthenticated = status === AUTH_STATUS.AUTHENTICATED
  const isAdmin = isAuthenticated && user.role === 'admin'

  return (
    <header className="site-header">
      <div className="page-container site-header__inner">
        <NavLink className="brand-link" to="/" aria-label="FilmDNA, inicio">
          <img src="/brand/filmdna-logo-primary-dark.svg" alt="" />
        </NavLink>

        <nav className="desktop-nav" aria-label="Navegación principal">
          <NavLink className="desktop-nav__link" to="/" end>
            Inicio
          </NavLink>
          <NavLink className="desktop-nav__link" to="/explorar">
            Explorar
          </NavLink>
          {isAuthenticated && (
            <NavLink className="desktop-nav__link" to="/perfil">
              Perfil
            </NavLink>
          )}
          {isAdmin && (
            <NavLink className="desktop-nav__link desktop-nav__link--admin" to="/admin">
              Administración
            </NavLink>
          )}
        </nav>

        <span className="phase-badge">FASE 3</span>

        <div className="header-session" aria-live="polite">
          {status === AUTH_STATUS.CHECKING && (
            <span className="header-session__status">Comprobando sesión…</span>
          )}

          {status === AUTH_STATUS.UNAUTHENTICATED && (
            <>
              <NavLink className="header-session__link" to="/login">Iniciar sesión</NavLink>
              <NavLink className="button button--primary header-session__register" to="/registro">
                Registrarse
              </NavLink>
            </>
          )}

          {isAuthenticated && (
            <button className="header-session__logout" type="button" onClick={logout}>
              Cerrar sesión
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
