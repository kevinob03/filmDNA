import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'
const outputDir = 'test-results/home-content'
await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ locale: 'es-ES' })
const report = { status: 'PASS', checks: [], responsive: [], errors: [] }
const check = (condition, name) => {
  report.checks.push({ name, pass: Boolean(condition) })
  if (!condition) report.status = 'FAIL'
}

page.on('pageerror', (error) => report.errors.push(error.message))

for (const width of [375, 768, 1280]) {
  await page.setViewportSize({ width, height: 900 })
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
  const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
  check(metrics.scrollWidth <= metrics.clientWidth, `Home sin overflow a ${width}px`)
  report.responsive.push({ width, ...metrics })
}

check(await page.getByRole('heading', { name: 'Encuentra una película para hoy' }).isVisible(), 'Personalización presenta recomendaciones reales')
check(await page.getByRole('link', { name: 'Obtener recomendaciones' }).getAttribute('href') === '/recomendaciones', 'CTA de recomendaciones correcto')
check(await page.getByRole('link', { name: 'Explorar películas' }).getAttribute('href') === '/explorar', 'CTA de Movie DNA correcto')
check(await page.getByRole('heading', { name: 'Preguntas frecuentes' }).isVisible(), 'FAQ visible al final del Home')
await page.locator('summary').filter({ hasText: '¿Qué es FilmDNA?' }).click()
check(await page.getByText(/plataforma de descubrimiento cinematográfico/i).isVisible(), 'Acordeón FAQ responde')
check(await page.getByRole('link', { name: 'Ver todas las preguntas' }).getAttribute('href') === '/ayuda', 'Enlace al FAQ completo correcto')
check(await page.getByText(/Disponible en una fase posterior|Sin recomendaciones todavía|Vista conceptual · sin datos/i).count() === 0, 'Sin textos temporales obsoletos')
check(report.errors.length === 0, 'Sin errores de página')

await writeFile(`${outputDir}/report.json`, JSON.stringify(report, null, 2))
await browser.close()
console.log(JSON.stringify(report, null, 2))
if (report.status !== 'PASS') process.exitCode = 1
