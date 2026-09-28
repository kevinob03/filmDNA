import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'
const outputDir = 'test-results/recommendations-audit'
await mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: 'es-ES' })
const consoleErrors = []
const failedRequests = []
const tmdbRequests = []
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }))
page.on('request', (request) => { if (request.url().startsWith('https://api.themoviedb.org/3/')) tmdbRequests.push(request.url()) })

await page.goto(`${baseURL}/recomendaciones#restrictive`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
await page.getByRole('button', { name: 'Experto', exact: true }).click()
for (const label of ['Terror', 'Menos de 90 min', 'Clásicos']) await page.getByRole('button', { name: label, exact: true }).click()
await page.locator('input[type="range"]').fill('9')
await page.getByRole('button', { name: 'Encontrar películas', exact: true }).click()
await page.locator('.recommendation-card, .content-state').first().waitFor({ timeout: 60_000 })
const activeFilters = await page.locator('.active-filters button').allTextContents().then((items) => items.map((item) => item.replace('×', '').trim()))
const cards = await page.locator('.recommendation-card').count()
const state = await page.locator('.content-state').innerText().catch(() => '')
await page.screenshot({ path: `${outputDir}/08-restrictive-corrected.png`, fullPage: true })
const result = {
  status: activeFilters.includes('TMDB 9.0+') && cards === 0 && state.includes('No encontramos películas') ? 'PASS' : 'FAIL',
  activeFilters,
  cards,
  state: state.replace(/\s+/g, ' ').trim(),
  tmdbRequests: tmdbRequests.length,
  consoleErrors,
  failedRequests,
  screenshot: `${outputDir}/08-restrictive-corrected.png`,
}
await browser.close()
await writeFile(`${outputDir}/restrictive-report.json`, JSON.stringify(result, null, 2), 'utf8')
console.log(JSON.stringify(result, null, 2))
