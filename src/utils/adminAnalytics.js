const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])/
const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('es-CR', { month: 'short', year: '2-digit', timeZone: 'UTC' })

const monthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
const addMonths = (date, amount) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1))
const labelMonth = (key) => {
  const [year, month] = key.split('-').map(Number)
  return MONTH_LABEL_FORMATTER.format(new Date(Date.UTC(year, month - 1, 1))).replace('.', '')
}
const safeArray = (value) => Array.isArray(value) ? value : []
const safeUserId = (value) => value == null ? '' : String(value)

export const buildMonthlyActivity = (entries = [], referenceDate = new Date(), months = 6) => {
  const counts = safeArray(entries).reduce((result, entry) => {
    const match = String(entry?.fechaVista ?? '').match(MONTH_PATTERN)
    if (!match) return result
    const key = `${match[1]}-${match[2]}`
    result.set(key, (result.get(key) ?? 0) + 1)
    return result
  }, new Map())
  const referenceMonth = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1))
  return Array.from({ length: months }, (_, index) => {
    const key = monthKey(addMonths(referenceMonth, index - months + 1))
    return { month: key, label: labelMonth(key), count: counts.get(key) ?? 0 }
  })
}

export const buildBaselineForecast = (monthlyActivity = []) => {
  const history = safeArray(monthlyActivity)
  const recent = history.slice(-3).map(({ count }) => Math.max(0, Number(count) || 0))
  const baseline = recent.length ? recent.reduce((sum, count) => sum + count, 0) / recent.length : 0
  const slope = recent.length > 1 ? (recent.at(-1) - recent[0]) / (recent.length - 1) : 0
  const lastMonth = history.at(-1)?.month
  if (!lastMonth) return []
  const [year, month] = lastMonth.split('-').map(Number)
  const lastDate = new Date(Date.UTC(year, month - 1, 1))

  return Array.from({ length: 3 }, (_, index) => {
    const key = monthKey(addMonths(lastDate, index + 1))
    return { month: key, label: labelMonth(key), count: Math.max(0, Math.round(baseline + slope * (index + 1))) }
  })
}

export const buildAdminAnalytics = (data = {}, referenceDate = new Date()) => {
  const users = safeArray(data.users)
  const diaryEntries = safeArray(data.diaryEntries)
  const favorites = safeArray(data.favorites)
  const lists = safeArray(data.lists)
  const listMovies = safeArray(data.listMovies)
  const totalUsers = users.length
  const monthlyActivity = buildMonthlyActivity(diaryEntries, referenceDate)
  const baselineForecast = buildBaselineForecast(monthlyActivity)
  const activeMonths = monthlyActivity.filter(({ count }) => count > 0).length
  const totalRecorded = monthlyActivity.reduce((sum, { count }) => sum + count, 0)
  const confidence = activeMonths >= 4 && totalRecorded >= 12 ? 'high' : activeMonths >= 2 && totalRecorded >= 4 ? 'medium' : 'low'
  const userIds = new Set(users.map(({ id }) => safeUserId(id)).filter(Boolean))
  const uniqueUsers = (records, key = 'usuarioId') => new Set(records.map((record) => safeUserId(record?.[key])).filter((id) => userIds.has(id))).size
  const ratings = diaryEntries.map(({ calificacion }) => Number(calificacion)).filter((rating) => rating >= 1 && rating <= 10)
  const ratingDistribution = [
    { label: '1–4', count: ratings.filter((rating) => rating <= 4).length, type: 'low' },
    { label: '5–7', count: ratings.filter((rating) => rating >= 5 && rating <= 7).length, type: 'medium' },
    { label: '8–10', count: ratings.filter((rating) => rating >= 8).length, type: 'high' },
  ]
  const listOwnerById = new Map(lists.map(({ id, usuarioId }) => [safeUserId(id), safeUserId(usuarioId)]))
  const usersWithListMovies = new Set(listMovies.map(({ listaId }) => listOwnerById.get(safeUserId(listaId))).filter((id) => userIds.has(id))).size
  const adoption = [
    { label: 'Quiz completado', count: users.filter(({ personalizationCompleted }) => personalizationCompleted).length },
    { label: 'Usaron el diario', count: uniqueUsers(diaryEntries) },
    { label: 'Guardaron favoritos', count: uniqueUsers(favorites) },
    { label: 'Añadieron a listas', count: usersWithListMovies },
  ].map((item) => ({ ...item, percent: totalUsers ? Math.round(item.count / totalUsers * 100) : 0 }))

  return {
    totals: {
      users: totalUsers,
      diaryEntries: diaryEntries.length,
      favorites: favorites.length,
      lists: lists.length,
      listMovies: listMovies.length,
    },
    monthlyActivity,
    baselineForecast,
    forecastConfidence: confidence,
    adoption,
    ratingDistribution,
  }
}

export const buildAdminProjectionInput = (analytics) => ({
  totals: analytics.totals,
  monthlyActivity: analytics.monthlyActivity.map(({ month, count }) => ({ month, count })),
  baselineForecast: analytics.baselineForecast.map(({ month, count }) => ({ month, count })),
  adoption: analytics.adoption.map(({ label, count, percent }) => ({ label, count, percent })),
  baselineConfidence: analytics.forecastConfidence,
})
