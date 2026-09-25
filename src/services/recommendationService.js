import { discoverMovies, getMovieDetails } from './tmdbService.js'
import { getAllMovieDNAProfiles, MOVIE_DNA_DIMENSIONS } from './movieDNAService.js'
import { DNA_TARGETS, DURATION_RANGES, GENRE_SIGNALS } from '../modules/recommendations/recommendationConfig.js'

const MAX_DNA_DISTANCE = Math.sqrt(MOVIE_DNA_DIMENSIONS.length * 100 ** 2)

export const calculateDNASimilarity = (a, b) => {
  const distance = Math.sqrt(MOVIE_DNA_DIMENSIONS.reduce((sum, { key }) => sum + (a[key] - b[key]) ** 2, 0))
  return 1 - distance / MAX_DNA_DISTANCE
}

const scoreMovie = (movie, selections, dna) => {
  const genres = new Set(movie.genre_ids || [])
  let score = 0
  Object.entries(selections).forEach(([criterion, option]) => {
    if (criterion === 'duration') return
    const signals = GENRE_SIGNALS[option] || []
    score += signals.some((genre) => genres.has(genre)) ? 2 : 0
    const target = DNA_TARGETS[criterion]
    if (dna && target) score += 1 - Math.abs(dna[target.dimension] - target[option]) / 100
  })
  return score
}

export const getExperienceRecommendations = async (selections) => {
  const duration = DURATION_RANGES[selections.duration] || {}
  const selectedGenres = Object.values(selections).flatMap((option) => GENRE_SIGNALS[option] || [])
  const uniqueGenres = [...new Set(selectedGenres)].slice(0, 5)
  const params = {}
  if (uniqueGenres.length) params.with_genres = uniqueGenres.join('|')
  if (duration.min) params['with_runtime.gte'] = duration.min
  if (duration.max) params['with_runtime.lte'] = duration.max
  const currentYear = new Date().getFullYear()
  if (selections.era === 'Estrenos') params['primary_release_date.gte'] = `${currentYear - 1}-01-01`
  if (selections.era === 'Recientes') params['primary_release_date.gte'] = `${currentYear - 5}-01-01`
  if (selections.era === 'De los 2000') {
    params['primary_release_date.gte'] = '2000-01-01'
    params['primary_release_date.lte'] = '2009-12-31'
  }
  if (selections.era === 'Clásicas') params['primary_release_date.lte'] = '1999-12-31'

  const [catalog, profiles] = await Promise.all([
    discoverMovies(params),
    getAllMovieDNAProfiles().catch(() => []),
  ])
  const profileById = new Map(profiles.map((profile) => [profile.tmdbId, profile]))
  return (catalog.results || [])
    .map((movie) => ({ movie, score: scoreMovie(movie, selections, profileById.get(movie.id)) }))
    .sort((a, b) => b.score - a.score || b.movie.vote_average - a.movie.vote_average)
    .slice(0, 12)
    .map(({ movie }) => movie)
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
  const settled = await Promise.allSettled(ranked.map((profile) => getMovieDetails(profile.tmdbId)))
  return settled.filter((result) => result.status === 'fulfilled').map((result) => result.value)
}
