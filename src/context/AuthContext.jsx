import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loginUser, registerUser, saveUserPersonalization } from '../services/authService.js'
import { APP_ROLE_VALUES } from '../constants/roles.js'

export const AUTH_STATUS = Object.freeze({
  CHECKING: 'checking',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
})

const SESSION_STORAGE_KEY = 'filmdna_session'
const VALID_ROLES = new Set(APP_ROLE_VALUES)
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

  const syncSessionUser = useCallback((changes) => {
    setUser((current) => {
      if (!current) return current
      const nombre = typeof changes?.nombre === 'string' ? changes.nombre.trim() : current.nombre
      const nextUser = {
        ...current,
        nombre: nombre || current.nombre,
        ...(changes?.personalizationCompleted === true ? { personalizationCompleted: true } : {}),
        ...(typeof changes?.avatarPreset === 'string' ? { avatarPreset: changes.avatarPreset } : {}),
        ...(typeof changes?.avatarImage === 'string' ? { avatarImage: changes.avatarImage } : {}),
        ...(changes?.discoveryPreferences && typeof changes.discoveryPreferences === 'object'
          ? { discoveryPreferences: changes.discoveryPreferences }
          : {}),
      }
      storeSession(nextUser)
      return nextUser
    })
  }, [])

  const completePersonalization = useCallback(async (preferences = {}) => {
    if (!user) throw new Error('personalization-requires-session')
    const updatedUser = await saveUserPersonalization(user.id, preferences)
    storeSession(updatedUser)
    setUser(updatedUser)
    return updatedUser
  }, [user])

  const value = useMemo(() => ({
    user,
    status,
    isAuthenticated: status === AUTH_STATUS.AUTHENTICATED,
    login,
    register,
    logout,
    syncSessionUser,
    completePersonalization,
  }), [completePersonalization, status, syncSessionUser, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider.')
  }

  return context
}
