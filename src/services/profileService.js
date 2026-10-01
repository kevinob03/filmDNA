import { normalizeProfileFields, toProfileUser } from '../modules/profile/profileModel.js'

const DEFAULT_API_URL = 'http://localhost:3001'
const configuredApiUrl = import.meta.env?.VITE_API_URL?.trim()
const DEFAULT_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '')

export class ProfileServiceError extends Error {
  constructor(type, status) {
    super(type)
    this.name = 'ProfileServiceError'
    this.type = type
    this.status = status
  }
}

export class AccountDeletionError extends Error {
  constructor(cause) {
    super('delete-account-failed', { cause })
    this.name = 'AccountDeletionError'
    this.type = 'delete-account-failed'
  }
}

export const createProfileService = (baseUrl = DEFAULT_BASE_URL) => {
  const apiBaseUrl = baseUrl.replace(/\/+$/, '')
  const pendingUpdates = new Map()
  const request = async (endpoint, options = {}) => {
    let response
    try {
      response = await fetch(`${apiBaseUrl}${endpoint}`, { ...options, headers: { Accept: 'application/json', ...options.headers } })
    } catch {
      throw new ProfileServiceError('network')
    }
    if (!response.ok) throw new ProfileServiceError(response.status === 404 ? 'not-found' : 'request', response.status)
    if (response.status === 204) return null
    try { return await response.json() } catch { throw new ProfileServiceError('invalid-response', response.status) }
  }
  const queryByUser = (collection, userId) => request(`/${collection}?usuarioId=${encodeURIComponent(userId)}`)
  const deleteRecords = (collection, records) => Promise.all(records.map(({ id }) => (
    request(`/${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' })
  )))
  return {
    async getUser(userId) {
      const user = await request(`/usuarios/${encodeURIComponent(userId)}`)
      if (!user || typeof user !== 'object' || Array.isArray(user)) throw new ProfileServiceError('invalid-response')
      return toProfileUser(user)
    },
    updateUser(userId, fields) {
      const key = String(userId)
      if (pendingUpdates.has(key)) return pendingUpdates.get(key)
      const payload = normalizeProfileFields(fields)
      const operation = request(`/usuarios/${encodeURIComponent(userId)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      }).then(toProfileUser).finally(() => pendingUpdates.delete(key))
      pendingUpdates.set(key, operation)
      return operation
    },
    async deleteAccount(userId) {
      const normalizedUserId = String(userId)
      try {
        const lists = await queryByUser('listas', normalizedUserId)

        for (const list of lists) {
          const relations = await request(`/listaPeliculas?listaId=${encodeURIComponent(list.id)}`)
          await deleteRecords('listaPeliculas', relations)
        }

        await deleteRecords('listas', lists)
        await deleteRecords('diario', await queryByUser('diario', normalizedUserId))
        await deleteRecords('favoritos', await queryByUser('favoritos', normalizedUserId))
        const [emotionalRecords, assignmentsAsUser, assignmentsAsPsychologist, auditAsUser, auditAsPsychologist, proposalsAsUser, proposalsAsPsychologist] = await Promise.all([
          queryByUser('registrosEmocionales', normalizedUserId),
          queryByUser('asignacionesPsicologicas', normalizedUserId),
          request('/asignacionesPsicologicas?psicologoId=' + encodeURIComponent(normalizedUserId)),
          queryByUser('auditoriaCinematerapia', normalizedUserId),
          request('/auditoriaCinematerapia?psicologoId=' + encodeURIComponent(normalizedUserId)),
          queryByUser('propuestasCinematerapia', normalizedUserId),
          request('/propuestasCinematerapia?psicologoId=' + encodeURIComponent(normalizedUserId)),
        ])
        const uniqueAssignments = [...new Map([...assignmentsAsUser, ...assignmentsAsPsychologist].map((item) => [String(item.id), item])).values()]
        const uniqueAuditEvents = [...new Map([...auditAsUser, ...auditAsPsychologist].map((item) => [String(item.id), item])).values()]
        const uniqueProposals = [...new Map([...proposalsAsUser, ...proposalsAsPsychologist].map((item) => [String(item.id), item])).values()]
        await deleteRecords('registrosEmocionales', emotionalRecords)
        await deleteRecords('asignacionesPsicologicas', uniqueAssignments)
        const anonymizedAt = new Date().toISOString()
        await Promise.all(uniqueProposals.map((proposal) => {
          const changes = { emotionalRecordId: null, emotionSnapshot: null, anonymizedAt }
          if (String(proposal.usuarioId) === normalizedUserId) changes.usuarioId = null
          if (String(proposal.psicologoId) === normalizedUserId) changes.psicologoId = null
          return request('/propuestasCinematerapia/' + encodeURIComponent(proposal.id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) })
        }))
        await Promise.all(uniqueAuditEvents.map((event) => {
          const changes = { anonymizedAt }
          if (String(event.usuarioId) === normalizedUserId) changes.usuarioId = null
          if (String(event.psicologoId) === normalizedUserId) changes.psicologoId = null
          return request('/auditoriaCinematerapia/' + encodeURIComponent(event.id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) })
        }))
        await request(`/usuarios/${encodeURIComponent(normalizedUserId)}`, { method: 'DELETE' })
      } catch (error) {
        // JSON Server no ofrece transacciones: un fallo puede dejar una limpieza parcial.
        // La operación es reintentable y el usuario se elimina al final para conservar la sesión ante fallos previos.
        throw new AccountDeletionError(error)
      }
    },
  }
}

const service = createProfileService()
export const getProfileUser = service.getUser
export const updateProfileUser = service.updateUser
export const deleteProfileAccount = service.deleteAccount

export const getProfileErrorMessage = (error) => {
  if (error?.type === 'network') return 'No pudimos conectar con JSON Server. Comprueba que esté activo e inténtalo de nuevo.'
  if (error?.type === 'invalid-name') return 'Escribe un nombre válido de hasta 80 caracteres.'
  if (error?.type === 'invalid-bio') return 'La bio puede tener hasta 160 caracteres.'
  if (error?.type === 'invalid-avatar') return 'Selecciona un avatar válido.'
  if (error?.type === 'invalid-avatar-image') return 'La foto no tiene un formato o tamaño válido.'
  if (error?.type === 'invalid-genres') return 'Selecciona hasta 5 géneros válidos.'
  if (error?.type === 'not-found') return 'La cuenta ya no está disponible.'
  if (error?.type === 'delete-account-failed') return 'No pudimos completar la eliminación. Tu sesión sigue activa; inténtalo de nuevo.'
  return 'No pudimos guardar tu perfil. Inténtalo de nuevo.'
}
