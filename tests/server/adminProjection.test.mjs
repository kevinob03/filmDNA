import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildAdminProjectionPrompt,
  validateAdminProjectionInput,
  validateAdminProjectionResponse,
} from '../../server/ai/operations/adminProjection.mjs'

const input = {
  totals: { users: 12, diaryEntries: 18, favorites: 9, lists: 6, listMovies: 14 },
  monthlyActivity: [
    { month: '2026-05', count: 1 }, { month: '2026-06', count: 2 }, { month: '2026-07', count: 2 },
    { month: '2026-08', count: 3 }, { month: '2026-09', count: 4 }, { month: '2026-10', count: 6 },
  ],
  baselineForecast: [{ month: '2026-11', count: 7 }, { month: '2026-12', count: 8 }, { month: '2027-01', count: 9 }],
  adoption: [{ label: 'Usaron el diario', count: 7, percent: 58 }],
  baselineConfidence: 'high',
}

const response = {
  schemaVersion: 'admin-projection-v1',
  summary: 'La actividad agregada mantiene una tendencia de crecimiento moderado.',
  trend: 'growing',
  confidence: 'high',
  forecast: [
    { month: '2026-11', count: 7, rationale: 'Continuidad de la tendencia reciente.' },
    { month: '2026-12', count: 8, rationale: 'Crecimiento moderado sobre la línea base.' },
    { month: '2027-01', count: 8, rationale: 'Estabilización prudente de la actividad.' },
  ],
  insights: [
    { title: 'Diario en crecimiento', detail: 'La serie mensual muestra más registros recientes.' },
    { title: 'Validar la tendencia', detail: 'Conviene esperar más meses antes de elevar la confianza.' },
  ],
}

test('normaliza únicamente métricas agregadas válidas', () => {
  assert.deepEqual(validateAdminProjectionInput(input), input)
  assert.throws(() => validateAdminProjectionInput({ ...input, monthlyActivity: input.monthlyActivity.slice(1) }), { type: 'invalid-schema' })
})

test('el prompt declara límites de privacidad e incertidumbre', () => {
  const prompt = buildAdminProjectionPrompt(input)
  assert.match(prompt, /espanol natural todos los campos textuales/i)
  assert.match(prompt, /summary, rationale, title y detail/i)
  assert.match(prompt, /no contienen nombres, correos ni notas personales/i)
  assert.match(prompt, /no presentes la proyección como certeza/i)
})

test('acepta la proyección estructurada y rechaza meses o cifras fuera de límites', () => {
  const normalized = validateAdminProjectionInput(input)
  assert.deepEqual(validateAdminProjectionResponse(response, normalized), response)
  assert.throws(() => validateAdminProjectionResponse({ ...response, forecast: response.forecast.map((item, index) => index ? item : { ...item, month: '2028-01' }) }, normalized), { type: 'invalid-schema' })
  assert.throws(() => validateAdminProjectionResponse({ ...response, forecast: response.forecast.map((item, index) => index ? item : { ...item, count: 999 }) }, normalized), { type: 'invalid-schema' })
})
