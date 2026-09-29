import { listUserDiaryEntries } from './diaryService.js'
import { listCustomLists, listFavorites, listWatchlist } from './libraryService.js'

export class StatisticsServiceError extends Error {
  constructor(type, cause) {
    super(type)
    this.name = 'StatisticsServiceError'
    this.type = type
    this.cause = cause
  }
}

export const getUserStatisticsActivity = async (userId) => {
  try {
    const [diaryEntries, favorites, watchlist, customLists] = await Promise.all([
      listUserDiaryEntries(userId),
      listFavorites(userId),
      listWatchlist(userId),
      listCustomLists(userId),
    ])
    return { diaryEntries, favorites, watchlist, customLists }
  } catch (error) {
    throw new StatisticsServiceError(error?.type === 'network' ? 'network' : 'request', error)
  }
}

export const getStatisticsErrorMessage = (error) => (
  error?.type === 'network'
    ? 'No pudimos conectar con JSON Server. Comprueba que esté activo e inténtalo de nuevo.'
    : 'No pudimos cargar tus estadísticas. Inténtalo de nuevo.'
)
