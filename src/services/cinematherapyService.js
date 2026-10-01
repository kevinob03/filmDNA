const DEFAULT_API_URL = 'http://localhost:3001'
const configuredApiUrl = import.meta.env?.VITE_API_URL?.trim()
const DEFAULT_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '')
const ACTIVE_STATUS = 'active'
const REVOKED_STATUS = 'revoked'

export class CinematherapyServiceError extends Error {
  constructor(type, status) {
    super(type)
    this.name = 'CinematherapyServiceError'
    this.type = type
    this.status = status
  }
}

const toPublicPsychologist = ({ id, nombre }) => ({ id, nombre })
const toPublicCase = (assignment, user) => ({
  assignmentId: assignment.id,
  userId: user.id,
  nombre: user.nombre,
  consentedAt: assignment.consentedAt,
  scopes: [...assignment.scopes],
})

export const createCinematherapyService = (baseUrl = DEFAULT_BASE_URL) => {
  const apiBaseUrl = baseUrl.replace(/\/+$/, '')
  const request = async (endpoint, options = {}) => {
    let response
    try {
      response = await fetch(apiBaseUrl + endpoint, { ...options, headers: { Accept: 'application/json', ...options.headers } })
    } catch {
      throw new CinematherapyServiceError('network')
    }
    if (!response.ok) throw new CinematherapyServiceError('request', response.status)
    if (response.status === 204) return null
    try { return await response.json() } catch { throw new CinematherapyServiceError('invalid-response', response.status) }
  }
  const writeAuditEvent = (event) => request('/auditoriaCinematerapia', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  })

  return {
    async getUserSetup(userId) {
      const normalizedUserId = String(userId)
      const [psychologists, assignments] = await Promise.all([
        request('/usuarios?role=psychologist'),
        request('/asignacionesPsicologicas?usuarioId=' + encodeURIComponent(normalizedUserId)),
      ])
      return {
        psychologists: psychologists.map(toPublicPsychologist),
        assignment: assignments.find((item) => item.status === ACTIVE_STATUS) ?? null,
      }
    },

    async grantConsent({ userId, psychologistId, emotionalHistory, recommendations, aiProcessing }) {
      if (!emotionalHistory || !recommendations || !aiProcessing) throw new CinematherapyServiceError('consent-required')
      const normalizedUserId = String(userId)
      const normalizedPsychologistId = String(psychologistId)
      const [psychologist, assignments] = await Promise.all([
        request('/usuarios/' + encodeURIComponent(normalizedPsychologistId)),
        request('/asignacionesPsicologicas?usuarioId=' + encodeURIComponent(normalizedUserId)),
      ])
      if (psychologist.role !== 'psychologist') throw new CinematherapyServiceError('invalid-psychologist')
      const timestamp = new Date().toISOString()
      const activeAssignments = assignments.filter((item) => item.status === ACTIVE_STATUS)
      await Promise.all(activeAssignments.map((item) => request('/asignacionesPsicologicas/' + encodeURIComponent(item.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: REVOKED_STATUS, revokedAt: timestamp }),
      })))
      const assignment = await request('/asignacionesPsicologicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: normalizedUserId,
          psicologoId: normalizedPsychologistId,
          status: ACTIVE_STATUS,
          scopes: ['emotional-history', 'movie-recommendations', 'external-ai-processing'],
          consentedAt: timestamp,
          revokedAt: null,
        }),
      })
      await writeAuditEvent({ assignmentId: assignment.id, usuarioId: normalizedUserId, psicologoId: normalizedPsychologistId, action: 'consent-granted', occurredAt: timestamp })
      return assignment
    },

    async revokeConsent(assignment) {
      if (!assignment?.id || assignment.status !== ACTIVE_STATUS) throw new CinematherapyServiceError('not-active')
      const timestamp = new Date().toISOString()
      const revoked = await request('/asignacionesPsicologicas/' + encodeURIComponent(assignment.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: REVOKED_STATUS, revokedAt: timestamp }),
      })
      await writeAuditEvent({ assignmentId: assignment.id, usuarioId: assignment.usuarioId, psicologoId: assignment.psicologoId, action: 'consent-revoked', occurredAt: timestamp })
      return revoked
    },

    async listAssignedCases(psychologistId) {
      const endpoint = '/asignacionesPsicologicas?psicologoId=' + encodeURIComponent(String(psychologistId)) + '&status=' + ACTIVE_STATUS
      const assignments = await request(endpoint)
      const users = await Promise.all(assignments.map((assignment) => request('/usuarios/' + encodeURIComponent(assignment.usuarioId))))
      return assignments.flatMap((assignment, index) => users[index]?.role === 'usuario' ? [toPublicCase(assignment, users[index])] : [])
    },
  }
}

const service = createCinematherapyService()
export const getUserCinematherapySetup = (userId) => service.getUserSetup(userId)
export const grantCinematherapyConsent = (values) => service.grantConsent(values)
export const revokeCinematherapyConsent = (assignment) => service.revokeConsent(assignment)
export const listPsychologistCases = (psychologistId) => service.listAssignedCases(psychologistId)

export const getCinematherapyErrorMessage = (error) => {
  if (error?.type === 'consent-required') return 'Debes aceptar todos los permisos para activar el acompañamiento con IA.'
  if (error?.type === 'invalid-psychologist') return 'La cuenta seleccionada no corresponde a un psicólogo.'
  if (error?.type === 'network') return 'No pudimos conectar con el servicio local.'
  return 'No pudimos completar la solicitud. Inténtalo de nuevo.'
}
