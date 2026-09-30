import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'
const outputDir = 'test-results/recommendations-performance'
await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'es-ES' })
const page = await context.newPage()
await page.route('**/api/ai/classify-movies', (route) => route.fulfill({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ provider: 'mock', model: 'mock-model', result: { invalid: true } }),
}))
const phases = new Map()
let phase = 'boot'
let activeTmdb = 0
let maxConcurrent = 0
const starts = new Map()

const phaseData = (name = phase) => {
  if (!phases.has(name)) phases.set(name, { requests: [], failed: [] })
  return phases.get(name)
}

page.on('request', (request) => {
  if (!request.url().startsWith('https://api.themoviedb.org/3/')) return
  const record = { url: request.url(), startedAt: performance.now(), type: request.resourceType() }
  phaseData().requests.push(record)
  starts.set(request, record)
  activeTmdb += 1
  maxConcurrent = Math.max(maxConcurrent, activeTmdb)
})
page.on('response', (response) => {
  const request = response.request()
  const record = starts.get(request)
  if (!record) return
  record.status = response.status()
  record.durationMs = Number((performance.now() - record.startedAt).toFixed(1))
  activeTmdb = Math.max(0, activeTmdb - 1)
  starts.delete(request)
})
page.on('requestfailed', (request) => {
  const record = starts.get(request)
  if (record) {
    record.failure = request.failure()?.errorText
    activeTmdb = Math.max(0, activeTmdb - 1)
    starts.delete(request)
  }
  phaseData().failed.push({ url: request.url(), error: request.failure()?.errorText })
})

const prepareResultCycle = async () => page.evaluate(() => {
  window.__recommendationCycle = new Promise((resolve) => {
    let enteredLoading = false
    const root = document.querySelector('.recommendation-results') || document.body
    const observer = new MutationObserver(() => {
      const loading = Boolean(document.querySelector('.movie-skeleton')) || !document.querySelector('.recommendation-card')
      if (loading) enteredLoading = true
      if (enteredLoading && document.querySelector('.recommendation-card') && !document.querySelector('.movie-skeleton')) {
        observer.disconnect()
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now())))
      }
    })
    observer.observe(root, { childList: true, subtree: true })
  })
})

const runResultCycle = async (name, action) => {
  phase = name
  await prepareResultCycle()
  const start = await page.evaluate(() => performance.now())
  await action()
  const end = await page.evaluate(() => window.__recommendationCycle)
  return Number((end - start).toFixed(1))
}

phase = 'boot'
await page.goto(`${baseURL}/recomendaciones`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
await page.getByRole('button', { name: 'Comedia', exact: true }).click()
await page.getByRole('button', { name: 'Reír', exact: true }).click()

const coldTotalMs = await runResultCycle('cold-search', async () => {
  await page.getByRole('button', { name: 'Encontrar películas', exact: true }).click()
})

const coldRequests = phaseData('cold-search').requests
const discover = coldRequests.find((request) => request.url.includes('/discover/movie'))
const details = coldRequests.filter((request) => /\/movie\/\d+\?/.test(request.url))

await page.getByRole('button', { name: /Ajustar filtros/ }).click()
const cachedRepeatMs = await runResultCycle('cached-repeat', async () => {
  await page.getByRole('dialog').getByRole('button', { name: 'Aplicar cambios', exact: true }).click()
})

phase = 'sort-only'
const beforeSort = await page.locator('.recommendation-card h3').allTextContents()
const sortStart = await page.evaluate(() => performance.now())
await page.locator('.results-sort select').selectOption('rating')
await page.waitForFunction((before) => {
  const current = [...document.querySelectorAll('.recommendation-card h3')].map((node) => node.textContent)
  return JSON.stringify(current) !== JSON.stringify(before)
}, beforeSort)
const sortEnd = await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now())))))
const sortOnlyMs = Number((sortEnd - sortStart).toFixed(1))

await page.getByRole('button', { name: /Ajustar filtros/ }).click()
await page.getByRole('dialog').getByRole('button', { name: 'Reír', exact: true }).click()
await page.getByRole('dialog').getByRole('button', { name: 'Emocionarme', exact: true }).click()
const localFilterChangeMs = await runResultCycle('local-filter-change', async () => {
  await page.getByRole('dialog').getByRole('button', { name: 'Aplicar cambios', exact: true }).click()
})

const allActualRequests = [...phases.values()].flatMap((entry) => entry.requests)
const repeatedUrls = Object.entries(allActualRequests.reduce((counts, request) => {
  counts[request.url] = (counts[request.url] || 0) + 1
  return counts
}, {})).filter(([, count]) => count > 1)

const result = {
  measuredAt: new Date().toISOString(),
  coldSearch: {
    totalToResultsMs: coldTotalMs,
    requestCount: coldRequests.length,
    discoverMs: discover?.durationMs ?? null,
    detailsMs: details.map((request) => ({
      id: request.url.match(/\/movie\/(\d+)/)?.[1],
      durationMs: request.durationMs,
      status: request.status,
    })),
    fastestDetailMs: Math.min(...details.map((request) => request.durationMs)),
    slowestDetailMs: Math.max(...details.map((request) => request.durationMs)),
    averageDetailMs: Number((details.reduce((sum, request) => sum + request.durationMs, 0) / details.length).toFixed(1)),
  },
  cachedRepeat: { totalToResultsMs: cachedRepeatMs, networkRequests: phaseData('cached-repeat').requests.length },
  sortOnly: { totalMs: sortOnlyMs, networkRequests: phaseData('sort-only').requests.length },
  localExperienceFilterChange: { totalToResultsMs: localFilterChangeMs, networkRequests: phaseData('local-filter-change').requests.length },
  network: {
    bootRequests: phaseData('boot').requests.length,
    maxConcurrentTmdbRequests: maxConcurrent,
    repeatedActualUrls: repeatedUrls,
    failures: [...phases.values()].flatMap((entry) => entry.failed),
  },
}

result.assertions = [
  { name: 'Búsqueda fría menor de 2 s', pass: coldTotalMs < 2000, actual: coldTotalMs },
  { name: 'Repetición usa caché sin nuevas solicitudes', pass: phaseData('cached-repeat').requests.length === 0, actual: phaseData('cached-repeat').requests.length },
  { name: 'Ordenamiento no usa red', pass: phaseData('sort-only').requests.length === 0, actual: phaseData('sort-only').requests.length },
  { name: 'Cambio de preferencia local no descarga detalles', pass: phaseData('local-filter-change').requests.length === 0, actual: phaseData('local-filter-change').requests.length },
  { name: 'No hay URL repetidas', pass: repeatedUrls.length === 0, actual: repeatedUrls },
]

await page.screenshot({ path: `${outputDir}/desktop-after-local-change.png`, fullPage: true })
await browser.close()
await writeFile(`${outputDir}/report.json`, JSON.stringify(result, null, 2), 'utf8')
console.log(JSON.stringify(result, null, 2))
if (result.assertions.some((assertion) => !assertion.pass)) process.exitCode = 1
