import assert from 'node:assert/strict'
import test from 'node:test'
import { generatePersonalRecommendationChat, validatePersonalGeminiKey } from '../../server/ai/operations/recommendationChat.mjs'

const request = {
  schemaVersion: 'recommendation-chat-v1', requestId: 'request_personal_01', sessionId: 'session_personal_01', message: 'Quiero ciencia ficción', history: [],
  context: { turn: 0, filters: {}, shownMovieIds: [], candidates: [] },
}

test('usa la clave personal sólo como configuración del proveedor', async () => {
  let observed
  const provider = { generate: async (input, config) => {
    observed = { input, config }
    return { schemaVersion: 'recommendation-chat-v1', requestId: request.requestId, action: 'new-search', reply: 'Buscaré ciencia ficción.', filtersPatch: { genres: ['878'] }, clearFilters: [], targetMovieId: 0, suggestedReplies: [] }
  } }
  const apiKey = 'AIza_personal_test_key_123456789'
  const result = await generatePersonalRecommendationChat(request, apiKey, { provider, model: 'gemini-test', timeoutMs: 1_000 })
  assert.equal(result.action, 'new-search')
  assert.equal(observed.config.apiKey, apiKey)
  assert.equal(observed.input.prompt.includes(apiKey), false)
  assert.equal(observed.input.prompt.includes(request.message), true)
})

test('rechaza una clave personal inválida', () => {
  assert.throws(() => validatePersonalGeminiKey('corta'), { type: 'configuration' })
})
