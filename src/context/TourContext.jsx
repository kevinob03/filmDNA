import { createContext, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'filmdna_tour_completed_v1'
const TourContext = createContext(null)

export const TOUR_STEPS = Object.freeze([
  { path: '/', title: 'Bienvenido a FilmDNA', description: 'Conoce las herramientas principales para descubrir, comparar y organizar películas.' },
  { path: '/', selector: '#experiencia', title: 'Empieza por cómo quieres sentirte', description: 'Elige algunos criterios y abre Recomendaciones con esos filtros preparados.' },
  { path: '/explorar', selector: '.movie-search', title: 'Explora el catálogo', description: 'Busca títulos concretos o recorre películas populares con información actual de TMDB.' },
  { path: '/recomendaciones', selector: '.natural-search', title: 'Describe lo que quieres ver', description: 'Puedes escribir una idea con tus palabras o utilizar los filtros manuales.' },
  { path: '/recomendaciones', selector: '.accessibility-trigger', title: 'Adapta la interfaz', description: 'Configura tema, contraste y tamaño del texto desde Accesibilidad.' },
  { path: '/', selector: '#preguntas-frecuentes', title: 'Encuentra ayuda cuando la necesites', description: 'Consulta las dudas principales aquí o abre la página completa de Ayuda.' },
])

export function TourProvider({ children }) {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [completed, setCompleted] = useState(() => {
    try { return window.localStorage.getItem(STORAGE_KEY) === 'true' } catch { return false }
  })

  const start = () => { setStepIndex(0); setActive(true) }
  const close = (completed = false) => {
    setActive(false)
    if (completed) {
      try { window.localStorage.setItem(STORAGE_KEY, 'true') } catch { /* El tour funciona sin persistencia. */ }
      setCompleted(true)
    }
  }

  const value = useMemo(() => ({
    active, completed, stepIndex, step: TOUR_STEPS[stepIndex], total: TOUR_STEPS.length,
    start, skip: () => close(false), finish: () => close(true),
    next: () => setStepIndex((index) => Math.min(index + 1, TOUR_STEPS.length - 1)),
    previous: () => setStepIndex((index) => Math.max(index - 1, 0)),
  }), [active, completed, stepIndex])

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export const useTour = () => {
  const context = useContext(TourContext)
  if (!context) throw new Error('useTour debe utilizarse dentro de TourProvider.')
  return context
}
