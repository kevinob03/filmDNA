import { AccessibilityProvider } from './context/AccessibilityContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import AppRoutes from './routes/AppRoutes.jsx'
import AppLayout from './shared/components/AppLayout.jsx'
import { TourProvider } from './context/TourContext.jsx'
import { RecommendationChatProvider } from './context/RecommendationChatContext.jsx'

function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <TourProvider>
          <RecommendationChatProvider>
            <AppLayout>
              <AppRoutes />
            </AppLayout>
          </RecommendationChatProvider>
        </TourProvider>
      </AuthProvider>
    </AccessibilityProvider>
  )
}

export default App
