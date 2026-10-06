import assert from 'node:assert/strict'
import test from 'node:test'
import { buildDemoDatabase, DEMO_ADMIN_CREDENTIALS } from '../../scripts/demoDatabase.mjs'
import { buildAdminAnalytics } from '../../src/utils/adminAnalytics.js'

const referenceDate = new Date('2026-10-05T12:00:00.000Z')

test('genera datos demo sinteticos, relacionados y suficientes para Admin', () => {
  const database = buildDemoDatabase(referenceDate)
  const userIds = new Set(database.usuarios.map(({ id }) => id))
  const listIds = new Set(database.listas.map(({ id }) => id))

  assert.equal(database.usuarios.length, 15)
  assert.equal(database.diario.length, 34)
  assert.equal(database.favoritos.length, 20)
  assert.equal(database.listas.length, 8)
  assert.equal(database.listaPeliculas.length, 24)
  assert.ok(database.usuarios.every(({ id, email }) => id.startsWith('demo-') && email.endsWith('@filmdna.test')))
  assert.ok(database.diario.every(({ usuarioId }) => userIds.has(usuarioId)))
  assert.ok(database.favoritos.every(({ usuarioId }) => userIds.has(usuarioId)))
  assert.ok(database.listaPeliculas.every(({ listaId }) => listIds.has(listaId)))
})

test('produce seis meses activos, tendencia visible y confianza alta', () => {
  const database = buildDemoDatabase(referenceDate)
  const analytics = buildAdminAnalytics({
    users: database.usuarios,
    diaryEntries: database.diario,
    favorites: database.favoritos,
    lists: database.listas,
    listMovies: database.listaPeliculas,
  }, referenceDate)

  assert.deepEqual(analytics.monthlyActivity.map(({ count }) => count), [3, 4, 5, 6, 7, 9])
  assert.equal(analytics.forecastConfidence, 'high')
  assert.ok(analytics.adoption.every(({ count }) => count > 0))
  assert.ok(analytics.ratingDistribution.every(({ count }) => count > 0))
})

test('incluye una cuenta Admin de demostracion documentable', () => {
  const database = buildDemoDatabase(referenceDate)
  const admin = database.usuarios.find(({ email }) => email === DEMO_ADMIN_CREDENTIALS.email)
  assert.equal(admin?.role, 'admin')
  assert.equal(admin?.password, DEMO_ADMIN_CREDENTIALS.password)
})
