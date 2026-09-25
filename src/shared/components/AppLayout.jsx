import Header from './Header.jsx'
import MobileNavigation from './MobileNavigation.jsx'
import ScrollToTop from './ScrollToTop.jsx'
import TmdbAttribution from './TmdbAttribution.jsx'
import './layout.css'

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <ScrollToTop />
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <Header />
      <div className="app-layout__content">{children}</div>
      <TmdbAttribution />
      <MobileNavigation />
    </div>
  )
}

export default AppLayout
