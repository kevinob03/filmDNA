const AI_API_BASE = '/api/ai'
const INTERACTIVE_BUDGET_MS = 6_000
const CINEMATHERAPY_BUDGET_MS = 10_000

export class AIServiceError extends Error {
  constructor(type, cause) {
    super(type)
    this.name = 'AIServiceError'
    this.type = type
    this.cause = cause
  }
}

const request = async (endpoint, options = {}) => {
  let response
  try {
    response = await fetch(`${AI_API_BASE}${endpoint}`, {
      ...options,
      headers: { Accept: 'application/json', ...options.headers },
    })
  } catch (cause) {
    throw new AIServiceError('network', cause)
  }

  let data
  try {
    data = await response.json()
  } catch (cause) {
    throw new AIServiceError('invalid-response', cause)
  }
  if (!response.ok) throw new AIServiceError(data?.error || 'unavailable')
  return data
}

export const getAIStatus = async () => request('/status')

export const requestMovieDNA = async (movie) => request('/movie-dna', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ movie, budgetMs: INTERACTIVE_BUDGET_MS }),
})

export const classifyMovieBatch = async (movies) => request('/classify-movies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ movies, budgetMs: INTERACTIVE_BUDGET_MS }),
})

export const requestSearchIntent = async (query) => request('/interpret-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, budgetMs: INTERACTIVE_BUDGET_MS }),
})

export const requestRecommendationChat = async (payload, personalAI = null) => request('/recommendation-chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(personalAI?.apiKey ? {
      'X-FilmDNA-AI-Provider': personalAI.provider,
      'X-FilmDNA-AI-Key': personalAI.apiKey,
      'X-FilmDNA-AI-Model': personalAI.model,
    } : {}),
  },
  body: JSON.stringify(payload),
})

export const requestCinematherapyDraft = async (input) => request('/cinematherapy-draft', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input, budgetMs: CINEMATHERAPY_BUDGET_MS }),
})

export const requestAdminProjection = async (input) => request('/admin-projection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input, budgetMs: CINEMATHERAPY_BUDGET_MS }),
})
