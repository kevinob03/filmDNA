import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'
const outputDir = 'test-results/recommendations-search'
await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'es-ES' })
const page = await context.newPage()
const report = { status: 'PASS', checks: [], requests: [], errors: [], performance: [], responsive: [] }
let responseMode = 'success'

const intent = (filters, unmappedTerms = []) => ({
  provider: 'mock', model: 'mock-intent-model',
  result: { schemaVersion: 'recommendation-search-intent-v1', filters, unmappedTerms, confidence: 0.92 },
})

await page.route('**/api/ai/interpret-search', async (route) => {
  const startedAt = performance.now()
  const query = route.request().postDataJSON()?.query || ''
  const record = { query, mode: responseMode }
  report.requests.push(record)
  if (responseMode === 'failure') {
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'unavailable' }) })
  } else if (responseMode === 'invalid') {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(intent({ tone: 'epic' })) })
  } else if (responseMode === 'empty') {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(intent({}, ['petición ambigua'])) })
  } else {
    let filters = { genres: ['35'], mood: 'laugh' }
    if (/oscura|ciencia/i.test(query)) filters = { genres: ['878'], mood: 'think' }
    if (/familia/i.test(query)) filters = { company: 'family' }
    if (/2020|español/i.test(query)) filters = { genres: ['18'], era: '2020s', language: 'es', minRating: 7.5 }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(intent(filters)) })
  }
  record.durationMs = Number((performance.now() - startedAt).toFixed(1))
})

await page.route('**/api/ai/classify-movies', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'unavailable' }) }))
page.on('pageerror', (error) => report.errors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error' && !message.text().includes('503 (Service Unavailable)')) report.errors.push(message.text())
})

const check = (condition, name, details = null) => {
  report.checks.push({ name, pass: Boolean(condition), details })
  if (!condition) report.status = 'FAIL'
}
const reset = async () => {
  responseMode = 'success'
  await page.goto(`${baseURL}/recomendaciones`, { waitUntil: 'domcontentloaded' })
}
const search = async (query) => {
  await page.getByRole('textbox', { name: 'Describe lo que buscas con tus propias palabras' }).fill(query)
  const startedAt = performance.now()
  await page.getByRole('button', { name: 'Buscar con IA' }).click()
  await page.locator('.intent-feedback').waitFor()
  const totalMs = Number((performance.now() - startedAt).toFixed(1))
  report.performance.push({ query, totalMs })
}
const waitForResults = async () => page.locator('.recommendation-card').first().waitFor({ timeout: 60_000 })
const activeFilter = (name) => page.locator('.active-filters button').filter({ hasText: name })

await reset()
const requestCountBeforeEmpty = report.requests.length
const searchButton = page.getByRole('button', { name: 'Buscar con IA' })
check(await searchButton.isDisabled(), 'D: query vacía mantiene botón disabled')
check(report.requests.length === requestCountBeforeEmpty, 'D: query vacía produce 0 requests IA')

await search('Quiero reírme con una comedia ligera')
await waitForResults()
check(await activeFilter('Comedia').isVisible(), 'A: género Comedia visible')
check(await activeFilter('Reír').isVisible(), 'A: estado Reír visible')

await reset()
await search('Una película oscura de ciencia ficción que me haga pensar')
await waitForResults()
check(await activeFilter('Ciencia ficción').isVisible(), 'B: Ciencia ficción visible')
check(await activeFilter('Pensar').isVisible(), 'B: Pensar visible')
await page.getByRole('button', { name: /Ajustar filtros/ }).click()
check(await page.getByRole('dialog').getByRole('button', { name: 'Sencillo' }).getAttribute('aria-pressed') === 'true', 'B: conserva modo Sencillo cuando no necesita Experto')
await page.getByRole('dialog').getByLabel('Cerrar filtros').click()

await reset()
await search('Algo para ver en familia')
await waitForResults()
check(await activeFilter('En familia').isVisible(), 'C: compañía En familia visible')

await reset()
await page.getByRole('button', { name: 'Drama', exact: true }).click()
responseMode = 'invalid'
await search('devuelve un tono inventado')
check(await page.getByRole('alert').getByText(/no está disponible temporalmente/i).isVisible(), 'E: respuesta con filtro inválido no se aplica')
check(await page.getByRole('button', { name: 'Drama', exact: true }).getAttribute('aria-pressed') === 'true', 'E: conserva filtros manuales ante respuesta inválida')

await reset()
responseMode = 'empty'
await search('sorpréndeme con cualquier cosa imposible de mapear')
check(await page.getByRole('alert').getByText(/No pude convertir/i).isVisible(), 'F: consulta no interpretable muestra mensaje útil')
check(await page.locator('.recommendation-results').count() === 0, 'F: consulta no interpretable no ejecuta búsqueda genérica')

await reset()
await page.getByRole('button', { name: 'Drama', exact: true }).click()
responseMode = 'failure'
await search('quiero un drama')
check(await page.getByRole('alert').getByText(/no está disponible temporalmente/i).isVisible(), 'G: fallo IA muestra error controlado')
await page.getByRole('button', { name: 'Encontrar películas', exact: true }).click()
await waitForResults()
check(await page.locator('.recommendation-card').count() > 0, 'G: filtros manuales continúan funcionando')

await reset()
await search('Quiero reírme con una comedia ligera')
await waitForResults()
const titlesBefore = await page.locator('.recommendation-card h3').allTextContents()
await page.locator('.recommendation-card__details').first().click()
await page.waitForURL(/\/pelicula\/\d+/)
await page.goBack({ waitUntil: 'domcontentloaded' })
await waitForResults()
check(JSON.stringify(await page.locator('.recommendation-card h3').allTextContents()) === JSON.stringify(titlesBefore), 'H: Atrás restaura resultados')
check(await activeFilter('Comedia').isVisible(), 'H: Atrás restaura filtros interpretados')

await page.getByRole('button', { name: /Ajustar filtros/ }).click()
await page.getByRole('dialog').getByRole('button', { name: 'Reír', exact: true }).click()
await page.getByRole('dialog').getByRole('button', { name: 'Asustarme', exact: true }).click()
await page.getByRole('dialog').getByRole('button', { name: 'Aplicar cambios', exact: true }).click()
await waitForResults()
check(await activeFilter('Asustarme').isVisible(), 'I: edición manual usa el valor nuevo')
check(await activeFilter('Reír').count() === 0, 'I: valor interpretado anterior deja de aplicarse')

await search('Algo para ver en familia')
await waitForResults()
check(await activeFilter('En familia').isVisible(), 'J: nueva búsqueda aplica intención nueva')
check(await activeFilter('Comedia').count() === 0 && await activeFilter('Asustarme').count() === 0, 'J: no acumula filtros incompatibles anteriores')

await reset()
await search('Drama español de los 2020 con al menos 7.5')
await waitForResults()
await page.getByRole('button', { name: /Ajustar filtros/ }).click()
check(await page.getByRole('dialog').getByRole('button', { name: 'Experto' }).getAttribute('aria-pressed') === 'true', 'Experto: cambia sólo cuando la intención usa filtros expertos')
check(await page.getByRole('dialog').getByLabel('Idioma original').inputValue() === 'es', 'Experto: idioma interpretado editable')
await page.getByRole('dialog').getByLabel('Cerrar filtros').click()

for (const width of [390, 768, 1440]) {
  await page.setViewportSize({ width, height: 900 })
  await reset()
  await page.getByRole('textbox', { name: 'Describe lo que buscas con tus propias palabras' }).fill('comedia ligera')
  const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  const controlsVisible = await page.getByRole('button', { name: 'Buscar con IA' }).isVisible() && await page.getByRole('textbox', { name: 'Describe lo que buscas con tus propias palabras' }).isVisible()
  check(metrics.scrollWidth <= metrics.clientWidth && controlsVisible, `Responsive ${width}px sin overflow y con controles visibles`, metrics)
  report.responsive.push({ width, ...metrics, controlsVisible })
  await page.screenshot({ path: `${outputDir}/responsive-${width}.png`, fullPage: true })
}

check(report.requests.every((request) => request.query.trim()), 'ninguna request IA contiene query vacía')
check(report.errors.length === 0, 'sin errores de consola o React', report.errors)
report.performanceNote = 'Frontera IA simulada; mide overhead estructural y recomendación local/TMDB, no latencia real de proveedores.'
report.performance = report.performance.map((measurement, index) => ({
  ...measurement,
  mockedInterpretationMs: report.requests[index]?.durationMs ?? null,
  recommendationAndUiMs: Number(Math.max(0, measurement.totalMs - (report.requests[index]?.durationMs || 0)).toFixed(1)),
}))

await browser.close()
await writeFile(`${outputDir}/report.json`, JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify(report, null, 2))
if (report.status !== 'PASS') process.exitCode = 1
