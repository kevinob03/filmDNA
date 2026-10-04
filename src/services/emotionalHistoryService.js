import { normalizeEmotionalRecord } from '../models/emotionalRecordModel.js'

const DEFAULT_API_URL = 'http://localhost:3001'
const configuredApiUrl = import.meta.env?.VITE_API_URL?.trim()
const DEFAULT_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '')

export class EmotionalHistoryServiceError extends Error {
  constructor(type, status) {
    super(type)
    this.name = 'EmotionalHistoryServiceError'
    this.type = type
    this.status = status
  }
}

const newestFirst = (records) => [...records].sort((left, right) => (
  new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
))

export const createEmotionalHistoryService = (baseUrl = DEFAULT_BASE_URL) => {
  const apiBaseUrl = baseUrl.replace(/\/+$/, '')
  const request = async (endpoint, options = {}) => {
    let response
    try {
      response = await fetch(apiBaseUrl + endpoint, { ...options, headers: { Accept: 'application/json', ...options.headers } })
    } catch {
      throw new EmotionalHistoryServiceError('network')
    }
    if (!response.ok) throw new EmotionalHistoryServiceError('request', response.status)
    if (response.status === 204) return null
    try { return await response.json() } catch { throw new EmotionalHistoryServiceError('invalid-response', response.status) }
  }

  const listByUser = async (userId) => {
    const records = await request('/registrosEmocionales?usuarioId=' + encodeURIComponent(String(userId)))
    return newestFirst(records)
  }

  return {
    listForUser: listByUser,
    async createForUser(userId, values) {
      const payload = normalizeEmotionalRecord(values)
      return request('/registrosEmocionales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: String(userId), ...payload, createdAt: new Date().toISOString() }),
      })
    },
    async listForPsychologist(psychologistId, userId) {
      const endpoint = '/asignacionesPsicologicas?psicologoId=' + encodeURIComponent(String(psychologistId))
        + '&usuarioId=' + encodeURIComponent(String(userId)) + '&status=active'
      const assignments = await request(endpoint)
      if (!assignments.length) throw new EmotionalHistoryServiceError('forbidden', 403)
      return listByUser(userId)
    },
  }
}

const service = createEmotionalHistoryService()
export const listUserEmotionalHistory = (userId) => service.listForUser(userId)
export const createUserEmotionalRecord = (userId, values) => service.createForUser(userId, values)
export const listAssignedUserEmotionalHistory = (psychologistId, userId) => service.listForPsychologist(psychologistId, userId)

export const getEmotionalHistoryErrorMessage = (error) => {
  if (error?.type === 'invalid-mood') return 'Selecciona cómo te sientes.'
  if (error?.type === 'invalid-intensity') return 'La intensidad debe estar entre 1 y 10.'
  if (error?.type === 'invalid-note') return 'La nota debe tener un máximo de 500 caracteres.'
  if (error?.type === 'forbidden') return 'Ya no tienes autorización para consultar este historial.'
  if (error?.type === 'network') return 'No pudimos conectar con el servicio local.'
  return 'No pudimos completar la solicitud. Inténtalo de nuevo.'
}
