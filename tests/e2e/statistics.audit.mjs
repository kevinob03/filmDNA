import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const projectRoot = resolve(import.meta.dirname, '../..')
const apiPort = 3193
const webPort = 5193
const apiURL = `http://127.0.0.1:${apiPort}`
const webURL = `http://127.0.0.1:${webPort}`
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'filmdna-rf10-'))
const temporaryDatabase = join(temporaryDirectory, 'db.json')
const processes = []
let browser

const fixture = {
  usuarios: [
    { id: 'user-a', nombre: 'Usuario A', email: 'a@filmdna.test', role: 'usuario' },
    { id: 'user-b', nombre: 'Usuario B', email: 'b@filmdna.test', role: 'usuario' },
    { id: 'user-empty', nombre: 'Usuario Vacío', email: 'empty@filmdna.test', role: 'usuario' },
  ],
  diario: [
    { id: 'a-1', usuarioId: 'user-a', tmdbId: 10, fechaVista: '2025-09-02', calificacion: 8, resena: 'A1' },
    { id: 'a-2', usuarioId: 'user-a', tmdbId: 10, fechaVista: '2025-09-20', calificacion: 9, resena: 'A2' },
    { id: 'a-3', usuarioId: 'user-a', tmdbId: 20, fechaVista: '2026-10-01', calificacion: 7, resena: 'A3' },
    { id: 'b-1', usuarioId: 'user-b', tmdbId: 30, fechaVista: '2024-01-01', calificacion: 4, resena: 'B1' },
  ],
  favoritos: [
    { id: 'fav-a-1', usuarioId: 'user-a', tmdbId: 10 }, { id: 'fav-a-2', usuarioId: 'user-a', tmdbId: 20 },
    { id: 'fav-b-1', usuarioId: 'user-b', tmdbId: 30 },
  ],
  listas: [
    { id: 'pending-a', usuarioId: 'user-a', nombre: 'Ver después', tipo: 'pendientes' },
    { id: 'custom-a', usuarioId: 'user-a', nombre: 'Clásicos', tipo: 'personalizada' },
    { id: 'pending-b', usuarioId: 'user-b', nombre: 'Ver después', tipo: 'pendientes' },
  ],
  listaPeliculas: [
    { id: 'rel-a-1', listaId: 'pending-a', tmdbId: 40 }, { id: 'rel-a-2', listaId: 'pending-a', tmdbId: 50 },
    { id: 'rel-b-1', listaId: 'pending-b', tmdbId: 60 },
  ],
  movieDNA: [], configuracionDNA: [],
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
    try { const response = await fetch(url); if (response.ok) return } catch {}
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150))
  }
  throw new Error(`Tiempo agotado esperando ${url}\n${child.diagnostics()}`)
}

const session = (id, nombre) => ({ id, nombre, email: `${id}@filmdna.test`, role: 'usuario' })
const setSession = async (context, user) => context.addInitScript(({ user }) => {
  localStorage.setItem('filmdna_session', JSON.stringify(user))
  if (!localStorage.getItem('filmdna_accessibility_preferences_v1')) localStorage.setItem('filmdna_accessibility_preferences_v1', JSON.stringify({ theme: 'dark', contrast: 'normal', textSize: '100' }))
}, { user })
const metricValue = (page, label) => page.locator('.statistics-metric').filter({ hasText: label }).locator('strong')

try {
  await writeFile(temporaryDatabase, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8')
  const jsonServer = start(join(projectRoot, 'node_modules/json-server/lib/bin.js'), [temporaryDatabase, '--host', '127.0.0.1', '--port', String(apiPort)])
  await waitFor(`${apiURL}/diario`, jsonServer)
  await waitFor(`${apiURL}/favoritos`, jsonServer)
  await waitFor(`${apiURL}/listas`, jsonServer)
  const vite = start(join(projectRoot, 'node_modules/vite/bin/vite.js'), ['--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], { VITE_API_URL: apiURL })
  await waitFor(webURL, vite)
  browser = await chromium.launch({ headless: true })

  const contextA = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'es-ES' })
  await setSession(contextA, session('user-a', 'Usuario A'))
  const page = await contextA.newPage()
  const browserErrors = []
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  await page.goto(`${webURL}/estadisticas`)
  await page.getByRole('heading', { name: 'Mis estadísticas' }).waitFor()
  assert.equal(await metricValue(page, 'Películas vistas').textContent(), '3')
  assert.equal(await metricValue(page, 'Calificación promedio').textContent(), '8.0/10')
  assert.equal(await metricValue(page, 'Favoritos').textContent(), '2')
  assert.equal(await page.locator('.statistics-secondary dd').nth(0).textContent(), '2')
  assert.equal(await page.locator('.statistics-secondary dd').nth(1).textContent(), '1')
  await page.getByText('septiembre de 2025').waitFor()
  await page.getByText('2 películas').waitFor()
  await page.getByText('octubre de 2026').waitFor()
  await page.getByText('1 película').waitFor()

  await fetch(`${apiURL}/diario`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuarioId: 'user-a', tmdbId: 70, fechaVista: '2026-10-22', calificacion: 10, resena: 'Nueva actividad' }) }).then((response) => assert.equal(response.ok, true))
  await page.reload()
  assert.equal(await metricValue(page, 'Películas vistas').textContent(), '4')
  assert.equal(await metricValue(page, 'Calificación promedio').textContent(), '8.5/10')
  await page.getByText('octubre de 2026').waitFor()
  assert.equal(await page.locator('.statistics-chart__row').filter({ hasText: 'octubre de 2026' }).locator('strong').textContent(), '2 películas')
  await page.reload()
  assert.equal(await metricValue(page, 'Películas vistas').textContent(), '4')

  const variants = [
    { width: 375, theme: 'dark', contrast: 'high', textSize: '125' },
    { width: 390, theme: 'light', contrast: 'normal', textSize: '125' },
    { width: 768, theme: 'dark', contrast: 'normal', textSize: '110' },
    { width: 1280, theme: 'light', contrast: 'normal', textSize: '100' },
    { width: 1440, theme: 'dark', contrast: 'normal', textSize: '100' },
  ]
  for (const variant of variants) {
    await page.setViewportSize({ width: variant.width, height: 900 })
    await page.evaluate((preferences) => localStorage.setItem('filmdna_accessibility_preferences_v1', JSON.stringify(preferences)), variant)
    await page.reload()
    await page.getByRole('heading', { name: 'Mis estadísticas' }).waitFor()
    const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, theme: document.documentElement.dataset.theme, contrast: document.documentElement.dataset.contrast, textSize: document.documentElement.dataset.textSize }))
    assert.equal(dimensions.theme, variant.theme)
    assert.equal(dimensions.contrast, variant.contrast)
    assert.equal(dimensions.textSize, variant.textSize)
    assert.ok(dimensions.scroll <= dimensions.client, `Overflow global a ${variant.width}px: ${dimensions.scroll} > ${dimensions.client}`)
  }

  const contextB = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'es-ES' })
  await setSession(contextB, session('user-b', 'Usuario B'))
  const pageB = await contextB.newPage()
  await pageB.goto(`${webURL}/estadisticas`)
  assert.equal(await metricValue(pageB, 'Películas vistas').textContent(), '1')
  assert.equal(await metricValue(pageB, 'Calificación promedio').textContent(), '4.0/10')
  assert.equal(await metricValue(pageB, 'Favoritos').textContent(), '1')
  await contextB.close()

  const emptyContext = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-ES' })
  await setSession(emptyContext, session('user-empty', 'Usuario Vacío'))
  const emptyPage = await emptyContext.newPage()
  await emptyPage.goto(`${webURL}/estadisticas`)
  assert.equal(await metricValue(emptyPage, 'Películas vistas').textContent(), '0')
  assert.equal(await metricValue(emptyPage, 'Calificación promedio').textContent(), 'Sin calificaciones')
  assert.equal(await metricValue(emptyPage, 'Favoritos').textContent(), '0')
  assert.deepEqual(await emptyPage.locator('.statistics-secondary dd').allTextContents(), ['0', '0'])
  await emptyPage.getByText('Aún no tienes actividad registrada').waitFor()
  assert.equal(await emptyPage.locator('body').getByText(/NaN|undefined/).count(), 0)
  await emptyContext.close()

  const guest = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const guestPage = await guest.newPage()
  await guestPage.goto(`${webURL}/estadisticas`)
  await guestPage.waitForURL('**/login')
  await guest.close()
  assert.deepEqual(browserErrors, [])
  console.log(JSON.stringify({ status: 'PASS', database: 'temporary', realActivity: 'PASS', understandable: 'PASS', refreshAfterChange: 'PASS', reloadPersistence: 'PASS', userIsolation: 'PASS', emptyUser: 'PASS', visitor: 'PASS', accessibility: 'PASS', responsive: Object.fromEntries(variants.map(({ width }) => [width, 'PASS'])), overflow: 'PASS' }, null, 2))
} finally {
  await browser?.close().catch(() => {})
  for (const child of processes.reverse()) if (child.exitCode === null) child.kill()
  await rm(temporaryDirectory, { recursive: true, force: true })
}
