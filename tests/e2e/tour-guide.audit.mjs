import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173'
const outputDir = 'test-results/tour-guide'
await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'es-ES' })
const report = { status: 'PASS', checks: [], errors: [] }
const check = (condition, name) => {
  report.checks.push({ name, pass: Boolean(condition) })
  if (!condition) report.status = 'FAIL'
}
page.on('pageerror', (error) => report.errors.push(error.message))

await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
await page.getByRole('button', { name: 'Iniciar tutorial de FilmDNA' }).click()
check(await page.getByRole('dialog').isVisible(), 'El botón abre un diálogo modal')
check(await page.getByRole('heading', { name: 'Bienvenido a FilmDNA' }).isVisible(), 'Muestra bienvenida')

await page.getByRole('button', { name: 'Siguiente' }).click()
check(await page.getByRole('heading', { name: 'Empieza por cómo quieres sentirte' }).isVisible(), 'Explica el selector de experiencia')
check(await page.locator('.tour-spotlight').isVisible(), 'Resalta el elemento explicado')

await page.getByRole('button', { name: 'Siguiente' }).click()
await page.waitForURL('**/explorar')
check(await page.locator('#tour-title').getByText('Explora el catálogo', { exact: true }).isVisible(), 'Navega a Explorar')

await page.getByRole('button', { name: 'Siguiente' }).click()
await page.waitForURL('**/recomendaciones')
check(await page.getByRole('heading', { name: 'Describe lo que quieres ver' }).isVisible(), 'Navega a Recomendaciones')

await page.getByRole('button', { name: 'Siguiente' }).click()
check(await page.getByRole('heading', { name: 'Adapta la interfaz' }).isVisible(), 'Explica Accesibilidad')

await page.getByRole('button', { name: 'Siguiente' }).click()
await page.waitForURL(baseURL + '/')
check(await page.getByRole('heading', { name: 'Encuentra ayuda cuando la necesites' }).isVisible(), 'Finaliza en el FAQ')
await page.getByRole('button', { name: 'Finalizar' }).click()
check(await page.getByRole('dialog').count() === 0, 'Finalizar cierra el tour')
check(await page.evaluate(() => localStorage.getItem('filmdna_tour_completed_v1')) === 'true', 'Recuerda que el tour fue completado')
check(await page.getByRole('button', { name: 'Repetir tutorial de FilmDNA' }).isVisible(), 'Permite repetir el tutorial')

await page.setViewportSize({ width: 375, height: 760 })
await page.getByRole('button', { name: 'Repetir tutorial de FilmDNA' }).click()
check((await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)), 'Sin overflow a 375px')
await page.keyboard.press('Escape')
check(await page.getByRole('dialog').count() === 0, 'Escape permite omitir el tour')
check(report.errors.length === 0, 'Sin errores de página')

await writeFile(`${outputDir}/report.json`, JSON.stringify(report, null, 2))
await browser.close()
console.log(JSON.stringify(report, null, 2))
if (report.status !== 'PASS') process.exitCode = 1
