const MONTH_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])/

export const calculateAverageRating = (entries = []) => {
  const ratings = entries
    .map((entry) => Number(entry.calificacion))
    .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 10)
  if (!ratings.length) return null
  return ratings.reduce((total, rating) => total + rating, 0) / ratings.length
}

export const groupEntriesByMonth = (entries = []) => entries.reduce((groups, entry) => {
  const match = String(entry.fechaVista ?? '').match(MONTH_KEY_PATTERN)
  if (!match) return groups
  const key = `${match[1]}-${match[2]}`
  return { ...groups, [key]: (groups[key] ?? 0) + 1 }
}, {})

export const buildMonthlySeries = (entries = []) => Object.entries(groupEntriesByMonth(entries))
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([month, count]) => ({ month, count }))

export const summarizeStatistics = ({ diaryEntries = [], favorites = [], watchlist = [], customLists = [] } = {}) => ({
  watchedCount: diaryEntries.length,
  averageRating: calculateAverageRating(diaryEntries),
  favoriteCount: favorites.length,
  watchlistCount: watchlist.length,
  customListCount: customLists.length,
  monthlyActivity: buildMonthlySeries(diaryEntries),
})
