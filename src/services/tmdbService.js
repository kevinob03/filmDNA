const API_BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'
const LANGUAGE = 'es-ES'
const CACHE_TTL = 60_000

const apiKey = import.meta.env.VITE_TMDB_API_KEY?.trim()
const responseCache = new Map()

export const isTmdbConfigured = Boolean(apiKey)

export class TmdbServiceError extends Error {
  constructor(type, status) {
    super(type)
    this.name = 'TmdbServiceError'
    this.type = type
    this.status = status
  }
}

const request = async (endpoint, params = {}) => {
  if (!isTmdbConfigured) {
    throw new TmdbServiceError('configuration')
  }

  const url = new URL(`${API_BASE_URL}${endpoint}`)
  url.search = new URLSearchParams({
    api_key: apiKey,
    language: LANGUAGE,
    ...params,
  }).toString()

  const cacheKey = url.toString()
  const cached = responseCache.get(cacheKey)

  if (cached && Date.now() - cached.createdAt < CACHE_TTL) {
    return cached.promise
  }

  const promise = fetch(url, { headers: { Accept: 'application/json' } })
    .then((response) => {
      if (!response.ok) {
        throw new TmdbServiceError(response.status === 404 ? 'not-found' : 'request', response.status)
      }

      return response.json()
    })
    .catch((error) => {
      responseCache.delete(cacheKey)
      if (error instanceof TmdbServiceError) throw error
      throw new TmdbServiceError('network')
    })

  responseCache.set(cacheKey, { createdAt: Date.now(), promise })
  return promise
}

export const getTrendingMovies = (page = 1) => request('/trending/movie/week', { page })

export const getPopularMovies = (page = 1) => request('/movie/popular', { page, region: 'ES' })

export const searchMovies = (query, page = 1) => request('/search/movie', {
  query: query.trim(),
  page,
  include_adult: 'false',
  region: 'ES',
})

export const getMovieDetails = (movieId) => request(`/movie/${encodeURIComponent(movieId)}`)

export const buildTmdbImageUrl = (path, size = 'w500') => {
  if (!path) return null
  return `${IMAGE_BASE_URL}/${size}${path}`
}

export const getTmdbErrorMessage = (error, context = 'las películas') => {
  if (error?.type === 'configuration') {
    return 'Configura VITE_TMDB_API_KEY en el archivo .env para cargar contenido de TMDB.'
  }

  if (error?.type === 'not-found') {
    return 'No encontramos la película solicitada.'
  }

  return `No pudimos cargar ${context} en este momento.`
}
