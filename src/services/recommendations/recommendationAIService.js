import { classifyMovieBatch } from '../aiClient.js'
import { PREFERENCE_DNA_MAP } from './movieDNARules.js'

export const RECOMMENDATION_AI_SCHEMA_VERSION = 'recommendation-classification-v1'
export const MAX_AI_BATCH_SIZE = 6

const classificationCache = new Map()
const cacheStats = { hits: 0, misses: 0, batches: 0 }

const stableMetadata = (movie, movieDNA) => ({
  year: movie.release_date?.slice(0, 4) || '',
  genres: movieDNA.objective.genres.map((genre) => genre.name || String(genre.id)),
  overview: typeof movie.overview === 'string' ? movie.overview.trim() : '',
  keywords: movieDNA.objective.keywords.map((keyword) => keyword.name || String(keyword.id)),
  runtime: movieDNA.objective.runtime,
  certifications: movieDNA.objective.certifications,
})

const hashString = (value) => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export const buildAIClassificationCandidate = (movie, movieDNA, preferences) => {
  const requestedDimensions = Object.entries(PREFERENCE_DNA_MAP).flatMap(([preferenceKey, config]) => {
    const target = preferences[preferenceKey]
    if (!target || (preferenceKey === 'company' && target === 'family')) return []
    const deterministic = movieDNA.experience?.[config.dnaGroup]?.[target]
    return deterministic?.status === 'unknown' ? [{ dimension: config.dnaGroup, target }] : []
  })
  if (!requestedDimensions.length) return null
  const metadata = stableMetadata(movie, movieDNA)
  return {
    tmdbId: Number(movie.id),
    title: movie.title || movie.original_title || '',
    metadata,
    movieDataVersion: hashString(JSON.stringify(metadata)),
    requestedDimensions,
  }
}

const cacheKey = (candidate, requested) => [
  RECOMMENDATION_AI_SCHEMA_VERSION,
  candidate.tmdbId,
  candidate.movieDataVersion,
  requested.dimension,
  requested.target,
].join(':')

const validateBatchResponse = (response, batch) => {
  if (!response || !Array.isArray(response.result?.movies) || typeof response.provider !== 'string' || typeof response.model !== 'string') throw new Error('invalid-ai-response')
  const expected = new Map(batch.map((movie) => [movie.tmdbId, new Set(movie.requestedDimensions.map(({ dimension, target }) => `${dimension}.${target}`))]))
  if (response.result.movies.length !== batch.length) throw new Error('invalid-ai-response')
  return response.result.movies.flatMap((movie) => {
    const expectedDimensions = expected.get(Number(movie.tmdbId))
    if (!expectedDimensions || !Array.isArray(movie.classifications) || movie.classifications.length !== expectedDimensions.size) throw new Error('invalid-ai-response')
    const seen = new Set()
    return movie.classifications.map((classification) => {
      const key = `${classification.dimension}.${classification.target}`
      if (!expectedDimensions.has(key) || seen.has(key)) throw new Error('invalid-ai-response')
      seen.add(key)
      return { ...classification, tmdbId: Number(movie.tmdbId), provider: response.provider, model: response.model }
    })
  })
}

const toRequestMovie = (candidate, requestedDimensions) => ({
  tmdbId: candidate.tmdbId,
  title: candidate.title,
  metadata: candidate.metadata,
  requestedDimensions,
})

export const classifyMovies = async (candidates) => {
  const results = new Map()
  const misses = []

  candidates.filter(Boolean).forEach((candidate) => {
    const missingDimensions = []
    candidate.requestedDimensions.forEach((requested) => {
      const cached = classificationCache.get(cacheKey(candidate, requested))
      if (cached) {
        cacheStats.hits += 1
        const current = results.get(candidate.tmdbId) || []
        current.push(cached)
        results.set(candidate.tmdbId, current)
      } else {
        cacheStats.misses += 1
        missingDimensions.push(requested)
      }
    })
    if (missingDimensions.length) misses.push({ candidate, missingDimensions })
  })

  const batches = []
  for (let index = 0; index < misses.length; index += MAX_AI_BATCH_SIZE) batches.push(misses.slice(index, index + MAX_AI_BATCH_SIZE))
  cacheStats.batches += batches.length

  const settled = await Promise.allSettled(batches.map(async (batchEntries) => {
    const requestBatch = batchEntries.map(({ candidate, missingDimensions }) => toRequestMovie(candidate, missingDimensions))
    const response = await classifyMovieBatch(requestBatch)
    return validateBatchResponse(response, requestBatch)
  }))

  settled.forEach((batchResult) => {
    if (batchResult.status !== 'fulfilled') return
    batchResult.value.forEach((assessment) => {
      const candidate = candidates.find((item) => item?.tmdbId === assessment.tmdbId)
      if (!candidate) return
      classificationCache.set(cacheKey(candidate, assessment), assessment)
      const current = results.get(assessment.tmdbId) || []
      current.push(assessment)
      results.set(assessment.tmdbId, current)
    })
  })

  return results
}

export const resetRecommendationAICache = () => {
  classificationCache.clear()
  cacheStats.hits = 0
  cacheStats.misses = 0
  cacheStats.batches = 0
}

export const getRecommendationAICacheStats = () => ({ ...cacheStats, entries: classificationCache.size })
