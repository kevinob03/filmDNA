import { getMovieDetails } from './movieService.js'

export const hydrateLibraryMovies = async (records) => {
  const movieIds = [...new Set(records.map((item) => Number(item.tmdbId)).filter((id) => Number.isInteger(id) && id > 0))]
  const results = await Promise.allSettled(movieIds.map((id) => getMovieDetails(String(id))))
  return movieIds.map((tmdbId, index) => results[index].status === 'fulfilled'
    ? { tmdbId, movie: results[index].value, error: null }
    : { tmdbId, movie: null, error: results[index].reason })
}