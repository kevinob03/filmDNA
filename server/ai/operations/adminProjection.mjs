import { AIProviderError } from '../errors.mjs'

export const ADMIN_PROJECTION_SCHEMA_VERSION = 'admin-projection-v1'
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/
const VALID_TRENDS = new Set(['growing', 'stable', 'declining', 'insufficient-data'])
const VALID_CONFIDENCE = new Set(['low', 'medium', 'high'])
const invalidSchema = () => { throw new AIProviderError('invalid-schema') }
const cleanText = (value, maximum) => typeof value === 'string' ? value.trim().slice(0, maximum) : ''
const safeInteger = (value, maximum = 1_000_000) => Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= maximum ? Number(value) : invalidSchema()

const normalizeSeries = (value, expectedLength) => {
  if (!Array.isArray(value) || value.length !== expectedLength) invalidSchema()
  const months = new Set()
  return value.map((item) => {
    if (!MONTH_PATTERN.test(item?.month) || months.has(item.month)) invalidSchema()
    months.add(item.month)
    return { month: item.month, count: safeInteger(item.count) }
  })
}

export const adminProjectionJsonSchema = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion', 'summary', 'trend', 'confidence', 'forecast', 'insights'],
  properties: {
    schemaVersion: { type: 'string', enum: [ADMIN_PROJECTION_SCHEMA_VERSION] },
    summary: { type: 'string', minLength: 1, maxLength: 320 },
    trend: { type: 'string', enum: [...VALID_TRENDS] },
    confidence: { type: 'string', enum: [...VALID_CONFIDENCE] },
    forecast: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['month', 'count', 'rationale'],
        properties: {
          month: { type: 'string', pattern: '^\\d{4}-(0[1-9]|1[0-2])$' },
          count: { type: 'integer', minimum: 0 },
          rationale: { type: 'string', minLength: 1, maxLength: 180 },
        },
      },
    },
    insights: {
      type: 'array',
      minItems: 2,
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'detail'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 80 },
          detail: { type: 'string', minLength: 1, maxLength: 220 },
        },
      },
    },
  },
})

export const validateAdminProjectionInput = (input) => {
  if (!input || typeof input !== 'object') invalidSchema()
  const totals = input.totals
  const requiredTotals = ['users', 'diaryEntries', 'favorites', 'lists', 'listMovies']
  if (!totals || typeof totals !== 'object') invalidSchema()
  const normalizedTotals = Object.fromEntries(requiredTotals.map((key) => [key, safeInteger(totals[key])]))
  const monthlyActivity = normalizeSeries(input.monthlyActivity, 6)
  const baselineForecast = normalizeSeries(input.baselineForecast, 3)
  if (!VALID_CONFIDENCE.has(input.baselineConfidence)) invalidSchema()
  if (!Array.isArray(input.adoption) || input.adoption.length < 1 || input.adoption.length > 8) invalidSchema()
  const adoption = input.adoption.map((item) => {
    const label = cleanText(item?.label, 80)
    const count = safeInteger(item?.count)
    const percent = safeInteger(item?.percent, 100)
    if (!label) invalidSchema()
    return { label, count, percent }
  })
  return { totals: normalizedTotals, monthlyActivity, baselineForecast, adoption, baselineConfidence: input.baselineConfidence }
}

export const buildAdminProjectionPrompt = (input) => `Analiza métricas agregadas de FilmDNA y genera una proyección prudente de registros mensuales en el Diario para los próximos tres meses.

REGLAS INMUTABLES:
- Los datos son agregados y no contienen nombres, correos ni notas personales.
- No inventes usuarios, eventos ni causas. Distingue observación, estimación e interpretación.
- Usa exactamente los tres meses presentes en baselineForecast, en el mismo orden.
- Los conteos deben ser enteros no negativos y mantenerse razonablemente cerca de la línea base matemática.
- Si la muestra es pequeña o hay pocos meses activos, usa confianza low y explica la limitación.
- No presentes la proyección como certeza ni recomiendes decisiones automáticas.
- Devuelve únicamente JSON conforme al schema, sin markdown ni chain-of-thought.

MÉTRICAS AGREGADAS:
${JSON.stringify(input)}

SCHEMA VERSION: ${ADMIN_PROJECTION_SCHEMA_VERSION}`

export const validateAdminProjectionResponse = (response, input) => {
  if (!response || response.schemaVersion !== ADMIN_PROJECTION_SCHEMA_VERSION) invalidSchema()
  const summary = cleanText(response.summary, 320)
  if (!summary || !VALID_TRENDS.has(response.trend) || !VALID_CONFIDENCE.has(response.confidence)) invalidSchema()
  if (!Array.isArray(response.forecast) || response.forecast.length !== 3) invalidSchema()
  const maximumObserved = Math.max(0, ...input.monthlyActivity.map(({ count }) => count), ...input.baselineForecast.map(({ count }) => count))
  const maximumForecast = Math.max(10, maximumObserved * 3 + 5)
  const forecast = response.forecast.map((item, index) => {
    const expectedMonth = input.baselineForecast[index].month
    const count = safeInteger(item?.count, maximumForecast)
    const rationale = cleanText(item?.rationale, 180)
    if (item?.month !== expectedMonth || !rationale) invalidSchema()
    return { month: expectedMonth, count, rationale }
  })
  if (!Array.isArray(response.insights) || response.insights.length < 2 || response.insights.length > 4) invalidSchema()
  const insights = response.insights.map((item) => {
    const title = cleanText(item?.title, 80)
    const detail = cleanText(item?.detail, 220)
    if (!title || !detail) invalidSchema()
    return { title, detail }
  })
  return { schemaVersion: ADMIN_PROJECTION_SCHEMA_VERSION, summary, trend: response.trend, confidence: response.confidence, forecast, insights }
}

export const adminProjectionOperation = Object.freeze({
  name: 'admin-projection',
  preferredProviderWindowMs: 6_000,
  schema: adminProjectionJsonSchema,
  validateInput: validateAdminProjectionInput,
  buildPrompt: buildAdminProjectionPrompt,
  validate: validateAdminProjectionResponse,
})
