import { COMPANY_OPTIONS, MOOD_OPTIONS } from '../config/recommendationConfig.js'

const optionGenres = (options, value) => (Array.isArray(value) ? value : [value])
  .flatMap((selected) => options.find((option) => option.value === selected)?.genreIds || [])

export const buildDiscoveryProfile = (preferences = {}) => {
  const explicit = (preferences.genres || []).map(Number).filter(Number.isFinite)
  const emotional = optionGenres(MOOD_OPTIONS, preferences.mood)
  const company = optionGenres(COMPANY_OPTIONS, preferences.company)
  const genreIds = [...new Set([...explicit, ...emotional, ...company])]
  return { explicit, emotional, company, genreIds }
}

export const rankPersonalizedMovies = (movies, profile) => [...movies].sort((a, b) => {
  const score = (movie) => {
    const genres = new Set(movie.genre_ids || [])
    const matches = (ids, weight) => ids.reduce((sum, id) => sum + (genres.has(id) ? weight : 0), 0)
    return matches(profile.explicit, 4) + matches(profile.emotional, 2) + matches(profile.company, 2)
  }
  return score(b) - score(a) || (b.popularity || 0) - (a.popularity || 0)
})
