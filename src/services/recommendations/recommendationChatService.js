import { requestRecommendationChat } from '../aiClient.js'
import {
  RECOMMENDATION_CHAT_SCHEMA_VERSION,
  validateRecommendationChatExchange,
  validateRecommendationChatRequest,
} from './recommendationChatContract.js'

const makeId = (prefix) => {
  const randomPart = globalThis.crypto?.randomUUID?.().replaceAll('-', '')
    || `${Date.now()}_${Math.random().toString(36).slice(2)}`
  return `${prefix}_${randomPart}`
}

export const createRecommendationChatSessionId = () => makeId('session')
export const createRecommendationChatRequestId = () => makeId('request')

export const toRecommendationChatFilters = (selections = {}) => Object.entries(selections).reduce((filters, [key, value]) => {
  if (key === 'providers') return filters
  if (Array.isArray(value)) {
    if (value.length) filters[key] = value.map(String)
    return filters
  }
  if (key === 'minRating') {
    if (Number(value) > 0) filters[key] = Number(value)
    return filters
  }
  if (value && !(key === 'popularity' && value === 'popular')) filters[key] = value
  return filters
}, {})

export const toRecommendationChatCandidate = (movie) => {
  const releaseYear = Number.parseInt(String(movie.release_date || '').slice(0, 4), 10)
  const genreIds = (movie.genres || movie.genre_ids || [])
    .map((genre) => Number(typeof genre === 'object' ? genre.id : genre))
    .filter((id) => Number.isInteger(id) && id > 0)
  return {
    tmdbId: Number(movie.id),
    title: String(movie.title || movie.original_title || `Película ${movie.id}`).slice(0, 200),
    overview: String(movie.overview || '').slice(0, 1_000),
    releaseYear: Number.isInteger(releaseYear) ? releaseYear : null,
    genreIds: [...new Set(genreIds)].slice(0, 12),
    runtime: Number.isInteger(movie.runtime) && movie.runtime > 0 ? movie.runtime : null,
    voteAverage: Number.isFinite(Number(movie.vote_average)) ? Number(movie.vote_average) : null,
  }
}

export const buildRecommendationChatRequest = ({ sessionId, message, history, filters, movies, turn }) => validateRecommendationChatRequest({
  schemaVersion: RECOMMENDATION_CHAT_SCHEMA_VERSION,
  requestId: createRecommendationChatRequestId(),
  sessionId,
  message,
  history: history.slice(-6),
  context: {
    turn,
    filters: toRecommendationChatFilters(filters),
    shownMovieIds: movies.map((movie) => Number(movie.id)).filter(Number.isInteger).slice(0, 20),
    candidates: movies.slice(0, 5).map(toRecommendationChatCandidate),
  },
})

export const sendRecommendationChatMessage = async (input) => {
  const request = buildRecommendationChatRequest(input)
  const response = await requestRecommendationChat(request, input.apiKey)
  return validateRecommendationChatExchange(request, response).response
}
