import { getMovieDetails } from './movieService.js'

export const hydrateDiaryEntries = async (entries) => {
  const results = await Promise.allSettled(entries.map((entry) => getMovieDetails(String(entry.tmdbId))))
  return entries.map((entry, index) => ({
    entry,
    movie: results[index].status === 'fulfilled' ? results[index].value : null,
    movieError: results[index].status === 'rejected' ? results[index].reason : null,
  }))
}
