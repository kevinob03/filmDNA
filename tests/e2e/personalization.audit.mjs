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
page.on('pageerror', (error) => report.errors.push(error.message))
page.on('console', (message) => { if (message.type() === 'error') report.errors.push(message.text()) })
await page.route('http://localhost:3001/usuarios**', async (route) => {
  const request = route.request()
  if (request.method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(storedUser ? [storedUser] : []) })
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

for (const label of ['Comedia', 'Reír', 'Equilibrado', 'Algo para disfrutar']) {
  await page.getByRole('button', { name: new RegExp(`^${label}`) }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
}
await page.getByRole('button', { name: 'Con amigos' }).click()
await page.getByRole('button', { name: 'Ver mis recomendaciones' }).click()
await page.waitForURL('**/recomendaciones?**')
check(savedPayload?.personalizationCompleted === true, 'marca el quiz como completado')
check(savedPayload?.recommendationPreferences?.mood === 'laugh', 'guarda preferencias estructuradas', savedPayload)
check(new URL(page.url()).searchParams.get('genres') === '35', 'abre recomendaciones con filtros aplicados')

await page.goto(`${baseURL}/recomendaciones`, { waitUntil: 'domcontentloaded' })
check(await page.getByText('Empezamos con las preferencias de tu quiz.').isVisible(), 'reutiliza preferencias en visitas posteriores')
await page.waitForFunction(() => [...document.querySelectorAll('button[aria-pressed="true"]')].some((button) => button.textContent?.trim() === 'Comedia'))
check(await page.getByRole('button', { name: 'Comedia', exact: true }).getAttribute('aria-pressed') === 'true', 'restaura el género favorito')
check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'sin overflow móvil a 390px')
check(report.errors.length === 0, 'sin errores de página', report.errors)

await page.screenshot({ path: `${outputDir}/quiz-mobile.png`, fullPage: true })
const pendingContext = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'es-ES' })
const pendingPage = await pendingContext.newPage()
let skippedPayload
const pendingUser = { id: 'pending-user', nombre: 'Pendiente', email: 'pending@filmdna.test', password: 'secreta', role: 'usuario', personalizationCompleted: false, recommendationPreferences: {} }
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
await pendingPage.waitForURL('**/recomendaciones')
check(skippedPayload?.personalizationCompleted === true && Object.keys(skippedPayload.recommendationPreferences).length === 0, 'se puede omitir sin volver a mostrar el quiz')
await pendingContext.close()

await browser.close()
await writeFile(`${outputDir}/report.json`, JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify(report, null, 2))
if (report.status !== 'PASS') process.exitCode = 1
