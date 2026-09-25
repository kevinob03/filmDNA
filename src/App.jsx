import { AuthProvider } from './context/AuthContext.jsx'
import AppRoutes from './routes/AppRoutes.jsx'
import AppLayout from './shared/components/AppLayout.jsx'

function App() {
  return (
    <AuthProvider>
      <AppLayout>
        <AppRoutes />
      </AppLayout>
    </AuthProvider>
  )
}

export default App
