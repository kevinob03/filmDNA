import { chromium } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'
const apiURL = process.env.E2E_API_URL || 'http://127.0.0.1:3001'
const records = await fetch(`${apiURL}/movieDNA`).then((response) => response.json())
const dimensionKeys = ['alegria', 'emocion', 'complejidad', 'intensidad', 'fantasia', 'ritmo']
const profile = records.find((record) => dimensionKeys.every((key) => Number.isFinite(record[key]) && record[key] >= 0 && record[key] <= 100) && typeof record.explicacion === 'string' && record.explicacion.trim())
if (!profile) throw new Error('No hay perfiles Movie DNA válidos existentes para auditar')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: 'es-ES' })
const failures = []
page.on('pageerror', (error) => failures.push(error.message))
page.on('console', (message) => { if (message.type() === 'error') failures.push(message.text()) })
page.on('requestfailed', (request) => failures.push(`${request.url()}: ${request.failure()?.errorText}`))

await page.goto(`${baseURL}/pelicula/${profile.tmdbId}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
await page.locator('.movie-dna-result, .movie-dna-state').first().waitFor({ timeout: 60_000 })
if (!await page.locator('.movie-dna-result').count()) {
  const state = await page.locator('.movie-dna-state').textContent().catch(() => '')
  throw new Error(`Movie DNA no llegó al estado success: ${state || 'sin estado'}; ${failures.join(' | ')}`)
}
const metricCount = await page.locator('.movie-dna-metric').count()
const radarPoints = (await page.locator('.movie-dna-radar__profile').getAttribute('points'))?.trim().split(/\s+/).length
const explanation = (await page.locator('.movie-dna-explanation').textContent())?.trim()
if (metricCount !== 6) throw new Error(`Se esperaban 6 métricas y se encontraron ${metricCount}`)
if (radarPoints !== 6) throw new Error(`Se esperaban 6 puntos de radar y se encontraron ${radarPoints}`)
if (!explanation) throw new Error('La explicación Movie DNA no está visible')

await page.getByRole('link', { name: /Buscar películas con DNA similar/ }).click()
await page.waitForURL(new RegExp(`/recomendaciones\\?similarTo=${profile.tmdbId}`))
await page.locator('.recommendation-card, .content-state').first().waitFor({ timeout: 60_000 })
if (failures.length) throw new Error(`Errores del navegador: ${failures.join(' | ')}`)

console.log(JSON.stringify({
  status: 'PASS',
  tmdbId: profile.tmdbId,
  dimensions: metricCount,
  radarPoints,
  similarityRoute: page.url(),
}, null, 2))
await browser.close()
