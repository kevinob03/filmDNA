import {
  COMPATIBILITY_THRESHOLDS,
  CONFIDENCE_LEVELS,
  EXPERIENCE_WEIGHTS,
  PREFERENCE_DNA_MAP,
} from './movieDNARules.js'

const getLabel = (options, group, value) => options?.[group]?.find((option) => option.value === value)?.label || value

const OBJECTIVE_WEIGHTS = Object.freeze({
  genres: 30,
  duration: 15,
  era: 10,
  minRating: 10,
  language: 10,
  region: 10,
  providers: 15,
})

const resolveDate = (value) => typeof value === 'function' ? value() : value
const clampPercentage = (value) => Math.min(100, Math.max(1, Math.round(value)))

export const getConfidenceLabel = (confidence) => {
  if (confidence >= CONFIDENCE_LEVELS.high) return 'Alta'
  if (confidence >= CONFIDENCE_LEVELS.medium) return 'Media'
  return 'Baja'
}

const objectiveReasons = (preferences, movieDNA, options, providerOptions) => {
  const reasons = []
  const objective = movieDNA.objective
  const genreIds = new Set(objective.genres.map((genre) => String(genre.id)))
  const matchedGenres = (preferences.genres || []).filter((id) => genreIds.has(String(id)))
  matchedGenres.slice(0, 2).forEach((id) => reasons.push({
    type: 'objective',
    text: `Coincide con ${getLabel(options, 'genres', String(id))}`,
    source: { type: 'genre', id: Number(id) },
  }))

  const duration = options?.duration?.find((option) => option.value === preferences.duration)
  if (duration && duration.value !== 'any' && objective.runtime !== null) {
    const matches = (!duration.min || objective.runtime >= duration.min) && (!duration.max || objective.runtime <= duration.max)
    if (matches) reasons.push({ type: 'objective', text: 'Duración dentro de tu rango', source: { type: 'runtime', value: objective.runtime } })
  }

  if (Number(preferences.minRating) > 0 && objective.voteAverage !== null && objective.voteAverage >= Number(preferences.minRating)) {
    reasons.push({ type: 'objective', text: `Puntuación TMDB ${objective.voteAverage.toFixed(1)}`, source: { type: 'vote_average', value: objective.voteAverage } })
  }

  if (preferences.providers?.length) {
    const selected = new Set(preferences.providers.map(String))
    const provider = objective.providers.find((item) => selected.has(String(item.id)))
    if (provider) reasons.push({ type: 'objective', text: `Disponible en ${provider.name}`, source: { type: 'watch_provider', id: provider.id } })
    else {
      const knownProvider = providerOptions?.find((item) => selected.has(String(item.provider_id)))
      if (knownProvider && !objective.providers.length) return reasons
    }
  }
  return reasons
}

const experienceReason = (preferenceKey, label, classification) => {
  const prefix = PREFERENCE_DNA_MAP[preferenceKey].label
  const text = prefix ? `${prefix} ${preferenceKey === 'mood' ? `“${label}”` : label.toLowerCase()}` : label
  return {
    type: 'experience',
    text,
    evidence: classification.evidence,
  }
}

const objectiveAssessments = (preferences, movieDNA, options, providerOptions) => {
  const objective = movieDNA.objective
  const assessments = []
  const add = (key, label, known, matches, detail) => assessments.push({
    key, label, weight: OBJECTIVE_WEIGHTS[key], known, score: known ? (matches ? 100 : 1) : null, detail,
  })

  if (preferences.genres?.length) {
    const available = new Set(objective.genres.map((genre) => String(genre.id)))
    const matches = preferences.genres.filter((id) => available.has(String(id))).length
    assessments.push({
      key: 'genres', label: preferences.genres.map((id) => getLabel(options, 'genres', String(id))).join(', '),
      weight: OBJECTIVE_WEIGHTS.genres, known: objective.genres.length > 0,
      score: objective.genres.length > 0 ? clampPercentage(matches / preferences.genres.length * 100) : null,
      detail: matches ? `${matches} género${matches === 1 ? '' : 's'} coincidente${matches === 1 ? '' : 's'}` : null,
    })
  }

  const duration = options?.duration?.find((option) => option.value === preferences.duration)
  if (duration && duration.value !== 'any') {
    const matches = objective.runtime !== null && (!duration.min || objective.runtime >= duration.min) && (!duration.max || objective.runtime <= duration.max)
    add('duration', duration.label, objective.runtime !== null, matches, matches ? 'Duración dentro de tu rango' : null)
  }

  const era = options?.era?.find((option) => option.value === preferences.era)
  if (era) {
    const date = objective.releaseDate
    const matches = Boolean(date) && (!era.from || date >= resolveDate(era.from)) && (!era.to || date <= resolveDate(era.to))
    add('era', era.label, Boolean(date), matches, matches ? `Estreno en ${era.label.toLowerCase()}` : null)
  }

  if (Number(preferences.minRating) > 0) {
    const matches = objective.voteAverage !== null && objective.voteAverage >= Number(preferences.minRating)
    add('minRating', `TMDB ${Number(preferences.minRating).toFixed(1)}+`, objective.voteAverage !== null, matches, matches ? `Puntuación TMDB ${objective.voteAverage.toFixed(1)}` : null)
  }

  if (preferences.language) {
    const label = getLabel(options, 'language', preferences.language)
    const matches = objective.originalLanguage === preferences.language
    add('language', label, Boolean(objective.originalLanguage), matches, matches ? `Idioma original: ${label}` : null)
  }

  if (preferences.region) {
    const label = getLabel(options, 'region', preferences.region)
    const countries = objective.productionCountries.map((country) => country.iso_3166_1)
    const matches = countries.includes(preferences.region)
    add('region', label, countries.length > 0, matches, matches ? `Producción de ${label}` : null)
  }

  if (preferences.providers?.length) {
    const selected = new Set(preferences.providers.map(String))
    const provider = objective.providers.find((item) => selected.has(String(item.id)))
    const label = provider?.name || providerOptions?.find((item) => selected.has(String(item.provider_id)))?.provider_name || 'Plataforma elegida'
    add('providers', label, true, Boolean(provider), provider ? `Disponible en ${provider.name}` : null)
  }

  return assessments
}

export const calculateCompatibility = (userPreferences, movieDNA, { optionGroups, providers = [] } = {}) => {
  const selected = Object.entries(PREFERENCE_DNA_MAP).filter(([key]) => Boolean(userPreferences[key]))
  const objectiveCriteria = objectiveAssessments(userPreferences, movieDNA, optionGroups, providers)
  const selectedWeight = selected.reduce((sum, [, config]) => sum + EXPERIENCE_WEIGHTS[config.weight], 0)
    + objectiveCriteria.reduce((sum, criterion) => sum + criterion.weight, 0)
  let evaluatedWeight = 0
  let weightedScore = 0
  let weightedConfidence = 0
  const evidenceIds = new Set()
  const reasons = objectiveReasons(userPreferences, movieDNA, optionGroups, providers)
  const evaluatedPreferences = []
  const unknownPreferences = []

  objectiveCriteria.forEach((criterion) => {
    if (!criterion.known) return
    evaluatedWeight += criterion.weight
    weightedScore += criterion.score * criterion.weight
    weightedConfidence += criterion.weight
    evidenceIds.add(`objective:${criterion.key}`)
  })

  selected.forEach(([preferenceKey, config]) => {
    const value = userPreferences[preferenceKey]
    const classification = movieDNA.experience?.[config.dnaGroup]?.[value]
    const label = getLabel(optionGroups, preferenceKey, value)
    if (!classification || classification.status !== 'known') {
      unknownPreferences.push({ key: preferenceKey, value, label })
      return
    }
    const weight = EXPERIENCE_WEIGHTS[config.weight]
    evaluatedWeight += weight
    weightedScore += classification.score * weight
    weightedConfidence += weight * classification.confidence
    classification.evidence.forEach((item) => evidenceIds.add(`${item.ruleId}:${item.sourceId}`))
    evaluatedPreferences.push({
      key: preferenceKey,
      value,
      label,
      score: classification.score,
      confidence: classification.confidence,
    })
    reasons.push(experienceReason(preferenceKey, label, classification))
  })

  // Cobertura = peso evaluado / peso seleccionado.
  const coverage = selectedWeight ? evaluatedWeight / selectedWeight : 0
  // Confianza = media ponderada de la calidad de las evidencias evaluadas.
  const confidence = evaluatedWeight ? weightedConfidence / evaluatedWeight : 0
  // Coincidencia = media ponderada de criterios objetivos y de experiencia evaluados.
  // Los criterios unknown afectan la cobertura, pero nunca se convierten en 0%.
  const rawPercentage = evaluatedWeight ? clampPercentage(weightedScore / evaluatedWeight) : null
  const hasKnownObjective = objectiveCriteria.some((criterion) => criterion.known)
  const hasEnoughEvidence = evaluatedWeight > 0
    && confidence >= COMPATIBILITY_THRESHOLDS.minimumConfidence
    && (hasKnownObjective || (coverage >= COMPATIBILITY_THRESHOLDS.minimumCoverage
      && evidenceIds.size >= COMPATIBILITY_THRESHOLDS.minimumEvidence))

  objectiveCriteria.filter((criterion) => criterion.detail).forEach((criterion) => {
    if (!reasons.some((reason) => reason.text === criterion.detail)) reasons.push({ type: 'objective', text: criterion.detail })
  })

  return {
    percentage: hasEnoughEvidence ? rawPercentage : null,
    coverage: Number(coverage.toFixed(2)),
    confidence: Number(confidence.toFixed(2)),
    confidenceLabel: getConfidenceLabel(confidence),
    evaluatedPreferences,
    unknownPreferences,
    evaluatedCriteria: objectiveCriteria.filter((criterion) => criterion.known),
    unknownCriteria: objectiveCriteria.filter((criterion) => !criterion.known),
    reasons: reasons.slice(0, 3),
  }
}
