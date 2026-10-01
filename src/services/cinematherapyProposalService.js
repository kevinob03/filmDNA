import { requestCinematherapyDraft } from './aiClient.js'
import { discoverMovies } from './tmdbService.js'

const DEFAULT_API_URL = 'http://localhost:3001'
const configuredApiUrl = import.meta.env?.VITE_API_URL?.trim()
const DEFAULT_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '')
const REVIEW_STATUSES = new Set(['approved', 'rejected'])

export class CinematherapyProposalServiceError extends Error {
  constructor(type, status) {
    super(type)
    this.name = 'CinematherapyProposalServiceError'
    this.type = type
    this.status = status
  }
}

const newestFirst = (records, field = 'generatedAt') => [...records].sort((left, right) => new Date(right[field]).getTime() - new Date(left[field]).getTime())

export const createCinematherapyProposalService = (baseUrl = DEFAULT_BASE_URL) => {
  const apiBaseUrl = baseUrl.replace(/\/+$/, '')
  const request = async (endpoint, options = {}) => {
    let response
    try {
      response = await fetch(apiBaseUrl + endpoint, { ...options, headers: { Accept: 'application/json', ...options.headers } })
    } catch {
      throw new CinematherapyProposalServiceError('network')
    }
    if (!response.ok) throw new CinematherapyProposalServiceError('request', response.status)
    if (response.status === 204) return null
    try { return await response.json() } catch { throw new CinematherapyProposalServiceError('invalid-response', response.status) }
  }

  const getActiveAssignment = async (psychologistId, userId, requireAI = false) => {
    const endpoint = '/asignacionesPsicologicas?psicologoId=' + encodeURIComponent(String(psychologistId))
      + '&usuarioId=' + encodeURIComponent(String(userId)) + '&status=active'
    const assignments = await request(endpoint)
    const assignment = assignments[0]
    if (!assignment) throw new CinematherapyProposalServiceError('forbidden', 403)
    if (requireAI && !assignment.scopes?.includes('external-ai-processing')) {
      throw new CinematherapyProposalServiceError('ai-consent-required', 403)
    }
    return assignment
  }

  const writeAuditEvent = (event) => request('/auditoriaCinematerapia', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  })

  return {
    async createDraft(psychologistId, userId) {
      const assignment = await getActiveAssignment(psychologistId, userId, true)
      const [records, profile] = await Promise.all([
        request('/registrosEmocionales?usuarioId=' + encodeURIComponent(String(userId))),
        request('/usuarios/' + encodeURIComponent(String(userId))),
      ])
      const latestRecord = newestFirst(records, 'createdAt')[0]
      if (!latestRecord) throw new CinematherapyProposalServiceError('no-emotional-record')
      const favoriteGenres = Array.isArray(profile.favoriteGenres) ? profile.favoriteGenres.map(Number).filter(Number.isInteger).slice(0, 5) : []
      const catalog = await discoverMovies({
        ...(favoriteGenres.length ? { with_genres: favoriteGenres.join(',') } : {}),
        'vote_average.gte': 6,
        sort_by: 'popularity.desc',
      })
      const sourceMovies = (catalog.results || []).filter((movie) => Number.isInteger(Number(movie.id)) && movie.title).slice(0, 10)
      if (sourceMovies.length < 3) throw new CinematherapyProposalServiceError('insufficient-candidates')

      const candidates = sourceMovies.map((movie) => ({
        tmdbId: Number(movie.id),
        title: movie.title,
        overview: movie.overview || '',
        genres: (movie.genre_ids || []).map(String),
        voteAverage: Number(movie.vote_average) || null,
      }))
      let aiResponse
      try {
        aiResponse = await requestCinematherapyDraft({
          emotion: { mood: latestRecord.mood, intensity: latestRecord.intensity },
          favoriteGenres,
          candidates,
        })
      } catch {
        throw new CinematherapyProposalServiceError('ai-unavailable')
      }
      const result = aiResponse?.result
      if (!result || !Array.isArray(result.recommendations) || result.recommendations.length !== 3) throw new CinematherapyProposalServiceError('invalid-ai-response')
      const moviesById = new Map(sourceMovies.map((movie) => [Number(movie.id), movie]))
      const recommendations = result.recommendations.map((recommendation) => {
        const movie = moviesById.get(Number(recommendation.tmdbId))
        if (!movie) throw new CinematherapyProposalServiceError('invalid-ai-response')
        return {
          tmdbId: Number(movie.id),
          title: movie.title,
          posterPath: movie.poster_path || null,
          releaseDate: movie.release_date || null,
          voteAverage: Number(movie.vote_average) || null,
          rationale: recommendation.rationale,
          sensitivity: recommendation.sensitivity,
          sensitivityReasons: recommendation.sensitivityReasons,
        }
      })
      const timestamp = new Date().toISOString()
      const proposal = await request('/propuestasCinematerapia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: String(userId),
          psicologoId: String(psychologistId),
          assignmentId: assignment.id,
          emotionalRecordId: latestRecord.id,
          emotionSnapshot: { mood: latestRecord.mood, intensity: latestRecord.intensity },
          status: 'pending',
          summary: result.summary,
          recommendations,
          aiProvider: aiResponse.provider,
          aiModel: aiResponse.model,
          generatedAt: timestamp,
          reviewedAt: null,
          reviewNote: '',
        }),
      })
      await writeAuditEvent({ assignmentId: assignment.id, proposalId: proposal.id, usuarioId: String(userId), psicologoId: String(psychologistId), action: 'proposal-generated', occurredAt: timestamp })
      return proposal
    },

    async listForPsychologist(psychologistId, userId) {
      await getActiveAssignment(psychologistId, userId)
      const endpoint = '/propuestasCinematerapia?psicologoId=' + encodeURIComponent(String(psychologistId)) + '&usuarioId=' + encodeURIComponent(String(userId))
      return newestFirst(await request(endpoint))
    },

    async reviewProposal(psychologistId, proposalId, status, reviewNote = '') {
      if (!REVIEW_STATUSES.has(status)) throw new CinematherapyProposalServiceError('invalid-review')
      const proposal = await request('/propuestasCinematerapia/' + encodeURIComponent(String(proposalId)))
      if (String(proposal.psicologoId) !== String(psychologistId) || proposal.status !== 'pending') throw new CinematherapyProposalServiceError('forbidden', 403)
      const assignment = await getActiveAssignment(psychologistId, proposal.usuarioId)
      const timestamp = new Date().toISOString()
      const updated = await request('/propuestasCinematerapia/' + encodeURIComponent(String(proposalId)), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNote: String(reviewNote).trim().slice(0, 240), reviewedAt: timestamp }),
      })
      await writeAuditEvent({ assignmentId: assignment.id, proposalId: proposal.id, usuarioId: proposal.usuarioId, psicologoId: String(psychologistId), action: status === 'approved' ? 'proposal-approved' : 'proposal-rejected', occurredAt: timestamp })
      return updated
    },

    async listApprovedForUser(userId) {
      const endpoint = '/propuestasCinematerapia?usuarioId=' + encodeURIComponent(String(userId)) + '&status=approved'
      return newestFirst(await request(endpoint), 'reviewedAt')
    },
  }
}

const service = createCinematherapyProposalService()
export const createCinematherapyDraft = (psychologistId, userId) => service.createDraft(psychologistId, userId)
export const listPsychologistProposals = (psychologistId, userId) => service.listForPsychologist(psychologistId, userId)
export const reviewCinematherapyProposal = (psychologistId, proposalId, status, note) => service.reviewProposal(psychologistId, proposalId, status, note)
export const listApprovedCinematherapyProposals = (userId) => service.listApprovedForUser(userId)

export const getCinematherapyProposalErrorMessage = (error) => {
  if (error?.type === 'no-emotional-record') return 'El usuario debe crear al menos un registro emocional antes de generar una propuesta.'
  if (error?.type === 'insufficient-candidates') return 'No encontramos suficientes películas candidatas en TMDB.'
  if (error?.type === 'ai-consent-required') return 'El usuario todavía no autorizó el procesamiento mínimo por IA externa.'
  if (error?.type === 'forbidden') return 'El consentimiento ya no está activo para esta operación.'
  if (error?.type === 'ai-unavailable') return 'La IA no está disponible temporalmente. No se creó ninguna propuesta.'
  if (error?.type === 'invalid-review') return 'La decisión profesional no es válida.'
  if (error?.type === 'network') return 'No pudimos conectar con el servicio local.'
  return 'No pudimos completar la propuesta de cinematerapia.'
}
