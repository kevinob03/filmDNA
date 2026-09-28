import {
  CLASSIFICATION_CONFIG,
  CLASSIFICATION_CONFLICTS,
  EXPERIENCE_RULES,
  FAMILY_CERTIFICATIONS_ES,
  GENRE_IDS,
  VERIFIED_KEYWORDS,
} from './movieDNARules.js'

const uniqueById = (items) => [...new Map(items.filter(Boolean).map((item) => [Number(item.id), item])).values()]

const getKeywords = (movieData) => uniqueById(movieData?.keywords?.keywords || movieData?.keywords?.results || [])

const getGenres = (movieData) => movieData?.genres?.length
  ? movieData.genres.map((genre) => ({ id: Number(genre.id), name: genre.name }))
  : (movieData?.genre_ids || []).map((id) => ({ id: Number(id), name: null }))

const getCertifications = (movieData, region) => {
  const regional = movieData?.release_dates?.results?.find((entry) => entry.iso_3166_1 === region)
  return [...new Set((regional?.release_dates || []).map((release) => release.certification?.trim()).filter(Boolean))]
}

const getProviders = (movieData, region) => {
  const regional = movieData?.['watch/providers']?.results?.[region]
  const providers = [...(regional?.flatrate || []), ...(regional?.free || []), ...(regional?.ads || [])]
  return uniqueById(providers.map((provider) => ({
    id: Number(provider.provider_id),
    name: provider.provider_name,
    logoPath: provider.logo_path,
  })))
}

const emptyClassification = () => ({ status: 'unknown', score: null, confidence: 0, source: 'unknown', evidence: [], conflictingEvidence: [] })

const createDimensions = () => Object.fromEntries(Object.entries(CLASSIFICATION_CONFIG).map(([group, options]) => [
  group,
  Object.fromEntries(Object.keys(options).map((option) => [option, emptyClassification()])),
]))

const sourceEvidence = (rule, genres, keywords) => {
  const collection = rule.signal.source === 'genre' ? genres : keywords
  const match = collection.find((item) => Number(item.id) === Number(rule.signal.id))
  if (!match) return null
  return {
    ruleId: rule.id,
    source: rule.signal.source,
    sourceId: Number(match.id),
    sourceValue: match.name || `TMDB ${match.id}`,
    contribution: rule.signal.contribution,
    confidence: rule.signal.confidence,
  }
}

const finalizeClassification = (classification, config) => {
  const points = classification.evidence.reduce((sum, item) => sum + item.contribution, 0)
  const hasRequiredSource = !config.requireKeyword || classification.evidence.some((item) => item.source === 'keyword')
  if (!classification.evidence.length || points < config.minimumPoints || !hasRequiredSource || (config.rejectOnConflict && classification.conflictingEvidence.length)) return classification
  const weightedConfidence = classification.evidence.reduce((sum, item) => sum + item.confidence * item.contribution, 0) / points
  // Coincidencia = puntos de reglas verificadas / fuerza máxima documentada.
  // No incluye confianza y no aplica un piso artificial al cruzar el umbral.
  return {
    status: 'known',
    score: Math.min(100, Math.round(points / config.maximumPoints * 100)),
    confidence: Number(weightedConfidence.toFixed(2)),
    source: 'deterministic',
    evidence: classification.evidence,
  }
}

const addConflictingEvidence = (dimensions, genres, keywords) => {
  Object.entries(CLASSIFICATION_CONFLICTS).forEach(([group, options]) => {
    Object.entries(options).forEach(([option, conflicts]) => {
      conflicts.forEach((conflict) => {
        const collection = conflict.source === 'genre' ? genres : keywords
        const match = collection.find((item) => Number(item.id) === Number(conflict.id))
        if (match) dimensions[group][option].conflictingEvidence.push({
          source: conflict.source,
          sourceId: Number(match.id),
          sourceValue: match.name || `TMDB ${match.id}`,
        })
      })
    })
  })
}

const addFamilyEvidence = (dimensions, genres, keywords, certifications, region) => {
  if (region !== 'ES' || !certifications.some((value) => FAMILY_CERTIFICATIONS_ES.includes(value))) return
  const familyGenre = genres.find((genre) => [GENRE_IDS.family, GENRE_IDS.animation].includes(genre.id))
  const familyKeyword = keywords.find((keyword) => keyword.id === VERIFIED_KEYWORDS.familyFriendly.id)
  if (!familyGenre && !familyKeyword) return

  dimensions.company.family.evidence.push({
    ruleId: 'company-family-regional-certification',
    source: 'certification',
    sourceId: region,
    sourceValue: certifications.join(', '),
    contribution: 2,
    confidence: 0.9,
  })
  dimensions.company.family.evidence.push({
    ruleId: familyKeyword ? 'company-family-family-friendly-keyword' : 'company-family-family-genre',
    source: familyKeyword ? 'keyword' : 'genre',
    sourceId: Number((familyKeyword || familyGenre).id),
    sourceValue: (familyKeyword || familyGenre).name,
    contribution: 2,
    confidence: familyKeyword ? 0.9 : 0.75,
  })
}

export const buildMovieDNA = (movieData, { region = 'ES' } = {}) => {
  const genres = getGenres(movieData)
  const keywords = getKeywords(movieData)
  const certifications = getCertifications(movieData, region)
  const providers = getProviders(movieData, region)
  const dimensions = createDimensions()

  EXPERIENCE_RULES.forEach((rule) => {
    const evidence = sourceEvidence(rule, genres, keywords)
    if (evidence) dimensions[rule.group][rule.option].evidence.push(evidence)
  })
  addConflictingEvidence(dimensions, genres, keywords)
  addFamilyEvidence(dimensions, genres, keywords, certifications, region)

  Object.entries(dimensions).forEach(([group, options]) => {
    Object.keys(options).forEach((option) => {
      dimensions[group][option] = finalizeClassification(options[option], CLASSIFICATION_CONFIG[group][option])
    })
  })

  return {
    tmdbId: Number(movieData?.id),
    source: 'tmdb',
    region,
    objective: {
      genres,
      keywords,
      runtime: Number.isFinite(movieData?.runtime) && movieData.runtime > 0 ? movieData.runtime : null,
      releaseDate: movieData?.release_date || null,
      voteAverage: Number.isFinite(movieData?.vote_average) ? movieData.vote_average : null,
      voteCount: Number.isFinite(movieData?.vote_count) ? movieData.vote_count : null,
      popularity: Number.isFinite(movieData?.popularity) ? movieData.popularity : null,
      originalLanguage: movieData?.original_language || null,
      productionCountries: movieData?.production_countries || [],
      productionCompanies: movieData?.production_companies || [],
      certifications,
      providers,
    },
    experience: dimensions,
  }
}
