import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'
const outputDir = 'test-results/recommendations-ai'
await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'es-ES' })
const page = await context.newPage()
const report = { status: 'PASS', aiRequests: [], checks: [], errors: [] }
let aiMode = 'success'

page.on('pageerror', (error) => report.errors.push(error.message))
page.on('console', (message) => { if (message.type() === 'error') report.errors.push(message.text()) })

await page.route('**/api/ai/classify-movies', async (route) => {
  const startedAt = performance.now()
  const body = route.request().postDataJSON()
  const record = { movieCount: body.movies.length, requested: body.movies.map((movie) => ({ tmdbId: movie.tmdbId, dimensions: movie.requestedDimensions })) }
  report.aiRequests.push(record)
  if (aiMode === 'failure') {
    record.durationMs = Number((performance.now() - startedAt).toFixed(1))
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ provider: 'mock', model: 'mock-model', result: { invalid: true } }) })
    return
  }
  const movies = body.movies.map((movie) => ({
    tmdbId: movie.tmdbId,
    classifications: movie.requestedDimensions.map(({ dimension, target }) => ({
      dimension,
      target,
      status: 'known',
      score: 18,
      confidence: 0.9,
      source: 'ai',
      evidence: ['La metadata indica poca afinidad con esta preferencia.'],
    })),
  }))
  record.durationMs = Number((performance.now() - startedAt).toFixed(1))
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ provider: 'mock', model: 'mock-model', result: { schemaVersion: 'recommendation-classification-v1', movies } }),
  })
})

const check = (condition, name, details = null) => {
  report.checks.push({ name, pass: Boolean(condition), details })
  if (!condition) report.status = 'FAIL'
}

const select = async (labels) => {
  for (const label of labels) {
    const exact = page.getByRole('button', { name: label, exact: true })
    const button = await exact.count() ? exact : page.getByRole('button').filter({ hasText: label }).first()
    await button.click()
  }
}

await page.goto(`${baseURL}/recomendaciones#known-only`, { waitUntil: 'domcontentloaded' })
await select(['Comedia', 'Reír'])
await page.getByRole('button', { name: 'Encontrar películas', exact: true }).click()
await page.locator('.recommendation-card').first().waitFor({ timeout: 60_000 })
const knownEvaluation = (await page.locator('.recommendation-card__evaluation').first().textContent())?.replace(/\s+/g, ' ').trim()
check(report.aiRequests.length === 0, 'preferencia determinista known no se envía ni reemplaza por IA')
check(knownEvaluation?.includes('1 de 1 preferencias evaluadas'), 'preferencia deterministic known permanece evaluada', knownEvaluation)

await page.goto(`${baseURL}/recomendaciones#hybrid-low-score`, { waitUntil: 'domcontentloaded' })
await select(['Drama', 'Tranquilo', 'Solo'])
const totalStart = performance.now()
await page.getByRole('button', { name: 'Encontrar películas', exact: true }).click()
await page.locator('.recommendation-card').first().waitFor({ timeout: 60_000 })
const totalMs = Number((performance.now() - totalStart).toFixed(1))
const firstBadge = (await page.locator('.recommendation-card__match').first().textContent())?.trim()
const firstEvaluation = (await page.locator('.recommendation-card__evaluation').first().textContent())?.replace(/\s+/g, ' ').trim()
check(firstBadge === '18% de coincidencia', 'score bajo + confianza alta reduce coincidencia', firstBadge)
check(firstEvaluation?.includes('2 de 2 preferencias evaluadas'), 'IA aumenta coverage sólo al resolver unknown', firstEvaluation)
check(report.aiRequests.length <= 2 && report.aiRequests.every((request) => request.movieCount <= 6), '12 candidatos usan máximo 2 batches de 6', report.aiRequests.map((request) => request.movieCount))
check(report.aiRequests.flatMap((request) => request.requested).every((movie) => movie.dimensions.every(({ dimension, target }) => (dimension === 'pace' && target === 'calm') || (dimension === 'company' && target === 'alone'))), 'sólo se envían dimensiones unknown activas')

const requestsAfterFirstSearch = report.aiRequests.length
await page.getByRole('button', { name: /Ajustar filtros/ }).click()
await page.getByRole('dialog').getByRole('button', { name: 'Aplicar cambios', exact: true }).click()
await page.locator('.recommendation-card').first().waitFor()
check(report.aiRequests.length === requestsAfterFirstSearch, 'repetir búsqueda reutiliza caché IA')

const titlesBefore = await page.locator('.recommendation-card h3').allTextContents()
await page.locator('.recommendation-card__details').first().click()
await page.waitForURL(/\/pelicula\/\d+/)
await page.goBack({ waitUntil: 'domcontentloaded' })
await page.locator('.recommendation-card').first().waitFor({ timeout: 60_000 })
const titlesAfter = await page.locator('.recommendation-card h3').allTextContents()
check(JSON.stringify(titlesAfter) === JSON.stringify(titlesBefore), 'detalle → Atrás restaura resultados enriquecidos')
check(report.aiRequests.length === requestsAfterFirstSearch, 'detalle → Atrás reutiliza caché IA')

aiMode = 'failure'
await page.goto(`${baseURL}/recomendaciones#ai-failure`, { waitUntil: 'domcontentloaded' })
await select(['Romance', 'Equilibrado', 'En pareja'])
await page.getByRole('button', { name: 'Encontrar películas', exact: true }).click()
await page.locator('.recommendation-card').first().waitFor({ timeout: 60_000 })
check(await page.locator('.recommendation-card').count() > 0, 'fallo IA conserva recomendaciones deterministas')
check((await page.locator('.recommendation-card__match').first().textContent())?.includes('determinar'), 'fallo IA conserva unknown explícito')

const heights = await page.locator('.recommendation-card').evaluateAll((cards) => cards.map((card) => Number(card.getBoundingClientRect().height.toFixed(2))))
check(Math.max(...heights) - Math.min(...heights) <= 1, 'cards enriquecidas mantienen altura uniforme', [...new Set(heights)])
check(report.errors.length === 0, 'sin errores de consola o React', report.errors)

report.performance = {
  mockedAIRequestMs: report.aiRequests.filter((request) => request.durationMs != null).map((request) => request.durationMs),
  totalFirstSearchMs: totalMs,
  note: 'IA simulada; TMDB y total no representan latencia de proveedores reales.',
}

await page.screenshot({ path: `${outputDir}/hybrid-fallback.png`, fullPage: true })
await browser.close()
await writeFile(`${outputDir}/report.json`, JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify(report, null, 2))
if (report.status !== 'PASS') process.exitCode = 1
