import Header from './Header.jsx'
import MobileNavigation from './MobileNavigation.jsx'
import AccessibilityPanel from './AccessibilityPanel.jsx'
import ScrollToTop from './ScrollToTop.jsx'
import TmdbAttribution from './TmdbAttribution.jsx'
import './layout.css'
import { TourButton, TourGuide } from './TourGuide.jsx'
import RecommendationChat from '../../modules/recommendations/components/RecommendationChat.jsx'
import { useRecommendationChat } from '../../context/RecommendationChatContext.jsx'

function AppLayout({ children }) {
  const { filters, movies, publishAction } = useRecommendationChat()

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
      <RecommendationChat filters={filters} movies={movies} onAction={publishAction} />
      <TourButton />
      <TourGuide />
    </div>
  )
}

export default AppLayout
