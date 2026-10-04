import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AUTH_STATUS, useAuth } from './AuthContext.jsx'
import { buildTourSteps } from './tourSteps.js'

const STORAGE_KEY = 'filmdna_tour_completed_v2'
const TourContext = createContext(null)

export function TourProvider({ children }) {
  const { status, user } = useAuth()
  const steps = useMemo(() => buildTourSteps(status === AUTH_STATUS.AUTHENTICATED ? user : null), [status, user])
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [completed, setCompleted] = useState(() => {
    try { return window.localStorage.getItem(STORAGE_KEY) === 'true' } catch { return false }
  })

  useEffect(() => { setStepIndex((index) => Math.min(index, steps.length - 1)) }, [steps.length])

  const start = useCallback(() => { setStepIndex(0); setActive(true) }, [])
  const close = useCallback((markCompleted = false) => {
    setActive(false)
    if (markCompleted) {
      try { window.localStorage.setItem(STORAGE_KEY, 'true') } catch { /* El tour funciona sin persistencia. */ }
      setCompleted(true)
    }
  }, [])
  const skip = useCallback(() => close(false), [close])
  const finish = useCallback(() => close(true), [close])
  const next = useCallback(() => setStepIndex((index) => Math.min(index + 1, steps.length - 1)), [steps.length])
  const previous = useCallback(() => setStepIndex((index) => Math.max(index - 1, 0)), [])

  const value = useMemo(() => ({
    active, completed, stepIndex, step: steps[stepIndex], total: steps.length,
    start, skip, finish, next, previous,
  }), [active, completed, finish, next, previous, skip, start, stepIndex, steps])

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export const useTour = () => {
  const context = useContext(TourContext)
  if (!context) throw new Error('useTour debe utilizarse dentro de TourProvider.')
  return context
}
