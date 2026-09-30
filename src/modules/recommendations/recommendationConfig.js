export const GENRE_OPTIONS = Object.freeze([
  { value: '28', label: 'Acción' },
  { value: '35', label: 'Comedia' },
  { value: '18', label: 'Drama' },
  { value: '53', label: 'Thriller' },
  { value: '27', label: 'Terror' },
  { value: '878', label: 'Ciencia ficción' },
  { value: '14', label: 'Fantasía' },
  { value: '10749', label: 'Romance' },
  { value: '16', label: 'Animación' },
  { value: '12', label: 'Aventura' },
  { value: '80', label: 'Crimen' },
  { value: '9648', label: 'Misterio' },
])

export const MOOD_OPTIONS = Object.freeze([
  { value: 'laugh', label: 'Reír', icon: 'smile', genreIds: [35] },
  { value: 'feel', label: 'Emocionarme', icon: 'heart', genreIds: [18, 10749] },
  { value: 'relax', label: 'Relajarme', icon: 'coffee', genreIds: [35, 16, 10751] },
  { value: 'tension', label: 'Sentir tensión', icon: 'bolt', genreIds: [53, 9648] },
  { value: 'surprise', label: 'Sorprenderme', icon: 'spark', genreIds: [9648, 878] },
  { value: 'fear', label: 'Asustarme', icon: 'ghost', genreIds: [27] },
  { value: 'think', label: 'Pensar', icon: 'bulb', genreIds: [99, 9648, 878] },
])

export const PACE_OPTIONS = Object.freeze([
  { value: 'calm', label: 'Tranquilo', description: 'Se toma su tiempo.', dnaTarget: 25 },
  { value: 'balanced', label: 'Equilibrado', description: 'Combina momentos tranquilos y movidos.', dnaTarget: 50 },
  { value: 'dynamic', label: 'Dinámico', description: 'Siempre están pasando cosas.', dnaTarget: 75 },
  { value: 'relentless', label: 'Sin descanso', description: 'Va rápido casi todo el tiempo.', dnaTarget: 95 },
])

export const ATTENTION_OPTIONS = Object.freeze([
  { value: 'easy', label: 'Fácil de seguir', dnaTarget: 20 },
  { value: 'casual', label: 'Algo para disfrutar', dnaTarget: 40 },
  { value: 'focus', label: 'Quiero concentrarme', dnaTarget: 70 },
  { value: 'challenge', label: 'Quiero algo desafiante', dnaTarget: 95 },
])

export const DURATION_OPTIONS = Object.freeze([
  { value: 'under-90', label: 'Menos de 90 min', max: 89 },
  { value: '90-120', label: '90–120 min', min: 90, max: 120 },
  { value: '120-150', label: '120–150 min', min: 121, max: 150 },
  { value: 'over-150', label: 'Más de 150 min', min: 151 },
  { value: 'any', label: 'No me importa' },
])

export const COMPANY_OPTIONS = Object.freeze([
  { value: 'alone', label: 'Solo' },
  { value: 'couple', label: 'En pareja' },
  { value: 'friends', label: 'Con amigos' },
  { value: 'family', label: 'En familia', genreIds: [10751, 16] },
])

export const ERA_OPTIONS = Object.freeze([
  { value: 'releases', label: 'Estrenos', from: () => `${new Date().getFullYear() - 1}-01-01` },
  { value: '2020s', label: '2020s', from: '2020-01-01', to: '2029-12-31' },
  { value: '2010s', label: '2010s', from: '2010-01-01', to: '2019-12-31' },
  { value: '2000s', label: '2000s', from: '2000-01-01', to: '2009-12-31' },
  { value: 'classics', label: 'Clásicos', to: '1989-12-31' },
])

export const LANGUAGE_OPTIONS = Object.freeze([
  { value: '', label: 'Cualquier idioma' },
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'fr', label: 'Francés' },
  { value: 'it', label: 'Italiano' },
  { value: 'ja', label: 'Japonés' },
  { value: 'ko', label: 'Coreano' },
])

export const REGION_OPTIONS = Object.freeze([
  { value: '', label: 'Cualquier país' },
  { value: 'ES', label: 'España' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'MX', label: 'México' },
  { value: 'AR', label: 'Argentina' },
  { value: 'FR', label: 'Francia' },
  { value: 'JP', label: 'Japón' },
  { value: 'KR', label: 'Corea del Sur' },
])

export const POPULARITY_OPTIONS = Object.freeze([
  { value: 'popular', label: 'Popular', sortBy: 'popularity.desc', minVotes: 300 },
  { value: 'balanced', label: 'Equilibrada', sortBy: 'vote_average.desc', minVotes: 100 },
  { value: 'hidden', label: 'Menos conocida', sortBy: 'vote_average.desc', minVotes: 25 },
])

export const INITIAL_SELECTIONS = Object.freeze({
  genres: [], mood: '', pace: '', attention: '', duration: '', company: '',
  era: '', minRating: 0, language: '', region: '', providers: [], popularity: 'popular',
})

export const OPTION_GROUPS = Object.freeze({
  genres: GENRE_OPTIONS,
  mood: MOOD_OPTIONS,
  pace: PACE_OPTIONS,
  attention: ATTENTION_OPTIONS,
  duration: DURATION_OPTIONS,
  company: COMPANY_OPTIONS,
  era: ERA_OPTIONS,
  language: LANGUAGE_OPTIONS,
  region: REGION_OPTIONS,
  popularity: POPULARITY_OPTIONS,
})

// Mantiene compatible el selector resumido de la Home sin duplicar su fuente de datos.
export const EXPERIENCE_CRITERIA = Object.freeze([
  { id: 'genres', label: 'Género', options: GENRE_OPTIONS.map((option) => option.label) },
  { id: 'mood', label: '¿Cómo quieres sentirte?', options: MOOD_OPTIONS.map((option) => option.label) },
  { id: 'pace', label: 'Ritmo', options: PACE_OPTIONS.map((option) => option.label) },
])

export const findOption = (group, value) => OPTION_GROUPS[group]?.find((option) => option.value === value)

export const normalizeOptionValue = (group, value) => OPTION_GROUPS[group]?.find((option) => option.value === value || option.label === value)?.value ?? value

export const getActiveFilterLabels = (selections, providers = []) => {
  const labels = []
  Object.entries(selections).forEach(([group, value]) => {
    if (group === 'providers') {
      value.forEach((providerId) => {
        const provider = providers.find((item) => String(item.provider_id) === String(providerId))
        if (provider) labels.push({ group, value: String(providerId), label: provider.provider_name })
      })
      return
    }
    if (group === 'genres') {
      value.forEach((genreId) => {
        const option = findOption(group, String(genreId))
        if (option) labels.push({ group, value: String(genreId), label: option.label })
      })
      return
    }
    if (group === 'minRating' && Number(value) > 0) {
      labels.push({ group, value, label: `TMDB ${Number(value).toFixed(1)}+` })
      return
    }
    if (!value || (group === 'popularity' && value === 'popular')) return
    const option = findOption(group, value)
    if (option?.label && option.value) labels.push({ group, value, label: option.label })
  })
  return labels
}
