import { discoverMovies, getRecommendationMovieDetails } from './tmdbService.js'
import { getAllMovieDNAProfiles, MOVIE_DNA_DIMENSIONS } from './movieDNAService.js'
import {
  DURATION_OPTIONS,
  ERA_OPTIONS,
  OPTION_GROUPS,
  POPULARITY_OPTIONS,
} from '../modules/recommendations/recommendationConfig.js'
import { buildMovieDNA } from './recommendations/movieDNA.js'
import { calculateCompatibility } from './recommendations/compatibilityService.js'
import { mergeMovieDNAEvidence } from './recommendations/mergeMovieDNAEvidence.js'
import { buildAIClassificationCandidate, classifyMovies } from './recommendations/recommendationAIService.js'

const MAX_DNA_DISTANCE = Math.sqrt(MOVIE_DNA_DIMENSIONS.length * 100 ** 2)

// Esta función pertenece exclusivamente al flujo existente de similitud del
// Movie DNA generado por IA. No participa en el perfil determinista de TMDB.
export const calculateDNASimilarity = (a, b) => {
  const distance = Math.sqrt(MOVIE_DNA_DIMENSIONS.reduce((sum, { key }) => sum + (a[key] - b[key]) ** 2, 0))
  return 1 - distance / MAX_DNA_DISTANCE
}

const resolveValue = (value) => typeof value === 'function' ? value() : value

const buildDiscoverParams = (selections) => {
  const params = {}
  if (selections.genres?.length) params.with_genres = selections.genres.join('|')

  const duration = DURATION_OPTIONS.find((option) => option.value === selections.duration)
  if (duration?.min) params['with_runtime.gte'] = duration.min
  if (duration?.max) params['with_runtime.lte'] = duration.max

  const era = ERA_OPTIONS.find((option) => option.value === selections.era)
  if (era?.from) params['primary_release_date.gte'] = resolveValue(era.from)
  if (era?.to) params['primary_release_date.lte'] = resolveValue(era.to)
  if (Number(selections.minRating) > 0) params['vote_average.gte'] = Number(selections.minRating)
  if (selections.language) params.with_original_language = selections.language
  if (selections.region) params.with_origin_country = selections.region
  if (selections.providers?.length) {
    params.with_watch_providers = selections.providers.join('|')
    params.watch_region = 'ES'
  }

  const popularity = POPULARITY_OPTIONS.find((option) => option.value === selections.popularity)
  if (popularity) {
    params.sort_by = popularity.sortBy
    params['vote_count.gte'] = popularity.minVotes
  }
  return params
}

const toCardProviders = (movieDNA) => movieDNA.objective.providers.map((provider) => ({
  provider_id: provider.id,
  provider_name: provider.name,
  logo_path: provider.logoPath,
}))

const compatibilityOrder = (a, b) => {
  const aPercentage = a.recommendation.percentage
  const bPercentage = b.recommendation.percentage
  if (aPercentage === null && bPercentage !== null) return 1
  if (aPercentage !== null && bPercentage === null) return -1
  if (aPercentage !== bPercentage) return (bPercentage ?? 0) - (aPercentage ?? 0)
  return (b.vote_average || 0) - (a.vote_average || 0)
}

const enrichMovies = async (movies, selections, providers) => {
  const settled = await Promise.allSettled(movies.slice(0, 12).map((movie) => getRecommendationMovieDetails(movie.id)))
  const enriched = settled
    .map((result, index) => result.status === 'fulfilled' ? result.value : movies[index])
    .map((movie) => ({ movie, movieDNA: buildMovieDNA(movie, { region: 'ES' }) }))

  let aiAssessments = new Map()
  try {
    const candidates = enriched.map(({ movie, movieDNA }) => buildAIClassificationCandidate(movie, movieDNA, selections)).filter(Boolean)
    aiAssessments = await classifyMovies(candidates)
  } catch {
    // La IA es enriquecimiento opcional: cualquier fallo conserva el resultado determinista.
  }

  return enriched
    .map(({ movie, movieDNA: deterministicDNA }) => {
      const movieDNA = mergeMovieDNAEvidence(deterministicDNA, aiAssessments.get(Number(movie.id)) || [])
      const compatibility = calculateCompatibility(selections, movieDNA, {
        optionGroups: OPTION_GROUPS,
        providers,
      })
      return {
        ...movie,
        recommendation: {
          ...compatibility,
          providers: toCardProviders(movieDNA),
          movieDNA,
        },
      }
    })
    .sort(compatibilityOrder)
}

export const getExperienceRecommendations = async (selections, providers = []) => {
  const catalog = await discoverMovies(buildDiscoverParams(selections))
  return enrichMovies(catalog.results || [], selections, providers)
}

export const getSimilarDNARecommendations = async (tmdbId, limit = 12) => {
  const profiles = await getAllMovieDNAProfiles()
  const source = profiles.find((profile) => profile.tmdbId === Number(tmdbId))
  if (!source) return []
  const ranked = profiles
    .filter((profile) => profile.tmdbId !== source.tmdbId)
    .map((profile) => ({ ...profile, similarity: calculateDNASimilarity(source, profile) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
  const settled = await Promise.allSettled(ranked.map((profile) => getRecommendationMovieDetails(profile.tmdbId)))
  return settled
    .map((result, index) => {
      if (result.status !== 'fulfilled') return null
      const movieDNA = buildMovieDNA(result.value, { region: 'ES' })
      return {
        ...result.value,
        recommendation: {
          percentage: Math.round(ranked[index].similarity * 100),
          coverage: 1,
          confidence: 1,
          confidenceLabel: 'Alta',
          evaluatedPreferences: [],
          unknownPreferences: [],
          reasons: [{ type: 'movie-dna', text: 'Movie DNA similar', evidence: [] }],
          providers: toCardProviders(movieDNA),
        },
      }
    })
    .filter(Boolean)
}
