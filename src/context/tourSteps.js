const PUBLIC_STEPS_START = [
  { path: '/', title: 'Bienvenido a FilmDNA', description: 'Conoce las herramientas principales para descubrir, comparar y organizar películas.' },
  { path: '/', selector: '[data-tour="quick-experience"]', title: 'Busca según el momento', description: 'Este selector prepara una búsqueda puntual en Recomendaciones. No modifica tu perfil ni el contenido personalizado de Explorar.' },
  { path: '/', selector: '[data-tour="professional-support"]', title: 'Acompañamiento profesional opcional', description: 'La cinematerapia supervisada funciona únicamente con consentimiento. FilmDNA no diagnostica ni sustituye atención profesional.' },
  { path: '/explorar', selector: '[data-tour="explore-search"]', title: 'Explora el catálogo', description: 'Busca títulos concretos. Si completaste el quiz, la selección inicial de Explorar parte de tus gustos; de lo contrario muestra películas populares.' },
]

const PUBLIC_STEPS_END = [
  { path: '/recomendaciones', selector: '[data-tour="recommendations-search"]', title: 'Encuentra una película para hoy', description: 'Describe lo que quieres ver o usa filtros manuales. Los resultados explican el porcentaje de coincidencia, la confianza y los criterios que pudieron comprobarse.' },
  { path: '/recomendaciones', selector: '[data-tour="recommendation-chat"]', title: 'Conversa con FilmDNA', description: 'El chat está disponible en toda la plataforma y puede ajustar tus recomendaciones. La API personal es opcional y admite Gemini, Groq o DeepSeek.' },
  { path: '/recomendaciones', selector: '[data-tour="accessibility"]', title: 'Adapta la interfaz', description: 'Configura tema, contraste y tamaño del texto desde Accesibilidad.' },
  { path: '/', selector: '[data-tour="faq"]', title: 'Encuentra ayuda cuando la necesites', description: 'Consulta las dudas principales aquí o abre la página completa de Ayuda.' },
]

export const buildTourSteps = (user = null) => {
  const privateSteps = []
  if (user?.role === 'usuario') {
    privateSteps.push({ path: '/perfil', selector: '[data-tour="discovery-profile"]', title: 'Una selección que evoluciona contigo', description: 'El quiz personaliza Explorar, no rellena los filtros de Recomendaciones. Puedes retomarlo desde Perfil cuando cambien tus gustos.' })
  }
  if (user) {
    privateSteps.push({ path: '/biblioteca', selector: '[data-tour="personal-space"]', title: 'Organiza tu recorrido', description: 'Guarda favoritos, pendientes y listas. En el Diario decides si cada reseña es privada o pública; las públicas aparecen en la página de la película.' })
  }
  if (user?.role === 'psychologist') {
    privateSteps.push({ path: '/psicologo', selector: '[data-tour="psychologist-dashboard"]', title: 'Tu espacio profesional', description: 'Consulta únicamente usuarios asignados con consentimiento vigente y supervisa recomendaciones sin realizar diagnósticos.' })
  }
  return Object.freeze([...PUBLIC_STEPS_START, ...privateSteps, ...PUBLIC_STEPS_END])
}
