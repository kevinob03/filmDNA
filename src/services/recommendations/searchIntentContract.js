import {
  ATTENTION_OPTIONS,
  COMPANY_OPTIONS,
  DURATION_OPTIONS,
  ERA_OPTIONS,
  GENRE_OPTIONS,
  LANGUAGE_OPTIONS,
  MOOD_OPTIONS,
  PACE_OPTIONS,
  POPULARITY_OPTIONS,
  REGION_OPTIONS,
  TONE_OPTIONS,
} from '../../modules/recommendations/recommendationConfig.js'

export const SEARCH_INTENT_SCHEMA_VERSION = 'recommendation-search-intent-v1'

const values = (options, { excludeEmpty = false } = {}) => options
  .map(({ value }) => String(value))
  .filter((value) => !excludeEmpty || value)

export const SEARCH_FILTER_VOCABULARY = Object.freeze({
  genres: Object.freeze(values(GENRE_OPTIONS)),
  mood: Object.freeze(values(MOOD_OPTIONS)),
  pace: Object.freeze(values(PACE_OPTIONS)),
  tone: Object.freeze(values(TONE_OPTIONS)),
  attention: Object.freeze(values(ATTENTION_OPTIONS)),
  duration: Object.freeze(values(DURATION_OPTIONS)),
  company: Object.freeze(values(COMPANY_OPTIONS)),
  era: Object.freeze(values(ERA_OPTIONS)),
  language: Object.freeze(values(LANGUAGE_OPTIONS, { excludeEmpty: true })),
  region: Object.freeze(values(REGION_OPTIONS, { excludeEmpty: true })),
  popularity: Object.freeze(values(POPULARITY_OPTIONS)),
})

export const SIMPLE_SEARCH_FILTERS = Object.freeze(['genres', 'mood', 'pace', 'tone', 'attention', 'duration', 'company'])
export const EXPERT_SEARCH_FILTERS = Object.freeze(['era', 'minRating', 'language', 'region', 'popularity'])
export const SEARCH_FILTER_NAMES = Object.freeze([...SIMPLE_SEARCH_FILTERS, ...EXPERT_SEARCH_FILTERS])

const invalid = () => { throw new Error('invalid-search-intent') }
const cleanTerms = (terms) => {
  if (!Array.isArray(terms) || terms.length > 10) invalid()
  return terms.map((term) => {
    if (typeof term !== 'string' || !term.trim() || term.trim().length > 120) invalid()
    return term.trim()
  })
}

export const validateSearchIntent = (result) => {
  if (!result || result.schemaVersion !== SEARCH_INTENT_SCHEMA_VERSION || !result.filters || typeof result.filters !== 'object' || Array.isArray(result.filters)) invalid()
  if (Object.keys(result).some((key) => !['schemaVersion', 'filters', 'unmappedTerms', 'confidence'].includes(key))) invalid()
  if (Object.keys(result.filters).some((key) => !SEARCH_FILTER_NAMES.includes(key))) invalid()

  const filters = {}
  Object.entries(result.filters).forEach(([key, value]) => {
    if (key === 'genres') {
      if (!Array.isArray(value) || !value.length || value.length > SEARCH_FILTER_VOCABULARY.genres.length) invalid()
      const normalized = value.map(String)
      if (new Set(normalized).size !== normalized.length || normalized.some((item) => !SEARCH_FILTER_VOCABULARY.genres.includes(item))) invalid()
      filters.genres = normalized
      return
    }
    if (key === 'minRating') {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0.5 || value > 9 || value * 2 % 1 !== 0) invalid()
      filters.minRating = value
      return
    }
    if (typeof value !== 'string' || !SEARCH_FILTER_VOCABULARY[key]?.includes(value)) invalid()
    filters[key] = value
  })

  if (typeof result.confidence !== 'number' || !Number.isFinite(result.confidence) || result.confidence < 0 || result.confidence > 1) invalid()
  return {
    schemaVersion: SEARCH_INTENT_SCHEMA_VERSION,
    filters,
    unmappedTerms: cleanTerms(result.unmappedTerms),
    confidence: Number(result.confidence.toFixed(2)),
  }
}

export const requiresExpertMode = (filters) => EXPERT_SEARCH_FILTERS.some((key) => Object.hasOwn(filters, key))
