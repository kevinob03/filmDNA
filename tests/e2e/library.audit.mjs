import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'
import { createLibraryService } from '../../src/services/libraryService.js'

const projectRoot = resolve(import.meta.dirname, '../..')
const apiPort = 3191
const webPort = 5191
const apiURL = `http://127.0.0.1:${apiPort}`
const webURL = `http://127.0.0.1:${webPort}`
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'filmdna-rf09-'))
const temporaryDatabase = join(temporaryDirectory, 'db.json')
const processes = []
let browser

const fixture = {
  usuarios: [
    { id: 'user-a', nombre: 'Usuario A', email: 'a@filmdna.test', role: 'usuario' },
    { id: 'user-b', nombre: 'Usuario B', email: 'b@filmdna.test', role: 'usuario' },
  ],
  diario: [], favoritos: [], listas: [], listaPeliculas: [], movieDNA: [], configuracionDNA: [],
}

const start = (entry, args, extraEnv = {}) => {
  const child = spawn(process.execPath, [entry, ...args], {
    cwd: projectRoot,
    env: { ...process.env, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
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
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150))
  }
  throw new Error(`Tiempo agotado esperando ${url}\n${child.diagnostics()}`)
}

const expectSingle = async (url) => {
  const records = await fetch(url).then((response) => response.json())
  assert.equal(records.length, 1)
  return records[0]
}

try {
  await writeFile(temporaryDatabase, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8')
  const jsonServer = start(join(projectRoot, 'node_modules/json-server/lib/bin.js'), [temporaryDatabase, '--host', '127.0.0.1', '--port', String(apiPort)])
  await waitFor(`${apiURL}/usuarios`, jsonServer)

  const service = createLibraryService(apiURL)
  const freshService = () => createLibraryService(apiURL)

  // Favoritos: CRUD, persistencia, deduplicación y aislamiento.
  await Promise.all([service.addFavorite('user-a', 550), service.addFavorite('user-a', 550)])
  assert.equal((await service.listFavorites('user-a')).length, 1)
  assert.equal((await freshService().listFavorites('user-a')).length, 1)
  assert.equal((await service.listFavorites('user-b')).length, 0)
  await service.removeFavorite('user-b', 550)
  assert.equal((await service.listFavorites('user-a')).length, 1)
  await service.removeFavorite('user-a', 550)
  assert.equal((await service.listFavorites('user-a')).length, 0)

  // Pendientes: lista reservada, CRUD, persistencia, deduplicación y aislamiento.
  await Promise.all([service.addToWatchlist('user-a', 550), service.addToWatchlist('user-a', 550)])
  assert.equal((await service.listWatchlist('user-a')).length, 1)
  assert.equal((await freshService().listWatchlist('user-a')).length, 1)
  assert.equal((await service.listWatchlist('user-b')).length, 0)
  await service.removeFromWatchlist('user-b', 550)
  assert.equal((await service.listWatchlist('user-a')).length, 1)
  const watchlist = await expectSingle(`${apiURL}/listas?usuarioId=user-a&tipo=pendientes`)
  assert.equal((await fetch(`${apiURL}/listaPeliculas?listaId=${watchlist.id}&tmdbId=550`).then((response) => response.json())).length, 1)
  await service.removeFromWatchlist('user-a', 550)
  assert.equal((await service.listWatchlist('user-a')).length, 0)

  // Listas personalizadas: CRUD completo, relaciones, persistencia y aislamiento.
  const list = await service.createCustomList('user-a', '  Ciencia   ficción  ')
  assert.equal(list.nombre, 'Ciencia ficción')
  await assert.rejects(() => service.createCustomList('user-a', 'CIENCIA FICCIÓN'), { type: 'duplicate-list' })
  assert.equal((await service.listCustomLists('user-a')).length, 1)
  assert.equal((await service.listCustomLists('user-b')).length, 0)
  const renamed = await service.renameCustomList('user-a', list.id, 'Clásicos modernos')
  assert.equal(renamed.nombre, 'Clásicos modernos')
  await Promise.all([
    service.addMovieToCustomList('user-a', list.id, 550),
    service.addMovieToCustomList('user-a', list.id, 550),
  ])
  assert.equal((await freshService().listMoviesInCustomList('user-a', list.id)).relations.length, 1)
  await assert.rejects(() => service.listMoviesInCustomList('user-b', list.id), { type: 'forbidden' })
  await assert.rejects(() => service.renameCustomList('user-b', list.id, 'Ataque'), { type: 'forbidden' })
  await assert.rejects(() => service.deleteCustomList('user-b', list.id), { type: 'forbidden' })
  await service.removeMovieFromCustomList('user-a', list.id, 550)
  assert.equal((await service.listMoviesInCustomList('user-a', list.id)).relations.length, 0)
  await service.addMovieToCustomList('user-a', list.id, 550)

  // Datos para probar la UI y su persistencia tras recarga.
  await service.addFavorite('user-a', 550)
  await service.addToWatchlist('user-a', 550)
  const vite = start(join(projectRoot, 'node_modules/vite/bin/vite.js'), ['--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], {
    VITE_API_URL: apiURL,
    VITE_TMDB_API_KEY: 'rf09-temporary-key',
  })
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
  await page.route('https://api.themoviedb.org/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ id: 550, title: 'El club de la lucha', original_title: 'Fight Club', overview: 'Película de prueba.', release_date: '1999-10-15', runtime: 139, vote_count: 100, vote_average: 8.4, status: 'Released', genres: [{ id: 18, name: 'Drama' }], poster_path: null, backdrop_path: null }),
  }))

  await page.goto(`${webURL}/biblioteca?seccion=favoritos`)
  await page.getByRole('heading', { name: 'Favoritos', exact: true }).waitFor()
  assert.equal(await page.locator('.library-movie').count(), 1)
  await page.reload()
  await page.getByRole('heading', { name: 'Favoritos', exact: true }).waitFor()
  assert.equal(await page.locator('.library-movie').count(), 1)

  const viewports = [
    { width: 375, textSize: '125' }, { width: 390, textSize: '125' },
    { width: 768, textSize: '100' }, { width: 1280, textSize: '100' }, { width: 1440, textSize: '100' },
  ]
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: 900 })
    await page.evaluate((textSize) => {
      const preferences = { theme: 'dark', contrast: 'normal', textSize }
      localStorage.setItem('filmdna_accessibility_preferences_v1', JSON.stringify(preferences))
    }, viewport.textSize)
    await page.reload()
    await page.getByRole('heading', { name: 'Favoritos', exact: true }).waitFor()
    const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, size: document.documentElement.dataset.textSize }))
    assert.equal(dimensions.size, viewport.textSize)
    assert.ok(dimensions.scroll <= dimensions.client, `Overflow global a ${viewport.width}px: ${dimensions.scroll} > ${dimensions.client}`)
  }

  await page.evaluate(() => localStorage.setItem('filmdna_accessibility_preferences_v1', JSON.stringify({ theme: 'dark', contrast: 'high', textSize: '125' })))
  await page.reload()
  assert.equal(await page.locator('html').getAttribute('data-contrast'), 'high')
  assert.equal(await page.locator('html').getAttribute('data-text-size'), '125')

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(`${webURL}/biblioteca?seccion=listas`)
  await page.getByRole('heading', { name: 'Mis listas', exact: true }).waitFor()
  const deleteButton = page.getByRole('button', { name: 'Eliminar' }).first()
  await deleteButton.focus()
  await deleteButton.press('Enter')
  const dialog = page.getByRole('alertdialog', { name: 'Eliminar lista' })
  await dialog.waitFor()
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Cancelar')
  await page.keyboard.press('Escape')
  await dialog.waitFor({ state: 'hidden' })
  assert.equal(await deleteButton.evaluate((element) => document.activeElement === element), true)
  await deleteButton.click()
  await page.getByRole('button', { name: 'Sí, eliminar lista' }).click()
  await page.getByText('Lista eliminada correctamente.').waitFor()
  assert.equal((await service.listCustomLists('user-a')).length, 0)
  assert.equal((await fetch(`${apiURL}/listaPeliculas?listaId=${list.id}`).then((response) => response.json())).length, 0)

  // Acciones en Movie Detail, estados visibles y persistencia tras F5.
  await page.goto(`${webURL}/pelicula/550`)
  const favoriteButton = page.getByRole('button', { name: /Favoritos/ })
  const watchlistButton = page.getByRole('button', { name: /Pendientes|Ver después/ })
  await favoriteButton.waitFor()
  await page.waitForFunction(() => document.querySelector('.library-toggle')?.getAttribute('aria-pressed') === 'true')
  assert.equal(await favoriteButton.getAttribute('aria-pressed'), 'true')
  assert.equal(await watchlistButton.getAttribute('aria-pressed'), 'true')
  await favoriteButton.click()
  await watchlistButton.click()
  await page.reload()
  assert.equal(await page.getByRole('button', { name: /Favoritos/ }).getAttribute('aria-pressed'), 'false')
  assert.equal(await page.getByRole('button', { name: /Pendientes|Ver después/ }).getAttribute('aria-pressed'), 'false')

  // Un visitante conserva acceso al detalle, pero una acción lo dirige al Auth existente.
  const guest = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-ES' })
  const guestPage = await guest.newPage()
  await guestPage.route('https://api.themoviedb.org/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 550, title: 'El club de la lucha', overview: 'Prueba', genres: [] }) }))
  await guestPage.goto(`${webURL}/pelicula/550`)
  await guestPage.getByRole('button', { name: 'Agregar a Favoritos' }).click()
  await guestPage.waitForURL('**/login')
  await guest.close()

  assert.deepEqual(browserErrors, [])
  console.log(JSON.stringify({
    status: 'PASS',
    database: 'temporary',
    favorites: 'PASS',
    watchlist: 'PASS',
    customLists: 'PASS',
    userIsolation: 'PASS',
    persistenceAfterReload: 'PASS',
    deleteConfirmation: 'PASS',
    accessibility: { normal: 'PASS', highContrast: 'PASS', text125: 'PASS', keyboardFocus: 'PASS' },
    responsive: Object.fromEntries(viewports.map(({ width }) => [width, 'PASS'])),
    unauthenticated: 'PASS',
  }, null, 2))
} finally {
  await browser?.close().catch(() => {})
  for (const child of processes.reverse()) {
    if (child.exitCode === null) child.kill()
  }
  await rm(temporaryDirectory, { recursive: true, force: true })
}
