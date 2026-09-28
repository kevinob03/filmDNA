import assert from 'node:assert/strict'
import test from 'node:test'
import { getConfiguredProviders, runAIOperation } from '../../server/ai/orchestrator.mjs'
import { movieDNAOperation, validateMovieDNAProfile } from '../../server/ai/operations/movieDNA.mjs'

const validProfile = {
  alegria: 60,
  emocion: 70,
  complejidad: 80,
  intensidad: 55,
  fantasia: 40,
  ritmo: 65,
  explicacion: 'Perfil de prueba.',
}

test('Movie DNA numérico conserva y valida sus seis dimensiones', () => {
  assert.deepEqual(validateMovieDNAProfile(validProfile), validProfile)
  assert.throws(() => validateMovieDNAProfile({ ...validProfile, ritmo: 101 }), { type: 'invalid-schema' })
})

test('la configuración vive en variables server-side y corrige el modelo Groq', () => {
  const configured = getConfiguredProviders({
    GROQ_API_KEY: 'server-secret',
    GROQ_MODEL: 'openai/gpt-oss-20b',
  })
  assert.equal(configured.length, 1)
  assert.equal(configured[0].provider.name, 'groq')
  assert.equal(configured[0].config.model, 'openai/gpt-oss-20b')
})

test('el orquestador valida JSON del proveedor antes de devolverlo', async (context) => {
  const originalFetch = globalThis.fetch
  context.after(() => { globalThis.fetch = originalFetch })
  globalThis.fetch = async () => new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: JSON.stringify(validProfile) }] } }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  const generated = await runAIOperation(movieDNAOperation, { title: 'Prueba' }, {
    env: { GEMINI_API_KEY: 'server-secret', GEMINI_MODEL: 'gemini-test' },
    budgetMs: 1_000,
  })
  assert.equal(generated.provider, 'gemini')
  assert.equal(generated.model, 'gemini-test')
  assert.deepEqual(generated.result, validProfile)
})

test('un JSON válido con esquema inválido se rechaza explícitamente', async (context) => {
  const originalFetch = globalThis.fetch
  context.after(() => { globalThis.fetch = originalFetch })
  globalThis.fetch = async () => new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: JSON.stringify({ ...validProfile, ritmo: null }) }] } }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  await assert.rejects(
    runAIOperation(movieDNAOperation, { title: 'Prueba' }, {
      env: { GEMINI_API_KEY: 'server-secret', GEMINI_MODEL: 'gemini-test' },
      budgetMs: 1_000,
    }),
    { type: 'invalid-schema' },
  )
})
