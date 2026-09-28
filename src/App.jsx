import { AccessibilityProvider } from './context/AccessibilityContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import AppRoutes from './routes/AppRoutes.jsx'
import AppLayout from './shared/components/AppLayout.jsx'

function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <AppLayout>
          <AppRoutes />
        </AppLayout>
      </AuthProvider>
    </AccessibilityProvider>
  )
}

export default App
