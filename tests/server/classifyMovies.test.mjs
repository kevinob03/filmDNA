import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CLASSIFY_MOVIES_SCHEMA_VERSION,
  MAX_MOVIES_PER_BATCH,
  validateClassifyMoviesInput,
  validateClassifyMoviesResponse,
} from '../../server/ai/operations/classifyMovies.mjs'
import { mergeAIClassification } from '../../src/services/recommendations/mergeMovieDNAEvidence.js'
import {
  buildAIClassificationCandidate,
  classifyMovies,
  getRecommendationAICacheStats,
  resetRecommendationAICache,
} from '../../src/services/recommendations/recommendationAIService.js'

const unknown = () => ({ status: 'unknown', score: null, confidence: 0, source: 'unknown', evidence: [], conflictingEvidence: [] })
const known = () => ({ status: 'known', score: 55, confidence: 0.85, source: 'deterministic', evidence: [{ ruleId: 'test', sourceId: 1 }] })
const assessment = (overrides = {}) => ({
  dimension: 'pace', target: 'calm', status: 'known', score: 18, confidence: 0.9, source: 'ai', evidence: ['Ritmo acelerado según la sinopsis.'], provider: 'test', model: 'test-model', ...overrides,
})
const requestMovie = (id, requestedDimensions = [{ dimension: 'pace', target: 'calm' }]) => ({ tmdbId: id, title: `Movie ${id}`, metadata: {}, requestedDimensions })

test('batch backend acepta máximo 6 películas', () => {
  assert.equal(validateClassifyMoviesInput({ movies: Array.from({ length: MAX_MOVIES_PER_BATCH }, (_, index) => requestMovie(index + 1)) }).movies.length, 6)
  assert.throws(() => validateClassifyMoviesInput({ movies: Array.from({ length: 7 }, (_, index) => requestMovie(index + 1)) }), { type: 'invalid-schema' })
})

test('respuesta rechaza tmdbId o dimensión no solicitados y valores fuera de rango', () => {
  const input = validateClassifyMoviesInput({ movies: [requestMovie(1)] })
  const response = (classification, tmdbId = 1) => ({ schemaVersion: CLASSIFY_MOVIES_SCHEMA_VERSION, movies: [{ tmdbId, classifications: [classification] }] })
  assert.throws(() => validateClassifyMoviesResponse(response(assessment(), 999), input), { type: 'invalid-schema' })
  assert.throws(() => validateClassifyMoviesResponse(response(assessment({ dimension: 'tones', target: 'dark' })), input), { type: 'invalid-schema' })
  assert.throws(() => validateClassifyMoviesResponse(response(assessment({ score: 101 })), input), { type: 'invalid-schema' })
  assert.throws(() => validateClassifyMoviesResponse(response(assessment({ confidence: 1.1 })), input), { type: 'invalid-schema' })
})

test('respuesta parcial y score no nulo para unknown se rechazan', () => {
  const input = validateClassifyMoviesInput({ movies: [requestMovie(1, [{ dimension: 'pace', target: 'calm' }, { dimension: 'attention', target: 'casual' }])] })
  assert.throws(() => validateClassifyMoviesResponse({ schemaVersion: CLASSIFY_MOVIES_SCHEMA_VERSION, movies: [{ tmdbId: 1, classifications: [assessment()] }] }, input), { type: 'invalid-schema' })
  const singleInput = validateClassifyMoviesInput({ movies: [requestMovie(1)] })
  assert.throws(() => validateClassifyMoviesResponse({ schemaVersion: CLASSIFY_MOVIES_SCHEMA_VERSION, movies: [{ tmdbId: 1, classifications: [assessment({ status: 'unknown', score: 0 })] }] }, singleInput), { type: 'invalid-schema' })
})

test('solo se solicitan preferencias activas que permanecen unknown', () => {
  const movieDNA = {
    objective: { genres: [], keywords: [], runtime: 100, certifications: [] },
    experience: {
      moods: { fear: known() }, tones: { dark: known() }, pace: { relentless: unknown() }, attention: {}, company: {},
    },
  }
  const candidate = buildAIClassificationCandidate({ id: 1, title: 'Test', overview: '' }, movieDNA, { mood: 'fear', tone: 'dark', pace: 'relentless' })
  assert.deepEqual(candidate.requestedDimensions, [{ dimension: 'pace', target: 'relentless' }])
})

test('determinista known nunca se sobrescribe', () => {
  const deterministic = known()
  assert.strictEqual(mergeAIClassification(deterministic, assessment({ score: 100 }), 1), deterministic)
})

test('IA válida resuelve unknown y conserva score bajo con confianza alta', () => {
  const merged = mergeAIClassification(unknown(), assessment({ score: 18, confidence: 0.9 }), 1)
  assert.equal(merged.status, 'known')
  assert.equal(merged.score, 18)
  assert.equal(merged.confidence, 0.72)
  assert.equal(merged.source, 'ai')
  assert.equal(merged.evidence[0].source, 'ai')
})

test('confianza baja o score null mantienen unknown', () => {
  assert.equal(mergeAIClassification(unknown(), assessment({ confidence: 0.74 }), 1).status, 'unknown')
  assert.equal(mergeAIClassification(unknown(), assessment({ status: 'unknown', score: null, confidence: 0.9 }), 1).status, 'unknown')
})

const candidate = (id, dimensions = [{ dimension: 'pace', target: 'calm' }]) => ({
  tmdbId: id,
  title: `Movie ${id}`,
  metadata: {},
  movieDataVersion: 'v1',
  requestedDimensions: dimensions,
})

const mockSuccessFetch = (counter) => async (_url, options) => {
  counter.count += 1
  const body = JSON.parse(options.body)
  return new Response(JSON.stringify({
    provider: 'test',
    model: 'test-model',
    result: {
      schemaVersion: CLASSIFY_MOVIES_SCHEMA_VERSION,
      movies: body.movies.map((movie) => ({
        tmdbId: movie.tmdbId,
        classifications: movie.requestedDimensions.map(({ dimension, target }) => assessment({ dimension, target })),
      })),
    },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

test('12 películas producen máximo 2 batches y la caché evita duplicados', async (context) => {
  resetRecommendationAICache()
  const originalFetch = globalThis.fetch
  const counter = { count: 0 }
  globalThis.fetch = mockSuccessFetch(counter)
  context.after(() => { globalThis.fetch = originalFetch })
  const candidates = Array.from({ length: 12 }, (_, index) => candidate(index + 1))
  const first = await classifyMovies(candidates)
  assert.equal(first.size, 12)
  assert.equal(counter.count, 2)
  assert.equal(getRecommendationAICacheStats().batches, 2)
  await classifyMovies(candidates)
  assert.equal(counter.count, 2)
  assert.equal(getRecommendationAICacheStats().hits, 12)
})

test('caché por dimensión reutiliza una clasificación parcial', async (context) => {
  resetRecommendationAICache()
  const originalFetch = globalThis.fetch
  const counter = { count: 0 }
  globalThis.fetch = mockSuccessFetch(counter)
  context.after(() => { globalThis.fetch = originalFetch })
  await classifyMovies([candidate(1, [{ dimension: 'pace', target: 'calm' }, { dimension: 'attention', target: 'casual' }])])
  await classifyMovies([candidate(1, [{ dimension: 'pace', target: 'calm' }])])
  assert.equal(counter.count, 1)
  assert.equal(getRecommendationAICacheStats().hits, 1)
})

test('fallo total IA devuelve cero evaluaciones y deja disponible el determinista', async (context) => {
  resetRecommendationAICache()
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('offline') }
  context.after(() => { globalThis.fetch = originalFetch })
  const results = await classifyMovies([candidate(1)])
  assert.equal(results.size, 0)
  const deterministic = unknown()
  assert.strictEqual(mergeAIClassification(deterministic, results.get(1)?.[0], 1), deterministic)
})
