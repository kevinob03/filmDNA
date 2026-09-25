import { NavLink } from 'react-router-dom'

const NavIcon = ({ type }) => {
  const paths = {
    home: <path d="M3 10.75 12 3l9 7.75V21h-6v-6H9v6H3V10.75Z" />,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
    tune: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
    diary: <><path d="M5 3h13a1 1 0 0 1 1 1v17H6a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1Z" /><path d="M8 3v18M11 8h5M11 12h5" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>
}

function MobileNavigation() {
  return (
    <nav className="mobile-nav" aria-label="Navegación móvil">
      <NavLink className="mobile-nav__item" to="/" end>
        <NavIcon type="home" />
        <span>Inicio</span>
      </NavLink>
      <span className="mobile-nav__item mobile-nav__item--disabled">
        <NavIcon type="compass" />
        <span>Explorar</span>
      </span>
      <a className="mobile-nav__item" href="#experiencia">
        <NavIcon type="tune" />
        <span>Experiencia</span>
      </a>
      <span className="mobile-nav__item mobile-nav__item--disabled">
        <NavIcon type="diary" />
        <span>Diario</span>
      </span>
      <span className="mobile-nav__item mobile-nav__item--disabled">
        <NavIcon type="profile" />
        <span>Perfil</span>
      </span>
    </nav>
  )
}

export default MobileNavigation
