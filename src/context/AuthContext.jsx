import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loginUser, registerUser } from '../services/authService.js'

export const AUTH_STATUS = Object.freeze({
  CHECKING: 'checking',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
})

const SESSION_STORAGE_KEY = 'filmdna_session'
const VALID_ROLES = new Set(['usuario', 'admin'])
const AuthContext = createContext(null)

const isValidSession = (session) => (
  session
  && (typeof session.id === 'string' || typeof session.id === 'number')
  && typeof session.nombre === 'string'
  && session.nombre.trim().length > 0
  && typeof session.email === 'string'
  && session.email.includes('@')
  && VALID_ROLES.has(session.role)
  && !Object.hasOwn(session, 'password')
)

const clearStoredSession = () => {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // La aplicación puede continuar sin persistencia si el navegador la bloquea.
  }
}

const storeSession = (user) => {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
  } catch {
    // La sesión actual sigue siendo válida aunque el navegador bloquee localStorage.
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(AUTH_STATUS.CHECKING)

  useEffect(() => {
    try {
      const storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY)

      if (!storedSession) {
        setStatus(AUTH_STATUS.UNAUTHENTICATED)
        return
      }

      const parsedSession = JSON.parse(storedSession)

      if (!isValidSession(parsedSession)) {
        clearStoredSession()
        setStatus(AUTH_STATUS.UNAUTHENTICATED)
        return
      }

      setUser(parsedSession)
      setStatus(AUTH_STATUS.AUTHENTICATED)
    } catch {
      clearStoredSession()
      setStatus(AUTH_STATUS.UNAUTHENTICATED)
    }
  }, [])

  const login = async (credentials) => {
    const authenticatedUser = await loginUser(credentials)
    storeSession(authenticatedUser)
    setUser(authenticatedUser)
    setStatus(AUTH_STATUS.AUTHENTICATED)
    return authenticatedUser
  }

  const register = async (registration) => {
    const registeredUser = await registerUser(registration)
    storeSession(registeredUser)
    setUser(registeredUser)
    setStatus(AUTH_STATUS.AUTHENTICATED)
    return registeredUser
  }

  const logout = () => {
    clearStoredSession()
    setUser(null)
    setStatus(AUTH_STATUS.UNAUTHENTICATED)
  }

  const value = useMemo(() => ({
    user,
    status,
    isAuthenticated: status === AUTH_STATUS.AUTHENTICATED,
    login,
    register,
    logout,
  }), [status, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider.')
  }

  return context
}
