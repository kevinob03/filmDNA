import assert from 'node:assert/strict'
import test from 'node:test'
import { createAIServer } from '../../server/aiServer.mjs'
import { createRecommendationChatRateLimiter } from '../../server/n8n/recommendationChatGateway.mjs'

const validRequest = {
  schemaVersion: 'recommendation-chat-v1',
  requestId: 'request_endpoint_1',
  sessionId: 'session_endpoint_1',
  message: 'Quiero una pelicula de ciencia ficcion',
  history: [],
  context: {
    turn: 0,
    filters: {},
    shownMovieIds: [],
    candidates: [],
  },
}
const validResponse = {
  schemaVersion: 'recommendation-chat-v1',
  requestId: 'request_endpoint_1',
  action: 'refine',
  reply: 'Buscare ciencia ficcion.',
  filtersPatch: { genres: ['878'] },
  clearFilters: [],
  targetMovieId: null,
  suggestedReplies: ['Que sea reciente'],
}
const env = {
  N8N_RECOMMENDATION_WEBHOOK_URL: 'https://n8n.example.test/webhook/filmdna/recommendation-chat',
  N8N_RECOMMENDATION_WEBHOOK_SECRET: 'server-only-secret',
}

const startServer = async (recommendationChat) => {
  const server = createAIServer({ recommendationChat })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const { port } = server.address()
  return {
    server,
    url: `http://127.0.0.1:${port}/api/ai/recommendation-chat`,
  }
}

test('endpoint envia solicitudes validas y rechaza datos privados', async (context) => {
  let upstreamCalls = 0
  const { server, url } = await startServer({
    env,
    rateLimiter: createRecommendationChatRateLimiter(),
    fetchImpl: async () => {
      upstreamCalls += 1
      return new Response(JSON.stringify(validResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    },
  })
  context.after(() => new Promise((resolve) => server.close(resolve)))

  const success = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validRequest),
  })
  assert.equal(success.status, 200)
  assert.deepEqual(await success.json(), validResponse)

  const rejected = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...validRequest, email: 'private@example.com' }),
  })
  assert.equal(rejected.status, 422)
  assert.deepEqual(await rejected.json(), { error: 'invalid-request' })
  assert.equal(upstreamCalls, 1)
})

test('endpoint distingue JSON invalido, payload grande y falta de configuracion', async (context) => {
  const { server, url } = await startServer({
    env: {},
    rateLimiter: createRecommendationChatRateLimiter(),
    fetchImpl: async () => { throw new Error('must not run') },
  })
  context.after(() => new Promise((resolve) => server.close(resolve)))

  const malformed = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad-json',
  })
  assert.equal(malformed.status, 400)
  assert.deepEqual(await malformed.json(), { error: 'invalid-json' })

  const oversized = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'x'.repeat(70 * 1024) }),
  })
  assert.equal(oversized.status, 413)
  assert.deepEqual(await oversized.json(), { error: 'payload-too-large' })

  const unconfigured = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validRequest),
  })
  const result = await unconfigured.json()
  assert.equal(unconfigured.status, 503)
  assert.equal(result.action, 'error')
  assert.equal(result.requestId, validRequest.requestId)
  assert.doesNotMatch(JSON.stringify(result), /secret|webhook|n8n/i)
})

test('endpoint separa la clave personal del payload y omite n8n', async (context) => {
  let observed
  const { server, url } = await startServer({
    personalGenerate: async (payload, credentials) => {
      observed = { payload, credentials }
      return validResponse
    },
    fetchImpl: async () => { throw new Error('n8n no debe ejecutarse') },
  })
  context.after(() => new Promise((resolve) => server.close(resolve)))

  const apiKey = 'AIza_personal_endpoint_key_123456'
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-FilmDNA-AI-Provider': 'groq', 'X-FilmDNA-AI-Key': apiKey, 'X-FilmDNA-AI-Model': 'openai/gpt-oss-20b' },
    body: JSON.stringify(validRequest),
  })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), validResponse)
  assert.deepEqual(observed.credentials, { provider: 'groq', apiKey, model: 'openai/gpt-oss-20b' })
  assert.equal(Object.hasOwn(observed.payload, 'apiKey'), false)
})
