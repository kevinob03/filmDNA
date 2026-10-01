import { NavLink } from 'react-router-dom'
import { AUTH_STATUS, useAuth } from '../../context/AuthContext.jsx'
import AccessibilityButton from './AccessibilityButton.jsx'
import AccountMenu from './AccountMenu.jsx'

function Header() {
  const { status, user } = useAuth()
  const isAuthenticated = status === AUTH_STATUS.AUTHENTICATED
  const isAdmin = isAuthenticated && user.role === 'admin'
  const isPsychologist = isAuthenticated && user.role === 'psychologist'

  return (
    <header className="site-header">
      <div className="page-container site-header__inner">
        <NavLink className="brand-link" to="/" aria-label="FilmDNA, inicio">
          <img className="brand-logo brand-logo--dark" src="/brand/filmdna-logo-primary-dark.svg" alt="" />
          <img className="brand-logo brand-logo--light" src="/brand/filmdna-logo-primary-light.svg" alt="" />
        </NavLink>

        <nav className="desktop-nav" aria-label="Navegación principal">
          <NavLink className="desktop-nav__link" to="/" end>Inicio</NavLink>
          <NavLink className="desktop-nav__link" to="/explorar">Explorar</NavLink>
          <NavLink className="desktop-nav__link" to="/recomendaciones">Recomendaciones</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink className="desktop-nav__link" to="/biblioteca">Biblioteca</NavLink>
              <NavLink className="desktop-nav__link" to="/diario">Diario</NavLink>
            </>
          ) : null}
          {isPsychologist ? <NavLink className="desktop-nav__link" to="/psicologo">Psicología</NavLink> : null}
          {isAdmin ? <NavLink className="desktop-nav__link desktop-nav__link--admin" to="/admin">Administración</NavLink> : null}
        </nav>

        <span className="phase-badge">FASE 11</span>
        <AccessibilityButton />

        <div className="header-session" aria-live="polite">
          {status === AUTH_STATUS.CHECKING ? <span className="header-session__status">Comprobando sesión…</span> : null}
          {status === AUTH_STATUS.UNAUTHENTICATED ? (
            <>
              <NavLink className="header-session__link" to="/login">Iniciar sesión</NavLink>
              <NavLink className="button button--primary header-session__register" to="/registro">Registrarse</NavLink>
            </>
          ) : null}
          {isAuthenticated ? <AccountMenu /> : null}
        </div>
      </div>
    </header>
  )
}

export default Header
