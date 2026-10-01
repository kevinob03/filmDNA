import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildCinematherapyDraftPrompt,
  validateCinematherapyDraftInput,
  validateCinematherapyDraftResponse,
} from '../../server/ai/operations/cinematherapyDraft.mjs'

const candidates = [
  { tmdbId: 1, title: 'Película calma', overview: 'Una amistad durante un viaje.', genres: ['18'], voteAverage: 7.2 },
  { tmdbId: 2, title: 'Comedia amable', overview: 'Amigos resuelven un problema cotidiano.', genres: ['35'], voteAverage: 7.5 },
  { tmdbId: 3, title: 'Historia luminosa', overview: 'Una familia vuelve a encontrarse.', genres: ['10751'], voteAverage: 8 },
]

const input = {
  emotion: { mood: 'sad', intensity: 8, note: 'Esta nota privada no debe salir' },
  favoriteGenres: [18, 35],
  candidates,
  userName: 'Nombre privado',
}

const validResponse = () => ({
  schemaVersion: 'cinematherapy-draft-v1',
  summary: 'Opciones prudentes para acompañar este momento.',
  recommendations: candidates.map(({ tmdbId }, index) => ({
    tmdbId,
    rationale: index === 0 ? 'Podría ofrecer una experiencia serena.' : 'Puede acompañar con un tono accesible.',
    sensitivity: index === 2 ? 'mild' : 'none',
    sensitivityReasons: index === 2 ? ['Tema familiar emotivo'] : [],
  })),
})

test('minimiza datos antes de construir el prompt', () => {
  const normalized = validateCinematherapyDraftInput(input)
  assert.deepEqual(normalized.emotion, { mood: 'sad', intensity: 8 })
  assert.equal(Object.hasOwn(normalized, 'userName'), false)
  assert.equal(Object.hasOwn(normalized.emotion, 'note'), false)
  const prompt = buildCinematherapyDraftPrompt(normalized)
  assert.doesNotMatch(prompt, /Esta nota privada/)
  assert.doesNotMatch(prompt, /Nombre privado/)
  assert.match(prompt, /No diagnostiques/)
})

test('acepta únicamente películas candidatas y tres resultados', () => {
  const normalized = validateCinematherapyDraftInput(input)
  assert.deepEqual(validateCinematherapyDraftResponse(validResponse(), normalized), validResponse())
  assert.throws(() => validateCinematherapyDraftResponse({
    ...validResponse(),
    recommendations: [{ ...validResponse().recommendations[0], tmdbId: 999 }, ...validResponse().recommendations.slice(1)],
  }, normalized), { type: 'invalid-schema' })
})

test('rechaza lenguaje diagnóstico en resumen y razones', () => {
  const normalized = validateCinematherapyDraftInput(input)
  assert.throws(() => validateCinematherapyDraftResponse({ ...validResponse(), summary: 'Tratamiento psicológico para depresión clínica.' }, normalized), { type: 'invalid-schema' })
  const response = validResponse()
  response.recommendations[0].rationale = 'Diagnóstico de trastorno mediante una película.'
  assert.throws(() => validateCinematherapyDraftResponse(response, normalized), { type: 'invalid-schema' })
})

test('exige coherencia entre sensibilidad y razones', () => {
  const normalized = validateCinematherapyDraftInput(input)
  const response = validResponse()
  response.recommendations[0].sensitivity = 'high'
  assert.throws(() => validateCinematherapyDraftResponse(response, normalized), { type: 'invalid-schema' })
})
