const DEFAULT_API_URL = 'http://localhost:3001'
const configuredApiUrl = import.meta.env?.VITE_API_URL?.trim()
const DEFAULT_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '')

export class DiaryServiceError extends Error {
  constructor(type, status) {
    super(type)
    this.name = 'DiaryServiceError'
    this.type = type
    this.status = status
  }
}

const normalizeId = (value) => String(value)
const normalizeTmdbId = (value) => {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new DiaryServiceError('invalid-movie')
  return id
}

const normalizeEntry = ({ fechaVista, calificacion, resena }) => {
  const rating = Number(calificacion)
  const review = String(resena ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaVista ?? '')) throw new DiaryServiceError('invalid-date')
  if (!Number.isInteger(rating) || rating < 1 || rating > 10) throw new DiaryServiceError('invalid-rating')
  if (!review) throw new DiaryServiceError('invalid-review')
  return { fechaVista, calificacion: rating, resena: review }
}

export const createDiaryService = (baseUrl = DEFAULT_BASE_URL) => {
  const apiBaseUrl = baseUrl.replace(/\/+$/, '')

  const request = async (endpoint, options = {}) => {
    let response
    try {
      response = await fetch(`${apiBaseUrl}${endpoint}`, {
        ...options,
        headers: { Accept: 'application/json', ...options.headers },
      })
    } catch {
      throw new DiaryServiceError('network')
    }
    if (!response.ok) throw new DiaryServiceError('request', response.status)
    if (response.status === 204) return null
    try {
      return await response.json()
    } catch {
      throw new DiaryServiceError('invalid-response', response.status)
    }
  }

  return {
    async createEntry(userId, tmdbId, entry) {
      const payload = {
        usuarioId: normalizeId(userId),
        tmdbId: normalizeTmdbId(tmdbId),
        ...normalizeEntry(entry),
      }
      const created = await request('/diario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!created || typeof created !== 'object' || Array.isArray(created)) throw new DiaryServiceError('invalid-response')
      return created
    },

    async listUserEntries(userId) {
      const params = new URLSearchParams({ usuarioId: normalizeId(userId) })
      const entries = await request(`/diario?${params}`)
      if (!Array.isArray(entries)) throw new DiaryServiceError('invalid-response')
      return entries.sort((left, right) => String(right.fechaVista ?? '').localeCompare(String(left.fechaVista ?? '')))
    },
  }
}

const service = createDiaryService()
export const createDiaryEntry = service.createEntry
export const listUserDiaryEntries = service.listUserEntries

export const getDiaryErrorMessage = (error) => {
  if (error?.type === 'network') return 'No pudimos conectar con JSON Server. Comprueba que esté activo e inténtalo de nuevo.'
  if (error?.type === 'invalid-date') return 'Selecciona una fecha válida.'
  if (error?.type === 'invalid-rating') return 'Selecciona una calificación entera entre 1 y 10.'
  if (error?.type === 'invalid-review') return 'Escribe una reseña.'
  if (error?.type === 'invalid-response') return 'El servidor devolvió una respuesta inesperada.'
  return 'No pudimos completar la operación. Inténtalo de nuevo.'
}
