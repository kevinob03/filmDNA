const DEFAULT_API_URL = 'http://localhost:3001'
const configuredApiUrl = import.meta.env?.VITE_API_URL?.trim()
const DEFAULT_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '')

export class AdminAnalyticsServiceError extends Error {
  constructor(type, status) {
    super(type)
    this.name = 'AdminAnalyticsServiceError'
    this.type = type
    this.status = status
  }
}

export const createAdminAnalyticsService = (baseUrl = DEFAULT_BASE_URL) => {
  const apiBaseUrl = baseUrl.replace(/\/+$/, '')

  const requestCollection = async (collection) => {
    let response
    try {
      response = await fetch(`${apiBaseUrl}/${collection}`, { headers: { Accept: 'application/json' } })
    } catch {
      throw new AdminAnalyticsServiceError('network')
    }
    if (!response.ok) throw new AdminAnalyticsServiceError('request', response.status)
    const data = await response.json()
    return Array.isArray(data) ? data : []
  }

  return {
    async getAnalyticsData() {
      const [usuarios, diario, favoritos, listas, listaPeliculas] = await Promise.all([
        requestCollection('usuarios'),
        requestCollection('diario'),
        requestCollection('favoritos'),
        requestCollection('listas'),
        requestCollection('listaPeliculas'),
      ])

      return {
        users: usuarios.map(({ id, role, personalizationCompleted }) => ({ id, role, personalizationCompleted: personalizationCompleted === true })),
        diaryEntries: diario.map(({ usuarioId, fechaVista, calificacion }) => ({ usuarioId, fechaVista, calificacion })),
        favorites: favoritos.map(({ usuarioId }) => ({ usuarioId })),
        lists: listas.map(({ id, usuarioId, tipo }) => ({ id, usuarioId, tipo })),
        listMovies: listaPeliculas.map(({ listaId }) => ({ listaId })),
      }
    },
  }
}

const service = createAdminAnalyticsService()
export const getAdminAnalyticsData = service.getAnalyticsData

export const getAdminAnalyticsErrorMessage = (error) => (
  error?.type === 'network'
    ? 'No pudimos conectar con JSON Server para calcular el dashboard.'
    : 'No pudimos cargar los datos analíticos del panel.'
)
