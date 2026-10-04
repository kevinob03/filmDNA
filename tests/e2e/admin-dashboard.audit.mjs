import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const projectRoot = resolve(import.meta.dirname, '../..')
const apiPort = 3212
const webPort = 5212
const apiURL = `http://127.0.0.1:${apiPort}`
const webURL = `http://127.0.0.1:${webPort}`
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'filmdna-admin-dashboard-'))
const temporaryDatabase = join(temporaryDirectory, 'db.json')
const processes = []
let browser

const fixture = {
  usuarios: [
    { id: 'admin-1', nombre: 'Admin Uno', email: 'admin@filmdna.test', password: 'privada', role: 'admin' },
    { id: 'user-1', nombre: 'Usuario Uno', email: 'user@filmdna.test', password: 'privada', role: 'usuario', personalizationCompleted: true },
    { id: 'user-2', nombre: 'Usuario Dos', email: 'user2@filmdna.test', password: 'privada', role: 'usuario' },
    { id: 'psych-1', nombre: 'Dra. Elena', email: 'elena@filmdna.test', password: 'privada', role: 'psychologist' },
  ],
  diario: [
    { id: 'd1', usuarioId: 'user-1', tmdbId: 1, fechaVista: '2026-09-01', calificacion: 8 },
    { id: 'd2', usuarioId: 'user-1', tmdbId: 2, fechaVista: '2026-09-20', calificacion: 6 },
    { id: 'd3', usuarioId: 'user-2', tmdbId: 3, fechaVista: '2026-10-02', calificacion: 3 },
  ],
  favoritos: [{ id: 'f1', usuarioId: 'user-1', tmdbId: 1 }],
  listas: [{ id: 'l1', usuarioId: 'user-1', nombre: 'Pendientes', tipo: 'pendientes' }],
  listaPeliculas: [{ id: 'lp1', listaId: 'l1', tmdbId: 2 }],
  movieDNA: [], configuracionDNA: [], asignacionesPsicologicas: [], auditoriaCinematerapia: [], registrosEmocionales: [], propuestasCinematerapia: [],
}

const aiResponse = {
  result: {
    schemaVersion: 'admin-projection-v1',
    summary: 'La actividad reciente sugiere una evolución estable, aunque la muestra todavía es pequeña.',
    trend: 'stable', confidence: 'low',
    forecast: [
      { month: '2026-11', count: 2, rationale: 'Estimación prudente.' },
      { month: '2026-12', count: 2, rationale: 'Continuidad moderada.' },
      { month: '2027-01', count: 2, rationale: 'Sin evidencia para un salto mayor.' },
    ],
    insights: [
      { title: 'Muestra limitada', detail: 'Se requieren más meses para aumentar la confianza.' },
      { title: 'Adopción del Diario', detail: 'La actividad está distribuida entre dos cuentas.' },
    ],
  },
  provider: 'gemini',
  model: 'gemini-test',
}

const start = (entry, args, extraEnv = {}) => {
  const child = spawn(process.execPath, [entry, ...args], { cwd: projectRoot, env: { ...process.env, ...extraEnv }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
  let diagnostics = ''
  child.stdout.on('data', (chunk) => { diagnostics += chunk })
  child.stderr.on('data', (chunk) => { diagnostics += chunk })
  child.diagnostics = () => diagnostics
  processes.push(child)
  return child
}

const waitFor = async (url, child, timeout = 30_000) => {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`El proceso terminó antes de iniciar:\n${child.diagnostics()}`)
    try { if ((await fetch(url)).ok) return } catch {}
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150))
  }
  throw new Error(`Tiempo agotado esperando ${url}\n${child.diagnostics()}`)
}

const setSession = (context, sessionUser) => context.addInitScript((user) => {
  localStorage.setItem('filmdna_session', JSON.stringify(user))
  localStorage.setItem('filmdna_accessibility_preferences_v1', JSON.stringify({ theme: 'dark', contrast: 'normal', textSize: '100' }))
}, sessionUser)

try {
  await writeFile(temporaryDatabase, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8')
  const jsonServer = start(join(projectRoot, 'node_modules/json-server/lib/bin.js'), [temporaryDatabase, '--host', '127.0.0.1', '--port', String(apiPort)])
  await waitFor(`${apiURL}/usuarios`, jsonServer)
  const vite = start(join(projectRoot, 'node_modules/vite/bin/vite.js'), ['--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], { VITE_API_URL: apiURL })
  await waitFor(webURL, vite)
  browser = await chromium.launch({ headless: true })

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await setSession(context, { id: 'admin-1', nombre: 'Admin Uno', email: 'admin@filmdna.test', role: 'admin' })
  const page = await context.newPage()
  const pageErrors = []
  let projectionPayload
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.route('**/api/ai/admin-projection', async (route) => {
    projectionPayload = route.request().postDataJSON()
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(aiResponse) })
  })
  await page.goto(`${webURL}/admin`)
  await page.getByRole('heading', { name: 'Administración', level: 1 }).waitFor()
  await page.getByRole('heading', { name: 'Uso de FilmDNA', level: 2 }).waitFor()
  assert.equal(await page.getByRole('heading', { name: 'Actividad y proyección del Diario', level: 2 }).count(), 1)
  assert.equal(await page.getByRole('heading', { name: 'Funciones utilizadas', level: 2 }).count(), 1)
  assert.equal(await page.getByRole('heading', { name: 'Calificaciones del Diario', level: 2 }).count(), 1)
  assert.ok(await page.getByRole('img').count() >= 4)
  assert.equal(await page.getByText('3', { exact: true }).count() > 0, true)

  await page.getByRole('button', { name: 'Generar proyección IA' }).click()
  await page.getByText(aiResponse.result.summary).waitFor()
  assert.equal(projectionPayload.input.monthlyActivity.length, 6)
  assert.equal(projectionPayload.input.baselineForecast.length, 3)
  assert.doesNotMatch(JSON.stringify(projectionPayload), /Admin Uno|admin@filmdna|user-1|privada/)
  assert.equal(await page.getByText('gemini', { exact: true }).count(), 1)

  const responsive = []
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`${webURL}/admin`)
    await page.getByRole('heading', { name: 'Uso de FilmDNA', level: 2 }).waitFor()
    const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
    responsive.push({ width, ...dimensions })
    assert.ok(dimensions.scrollWidth <= dimensions.clientWidth + 1, `Overflow a ${width}px`)
  }
  assert.deepEqual(pageErrors, [])
  await context.close()

  const userContext = await browser.newContext()
  await setSession(userContext, { id: 'user-1', nombre: 'Usuario Uno', email: 'user@filmdna.test', role: 'usuario' })
  const userPage = await userContext.newPage()
  await userPage.goto(`${webURL}/admin`)
  await userPage.waitForURL('**/acceso-denegado')
  await userContext.close()

  console.log(JSON.stringify({ status: 'PASS', charts: 4, aiProjection: 'PASS', privacy: 'PASS', adminOnly: 'PASS', responsive, errors: pageErrors }, null, 2))
} finally {
  await browser?.close().catch(() => {})
  for (const child of processes.reverse()) if (child.exitCode === null) child.kill()
  await rm(temporaryDirectory, { recursive: true, force: true })
}
