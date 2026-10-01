import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'
import { createDiaryService } from '../../src/services/diaryService.js'

const projectRoot = resolve(import.meta.dirname, '../..')
const apiPort = 3192
const webPort = 5192
const apiURL = `http://127.0.0.1:${apiPort}`
const webURL = `http://127.0.0.1:${webPort}`
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'filmdna-rf08-'))
const temporaryDatabase = join(temporaryDirectory, 'db.json')
const processes = []
let browser

const fixture = {
  usuarios: [
    { id: 'user-a', nombre: 'Usuario A', email: 'a@filmdna.test', role: 'usuario' },
    { id: 'user-b', nombre: 'Usuario B', email: 'b@filmdna.test', role: 'usuario' },
  ],
  diario: [
    { id: 'other-user-entry', usuarioId: 'user-b', tmdbId: 551, fechaVista: '2025-01-01', calificacion: 2, resena: 'Reseña privada de B' },
    { id: 'public-review-b', usuarioId: 'user-b', tmdbId: 550, fechaVista: '2026-02-02', calificacion: 9, resena: 'Reseña pública visible.', publica: true },
    { id: 'legacy-private-b', usuarioId: 'user-b', tmdbId: 550, fechaVista: '2026-01-01', calificacion: 4, resena: 'Reseña antigua privada.' },
  ],
  favoritos: [], listas: [], listaPeliculas: [], movieDNA: [], configuracionDNA: [],
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

const movie = (id, title) => ({ id, title, overview: 'Película de prueba.', release_date: '1999-10-15', runtime: 120, vote_count: 100, vote_average: 8.4, status: 'Released', genres: [], poster_path: null, backdrop_path: null })

try {
  await writeFile(temporaryDatabase, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8')
  const jsonServer = start(join(projectRoot, 'node_modules/json-server/lib/bin.js'), [temporaryDatabase, '--host', '127.0.0.1', '--port', String(apiPort)])
  await waitFor(`${apiURL}/usuarios`, jsonServer)
  await waitFor(`${apiURL}/diario`, jsonServer)

  const service = createDiaryService(apiURL)
  await assert.rejects(() => service.createEntry('user-a', 550, { fechaVista: '2026-09-29', calificacion: 11, resena: 'Inválida' }), { type: 'invalid-rating' })
  await assert.rejects(() => service.createEntry('user-a', 550, { fechaVista: '2026-09-29', calificacion: 8, resena: 'Inválida', visibilidad: 'todos' }), { type: 'invalid-visibility' })
  assert.deepEqual((await service.listPublicMovieReviews(550)).map((entry) => entry.resena), ['Reseña pública visible.'])

  const vite = start(join(projectRoot, 'node_modules/vite/bin/vite.js'), ['--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], { VITE_API_URL: apiURL, VITE_TMDB_API_KEY: 'rf08-temporary-key' })
  await waitFor(webURL, vite)
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'es-ES' })
  await context.addInitScript(() => {
    localStorage.setItem('filmdna_session', JSON.stringify({ id: 'user-a', nombre: 'Usuario A', email: 'a@filmdna.test', role: 'usuario' }))
    if (!localStorage.getItem('filmdna_accessibility_preferences_v1')) {
      localStorage.setItem('filmdna_accessibility_preferences_v1', JSON.stringify({ theme: 'dark', contrast: 'normal', textSize: '100' }))
    }
  })
  const page = await context.newPage()
  const browserErrors = []
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  await page.route('https://api.themoviedb.org/**', async (route) => {
    const match = route.request().url().match(/\/movie\/(\d+)/)
    const id = Number(match?.[1])
    if (id === 999) return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(movie(id || 550, id === 551 ? 'Película privada B' : 'El club de la lucha')) })
  })

  await page.goto(`${webURL}/pelicula/550`)
  await page.getByRole('heading', { name: 'Registrar en mi Diario' }).waitFor()
  await page.getByText('Reseña pública visible.').waitFor()
  assert.equal(await page.getByText('Reseña antigua privada.').count(), 0)
  await page.getByRole('button', { name: 'Registrar película vista' }).click()
  await page.getByText('Selecciona la fecha en que viste la película.').waitFor()
  await page.getByText('Selecciona una calificación entera entre 1 y 10.').waitFor()
  await page.getByText('Escribe una reseña.').waitFor()
  await page.getByLabel('Fecha vista').fill('2026-09-29')
  await page.getByLabel('Tu calificación').selectOption('8')
  await page.getByLabel('Reseña', { exact: true }).fill('Una reseña personal de prueba.')
  await page.getByRole('radio', { name: /^Pública/ }).check()
  await page.getByRole('button', { name: 'Registrar película vista' }).click()
  await page.getByText('Película registrada correctamente en tu Diario.').waitFor()
  await page.getByText('Una reseña personal de prueba.').waitFor()

  let records = await fetch(`${apiURL}/diario?usuarioId=user-a`).then((response) => response.json())
  assert.equal(records.length, 1)
  assert.deepEqual({ usuarioId: records[0].usuarioId, tmdbId: records[0].tmdbId, fechaVista: records[0].fechaVista, calificacion: records[0].calificacion, resena: records[0].resena, publica: records[0].publica }, { usuarioId: 'user-a', tmdbId: 550, fechaVista: '2026-09-29', calificacion: 8, resena: 'Una reseña personal de prueba.', publica: true })
  assert.equal(await page.getByLabel('Fecha vista').inputValue(), '')
  assert.equal(await page.getByLabel('Tu calificación').inputValue(), '')
  assert.equal(await page.getByLabel('Reseña', { exact: true }).inputValue(), '')
  assert.equal(await page.getByRole('radio', { name: /^Privada/ }).isChecked(), true)

  await service.createEntry('user-a', 999, { fechaVista: '2026-08-10', calificacion: 7, resena: 'Registro cuyo TMDB falla.' })
  await page.goto(`${webURL}/diario`)
  await page.getByRole('heading', { name: 'Mi Diario' }).waitFor()
  await page.getByText('Una reseña personal de prueba.').waitFor()
  await page.getByText('Registro cuyo TMDB falla.').waitFor()
  await page.getByText('Tu registro sigue guardado.', { exact: false }).waitFor()
  assert.equal(await page.getByText('Reseña privada de B').count(), 0)
  const reviews = await page.locator('.diary-entry__review').allTextContents()
  assert.deepEqual(reviews, ['Una reseña personal de prueba.', 'Registro cuyo TMDB falla.'])
  assert.equal(await page.getByText('Reseña pública', { exact: true }).count(), 1)
  assert.equal(await page.getByText('Reseña privada', { exact: true }).count(), 1)
  await page.reload()
  await page.getByText('Una reseña personal de prueba.').waitFor()

  const variants = [
    { width: 375, theme: 'dark', contrast: 'high', textSize: '125' },
    { width: 390, theme: 'light', contrast: 'normal', textSize: '125' },
    { width: 768, theme: 'dark', contrast: 'normal', textSize: '100' },
    { width: 1280, theme: 'light', contrast: 'normal', textSize: '100' },
    { width: 1440, theme: 'dark', contrast: 'normal', textSize: '100' },
  ]
  for (const variant of variants) {
    await page.setViewportSize({ width: variant.width, height: 900 })
    await page.evaluate((preferences) => localStorage.setItem('filmdna_accessibility_preferences_v1', JSON.stringify(preferences)), variant)
    await page.reload()
    await page.getByRole('heading', { name: 'Mi Diario' }).waitFor()
    const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, theme: document.documentElement.dataset.theme, contrast: document.documentElement.dataset.contrast, textSize: document.documentElement.dataset.textSize }))
    assert.equal(dimensions.theme, variant.theme)
    assert.equal(dimensions.contrast, variant.contrast)
    assert.equal(dimensions.textSize, variant.textSize)
    assert.ok(dimensions.scroll <= dimensions.client, `Overflow global a ${variant.width}px: ${dimensions.scroll} > ${dimensions.client}`)
  }

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(`${webURL}/pelicula/550`)
  await page.getByLabel('Fecha vista').fill('2026-09-30')
  await page.getByLabel('Tu calificación').selectOption('9')
  await page.getByLabel('Reseña', { exact: true }).fill('Prueba de doble envío.')
  await page.getByRole('button', { name: 'Registrar película vista' }).dblclick()
  await page.getByText('Película registrada correctamente en tu Diario.').waitFor()
  records = await fetch(`${apiURL}/diario?usuarioId=user-a`).then((response) => response.json())
  assert.equal(records.filter((entry) => entry.resena === 'Prueba de doble envío.').length, 1)

  const guest = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-ES' })
  const guestPage = await guest.newPage()
  await guestPage.route('https://api.themoviedb.org/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(movie(550, 'El club de la lucha')) }))
  await guestPage.goto(`${webURL}/diario`)
  await guestPage.waitForURL('**/login')
  await guestPage.goto(`${webURL}/pelicula/550`)
  await guestPage.getByText('Reseña pública visible.').waitFor()
  assert.equal(await guestPage.getByText('Reseña antigua privada.').count(), 0)
  const guestDimensions = await guestPage.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert.ok(guestDimensions.scroll <= guestDimensions.client, `Overflow del detalle público móvil: ${guestDimensions.scroll} > ${guestDimensions.client}`)
  await guestPage.getByRole('button', { name: 'Iniciar sesión para registrar' }).click()
  await guestPage.waitForURL('**/login')
  await guest.close()

  const unexpectedBrowserErrors = browserErrors.filter((message) => !message.includes('503 (Service Unavailable)'))
  assert.deepEqual(unexpectedBrowserErrors, [])
  console.log(JSON.stringify({ status: 'PASS', database: 'temporary', create: 'PASS', visibility: 'PASS', legacyPrivacy: 'PASS', publicMovieReviews: 'PASS', requiredFields: 'PASS', ratingRange: 'PASS', consultation: 'PASS', reloadPersistence: 'PASS', userIsolation: 'PASS', visitor: 'PASS', duplicateSubmit: 'PASS', tmdbPartialFailure: 'PASS', accessibility: 'PASS', responsive: Object.fromEntries(variants.map(({ width }) => [width, 'PASS'])), overflow: 'PASS' }, null, 2))
} finally {
  await browser?.close().catch(() => {})
  for (const child of processes.reverse()) if (child.exitCode === null) child.kill()
  await rm(temporaryDirectory, { recursive: true, force: true })
}
