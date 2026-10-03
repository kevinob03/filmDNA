import {
  SEARCH_FILTER_NAMES,
  SEARCH_INTENT_SCHEMA_VERSION,
  validateSearchIntent,
} from './searchIntentContract.js'

export const RECOMMENDATION_CHAT_SCHEMA_VERSION = 'recommendation-chat-v1'
export const RECOMMENDATION_CHAT_ACTIONS = Object.freeze([
  'new-search', 'clarify', 'refine', 'replace-one', 'explain', 'reset', 'error',
])
export const RECOMMENDATION_CHAT_LIMITS = Object.freeze({
  messageLength: 500,
  replyLength: 800,
  historyTurns: 6,
  shownMovieIds: 20,
  candidates: 5,
  candidateOverviewLength: 1_000,
  suggestedReplies: 4,
  suggestedReplyLength: 80,
  maxTurn: 50,
})
export const RECOMMENDATION_CHAT_FORBIDDEN_FIELDS = Object.freeze([
  'userId', 'email', 'password', 'emotionalHistory', 'psychologicalNotes', 'privateNotes',
])

const REQUEST_KEYS = ['schemaVersion', 'requestId', 'sessionId', 'message', 'history', 'context']
const CONTEXT_KEYS = ['turn', 'filters', 'shownMovieIds', 'candidates']
const HISTORY_KEYS = ['role', 'text']
const CANDIDATE_KEYS = [
  'tmdbId', 'title', 'overview', 'releaseYear', 'genreIds', 'runtime', 'voteAverage',
]
const RESPONSE_KEYS = [
  'schemaVersion', 'requestId', 'action', 'reply', 'filtersPatch',
  'clearFilters', 'targetMovieId', 'suggestedReplies',
]
const FILTER_ACTIONS = new Set(['new-search', 'refine'])
const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]{8,100}$/
const UNSAFE_CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/

export class RecommendationChatContractError extends Error {
  constructor(field = 'payload') {
    super('invalid-recommendation-chat-contract')
    this.name = 'RecommendationChatContractError'
    this.code = 'invalid-recommendation-chat-contract'
    this.field = field
  }
}

const invalid = (field) => {
  throw new RecommendationChatContractError(field)
}
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const assertAllowedKeys = (value, allowedKeys, field) => {
  if (!isPlainObject(value) || Object.keys(value).some((key) => !allowedKeys.includes(key))) invalid(field)
}
const cleanText = (value, { field, max, allowEmpty = false }) => {
  if (typeof value !== 'string' || UNSAFE_CONTROL_CHARACTERS.test(value)) invalid(field)
  const cleaned = value.trim()
  if ((!allowEmpty && !cleaned) || cleaned.length > max) invalid(field)
  return cleaned
}
const cleanSafeId = (value, field) => {
  if (typeof value !== 'string' || !SAFE_ID_PATTERN.test(value)) invalid(field)
  return value
}
const cleanPositiveInteger = (value, field, { allowNull = false } = {}) => {
  if (allowNull && value === null) return null
  if (!Number.isInteger(value) || value <= 0) invalid(field)
  return value
}
const cleanMovieIds = (value, { field, max }) => {
  if (!Array.isArray(value) || value.length > max) invalid(field)
  const ids = value.map((id) => cleanPositiveInteger(id, field))
  if (new Set(ids).size !== ids.length) invalid(field)
  return ids
}
const cleanFilters = (filters, field) => {
  if (!isPlainObject(filters)) invalid(field)
  try {
    return validateSearchIntent({
      schemaVersion: SEARCH_INTENT_SCHEMA_VERSION,
      filters,
      unmappedTerms: [],
      confidence: 1,
    }).filters
  } catch {
    return invalid(field)
  }
}

const cleanHistory = (history) => {
  if (!Array.isArray(history) || history.length > RECOMMENDATION_CHAT_LIMITS.historyTurns) invalid('history')
  const cleaned = history.map((turn, index) => {
    const field = `history[${index}]`
    assertAllowedKeys(turn, HISTORY_KEYS, field)
    if (!['user', 'assistant'].includes(turn.role)) invalid(`${field}.role`)
    return {
      role: turn.role,
      text: cleanText(turn.text, {
        field: `${field}.text`,
        max: turn.role === 'user'
          ? RECOMMENDATION_CHAT_LIMITS.messageLength
          : RECOMMENDATION_CHAT_LIMITS.replyLength,
      }),
    }
  })
  if (cleaned.some((turn, index) => turn.role !== (index % 2 === 0 ? 'user' : 'assistant'))) invalid('history')
  if (cleaned.length % 2 !== 0) invalid('history')
  return cleaned
}

const cleanCandidate = (candidate, index) => {
  const field = `context.candidates[${index}]`
  assertAllowedKeys(candidate, CANDIDATE_KEYS, field)
  if (!Array.isArray(candidate.genreIds) || candidate.genreIds.length > 12) invalid(`${field}.genreIds`)
  const genreIds = candidate.genreIds.map((id) => cleanPositiveInteger(id, `${field}.genreIds`))
  if (new Set(genreIds).size !== genreIds.length) invalid(`${field}.genreIds`)
  if (candidate.releaseYear !== null && (!Number.isInteger(candidate.releaseYear) || candidate.releaseYear < 1870 || candidate.releaseYear > 2200)) invalid(`${field}.releaseYear`)
  if (candidate.runtime !== null && (!Number.isInteger(candidate.runtime) || candidate.runtime <= 0 || candidate.runtime > 1_000)) invalid(`${field}.runtime`)
  if (candidate.voteAverage !== null && (typeof candidate.voteAverage !== 'number' || !Number.isFinite(candidate.voteAverage) || candidate.voteAverage < 0 || candidate.voteAverage > 10)) invalid(`${field}.voteAverage`)

  return {
    tmdbId: cleanPositiveInteger(candidate.tmdbId, `${field}.tmdbId`),
    title: cleanText(candidate.title, { field: `${field}.title`, max: 200 }),
    overview: cleanText(candidate.overview, {
      field: `${field}.overview`,
      max: RECOMMENDATION_CHAT_LIMITS.candidateOverviewLength,
      allowEmpty: true,
    }),
    releaseYear: candidate.releaseYear,
    genreIds,
    runtime: candidate.runtime,
    voteAverage: candidate.voteAverage === null ? null : Number(candidate.voteAverage.toFixed(1)),
  }
}

const cleanContext = (context) => {
  assertAllowedKeys(context, CONTEXT_KEYS, 'context')
  if (!Number.isInteger(context.turn) || context.turn < 0 || context.turn > RECOMMENDATION_CHAT_LIMITS.maxTurn) invalid('context.turn')
  if (!Array.isArray(context.candidates) || context.candidates.length > RECOMMENDATION_CHAT_LIMITS.candidates) invalid('context.candidates')
  const candidates = context.candidates.map(cleanCandidate)
  const candidateIds = candidates.map(({ tmdbId }) => tmdbId)
  if (new Set(candidateIds).size !== candidateIds.length) invalid('context.candidates')

  return {
    turn: context.turn,
    filters: cleanFilters(context.filters, 'context.filters'),
    shownMovieIds: cleanMovieIds(context.shownMovieIds, {
      field: 'context.shownMovieIds',
      max: RECOMMENDATION_CHAT_LIMITS.shownMovieIds,
    }),
    candidates,
  }
}

const cleanFilterNames = (value) => {
  if (!Array.isArray(value) || value.length > SEARCH_FILTER_NAMES.length) invalid('clearFilters')
  if (value.some((name) => typeof name !== 'string' || !SEARCH_FILTER_NAMES.includes(name))) invalid('clearFilters')
  if (new Set(value).size !== value.length) invalid('clearFilters')
  return [...value]
}

const cleanSuggestedReplies = (value) => {
  if (!Array.isArray(value) || value.length > RECOMMENDATION_CHAT_LIMITS.suggestedReplies) invalid('suggestedReplies')
  const replies = value.map((reply, index) => cleanText(reply, {
    field: `suggestedReplies[${index}]`,
    max: RECOMMENDATION_CHAT_LIMITS.suggestedReplyLength,
  }))
  if (new Set(replies.map((reply) => reply.toLocaleLowerCase())).size !== replies.length) invalid('suggestedReplies')
  return replies
}

export const validateRecommendationChatRequest = (payload) => {
  assertAllowedKeys(payload, REQUEST_KEYS, 'request')
  if (payload.schemaVersion !== RECOMMENDATION_CHAT_SCHEMA_VERSION) invalid('schemaVersion')

  return {
    schemaVersion: RECOMMENDATION_CHAT_SCHEMA_VERSION,
    requestId: cleanSafeId(payload.requestId, 'requestId'),
    sessionId: cleanSafeId(payload.sessionId, 'sessionId'),
    message: cleanText(payload.message, {
      field: 'message',
      max: RECOMMENDATION_CHAT_LIMITS.messageLength,
    }),
    history: cleanHistory(payload.history),
    context: cleanContext(payload.context),
  }
}

export const validateRecommendationChatResponse = (payload) => {
  assertAllowedKeys(payload, RESPONSE_KEYS, 'response')
  if (payload.schemaVersion !== RECOMMENDATION_CHAT_SCHEMA_VERSION) invalid('schemaVersion')
  if (!RECOMMENDATION_CHAT_ACTIONS.includes(payload.action)) invalid('action')

  const filtersPatch = cleanFilters(payload.filtersPatch, 'filtersPatch')
  const clearFilters = cleanFilterNames(payload.clearFilters)
  if (clearFilters.some((name) => Object.hasOwn(filtersPatch, name))) invalid('clearFilters')

  const changesFilters = Object.keys(filtersPatch).length > 0 || clearFilters.length > 0
  if (changesFilters && !FILTER_ACTIONS.has(payload.action)) invalid('action')
  if (FILTER_ACTIONS.has(payload.action) && !changesFilters) invalid('filtersPatch')

  const targetMovieId = cleanPositiveInteger(payload.targetMovieId, 'targetMovieId', { allowNull: true })
  if (payload.action === 'replace-one' && targetMovieId === null) invalid('targetMovieId')
  if (payload.action !== 'replace-one' && targetMovieId !== null) invalid('targetMovieId')

  return {
    schemaVersion: RECOMMENDATION_CHAT_SCHEMA_VERSION,
    requestId: cleanSafeId(payload.requestId, 'requestId'),
    action: payload.action,
    reply: cleanText(payload.reply, {
      field: 'reply',
      max: RECOMMENDATION_CHAT_LIMITS.replyLength,
    }),
    filtersPatch,
    clearFilters,
    targetMovieId,
    suggestedReplies: cleanSuggestedReplies(payload.suggestedReplies),
  }
}

export const validateRecommendationChatExchange = (requestPayload, responsePayload) => {
  const request = validateRecommendationChatRequest(requestPayload)
  const response = validateRecommendationChatResponse(responsePayload)
  if (response.requestId !== request.requestId) invalid('requestId')

  if (response.action === 'replace-one') {
    const candidateIds = new Set(request.context.candidates.map(({ tmdbId }) => tmdbId))
    if (!candidateIds.has(response.targetMovieId)) invalid('targetMovieId')
  }

  return { request, response }
}
