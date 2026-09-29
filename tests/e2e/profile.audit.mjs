import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const projectRoot = resolve(import.meta.dirname, '../..')
const apiPort = 3194
const webPort = 5194
const apiURL = `http://127.0.0.1:${apiPort}`
const webURL = `http://127.0.0.1:${webPort}`
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'filmdna-ux01-'))
const temporaryDatabase = join(temporaryDirectory, 'db.json')
const processes = []
let browser

const fixture = {
  usuarios: [
    { id: 'user-a', nombre: 'Usuario Antiguo', email: 'a@filmdna.test', password: 'privada-a', role: 'usuario' },
    { id: 'user-b', nombre: 'Usuario B', email: 'b@filmdna.test', password: 'privada-b', role: 'usuario' },
    { id: 'user-delete', nombre: 'Usuario Borrable', email: 'delete@filmdna.test', password: 'privada-delete', role: 'usuario' },
    { id: 'user-fail', nombre: 'Usuario con fallo', email: 'fail@filmdna.test', password: 'privada-fail', role: 'usuario' },
  ],
  diario: [
    { id: 'a-1', usuarioId: 'user-a', tmdbId: 10, fechaVista: '2026-01-02', calificacion: 9, resena: 'A1' },
    { id: 'a-2', usuarioId: 'user-a', tmdbId: 20, fechaVista: '2026-02-02', calificacion: 7, resena: 'A2' },
    { id: 'b-1', usuarioId: 'user-b', tmdbId: 30, fechaVista: '2026-02-03', calificacion: 2, resena: 'B1' },
  ],
  favoritos: [{ id: 'fav-a', usuarioId: 'user-a', tmdbId: 10 }, { id: 'fav-b', usuarioId: 'user-b', tmdbId: 30 }],
  listas: [
    { id: 'pending-a', usuarioId: 'user-a', nombre: 'Ver después', tipo: 'pendientes' },
    { id: 'pending-b', usuarioId: 'user-b', nombre: 'Ver después', tipo: 'pendientes' },
  ],
  listaPeliculas: [
    { id: 'rel-a-1', listaId: 'pending-a', tmdbId: 40 },
    { id: 'rel-a-2', listaId: 'pending-a', tmdbId: 50 },
    { id: 'rel-b-1', listaId: 'pending-b', tmdbId: 60 },
  ],
  movieDNA: [{ id: 'dna-global', tmdbId: 550, ritmo: 8 }],
  configuracionDNA: [{ id: 'config-global', version: 1 }],
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

const session = (id, nombre, email) => ({ id, nombre, email, role: 'usuario' })
const setSession = async (context, user, preferences = { theme: 'dark', contrast: 'normal', textSize: '100' }) => context.addInitScript(({ sessionUser, accessibility }) => {
  localStorage.setItem('filmdna_session', JSON.stringify(sessionUser))
  if (!localStorage.getItem('filmdna_accessibility_preferences_v1')) localStorage.setItem('filmdna_accessibility_preferences_v1', JSON.stringify(accessibility))
}, { sessionUser: user, accessibility: preferences })

try {
  await writeFile(temporaryDatabase, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8')
  const jsonServer = start(join(projectRoot, 'node_modules/json-server/lib/bin.js'), [temporaryDatabase, '--host', '127.0.0.1', '--port', String(apiPort)])
  await waitFor(`${apiURL}/usuarios`, jsonServer)
  await waitFor(`${apiURL}/diario`, jsonServer)
  await waitFor(`${apiURL}/favoritos`, jsonServer)
  await waitFor(`${apiURL}/listas`, jsonServer)
  await waitFor(`${apiURL}/listaPeliculas`, jsonServer)
  const vite = start(join(projectRoot, 'node_modules/vite/bin/vite.js'), ['--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], { VITE_API_URL: apiURL })
  await waitFor(webURL, vite)
  browser = await chromium.launch({ headless: true })

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'es-ES' })
  await setSession(context, session('user-a', 'Usuario Antiguo', 'a@filmdna.test'))
  const page = await context.newPage()
  const browserErrors = []
  const patchPayloads = []
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
  page.on('request', (request) => { if (request.method() === 'PATCH' && request.url().includes('/usuarios/')) patchPayloads.push(request.postDataJSON()) })
  await page.goto(`${webURL}/perfil`)
  await page.getByRole('heading', { name: 'Usuario Antiguo', level: 1 }).waitFor()
  assert.equal(await page.getByText(/undefined|null/i).count(), 0)
  assert.equal(await page.getByText('Añade una bio para contar').count(), 1)
  assert.equal(await page.locator('.profile-metrics > div').filter({ hasText: 'Películas vistas' }).locator('dd').textContent(), '2')
  assert.equal(await page.locator('.profile-metrics > div').filter({ hasText: 'Promedio personal' }).locator('dd').textContent(), '8.0/10')
  assert.equal(await page.locator('.profile-metrics > div').filter({ hasText: 'Favoritos' }).locator('dd').textContent(), '1')
  assert.equal(await page.locator('.profile-metrics > div').filter({ hasText: 'Ver después' }).locator('dd').textContent(), '2')

  await page.getByRole('button', { name: 'Editar perfil' }).click()
  assert.equal(await page.getByRole('textbox', { name: /email/i }).count(), 0)
  assert.equal(await page.getByRole('combobox', { name: /rol/i }).count(), 0)
  await page.getByLabel('Nombre visible').fill('Cambio temporal')
  await page.getByLabel('Bio').fill('Esta bio no debe guardarse.')
  await page.getByRole('button', { name: 'Órbita neón' }).click()
  await page.getByRole('button', { name: /Acción/ }).click()
  await page.getByRole('button', { name: 'Cancelar' }).click()
  await page.getByRole('heading', { name: 'Usuario Antiguo', level: 1 }).waitFor()
  assert.equal((await fetch(`${apiURL}/usuarios/user-a`).then((response) => response.json())).nombre, 'Usuario Antiguo')

  await page.getByRole('button', { name: 'Editar perfil' }).click()
  await page.getByLabel('Nombre visible').fill('Ana Cinéfila')
  await page.getByLabel('Bio').fill('Colecciono historias que dejan eco después de los créditos.')
  await page.getByRole('button', { name: 'Órbita neón' }).click()
  await page.locator('#profile-avatar-upload').setInputFiles({
    name: 'avatar.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8Dwn4GBgYGJAQoAHgQCAQ9Z4uUAAAAASUVORK5CYII=', 'base64'),
  })
  await page.locator('.profile-editor .profile-avatar--custom img').waitFor()
  for (const label of ['Acción', 'Comedia', 'Drama', 'Thriller', 'Terror']) await page.getByRole('button', { name: new RegExp(label) }).click()
  assert.equal(await page.getByText('5 de 5 seleccionados').textContent(), '5 de 5 seleccionados')
  assert.equal(await page.getByRole('button', { name: /Ciencia ficción/ }).isDisabled(), true)
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await page.getByText('Tu perfil se actualizó correctamente.').waitFor()
  await page.getByRole('heading', { name: 'Ana Cinéfila', level: 1 }).waitFor()
  await page.getByText('Colecciono historias que dejan eco después de los créditos.').waitFor()
  for (const label of ['Acción', 'Comedia', 'Drama', 'Thriller', 'Terror']) await page.locator('.profile-preferences').getByText(label, { exact: true }).waitFor()
  const savedPayload = patchPayloads.at(-1)
  assert.deepEqual(Object.keys(savedPayload).sort(), ['avatarImage', 'avatarPreset', 'bio', 'favoriteGenres', 'nombre'])
  assert.equal(savedPayload.nombre, 'Ana Cinéfila')
  assert.equal(savedPayload.bio, 'Colecciono historias que dejan eco después de los créditos.')
  assert.equal(savedPayload.avatarPreset, '')
  assert.ok(savedPayload.avatarImage.startsWith('data:image/webp;base64,'))
  assert.deepEqual(savedPayload.favoriteGenres, [28, 35, 18, 53, 27])
  const storedSession = await page.evaluate(() => JSON.parse(localStorage.getItem('filmdna_session')))
  assert.equal(storedSession.nombre, 'Ana Cinéfila')
  assert.equal(Object.hasOwn(storedSession, 'password'), false)
  assert.deepEqual(Object.keys(storedSession).sort(), ['email', 'id', 'nombre', 'role'])

  await page.reload()
  await page.getByRole('heading', { name: 'Ana Cinéfila', level: 1 }).waitFor()
  await page.getByText('Colecciono historias que dejan eco después de los créditos.').waitFor()
  await page.locator('.profile-hero .profile-avatar--custom img').waitFor()
  const keyboardEdit = page.getByRole('button', { name: 'Editar perfil' })
  await keyboardEdit.focus()
  assert.equal(await keyboardEdit.evaluate((element) => element === document.activeElement), true)
  await page.keyboard.press('Enter')
  await page.getByRole('heading', { name: 'Haz tuyo este espacio' }).waitFor()
  const keyboardCancel = page.getByRole('button', { name: 'Cancelar' })
  await keyboardCancel.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Editar perfil' }).waitFor()
  const userA = await fetch(`${apiURL}/usuarios/user-a`).then((response) => response.json())
  const userB = await fetch(`${apiURL}/usuarios/user-b`).then((response) => response.json())
  assert.equal(userA.email, 'a@filmdna.test')
  assert.equal(userA.role, 'usuario')
  assert.equal(userA.password, 'privada-a')
  assert.ok(userA.avatarImage.startsWith('data:image/webp;base64,'))
  assert.equal(userB.nombre, 'Usuario B')
  assert.equal(userB.bio, undefined)

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
    await page.getByRole('heading', { name: 'Ana Cinéfila', level: 1 }).waitFor()
    const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, theme: document.documentElement.dataset.theme, contrast: document.documentElement.dataset.contrast, textSize: document.documentElement.dataset.textSize }))
    assert.deepEqual({ theme: dimensions.theme, contrast: dimensions.contrast, textSize: dimensions.textSize }, { theme: variant.theme, contrast: variant.contrast, textSize: variant.textSize })
    assert.ok(dimensions.scroll <= dimensions.client, `Overflow global a ${variant.width}px: ${dimensions.scroll} > ${dimensions.client}`)
  }

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  await setSession(reducedContext, session('user-a', 'Ana Cinéfila', 'a@filmdna.test'))
  const reducedPage = await reducedContext.newPage()
  await reducedPage.goto(`${webURL}/perfil`)
  await reducedPage.getByRole('heading', { name: 'Ana Cinéfila', level: 1 }).waitFor()
  const reducedDuration = await reducedPage.evaluate(() => Number.parseFloat(getComputedStyle(document.querySelector('.profile-quick__card')).transitionDuration))
  assert.ok(reducedDuration <= 0.001, `La transición no se redujo suficientemente: ${reducedDuration}s`)
  await reducedContext.close()

  const deleteContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await setSession(deleteContext, session('user-a', 'Ana Cinéfila', 'a@filmdna.test'))
  const deletePage = await deleteContext.newPage()
  const destructiveRequests = []
  deletePage.on('request', (request) => { if (request.method() === 'DELETE') destructiveRequests.push(request.url()) })
  await deletePage.goto(`${webURL}/perfil`)
  await deletePage.getByRole('heading', { name: 'Ana Cinéfila', level: 1 }).waitFor()
  await deletePage.getByRole('button', { name: 'Eliminar mi cuenta' }).click()
  const confirmDelete = deletePage.getByRole('button', { name: 'Eliminar definitivamente' })
  assert.equal(await confirmDelete.isDisabled(), true)
  await deletePage.getByLabel(/Escribe ELIMINAR/).fill('eliminar')
  assert.equal(await confirmDelete.isDisabled(), true)
  await deletePage.getByRole('button', { name: 'Cancelar' }).click()
  assert.equal(destructiveRequests.length, 0)
  assert.equal((await fetch(`${apiURL}/usuarios/user-a`)).ok, true)
  assert.equal((await fetch(`${apiURL}/diario?usuarioId=user-a`).then((response) => response.json())).length, 2)
  assert.equal((await fetch(`${apiURL}/favoritos?usuarioId=user-a`).then((response) => response.json())).length, 1)
  assert.equal((await fetch(`${apiURL}/listas?usuarioId=user-a`).then((response) => response.json())).length, 1)
  assert.equal((await fetch(`${apiURL}/listaPeliculas?listaId=pending-a`).then((response) => response.json())).length, 2)

  await deletePage.getByRole('button', { name: 'Eliminar mi cuenta' }).click()
  await deletePage.getByLabel(/Escribe ELIMINAR/).fill('ELIMINAR')
  await confirmDelete.click()
  await deletePage.waitForURL('**/login')
  assert.equal((await fetch(`${apiURL}/usuarios/user-a`)).status, 404)
  assert.equal((await fetch(`${apiURL}/diario?usuarioId=user-a`).then((response) => response.json())).length, 0)
  assert.equal((await fetch(`${apiURL}/favoritos?usuarioId=user-a`).then((response) => response.json())).length, 0)
  assert.equal((await fetch(`${apiURL}/listas?usuarioId=user-a`).then((response) => response.json())).length, 0)
  assert.equal((await fetch(`${apiURL}/listaPeliculas?listaId=pending-a`).then((response) => response.json())).length, 0)
  assert.equal(await deletePage.evaluate(() => localStorage.getItem('filmdna_session')), null)
  assert.equal((await fetch(`${apiURL}/usuarios/user-b`)).ok, true)
  assert.equal((await fetch(`${apiURL}/diario?usuarioId=user-b`).then((response) => response.json())).length, 1)
  assert.equal((await fetch(`${apiURL}/favoritos?usuarioId=user-b`).then((response) => response.json())).length, 1)
  assert.equal((await fetch(`${apiURL}/listas?usuarioId=user-b`).then((response) => response.json())).length, 1)
  assert.equal((await fetch(`${apiURL}/listaPeliculas?listaId=pending-b`).then((response) => response.json())).length, 1)
  assert.equal((await fetch(`${apiURL}/movieDNA`).then((response) => response.json())).length, 1)
  assert.equal((await fetch(`${apiURL}/configuracionDNA`).then((response) => response.json())).length, 1)
  await deleteContext.close()

  const failureContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await setSession(failureContext, session('user-fail', 'Usuario con fallo', 'fail@filmdna.test'))
  const failurePage = await failureContext.newPage()
  await failurePage.route('**/listas?usuarioId=user-fail', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }))
  await failurePage.goto(`${webURL}/perfil`)
  await failurePage.getByRole('heading', { name: 'Usuario con fallo', level: 1 }).waitFor()
  await failurePage.getByRole('button', { name: 'Eliminar mi cuenta' }).click()
  await failurePage.getByLabel(/Escribe ELIMINAR/).fill('ELIMINAR')
  await failurePage.getByRole('button', { name: 'Eliminar definitivamente' }).click()
  await failurePage.getByRole('alert').filter({ hasText: 'No pudimos completar la eliminación' }).waitFor()
  assert.equal(new URL(failurePage.url()).pathname, '/perfil')
  assert.ok(await failurePage.evaluate(() => localStorage.getItem('filmdna_session')))
  assert.equal((await fetch(`${apiURL}/usuarios/user-fail`)).ok, true)
  assert.equal(await failurePage.getByRole('button', { name: 'Eliminar definitivamente' }).isDisabled(), false)
  assert.equal(await failurePage.getByRole('button', { name: 'Cancelar' }).isDisabled(), false)
  await failureContext.close()

  const guest = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const guestPage = await guest.newPage()
  await guestPage.goto(`${webURL}/perfil`)
  await guestPage.waitForURL('**/login')
  await guest.close()
  assert.deepEqual(browserErrors, [])
  console.log(JSON.stringify({ status: 'PASS', database: 'temporary', legacyUser: 'PASS', edit: 'PASS', bio: 'PASS', customPhoto: 'PASS', avatarPresets: 'PASS', genres: 'PASS', maximumFive: 'PASS', save: 'PASS', persistence: 'PASS', protectedFields: 'PASS', sessionWithoutPassword: 'PASS', userIsolation: 'PASS', cancel: 'PASS', deleteConfirmation: 'PASS', deleteCancel: 'PASS', deleteAccount: 'PASS', deleteRelatedData: 'PASS', deleteIsolation: 'PASS', noOrphanListMovies: 'PASS', deleteBackendFailure: 'PASS', realStatistics: 'PASS', visitor: 'PASS', keyboard: 'PASS', themes: 'PASS', text125: 'PASS', reducedMotion: 'PASS', responsive: Object.fromEntries(variants.map(({ width }) => [width, 'PASS'])), overflow: 'PASS' }, null, 2))
} finally {
  await browser?.close().catch(() => {})
  for (const child of processes.reverse()) if (child.exitCode === null) child.kill()
  await rm(temporaryDirectory, { recursive: true, force: true })
}
