import { chromium } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { buildMovieDNA } from '../../src/services/recommendations/movieDNA.js'
import { calculateCompatibility } from '../../src/services/recommendations/compatibilityService.js'
import { INITIAL_SELECTIONS, OPTION_GROUPS } from '../../src/config/recommendationConfig.js'

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'
const outputDir = 'test-results/recommendations-audit'
await mkdir(outputDir, { recursive: true })
const previousReport = await readFile(`${outputDir}/report.json`, 'utf8').then(JSON.parse).catch(() => null)

const scenarios = [
  { id: '01-comedia', name: 'Comedia + Reír', filters: ['Comedia', 'Reír'], preferences: { genres: ['35'], mood: 'laugh' } },
  { id: '02-terror', name: 'Terror + Asustarme + Sin descanso', filters: ['Terror', 'Asustarme', 'Sin descanso'], preferences: { genres: ['27'], mood: 'fear', pace: 'relentless' } },
  { id: '03-ciencia-ficcion', name: 'Ciencia ficción + Pensar + Quiero concentrarme', filters: ['Ciencia ficción', 'Pensar', 'Quiero concentrarme'], preferences: { genres: ['878'], mood: 'think', attention: 'focus' } },
  { id: '04-animacion', name: 'Animación + Emocionarme + En familia', filters: ['Animación', 'Emocionarme', 'En familia'], preferences: { genres: ['16'], mood: 'feel', company: 'family' } },
  { id: '05-drama', name: 'Drama + Tranquilo + Solo', filters: ['Drama', 'Tranquilo', 'Solo'], preferences: { genres: ['18'], pace: 'calm', company: 'alone' } },
  { id: '06-romance', name: 'Romance + Equilibrado + En pareja', filters: ['Romance', 'Equilibrado', 'En pareja'], preferences: { genres: ['10749'], pace: 'balanced', company: 'couple' } },
]

const report = {
  generatedAt: new Date().toISOString(),
  baseURL,
  scenarios: [],
  interface: { checks: [], errors: [] },
  restrictive: null,
  global: { consoleErrors: [], pageErrors: [], failedRequests: [], brokenImages: [] },
  responsive: [],
  beforeAfter: [],
}

let currentRun = 'setup'
const networkByRun = new Map()
const detailsByRun = new Map()
const getRunList = (map) => {
  if (!map.has(currentRun)) map.set(currentRun, [])
  return map.get(currentRun)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'es-ES' })
const page = await context.newPage()
await page.route('**/api/ai/classify-movies', (route) => route.fulfill({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ provider: 'mock', model: 'mock-model', result: { invalid: true } }),
}))

page.on('console', (message) => {
  if (message.type() === 'error') report.global.consoleErrors.push({ run: currentRun, text: message.text() })
})
page.on('pageerror', (error) => report.global.pageErrors.push({ run: currentRun, text: error.message }))
page.on('request', (request) => {
  if (request.url().startsWith('https://api.themoviedb.org/3/')) getRunList(networkByRun).push(request.url())
})
page.on('requestfailed', (request) => report.global.failedRequests.push({ run: currentRun, url: request.url(), error: request.failure()?.errorText }))
page.on('response', async (response) => {
  const url = response.url()
  if (!url.startsWith('https://api.themoviedb.org/3/movie/')) return
  if (!/[?&]append_to_response=/.test(url)) return
  try {
    const data = await response.json()
    if (!detailsByRun.has(currentRun)) detailsByRun.set(currentRun, new Map())
    detailsByRun.get(currentRun).set(Number(data.id), data)
  } catch {
    // El estado HTTP se valida mediante requests fallidos y resultados visibles.
  }
})

const waitForOutcome = async () => {
  await page.locator('.recommendation-results').waitFor({ state: 'visible', timeout: 60_000 })
  await page.locator('.recommendation-card, .content-state').first().waitFor({ state: 'visible', timeout: 60_000 })
}

const navigateFresh = async (suffix) => {
  await page.goto('about:blank')
  await page.goto(`${baseURL}/recomendaciones#${suffix}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
}

const setFilters = async (labels) => {
  for (const label of labels) {
    const exact = page.getByRole('button', { name: label, exact: true })
    const button = await exact.count() ? exact : page.getByRole('button').filter({ hasText: label }).first()
    await button.click()
    if (await button.getAttribute('aria-pressed') !== 'true') throw new Error(`El filtro no quedó seleccionado: ${label}`)
  }
}

const activeFilterTexts = async () => page.locator('.active-filters button').allTextContents().then((items) => items.map((item) => item.replace('×', '').trim()))

const formatRuntime = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours ? `${hours}h ${rest ? `${rest} min` : ''}`.trim() : `${rest} min`
}

const checkOrdering = (badges) => {
  let unknownSeen = false
  let previous = Number.POSITIVE_INFINITY
  for (const badge of badges) {
    if (badge.includes('determinar')) {
      unknownSeen = true
      continue
    }
    const value = Number.parseInt(badge, 10)
    if (unknownSeen || value > previous) return false
    previous = value
  }
  return true
}

const inspectCards = async (preferences, runId) => {
  const cards = page.locator('.recommendation-card')
  const count = await cards.count()
  const details = detailsByRun.get(runId) || new Map()
  const fullPreferences = { ...INITIAL_SELECTIONS, genres: [], providers: [], ...preferences }
  const output = []
  const validations = []

  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index)
    const href = await card.locator('.recommendation-card__details').getAttribute('href')
    const id = Number(href?.split('/').pop())
    const detail = details.get(id)
    const title = (await card.locator('h3').textContent())?.trim()
    const badge = (await card.locator('.recommendation-card__match').textContent())?.trim()
    const facts = (await card.locator('.recommendation-card__facts').textContent())?.replace(/\s+/g, ' ').trim() || ''
    const reasons = await card.locator('.recommendation-card__reasons li').allTextContents().then((items) => items.map((item) => item.replace('✓', '').trim()))
    const providerLocator = card.locator('.recommendation-card__providers')
    const providerText = await providerLocator.count() ? (await providerLocator.textContent())?.trim() || '' : ''

    if (!detail) {
      validations.push({ pass: false, message: `${title}: no se capturó detalle enriquecido de TMDB` })
      output.push({ id, title, badge, reasons, facts, providerText })
      continue
    }

    const dna = buildMovieDNA(detail, { region: 'ES' })
    const expected = calculateCompatibility(fullPreferences, dna, { optionGroups: OPTION_GROUPS })
    const expectedBadge = expected.percentage === null ? 'Sin criterios para calcular' : `${expected.percentage}% coincidencia`
    const evaluationText = (await card.locator('.recommendation-card__evaluation').textContent().catch(() => ''))?.replace(/\s+/g, ' ').trim() || ''
    validations.push({ pass: badge === expectedBadge, message: `${title}: porcentaje ${badge}; esperado ${expectedBadge}` })
    validations.push({ pass: JSON.stringify(reasons) === JSON.stringify(expected.reasons.map((reason) => reason.text)), message: `${title}: razones respaldadas por el cálculo` })
    validations.push({ pass: !badge.startsWith('0%'), message: `${title}: no muestra 0% para unknown` })
    validations.push({ pass: expected.evaluatedPreferences.length + expected.unknownPreferences.length === Object.keys(preferences).filter((key) => key !== 'genres').length, message: `${title}: toda preferencia experiencial queda evaluada o unknown` })
    const evaluatedTotal = expected.evaluatedPreferences.length + expected.evaluatedCriteria.length
    const criteriaTotal = evaluatedTotal + expected.unknownPreferences.length + expected.unknownCriteria.length
    validations.push({ pass: criteriaTotal === 0 || evaluationText.includes(`${evaluatedTotal} de ${criteriaTotal}`), message: `${title}: cobertura parcial visible` })
    validations.push({ pass: expected.unknownPreferences.length === 0 || evaluationText.includes('Sin datos suficientes'), message: `${title}: preferencias unknown visibles` })

    const selectedGenres = new Set(fullPreferences.genres.map(Number))
    const detailGenres = new Set(detail.genres.map((genre) => Number(genre.id)))
    validations.push({ pass: !selectedGenres.size || [...selectedGenres].some((idValue) => detailGenres.has(idValue)), message: `${title}: respeta género objetivo` })

    const expectedYear = detail.release_date?.slice(0, 4)
    const expectedRuntime = Number.isFinite(detail.runtime) && detail.runtime > 0 ? formatRuntime(detail.runtime) : null
    const expectedRating = detail.vote_count > 0 ? detail.vote_average.toFixed(1) : null
    validations.push({ pass: !expectedYear || facts.includes(expectedYear), message: `${title}: año coincide con TMDB` })
    validations.push({ pass: !expectedRuntime || facts.includes(expectedRuntime), message: `${title}: duración coincide con TMDB` })
    validations.push({ pass: !expectedRating || facts.includes(expectedRating), message: `${title}: puntuación coincide con TMDB` })

    const realProviders = [...(detail['watch/providers']?.results?.ES?.flatrate || []), ...(detail['watch/providers']?.results?.ES?.free || []), ...(detail['watch/providers']?.results?.ES?.ads || [])].map((provider) => provider.provider_name)
    validations.push({ pass: !providerText || realProviders.some((name) => providerText.includes(name)), message: `${title}: plataforma procede de TMDB/JustWatch` })
    output.push({ id, title, badge, percentage: expected.percentage, coverage: expected.coverage, confidence: expected.confidence, confidenceLabel: expected.confidenceLabel, evaluatedPreferences: expected.evaluatedPreferences.map(({ key, label }) => ({ key, label })), unknownPreferences: expected.unknownPreferences, reasons, facts, providerText })
  }
  return { cards: output, validations }
}

for (const scenario of scenarios) {
  currentRun = scenario.id
  console.log(`Ejecutando ${scenario.name}`)
  await navigateFresh(`scenario-${scenario.id}`)
  await setFilters(scenario.filters)
  await page.getByRole('button', { name: 'Encontrar películas', exact: true }).click()
  await waitForOutcome()

  const active = await activeFilterTexts()
  const cards = await inspectCards(scenario.preferences, scenario.id)
  const badges = cards.cards.map((card) => card.badge)
  const screenshot = `${outputDir}/${scenario.id}.png`
  await page.screenshot({ path: screenshot, fullPage: true })
  const bodyText = await page.locator('body').innerText()
  const broken = await page.locator('img').evaluateAll((images) => images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src))
  broken.forEach((url) => report.global.brokenImages.push({ run: currentRun, url }))
  const validations = [
    { pass: scenario.filters.every((filter) => active.includes(filter)), message: 'Filtros activos correctos' },
    { pass: cards.cards.length > 0, message: 'Aparecen resultados' },
    { pass: checkOrdering(badges), message: 'Compatibilidad evaluable antes de unknown y orden descendente' },
    { pass: !/(undefined|NaN)/.test(bodyText), message: 'No aparecen undefined ni NaN' },
    ...cards.validations,
  ]
  const cardHeights = await page.locator('.recommendation-card').evaluateAll((items) => items.map((item) => Number(item.getBoundingClientRect().height.toFixed(2))))
  validations.push({ pass: cardHeights.length < 2 || Math.max(...cardHeights) - Math.min(...cardHeights) <= 1, message: `Cards con altura uniforme (${[...new Set(cardHeights)].join(', ')} px)` })
  const requests = networkByRun.get(scenario.id) || []
  report.scenarios.push({
    id: scenario.id,
    name: scenario.name,
    status: validations.every((check) => check.pass) ? 'PASS' : 'FAIL',
    filters: scenario.filters,
    activeFilters: active,
    movies: cards.cards,
    validations,
    tmdbRequests: requests.length,
    tmdbRequestBreakdown: {
      discover: requests.filter((url) => url.includes('/discover/movie')).length,
      enrichedDetails: requests.filter((url) => /\/movie\/\d+\?/.test(url)).length,
      providerLists: requests.filter((url) => url.includes('/watch/providers/movie')).length,
    },
    screenshot,
  })
}

currentRun = 'interface'
console.log('Ejecutando interacciones auxiliares')
await navigateFresh('interface')
await setFilters(['Comedia', 'Reír'])
await page.getByRole('button', { name: 'Encontrar películas', exact: true }).click()
await waitForOutcome()

const interfaceCheck = async (name, action) => {
  try {
    await action()
    report.interface.checks.push({ name, status: 'PASS' })
  } catch (error) {
    report.interface.checks.push({ name, status: 'FAIL', error: error.message })
  }
}

await interfaceCheck('Abrir y cerrar Ajustar filtros', async () => {
  await page.getByRole('button', { name: /Ajustar filtros/ }).click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click()
  await page.getByRole('dialog').waitFor({ state: 'detached' })
})
await interfaceCheck('Cambiar filtros y Aplicar cambios', async () => {
  await page.getByRole('button', { name: /Ajustar filtros/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Drama', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Aplicar cambios', exact: true }).click()
  await waitForOutcome()
  const active = await activeFilterTexts()
  if (!active.includes('Drama')) throw new Error('Drama no aparece entre filtros activos')
})
await interfaceCheck('Ordenar por Mejor compatibilidad', async () => {
  await page.locator('.results-sort select').selectOption('compatibility')
  const badges = await page.locator('.recommendation-card__match').allTextContents()
  if (!checkOrdering(badges)) throw new Error('El orden de compatibilidad no es válido')
})
await interfaceCheck('Restaurar resultados al volver desde un detalle', async () => {
  const filtersBefore = await activeFilterTexts()
  const titlesBefore = await page.locator('.recommendation-card h3').allTextContents()
  await page.locator('.recommendation-card__details').first().click()
  await page.waitForURL(/\/pelicula\/\d+/)
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await page.waitForURL(/\/recomendaciones\?/)
  await waitForOutcome()
  const filtersAfter = await activeFilterTexts()
  const titlesAfter = await page.locator('.recommendation-card h3').allTextContents()
  if (!titlesAfter.length) throw new Error('Los resultados quedaron vacíos al volver')
  if (JSON.stringify(filtersAfter) !== JSON.stringify(filtersBefore)) throw new Error('Los filtros no se restauraron correctamente')
  if (JSON.stringify(titlesAfter) !== JSON.stringify(titlesBefore)) throw new Error('Los resultados restaurados no coinciden con la búsqueda anterior')
})
await interfaceCheck('No me interesa', async () => {
  const before = await page.locator('.recommendation-card').count()
  await page.locator('.recommendation-card').first().getByRole('button', { name: /No recomendar/ }).click()
  const after = await page.locator('.recommendation-card').count()
  if (after !== before - 1) throw new Error(`Esperaba ${before - 1} cards y hay ${after}`)
})
await interfaceCheck('Limpiar filtros', async () => {
  await page.getByRole('button', { name: /Ajustar filtros/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Limpiar', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Aplicar cambios', exact: true }).click()
  await waitForOutcome()
  if (await page.locator('.active-filters button').count()) throw new Error('Quedaron filtros activos')
})
await page.screenshot({ path: `${outputDir}/07-interface.png`, fullPage: true })

for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 900 }, { width: 390, height: 844 }]) {
  await page.setViewportSize(viewport)
  await navigateFresh(`responsive-${viewport.width}`)
  const naturalSearch = page.locator('.natural-search')
  const action = naturalSearch.locator('.natural-search__action')
  const metrics = await naturalSearch.evaluate((element) => ({ width: element.getBoundingClientRect().width, scrollWidth: element.scrollWidth }))
  const disabledStyle = await action.evaluate((element) => ({ disabled: element.disabled, cursor: getComputedStyle(element).cursor, boxShadow: getComputedStyle(element).boxShadow }))
  const pass = metrics.scrollWidth <= metrics.width + 1 && disabledStyle.disabled && disabledStyle.cursor === 'not-allowed' && disabledStyle.boxShadow === 'none'
  const screenshot = `${outputDir}/responsive-${viewport.width}.png`
  await page.screenshot({ path: screenshot, fullPage: true })
  report.responsive.push({ viewport, status: pass ? 'PASS' : 'FAIL', metrics, disabledStyle, screenshot })
}

currentRun = 'restrictive'
console.log('Ejecutando combinación restrictiva')
await navigateFresh('restrictive')
await page.getByRole('button', { name: 'Experto', exact: true }).click()
await setFilters(['Terror', 'Menos de 90 min', 'Clásicos'])
await page.locator('input[type="range"]').fill('9')
await page.getByRole('button', { name: 'Encontrar películas', exact: true }).click()
await waitForOutcome()
const restrictiveCards = await page.locator('.recommendation-card').count()
const restrictiveState = await page.locator('.content-state').innerText().catch(() => '')
await page.screenshot({ path: `${outputDir}/08-restrictive.png`, fullPage: true })
report.restrictive = {
  status: restrictiveCards === 0 && restrictiveState.includes('No encontramos películas') ? 'PASS' : 'FAIL',
  cards: restrictiveCards,
  state: restrictiveState.replace(/\s+/g, ' ').trim(),
  tmdbRequests: (networkByRun.get('restrictive') || []).length,
}

if (previousReport?.scenarios) {
  report.beforeAfter = report.scenarios.map((scenario) => {
    const beforeScenario = previousReport.scenarios.find((item) => item.id === scenario.id)
    const previousByTitle = new Map((beforeScenario?.movies || []).map((movie) => [movie.title, movie]))
    return {
      id: scenario.id,
      name: scenario.name,
      commonMovies: scenario.movies.filter((movie) => previousByTitle.has(movie.title)).map((movie) => ({
        title: movie.title,
        beforePercentage: previousByTitle.get(movie.title).percentage ?? null,
        afterPercentage: movie.percentage,
        coverage: movie.coverage,
        confidence: movie.confidence,
        evaluatedPreferences: movie.evaluatedPreferences,
        unknownPreferences: movie.unknownPreferences,
      })),
    }
  })
}

await browser.close()
await writeFile(`${outputDir}/report.json`, JSON.stringify(report, null, 2), 'utf8')
console.log(JSON.stringify({
  scenarios: report.scenarios.map(({ name, status, tmdbRequests }) => ({ name, status, tmdbRequests })),
  interface: report.interface,
  restrictive: report.restrictive,
  global: report.global,
  report: `${outputDir}/report.json`,
}, null, 2))
