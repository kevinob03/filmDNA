import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const RecommendationChatContext = createContext(null)
const NAVIGATING_ACTIONS = new Set(['new-search', 'refine', 'replace-one', 'reset'])

export function RecommendationChatProvider({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const actionSequence = useRef(0)
  const [recommendationContext, setRecommendationContext] = useState({ filters: {}, movies: [] })
  const [pendingAction, setPendingAction] = useState(null)

  const updateRecommendationContext = useCallback((filters, movies) => {
    setRecommendationContext({ filters: filters || {}, movies: Array.isArray(movies) ? movies : [] })
  }, [])

  const publishAction = useCallback((response) => {
    actionSequence.current += 1
    setPendingAction({ id: actionSequence.current, response })
    if (NAVIGATING_ACTIONS.has(response.action) && pathname !== '/recomendaciones') navigate('/recomendaciones')
  }, [navigate, pathname])

  const value = useMemo(() => ({
    ...recommendationContext,
    pendingAction,
    publishAction,
    updateRecommendationContext,
  }), [pendingAction, publishAction, recommendationContext, updateRecommendationContext])

  return <RecommendationChatContext.Provider value={value}>{children}</RecommendationChatContext.Provider>
}

export function useRecommendationChat() {
  const context = useContext(RecommendationChatContext)
  if (!context) throw new Error('useRecommendationChat debe utilizarse dentro de RecommendationChatProvider.')
  return context
}
