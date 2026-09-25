import { NavLink } from 'react-router-dom'

const unavailableItems = ['Recomendaciones', 'Diario', 'Mis listas', 'Estadísticas', 'Perfil']

function Header() {
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
          {unavailableItems.map((item) => (
            <span className="desktop-nav__link desktop-nav__link--disabled" key={item}>
              {item}
            </span>
          ))}
        </nav>

        <span className="phase-badge">FASE 2</span>
      </div>
    </header>
  )
}

export default Header
