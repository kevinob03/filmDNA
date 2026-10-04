import { Outlet } from 'react-router-dom'
import AppLayout from '../../components/shared/AppLayout.jsx'
import { AccessibilityProvider } from '../../context/AccessibilityContext.jsx'
import { AuthProvider } from '../../context/AuthContext.jsx'
import { RecommendationChatProvider } from '../../context/RecommendationChatContext.jsx'
import { TourProvider } from '../../context/TourContext.jsx'

function RootPage() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <TourProvider>
          <RecommendationChatProvider>
            <AppLayout>
              <Outlet />
            </AppLayout>
          </RecommendationChatProvider>
        </TourProvider>
      </AuthProvider>
    </AccessibilityProvider>
  )
}

export default RootPage
