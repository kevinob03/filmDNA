import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'
import { getConfiguredProviders, runAIOperation } from './ai/orchestrator.mjs'
import { toPublicAIError } from './ai/errors.mjs'
import { movieDNAOperation } from './ai/operations/movieDNA.mjs'
import { classifyMoviesOperation } from './ai/operations/classifyMovies.mjs'
import { interpretSearchIntentOperation } from './ai/operations/interpretSearchIntent.mjs'
import { cinematherapyDraftOperation } from './ai/operations/cinematherapyDraft.mjs'
import {
  createRecommendationChatErrorResponse,
  forwardRecommendationChat,
  recommendationChatErrorStatus,
} from './n8n/recommendationChatGateway.mjs'
import { generatePersonalRecommendationChat } from './ai/operations/recommendationChat.mjs'

const PORT = Number(process.env.AI_SERVER_PORT) || 3002
const MAX_BODY_BYTES = 64 * 1024

const sendJson = (response, status, payload) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(payload))
}

const readJsonBody = async (request) => {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw new Error('payload-too-large')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export const createAIServer = ({ recommendationChat = {} } = {}) => createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/api/ai/status') {
    const providers = getConfiguredProviders().map(({ provider }) => provider.name)
    sendJson(response, 200, { configured: providers.length > 0, providers })
    return
  }

  if (request.method === 'POST' && request.url === '/api/ai/recommendation-chat') {
    let body
    try {
      body = await readJsonBody(request)
    } catch (error) {
      const type = error?.message === 'payload-too-large' ? 'payload-too-large' : 'invalid-json'
      sendJson(response, type === 'payload-too-large' ? 413 : 400, { error: type })
      return
    }

    try {
      const personalApiKey = request.headers['x-filmdna-ai-key']
      const result = personalApiKey
        ? await (recommendationChat.personalGenerate || generatePersonalRecommendationChat)(body, {
          provider: request.headers['x-filmdna-ai-provider'],
          apiKey: personalApiKey,
          model: request.headers['x-filmdna-ai-model'],
        })
        : await forwardRecommendationChat(body, {
          ...recommendationChat,
          clientKey: request.socket.remoteAddress || 'local',
        })
      sendJson(response, 200, result)
    } catch (error) {
      const type = error?.type || (error?.code === 'invalid-recommendation-chat-contract' ? 'invalid-request' : 'unavailable')
      const status = recommendationChatErrorStatus(type)
      const payload = error?.requestId
        ? createRecommendationChatErrorResponse(error.requestId, type)
        : { error: type }
      sendJson(response, status, payload)
    }
    return
  }

  if (request.method === 'POST' && request.url === '/api/ai/movie-dna') {
    try {
      const body = await readJsonBody(request)
      const generated = await runAIOperation(movieDNAOperation, body?.movie, { budgetMs: body?.budgetMs })
      sendJson(response, 200, generated)
    } catch (error) {
      const type = toPublicAIError(error)
      const status = type === 'configuration' ? 503 : type === 'rate-limited' ? 429 : type === 'timeout' ? 504 : 502
      sendJson(response, status, { error: type })
    }
    return
  }

  if (request.method === 'POST' && request.url === '/api/ai/classify-movies') {
    try {
      const body = await readJsonBody(request)
      const classified = await runAIOperation(classifyMoviesOperation, { movies: body?.movies }, { budgetMs: body?.budgetMs })
      sendJson(response, 200, classified)
    } catch (error) {
      const type = toPublicAIError(error)
      const status = type === 'configuration' ? 503 : type === 'rate-limited' ? 429 : type === 'timeout' ? 504 : type === 'invalid-schema' ? 422 : 502
      sendJson(response, status, { error: type })
    }
    return
  }

  if (request.method === 'POST' && request.url === '/api/ai/interpret-search') {
    try {
      const body = await readJsonBody(request)
      const intent = await runAIOperation(interpretSearchIntentOperation, { query: body?.query }, { budgetMs: body?.budgetMs })
      sendJson(response, 200, intent)
    } catch (error) {
      const type = toPublicAIError(error)
      const status = type === 'configuration' ? 503 : type === 'rate-limited' ? 429 : type === 'timeout' ? 504 : type === 'invalid-schema' ? 422 : 502
      sendJson(response, status, { error: type })
    }
    return
  }

  if (request.method === 'POST' && request.url === '/api/ai/cinematherapy-draft') {
    try {
      const body = await readJsonBody(request)
      const draft = await runAIOperation(cinematherapyDraftOperation, body?.input, { budgetMs: body?.budgetMs })
      sendJson(response, 200, draft)
    } catch (error) {
      const type = toPublicAIError(error)
      const status = type === 'configuration' ? 503 : type === 'rate-limited' ? 429 : type === 'timeout' ? 504 : type === 'invalid-schema' ? 422 : 502
      sendJson(response, status, { error: type })
    }
    return
  }
  sendJson(response, 404, { error: 'not-found' })
})

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createAIServer().listen(PORT, '127.0.0.1', () => {
    console.info(`[AI backend] listening on http://127.0.0.1:${PORT}`)
  })
}
