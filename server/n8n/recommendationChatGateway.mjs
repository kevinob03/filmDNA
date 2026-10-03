import {
  RECOMMENDATION_CHAT_SCHEMA_VERSION,
  validateRecommendationChatExchange,
  validateRecommendationChatRequest,
  validateRecommendationChatResponse,
} from '../../src/services/recommendations/recommendationChatContract.js'

const DEFAULT_TIMEOUT_MS = 30_000
const MIN_TIMEOUT_MS = 1_000
const MAX_TIMEOUT_MS = 45_000
const MAX_RESPONSE_BYTES = 64 * 1024
const RATE_LIMIT = 12
const RATE_WINDOW_MS = 60_000
const MAX_RATE_LIMIT_ENTRIES = 1_000
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'host.docker.internal'])

export class RecommendationChatGatewayError extends Error {
  constructor(type, { cause = null, requestId = null } = {}) {
    super(type)
    this.name = 'RecommendationChatGatewayError'
    this.type = type
    this.cause = cause
    this.requestId = requestId
  }
}

export const createRecommendationChatRateLimiter = ({
  limit = RATE_LIMIT,
  windowMs = RATE_WINDOW_MS,
  now = Date.now,
} = {}) => {
  const entries = new Map()
  return {
    consume(key) {
      const timestamp = now()
      if (entries.size >= MAX_RATE_LIMIT_ENTRIES && !entries.has(key)) {
        for (const [entryKey, entry] of entries) {
          if (timestamp >= entry.resetAt) entries.delete(entryKey)
        }
        if (entries.size >= MAX_RATE_LIMIT_ENTRIES) entries.delete(entries.keys().next().value)
      }
      const current = entries.get(key)
      if (!current || timestamp >= current.resetAt) {
        entries.set(key, { count: 1, resetAt: timestamp + windowMs })
        return
      }
      if (current.count >= limit) throw new RecommendationChatGatewayError('rate-limited')
      current.count += 1
    },
    clear() {
      entries.clear()
    },
  }
}

const defaultRateLimiter = createRecommendationChatRateLimiter()

const getConfiguration = (env) => {
  const rawUrl = env.N8N_RECOMMENDATION_WEBHOOK_URL?.trim()
  const secret = env.N8N_RECOMMENDATION_WEBHOOK_SECRET?.trim()
  if (!rawUrl || !secret || secret.length < 12) throw new RecommendationChatGatewayError('configuration')

  let url
  try {
    url = new URL(rawUrl)
  } catch (cause) {
    throw new RecommendationChatGatewayError('configuration', { cause })
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new RecommendationChatGatewayError('configuration')
  if (url.username || url.password) throw new RecommendationChatGatewayError('configuration')
  if (url.protocol !== 'https:' && !LOCAL_HOSTS.has(url.hostname)) {
    throw new RecommendationChatGatewayError('configuration')
  }

  const configuredTimeout = Number(env.N8N_RECOMMENDATION_TIMEOUT_MS)
  const timeoutMs = Number.isFinite(configuredTimeout)
    ? Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, configuredTimeout))
    : DEFAULT_TIMEOUT_MS
  return { url: url.toString(), secret, timeoutMs }
}

const readUpstreamJson = async (response, requestId) => {
  const contentLength = Number(response.headers?.get?.('content-length'))
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
    throw new RecommendationChatGatewayError('invalid-response', { requestId })
  }

  let text
  try {
    text = await response.text()
  } catch (cause) {
    throw new RecommendationChatGatewayError('invalid-response', { cause, requestId })
  }
  if (Buffer.byteLength(text, 'utf8') > MAX_RESPONSE_BYTES) {
    throw new RecommendationChatGatewayError('invalid-response', { requestId })
  }
  try {
    return JSON.parse(text)
  } catch (cause) {
    throw new RecommendationChatGatewayError('invalid-response', { cause, requestId })
  }
}

export const forwardRecommendationChat = async (payload, {
  env = process.env,
  fetchImpl = globalThis.fetch,
  rateLimiter = defaultRateLimiter,
  clientKey = 'local',
} = {}) => {
  let request
  try {
    request = validateRecommendationChatRequest(payload)
  } catch (cause) {
    throw new RecommendationChatGatewayError('invalid-request', { cause })
  }

  try {
    rateLimiter.consume(`${clientKey}:${request.sessionId}`)
  } catch (cause) {
    throw new RecommendationChatGatewayError('rate-limited', { cause, requestId: request.requestId })
  }

  let configuration
  try {
    configuration = getConfiguration(env)
  } catch (cause) {
    throw new RecommendationChatGatewayError('configuration', { cause, requestId: request.requestId })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), configuration.timeoutMs)
  let response
  try {
    response = await fetchImpl(configuration.url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-FilmDNA-Webhook-Secret': configuration.secret,
      },
      body: JSON.stringify(request),
      redirect: 'error',
      signal: controller.signal,
    })
  } catch (cause) {
    const type = controller.signal.aborted || cause?.name === 'AbortError' ? 'timeout' : 'unavailable'
    throw new RecommendationChatGatewayError(type, { cause, requestId: request.requestId })
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    const type = response.status === 429 ? 'rate-limited' : response.status === 504 ? 'timeout' : 'unavailable'
    throw new RecommendationChatGatewayError(type, { requestId: request.requestId })
  }

  const upstreamPayload = await readUpstreamJson(response, request.requestId)
  try {
    return validateRecommendationChatExchange(request, upstreamPayload).response
  } catch (cause) {
    throw new RecommendationChatGatewayError('invalid-response', { cause, requestId: request.requestId })
  }
}

const ERROR_MESSAGES = Object.freeze({
  configuration: 'El asistente de peliculas todavia no esta configurado.',
  'rate-limited': 'Has enviado varios mensajes. Espera un momento antes de continuar.',
  timeout: 'El asistente tardo demasiado. Puedes intentarlo nuevamente.',
  unavailable: 'El asistente no esta disponible temporalmente.',
  'invalid-response': 'El asistente devolvio una respuesta no valida.',
})

export const createRecommendationChatErrorResponse = (requestId, type) => validateRecommendationChatResponse({
  schemaVersion: RECOMMENDATION_CHAT_SCHEMA_VERSION,
  requestId,
  action: 'error',
  reply: ERROR_MESSAGES[type] || ERROR_MESSAGES.unavailable,
  filtersPatch: {},
  clearFilters: [],
  targetMovieId: null,
  suggestedReplies: ['Reintentar'],
})

export const recommendationChatErrorStatus = (type) => ({
  'invalid-request': 422,
  configuration: 503,
  'rate-limited': 429,
  timeout: 504,
  'invalid-response': 502,
  unavailable: 502,
}[type] || 502)
