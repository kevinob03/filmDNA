import assert from 'node:assert/strict'
import test from 'node:test'
import { createAIServer } from '../../server/aiServer.mjs'

test('el endpoint de proyección rechaza métricas con contrato inválido', async (context) => {
  const server = createAIServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  context.after(() => new Promise((resolve) => server.close(resolve)))
  const { port } = server.address()

  const response = await fetch(`http://127.0.0.1:${port}/api/ai/admin-projection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: {} }),
  })

  assert.equal(response.status, 422)
  assert.deepEqual(await response.json(), { error: 'invalid-schema' })
})
