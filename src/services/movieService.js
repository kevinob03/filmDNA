import { getMovieDetails as getTmdbMovieDetails, getPopularMovies, searchMovies as searchTmdbMovies } from './tmdbService.js'
import { getOmdbMovieDetails, isOmdbConfigured, searchOmdbMovies } from './omdbService.js'
export { getPopularMovies }
export const searchMovies = async (query, page = 1) => {
  try { return await searchTmdbMovies(query, page) } catch (error) { if (!isOmdbConfigured) throw error; return searchOmdbMovies(query, page) }
}
export const getMovieDetails = (id) => id.startsWith('imdb:') ? getOmdbMovieDetails(id.slice(5)) : getTmdbMovieDetails(id)
