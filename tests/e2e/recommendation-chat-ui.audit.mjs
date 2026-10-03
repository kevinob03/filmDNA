import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'es-ES' })
const page = await context.newPage()
const errors = []
const requests = []
const personalKeyHeaders = []
let responseMode = 'refine'

await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }))
await page.route('https://fonts.gstatic.com/**', (route) => route.fulfill({ status: 204, body: '' }))
await page.route('**/api/ai/recommendation-chat', async (route) => {
  const request = route.request().postDataJSON()
  requests.push(request)
  personalKeyHeaders.push(route.request().headers()['x-filmdna-gemini-key'] || '')
  if (responseMode === 'failure') return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'unavailable' }) })
  const response = responseMode === 'reset'
    ? { schemaVersion: 'recommendation-chat-v1', requestId: request.requestId, action: 'reset', reply: 'Empecemos de nuevo.', filtersPatch: {}, clearFilters: [], targetMovieId: null, suggestedReplies: [] }
    : { schemaVersion: 'recommendation-chat-v1', requestId: request.requestId, action: 'refine', reply: 'Buscaré ciencia ficción para pensar.', filtersPatch: { genres: ['878'], mood: 'think' }, clearFilters: [], targetMovieId: null, suggestedReplies: ['Que sea reciente'] }
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) })
})
await page.route('**/api/ai/classify-movies', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'unavailable' }) }))
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('503')) errors.push(message.text()) })

await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' })
assert.equal(await page.getByRole('heading', { name: 'Habla con FilmDNA' }).count(), 0)
const launcher = page.getByRole('button', { name: 'Chat FilmDNA' })
const tutorial = page.getByRole('button', { name: /tutorial/i })
const [launcherBox, tutorialBox] = await Promise.all([launcher.boundingBox(), tutorial.boundingBox()])
assert.ok(launcherBox && tutorialBox && launcherBox.y < tutorialBox.y, 'El botón del chat debe estar encima del tutorial')
await launcher.click()
await page.getByRole('heading', { name: 'Habla con FilmDNA' }).waitFor()
assert.equal(await page.getByText(/no incluye tu correo/i).isVisible(), true)
const personalKey = 'AIza_e2e_personal_key_1234567890'
await page.getByRole('button', { name: 'Configurar API key personal' }).click()
await page.getByRole('textbox', { name: 'API key', exact: true }).fill(personalKey)
await page.getByLabel(/Guardar hasta cerrar el navegador/).check()
await page.getByLabel(/No volver a preguntarme/).check()
await page.getByRole('button', { name: 'Usar esta clave' }).click()
await page.getByLabel('Mensaje para FilmDNA').fill('Quiero ciencia ficción que me haga pensar')
await page.getByRole('button', { name: 'Enviar', exact: true }).click()
await page.waitForURL('**/recomendaciones')
await page.getByText('Buscaré ciencia ficción para pensar.').waitFor()
await page.locator('.active-filters button').filter({ hasText: 'Ciencia ficción' }).waitFor({ timeout: 60_000 })
await page.locator('.active-filters button').filter({ hasText: 'Pensar' }).waitFor({ timeout: 60_000 })
assert.deepEqual(requests[0].context.filters, {})
assert.equal(Object.hasOwn(requests[0], 'email'), false)
assert.equal(Object.hasOwn(requests[0], 'apiKey'), false)
assert.equal(personalKeyHeaders[0], personalKey)
assert.equal(await page.evaluate((key) => localStorage.getItem('filmdna_personal_gemini_key_preference_v1')?.includes(key), personalKey), false)

await page.getByRole('button', { name: 'Que sea reciente' }).click()
await page.getByText('Buscaré ciencia ficción para pensar.').nth(1).waitFor()
assert.equal(requests[1].history.length, 2)
assert.deepEqual(requests[1].context.filters, { genres: ['878'], mood: 'think' })

responseMode = 'failure'
await page.getByLabel('Mensaje para FilmDNA').fill('Otra opción')
await page.getByRole('button', { name: 'Enviar', exact: true }).click()
await page.getByRole('alert').waitFor()
assert.match(await page.getByRole('alert').textContent(), /no está disponible/i)

responseMode = 'reset'
await page.getByLabel('Mensaje para FilmDNA').fill('Empecemos de nuevo')
await page.getByRole('button', { name: 'Enviar', exact: true }).click()
await page.getByText('Empecemos de nuevo.').waitFor()
assert.equal(await page.locator('.active-filters').count(), 0)

for (const width of [390, 768, 1440]) {
  await page.setViewportSize({ width, height: 900 })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Chat FilmDNA' }).click()
  await page.getByRole('heading', { name: 'Habla con FilmDNA' }).waitFor()
  const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert.ok(dimensions.scroll <= dimensions.client, `Overflow del chatbot a ${width}px`)
}

for (const path of ['/', '/explorar', '/recomendaciones', '/biblioteca', '/diario', '/perfil', '/ayuda', '/login']) {
  await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Chat FilmDNA' }).waitFor()
}

assert.deepEqual(errors, [])
await browser.close()
console.log(JSON.stringify({ status: 'PASS', globalAccess: 'PASS', contract: 'PASS', filters: 'PASS', history: 'PASS', errors: 'PASS', reset: 'PASS', privacy: 'PASS', responsive: { 390: 'PASS', 768: 'PASS', 1440: 'PASS' } }, null, 2))
