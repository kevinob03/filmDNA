import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createRecommendationChatErrorResponse,
  createRecommendationChatRateLimiter,
  forwardRecommendationChat,
  recommendationChatErrorStatus,
} from '../../server/n8n/recommendationChatGateway.mjs'

const env = {
  N8N_RECOMMENDATION_WEBHOOK_URL: 'https://n8n.example.test/webhook/filmdna/recommendation-chat',
  N8N_RECOMMENDATION_WEBHOOK_SECRET: 'server-only-secret',
  N8N_RECOMMENDATION_TIMEOUT_MS: '5000',
}
const request = (overrides = {}) => ({
  schemaVersion: 'recommendation-chat-v1',
  requestId: 'request_12345678',
  sessionId: 'session_12345678',
  message: 'Quiero una comedia corta',
  history: [],
  context: {
    turn: 0,
    filters: {},
    shownMovieIds: [101],
    candidates: [{
      tmdbId: 101,
      title: 'Pelicula real',
      overview: 'Sinopsis publica',
      releaseYear: 2024,
      genreIds: [35],
      runtime: 90,
      voteAverage: 7.5,
    }],
  },
  ...overrides,
})
const response = (overrides = {}) => ({
  schemaVersion: 'recommendation-chat-v1',
  requestId: 'request_12345678',
  action: 'refine',
  reply: 'Buscare comedias cortas.',
  filtersPatch: { genres: ['35'], duration: '90-120' },
  clearFilters: [],
  targetMovieId: null,
  suggestedReplies: ['Que sea reciente'],
  ...overrides,
})
const jsonResponse = (payload, init = {}) => new Response(JSON.stringify(payload), {
  status: 200,
  headers: { 'Content-Type': 'application/json', ...init.headers },
  ...init,
})
const freshLimiter = () => createRecommendationChatRateLimiter()

test('reenvia solo el contrato validado con secreto de servidor', async () => {
  let observed
  const result = await forwardRecommendationChat(request({ message: '  Quiero una comedia corta  ' }), {
    env,
    rateLimiter: freshLimiter(),
    fetchImpl: async (url, options) => {
      observed = { url, options }
      return jsonResponse(response())
    },
  })

  assert.equal(result.action, 'refine')
  assert.equal(observed.url, env.N8N_RECOMMENDATION_WEBHOOK_URL)
  assert.equal(observed.options.headers['X-FilmDNA-Webhook-Secret'], env.N8N_RECOMMENDATION_WEBHOOK_SECRET)
  assert.equal(JSON.parse(observed.options.body).message, 'Quiero una comedia corta')
  assert.equal(observed.options.redirect, 'error')
})

test('rechaza la solicitud antes de llamar a n8n', async () => {
  let calls = 0
  await assert.rejects(forwardRecommendationChat({ ...request(), email: 'private@example.com' }, {
    env,
    rateLimiter: freshLimiter(),
    fetchImpl: async () => {
      calls += 1
      return jsonResponse(response())
    },
  }), { type: 'invalid-request' })
  assert.equal(calls, 0)
})

test('exige HTTPS salvo para hosts locales de desarrollo', async () => {
  await assert.rejects(forwardRecommendationChat(request(), {
    env: { ...env, N8N_RECOMMENDATION_WEBHOOK_URL: 'http://remote.example.test/webhook' },
    rateLimiter: freshLimiter(),
    fetchImpl: async () => jsonResponse(response()),
  }), { type: 'configuration' })
  await assert.rejects(forwardRecommendationChat(request(), {
    env: { ...env, N8N_RECOMMENDATION_WEBHOOK_URL: 'https://user:password@n8n.example.test/webhook' },
    rateLimiter: freshLimiter(),
    fetchImpl: async () => jsonResponse(response()),
  }), { type: 'configuration' })

  await assert.doesNotReject(forwardRecommendationChat(request(), {
    env: { ...env, N8N_RECOMMENDATION_WEBHOOK_URL: 'http://localhost:5678/webhook/test' },
    rateLimiter: freshLimiter(),
    fetchImpl: async () => jsonResponse(response()),
  }))
})

test('rechaza respuestas inventadas o desvinculadas de la solicitud', async () => {
  await assert.rejects(forwardRecommendationChat(request(), {
    env,
    rateLimiter: freshLimiter(),
    fetchImpl: async () => jsonResponse({ ...response(), movies: [{ id: 999 }] }),
  }), { type: 'invalid-response' })
  await assert.rejects(forwardRecommendationChat(request(), {
    env,
    rateLimiter: freshLimiter(),
    fetchImpl: async () => jsonResponse(response({ requestId: 'request_different' })),
  }), { type: 'invalid-response' })
  await assert.rejects(forwardRecommendationChat(request(), {
    env,
    rateLimiter: freshLimiter(),
    fetchImpl: async () => jsonResponse(response({
      action: 'replace-one',
      filtersPatch: {},
      targetMovieId: 999,
    })),
  }), { type: 'invalid-response' })
})

test('convierte fallos de red, timeout y rate limit en errores controlados', async () => {
  await assert.rejects(forwardRecommendationChat(request(), {
    env,
    rateLimiter: freshLimiter(),
    fetchImpl: async () => { throw new Error('private network detail') },
  }), { type: 'unavailable', requestId: 'request_12345678' })
  await assert.rejects(forwardRecommendationChat(request(), {
    env,
    rateLimiter: freshLimiter(),
    fetchImpl: async () => {
      const error = new Error('aborted')
      error.name = 'AbortError'
      throw error
    },
  }), { type: 'timeout', requestId: 'request_12345678' })
  await assert.rejects(forwardRecommendationChat(request(), {
    env,
    rateLimiter: freshLimiter(),
    fetchImpl: async () => jsonResponse({}, { status: 429 }),
  }), { type: 'rate-limited', requestId: 'request_12345678' })
})

test('limita solicitudes por cliente y sesion dentro de la ventana', async () => {
  let now = 1_000
  const rateLimiter = createRecommendationChatRateLimiter({ limit: 1, windowMs: 100, now: () => now })
  const options = { env, rateLimiter, fetchImpl: async () => jsonResponse(response()) }
  await forwardRecommendationChat(request(), options)
  await assert.rejects(forwardRecommendationChat(request(), options), { type: 'rate-limited' })
  now += 101
  await assert.doesNotReject(forwardRecommendationChat(request(), options))
})

test('la respuesta publica de error no filtra detalles internos', () => {
  const result = createRecommendationChatErrorResponse('request_12345678', 'unavailable')
  assert.equal(result.action, 'error')
  assert.equal(result.targetMovieId, null)
  assert.doesNotMatch(JSON.stringify(result), /n8n|secret|webhook/i)
  assert.equal(recommendationChatErrorStatus('timeout'), 504)
  assert.equal(recommendationChatErrorStatus('invalid-request'), 422)
})
