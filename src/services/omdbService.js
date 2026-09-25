const API_URL = 'https://www.omdbapi.com/'
const apiKey = import.meta.env.VITE_OMDB_API_KEY?.trim()
export const isOmdbConfigured = Boolean(apiKey)
export class OmdbServiceError extends Error { constructor(type) { super(type); this.name = 'OmdbServiceError'; this.type = type } }
const request = async (params) => {
  if (!isOmdbConfigured) throw new OmdbServiceError('configuration')
  const url = new URL(API_URL); url.search = new URLSearchParams({ apikey: apiKey, ...params }).toString()
  let response
  try { response = await fetch(url, { headers: { Accept: 'application/json' } }) } catch { throw new OmdbServiceError('network') }
  if (!response.ok) throw new OmdbServiceError('request')
  const data = await response.json()
  if (data.Response === 'False') throw new OmdbServiceError(data.Error === 'Movie not found!' ? 'not-found' : 'request')
  return data
}
const normalizeMovie = (movie) => ({ id: `imdb:${movie.imdbID}`, imdbId: movie.imdbID, source: 'omdb', title: movie.Title, release_date: movie.Year && movie.Year !== 'N/A' ? `${movie.Year.slice(0, 4)}-01-01` : '', posterUrl: movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : null })
export const searchOmdbMovies = async (query, page = 1) => {
  const data = await request({ s: query.trim(), type: 'movie', page: String(Math.min(page, 100)) })
  return { results: data.Search.map(normalizeMovie), total_pages: Math.max(1, Math.ceil(Number(data.totalResults) / 10)), source: 'omdb' }
}
export const getOmdbMovieDetails = async (imdbId) => {
  const movie = await request({ i: imdbId, plot: 'full' })
  return { ...normalizeMovie(movie), overview: movie.Plot !== 'N/A' ? movie.Plot : '', runtime: Number.parseInt(movie.Runtime, 10) || null, genres: movie.Genre !== 'N/A' ? movie.Genre.split(', ').map((name) => ({ id: name, name })) : [], vote_average: Number.parseFloat(movie.imdbRating) || 0, vote_count: Number.parseInt(movie.imdbVotes?.replaceAll(',', ''), 10) || 0, status: null }
}
