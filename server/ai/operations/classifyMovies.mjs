import { AIProviderError } from '../errors.mjs'

export const CLASSIFY_MOVIES_SCHEMA_VERSION = 'recommendation-classification-v1'
export const MAX_MOVIES_PER_BATCH = 6

const TARGETS = Object.freeze({
  moods: new Set(['laugh', 'feel', 'relax', 'tension', 'surprise', 'fear', 'think']),
  tones: new Set(['light', 'emotional', 'serious', 'dark', 'disturbing']),
  pace: new Set(['calm', 'balanced', 'dynamic', 'relentless']),
  attention: new Set(['easy', 'casual', 'focus', 'challenge']),
  company: new Set(['alone', 'couple', 'friends']),
})

const DIMENSIONS = Object.keys(TARGETS)
const ALL_TARGETS = [...new Set(Object.values(TARGETS).flatMap((targets) => [...targets]))]
const invalidSchema = () => { throw new AIProviderError('invalid-schema') }
const cleanText = (value, maximum = 1_500) => typeof value === 'string' ? value.trim().slice(0, maximum) : ''

export const classifyMoviesJsonSchema = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion', 'movies'],
  properties: {
    schemaVersion: { type: 'string', enum: [CLASSIFY_MOVIES_SCHEMA_VERSION] },
    movies: {
      type: 'array',
      minItems: 1,
      maxItems: MAX_MOVIES_PER_BATCH,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['tmdbId', 'classifications'],
        properties: {
          tmdbId: { type: 'integer', minimum: 1 },
          classifications: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['dimension', 'target', 'status', 'score', 'confidence', 'source', 'evidence'],
              properties: {
                dimension: { type: 'string', enum: DIMENSIONS },
                target: { type: 'string', enum: ALL_TARGETS },
                status: { type: 'string', enum: ['known', 'unknown'] },
                score: { type: ['number', 'null'], minimum: 0, maximum: 100 },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                source: { type: 'string', enum: ['ai'] },
                evidence: { type: 'array', maxItems: 2, items: { type: 'string', minLength: 1, maxLength: 240 } },
              },
            },
          },
        },
      },
    },
  },
})

const normalizeRequestedDimension = (requested) => {
  const dimension = cleanText(requested?.dimension, 30)
  const target = cleanText(requested?.target, 30)
  if (!TARGETS[dimension]?.has(target)) invalidSchema()
  return { dimension, target }
}

export const validateClassifyMoviesInput = (input) => {
  if (!input || !Array.isArray(input.movies) || !input.movies.length || input.movies.length > MAX_MOVIES_PER_BATCH) invalidSchema()
  const ids = new Set()
  const movies = input.movies.map((movie) => {
    const tmdbId = Number(movie?.tmdbId)
    if (!Number.isInteger(tmdbId) || tmdbId <= 0 || ids.has(tmdbId)) invalidSchema()
    ids.add(tmdbId)
    if (!Array.isArray(movie.requestedDimensions) || !movie.requestedDimensions.length) invalidSchema()
    const requestedDimensions = movie.requestedDimensions.map(normalizeRequestedDimension)
    const requestKeys = requestedDimensions.map(({ dimension, target }) => `${dimension}.${target}`)
    if (new Set(requestKeys).size !== requestKeys.length) invalidSchema()
    const metadata = movie.metadata || {}
    return {
      tmdbId,
      title: cleanText(movie.title, 200),
      metadata: {
        year: cleanText(metadata.year, 10),
        genres: Array.isArray(metadata.genres) ? metadata.genres.map((value) => cleanText(value, 80)).filter(Boolean).slice(0, 8) : [],
        overview: cleanText(metadata.overview),
        keywords: Array.isArray(metadata.keywords) ? metadata.keywords.map((value) => cleanText(value, 80)).filter(Boolean).slice(0, 20) : [],
        runtime: Number.isFinite(metadata.runtime) && metadata.runtime > 0 ? metadata.runtime : null,
        certifications: Array.isArray(metadata.certifications) ? metadata.certifications.map((value) => cleanText(value, 20)).filter(Boolean).slice(0, 8) : [],
      },
      requestedDimensions,
    }
  })
  return { movies }
}

export const buildClassifyMoviesPrompt = (input) => `Clasifica únicamente las preferencias cinematográficas solicitadas usando sólo la metadata proporcionada.

Devuelve JSON estricto conforme al schema. No añadas películas, dimensiones ni targets no solicitados. Cada solicitud debe aparecer exactamente una vez.

FORMA DE RESPUESTA:
{
  "schemaVersion": "${CLASSIFY_MOVIES_SCHEMA_VERSION}",
  "movies": [{
    "tmdbId": 123,
    "classifications": [{
      "dimension": "pace",
      "target": "calm",
      "status": "known",
      "score": 18,
      "confidence": 0.90,
      "source": "ai",
      "evidence": ["Resumen breve basado en metadata."]
    }]
  }]
}

score mide coincidencia de 0 a 100 y es independiente de confidence. Un score bajo con confidence alta significa evidencia fuerte de poca coincidencia y debe ser status "known". Usa status "unknown" y score null cuando la metadata no permita decidir responsablemente. No rellenes valores para aumentar cobertura.

Para company.alone, company.couple y company.friends evalúa afinidad contextual, no afirmes que la película sea objetivamente "para" ese grupo. No se solicita company.family porque depende de certificación y evidencia objetiva.

La evidencia debe contener como máximo dos resúmenes breves basados en la metadata, sin chain-of-thought.

SCHEMA VERSION: ${CLASSIFY_MOVIES_SCHEMA_VERSION}
SOLICITUD:
${JSON.stringify(input)}`

export const validateClassifyMoviesResponse = (response, input) => {
  if (!response || response.schemaVersion !== CLASSIFY_MOVIES_SCHEMA_VERSION || !Array.isArray(response.movies)) invalidSchema()
  if (response.movies.length !== input.movies.length) invalidSchema()
  const expected = new Map(input.movies.map((movie) => [movie.tmdbId, new Set(movie.requestedDimensions.map(({ dimension, target }) => `${dimension}.${target}`))]))
  const seenMovies = new Set()

  const movies = response.movies.map((movie) => {
    const tmdbId = Number(movie?.tmdbId)
    if (!expected.has(tmdbId) || seenMovies.has(tmdbId) || !Array.isArray(movie.classifications)) invalidSchema()
    seenMovies.add(tmdbId)
    const expectedKeys = expected.get(tmdbId)
    if (movie.classifications.length !== expectedKeys.size) invalidSchema()
    const seen = new Set()
    const classifications = movie.classifications.map((classification) => {
      const dimension = classification?.dimension
      const target = classification?.target
      const key = `${dimension}.${target}`
      if (!expectedKeys.has(key) || seen.has(key)) invalidSchema()
      seen.add(key)
      const status = classification.status
      const score = classification.score
      const confidence = classification.confidence
      const evidence = classification.evidence
      if (!['known', 'unknown'].includes(status) || classification.source !== 'ai') invalidSchema()
      if (typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) invalidSchema()
      if (!Array.isArray(evidence) || evidence.length > 2 || evidence.some((item) => typeof item !== 'string' || !item.trim() || item.length > 240)) invalidSchema()
      if (status === 'known' && (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 100 || !evidence.length)) invalidSchema()
      if (status === 'unknown' && score !== null) invalidSchema()
      return { dimension, target, status, score: status === 'known' ? Math.round(score) : null, confidence: Number(confidence.toFixed(2)), source: 'ai', evidence: evidence.map((item) => item.trim()) }
    })
    return { tmdbId, classifications }
  })

  return { schemaVersion: CLASSIFY_MOVIES_SCHEMA_VERSION, movies }
}

export const classifyMoviesOperation = Object.freeze({
  name: 'classify-movies',
  schema: classifyMoviesJsonSchema,
  validateInput: validateClassifyMoviesInput,
  buildPrompt: buildClassifyMoviesPrompt,
  validate: validateClassifyMoviesResponse,
})
