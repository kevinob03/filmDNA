import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

export const ACCESSIBILITY_STORAGE_KEY = 'filmdna_accessibility_preferences_v1'

const DEFAULT_PREFERENCES = Object.freeze({ theme: 'dark', contrast: 'normal', textSize: '100' })
const VALID_THEMES = new Set(['dark', 'light'])
const VALID_CONTRASTS = new Set(['normal', 'high'])
const VALID_TEXT_SIZES = new Set(['100', '110', '125'])
const AccessibilityContext = createContext(null)

const normalizePreferences = (preferences) => ({
  theme: VALID_THEMES.has(preferences?.theme) ? preferences.theme : DEFAULT_PREFERENCES.theme,
  contrast: VALID_CONTRASTS.has(preferences?.contrast) ? preferences.contrast : DEFAULT_PREFERENCES.contrast,
  textSize: VALID_TEXT_SIZES.has(preferences?.textSize) ? preferences.textSize : DEFAULT_PREFERENCES.textSize,
})

const readPreferences = () => {
  try {
    const stored = window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)
    return stored ? normalizePreferences(JSON.parse(stored)) : DEFAULT_PREFERENCES
  } catch {
    return DEFAULT_PREFERENCES
  }
}

const applyPreferences = (preferences) => {
  document.documentElement.dataset.theme = preferences.theme
  document.documentElement.style.colorScheme = preferences.theme
  document.documentElement.dataset.contrast = preferences.contrast
  document.documentElement.dataset.textSize = preferences.textSize
  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) themeColor.content = preferences.theme === 'light' ? '#E9EEEC' : '#08090C'
}

const storePreferences = (preferences) => {
  try {
    window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Las preferencias siguen activas si el navegador bloquea localStorage.
  }
}

export function AccessibilityProvider({ children }) {
  const [preferences, setPreferences] = useState(() => {
    const initialPreferences = readPreferences()
    applyPreferences(initialPreferences)
    return initialPreferences
  })
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const triggerRef = useRef(null)

  const updatePreferences = useCallback((changes) => {
    setPreferences((current) => {
      const next = normalizePreferences({ ...current, ...changes })
      applyPreferences(next)
      storePreferences(next)
      return next
    })
  }, [])

  const setContrast = useCallback((contrast) => updatePreferences({ contrast }), [updatePreferences])
  const setTheme = useCallback((theme) => updatePreferences({ theme }), [updatePreferences])
  const setTextSize = useCallback((textSize) => updatePreferences({ textSize }), [updatePreferences])
  const resetPreferences = useCallback(() => {
    applyPreferences(DEFAULT_PREFERENCES)
    storePreferences(DEFAULT_PREFERENCES)
    setPreferences(DEFAULT_PREFERENCES)
  }, [])
  const openPanel = useCallback((trigger) => {
    triggerRef.current = trigger
    setIsPanelOpen(true)
  }, [])
  const closePanel = useCallback(() => {
    setIsPanelOpen(false)
    window.requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  const value = useMemo(() => ({
    ...preferences,
    isPanelOpen,
    closePanel,
    openPanel,
    resetPreferences,
    setContrast,
    setTheme,
    setTextSize,
  }), [closePanel, isPanelOpen, openPanel, preferences, resetPreferences, setContrast, setTextSize, setTheme])

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>
}

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (!context) throw new Error('useAccessibility debe utilizarse dentro de AccessibilityProvider.')
  return context
}
