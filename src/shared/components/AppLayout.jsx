import Header from './Header.jsx'
import MobileNavigation from './MobileNavigation.jsx'
import './layout.css'

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <Header />
      <div className="app-layout__content">{children}</div>
      <MobileNavigation />
    </div>
  )
}

export default AppLayout
