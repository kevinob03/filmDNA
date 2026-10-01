import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'
const outputDir = 'test-results/personalization'
await mkdir(outputDir, { recursive: true })
const report = { status: 'PASS', checks: [], errors: [] }
const check = (condition, name, details = null) => {
  report.checks.push({ name, pass: Boolean(condition), details })
  if (!condition) report.status = 'FAIL'
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'es-ES' })
const page = await context.newPage()
let storedUser
let savedPayload
const personalizedRequests = []
page.on('pageerror', (error) => report.errors.push(error.message))
page.on('console', (message) => { if (message.type() === 'error') report.errors.push(message.text()) })
await page.route('https://api.themoviedb.org/3/**', async (route) => {
  const url = new URL(route.request().url())
  if (url.pathname.endsWith('/discover/movie')) {
    personalizedRequests.push({ withGenres: url.searchParams.get('with_genres'), page: url.searchParams.get('page') })
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      page: 1, total_pages: 1, results: [
        { id: 1, title: 'Terror popular', genre_ids: [27], popularity: 100, vote_average: 8, vote_count: 10 },
        { id: 2, title: 'Comedia afín', genre_ids: [35], popularity: 30, vote_average: 7, vote_count: 10 },
      ],
    }) })
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) })
})
await page.route('http://localhost:3001/usuarios**', async (route) => {
  const request = route.request()
  if (request.method() === 'GET') {
    const userDetail = new URL(request.url()).pathname.endsWith('/quiz-user')
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(userDetail ? storedUser : storedUser ? [storedUser] : []) })
  }
  if (request.method() === 'POST') {
    storedUser = { id: 'quiz-user', ...request.postDataJSON() }
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(storedUser) })
  }
  if (request.method() === 'PATCH') {
    savedPayload = request.postDataJSON()
    storedUser = { ...storedUser, ...savedPayload }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(storedUser) })
  }
  return route.continue()
})

await page.goto(`${baseURL}/registro`, { waitUntil: 'domcontentloaded' })
const passwordBox = await page.getByLabel('Contraseña', { exact: true }).boundingBox()
const confirmationBox = await page.getByLabel('Confirmar contraseña').boundingBox()
check(Math.abs(passwordBox.width - confirmationBox.width) < 1 && passwordBox.height === confirmationBox.height, 'los dos inputs de contraseña tienen el mismo tamaño', { passwordBox, confirmationBox })
await page.setViewportSize({ width: 390, height: 844 })
await page.getByLabel('Nombre').fill('Usuario Quiz')
await page.getByLabel('Email').fill('quiz@filmdna.test')
await page.getByLabel('Contraseña', { exact: true }).fill('secreta')
await page.getByLabel('Confirmar contraseña').fill('secreta')
await page.getByRole('button', { name: 'Crear cuenta' }).click()
await page.waitForURL('**/personalizacion')
await page.getByRole('heading', { name: '¿Qué sueles disfrutar?' }).waitFor()
check(await page.getByRole('heading', { name: '¿Qué sueles disfrutar?' }).isVisible(), 'registro abre el quiz')
check(await page.getByRole('button', { name: 'Continuar' }).isDisabled(), 'cada paso requiere una selección')

await page.getByRole('button', { name: 'Comedia' }).click()
await page.getByRole('button', { name: 'Continuar' }).click()
check(await page.getByRole('heading', { name: '¿Cómo te gusta sentirte?' }).isVisible(), 'el paso emocional usa el texto aprobado')
await page.getByRole('button', { name: 'Reír', exact: true }).click()
await page.getByRole('button', { name: 'Emocionarme', exact: true }).click()
check(await page.getByRole('button', { name: 'Reír', exact: true }).getAttribute('aria-pressed') === 'true'
  && await page.getByRole('button', { name: 'Emocionarme', exact: true }).getAttribute('aria-pressed') === 'true', 'permite elegir varias emociones')
await page.getByRole('button', { name: 'Continuar' }).click()
for (const label of ['Equilibrado', 'Algo para disfrutar']) {
  await page.getByRole('button', { name: new RegExp(`^${label}`) }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
}
await page.getByRole('button', { name: 'Con amigos' }).click()
await page.getByRole('button', { name: 'Explorar para mí' }).click()
await page.waitForURL('**/explorar')
check(savedPayload?.personalizationCompleted === true, 'marca el quiz como completado')
check(JSON.stringify(savedPayload?.discoveryPreferences?.mood) === JSON.stringify(['laugh', 'feel']), 'guarda varias emociones en el perfil de descubrimiento', savedPayload)
await page.getByRole('heading', { name: 'Basado en tus gustos' }).waitFor()
check(await page.getByRole('heading', { name: 'Basado en tus gustos' }).isVisible(), 'abre Explorar con contenido personalizado')
await page.getByRole('heading', { name: 'Comedia afín' }).waitFor()
const discoveryGenres = personalizedRequests[0]?.withGenres?.split('|') || []
check(discoveryGenres.includes('35'), 'consulta TMDB con los géneros derivados del perfil', personalizedRequests[0])
check((await page.locator('.movie-card h3').first().textContent())?.trim() === 'Comedia afín', 'ordena el catálogo por afinidad antes que popularidad')

await page.goto(`${baseURL}/recomendaciones`, { waitUntil: 'domcontentloaded' })
check(await page.getByRole('button', { name: 'Comedia', exact: true }).getAttribute('aria-pressed') === 'false', 'el quiz no rellena filtros de Recomendaciones')
check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'sin overflow móvil a 390px')
check(report.errors.length === 0, 'sin errores de página', report.errors)

await page.goto(`${baseURL}/perfil`, { waitUntil: 'domcontentloaded' })
const retakeQuiz = page.getByRole('link', { name: 'Retomar quiz' })
await retakeQuiz.waitFor()
check(await retakeQuiz.getAttribute('href') === '/personalizacion', 'Perfil permite retomar el quiz')
await retakeQuiz.click()
await page.waitForURL('**/personalizacion')
await page.getByRole('heading', { name: '¿Qué sueles disfrutar?' }).waitFor()
check(await page.getByRole('heading', { name: '¿Qué sueles disfrutar?' }).isVisible(), 'Retomar quiz abre el recorrido desde el inicio')
check(await page.getByRole('button', { name: 'Comedia', exact: true }).getAttribute('aria-pressed') === 'true', 'Retomar quiz conserva las respuestas actuales')
await page.getByRole('button', { name: 'Continuar' }).click()
check(await page.getByRole('button', { name: 'Reír', exact: true }).getAttribute('aria-pressed') === 'true'
  && await page.getByRole('button', { name: 'Emocionarme', exact: true }).getAttribute('aria-pressed') === 'true', 'Retomar quiz conserva varias emociones')

await page.screenshot({ path: `${outputDir}/quiz-mobile.png`, fullPage: true })
const pendingContext = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'es-ES' })
const pendingPage = await pendingContext.newPage()
let skippedPayload
const pendingUser = { id: 'pending-user', nombre: 'Pendiente', email: 'pending@filmdna.test', password: 'secreta', role: 'usuario', personalizationCompleted: false, discoveryPreferences: {} }
pendingPage.on('pageerror', (error) => report.errors.push(error.message))
await pendingPage.route('http://localhost:3001/usuarios**', async (route) => {
  if (route.request().method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([pendingUser]) })
  if (route.request().method() === 'PATCH') {
    skippedPayload = route.request().postDataJSON()
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...pendingUser, ...skippedPayload }) })
  }
  return route.continue()
})
await pendingPage.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' })
await pendingPage.getByLabel('Email').fill(pendingUser.email)
await pendingPage.getByLabel('Contraseña').fill(pendingUser.password)
await pendingPage.getByRole('button', { name: 'Iniciar sesión' }).click()
await pendingPage.waitForURL('**/personalizacion')
check(true, 'una cuenta pendiente retoma el quiz al iniciar sesión')
await pendingPage.getByRole('button', { name: 'Ahora no' }).click()
await pendingPage.waitForURL('**/explorar')
check(skippedPayload?.personalizationCompleted === true && Object.keys(skippedPayload.discoveryPreferences).length === 0, 'se puede omitir sin volver a mostrar el quiz')
await pendingContext.close()

await browser.close()
await writeFile(`${outputDir}/report.json`, JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify(report, null, 2))
if (report.status !== 'PASS') process.exitCode = 1
