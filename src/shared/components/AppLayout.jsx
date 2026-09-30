import Header from './Header.jsx'
import MobileNavigation from './MobileNavigation.jsx'
import AccessibilityPanel from './AccessibilityPanel.jsx'
import ScrollToTop from './ScrollToTop.jsx'
import TmdbAttribution from './TmdbAttribution.jsx'
import './layout.css'
import { TourButton, TourGuide } from './TourGuide.jsx'

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <ScrollToTop />
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <Header />
      <AccessibilityPanel />
      <div className="app-layout__content">{children}</div>
      <TmdbAttribution />
      <MobileNavigation />
      <TourButton />
      <TourGuide />
    </div>
  )
}

export default AppLayout
