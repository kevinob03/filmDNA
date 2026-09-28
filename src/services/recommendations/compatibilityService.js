import {
  COMPATIBILITY_THRESHOLDS,
  CONFIDENCE_LEVELS,
  EXPERIENCE_WEIGHTS,
  PREFERENCE_DNA_MAP,
} from './movieDNARules.js'

const getLabel = (options, group, value) => options?.[group]?.find((option) => option.value === value)?.label || value

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

export const calculateCompatibility = (userPreferences, movieDNA, { optionGroups, providers = [] } = {}) => {
  const selected = Object.entries(PREFERENCE_DNA_MAP).filter(([key]) => Boolean(userPreferences[key]))
  const selectedWeight = selected.reduce((sum, [, config]) => sum + EXPERIENCE_WEIGHTS[config.weight], 0)
  let evaluatedWeight = 0
  let weightedScore = 0
  let weightedConfidence = 0
  const evidenceIds = new Set()
  const reasons = objectiveReasons(userPreferences, movieDNA, optionGroups, providers)
  const evaluatedPreferences = []
  const unknownPreferences = []

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
  // Coincidencia = media ponderada de scores sólo entre preferencias evaluadas.
  // Las preferencias unknown afectan la cobertura, pero nunca se convierten en 0%.
  const rawPercentage = evaluatedWeight ? Math.round(weightedScore / evaluatedWeight) : null
  const hasEnoughEvidence = coverage >= COMPATIBILITY_THRESHOLDS.minimumCoverage
    && confidence >= COMPATIBILITY_THRESHOLDS.minimumConfidence
    && evidenceIds.size >= COMPATIBILITY_THRESHOLDS.minimumEvidence

  return {
    percentage: hasEnoughEvidence ? rawPercentage : null,
    coverage: Number(coverage.toFixed(2)),
    confidence: Number(confidence.toFixed(2)),
    confidenceLabel: getConfidenceLabel(confidence),
    evaluatedPreferences,
    unknownPreferences,
    reasons: reasons.slice(0, 3),
  }
}
