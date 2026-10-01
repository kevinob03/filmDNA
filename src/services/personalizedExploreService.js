import { buildDiscoveryProfile, rankPersonalizedMovies } from '../modules/explore/discoveryProfile.js'
import { discoverMovies } from './tmdbService.js'

export const getPersonalizedExploreMovies = async (preferences, page = 1) => {
  const profile = buildDiscoveryProfile(preferences)
  if (!profile.genreIds.length) return null
  const data = await discoverMovies({ page, with_genres: profile.genreIds.join('|') })
  return { ...data, results: rankPersonalizedMovies(data.results || [], profile), personalized: true }
}
