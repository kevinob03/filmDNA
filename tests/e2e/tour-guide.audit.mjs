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

await page.getByRole('button', { name: 'Siguiente', exact: true }).click()
check(await page.getByRole('heading', { name: 'Busca según el momento' }).isVisible(), 'Distingue el selector rápido del perfil')
await page.locator('.tour-spotlight').waitFor()
check(await page.locator('.tour-spotlight').isVisible(), 'Resalta el elemento explicado')

await page.getByRole('button', { name: 'Siguiente', exact: true }).click()
check(await page.getByRole('heading', { name: 'Acompañamiento profesional opcional' }).isVisible(), 'Presenta la función profesional con sus límites')

await page.getByRole('button', { name: 'Siguiente', exact: true }).click()
await page.waitForURL('**/explorar')
check(await page.locator('#tour-title').getByText('Explora el catálogo', { exact: true }).isVisible(), 'Navega a Explorar')

await page.getByRole('button', { name: 'Siguiente', exact: true }).click()
await page.waitForURL('**/recomendaciones')
check(await page.getByRole('heading', { name: 'Encuentra una película para hoy' }).isVisible(), 'Explica coincidencia y búsqueda en Recomendaciones')

await page.getByRole('button', { name: 'Siguiente', exact: true }).click()
check(await page.getByRole('heading', { name: 'Conversa con FilmDNA' }).isVisible(), 'Presenta el chatbot global')

await page.getByRole('button', { name: 'Siguiente', exact: true }).click()
check(await page.getByRole('heading', { name: 'Adapta la interfaz' }).isVisible(), 'Explica Accesibilidad')

await page.getByRole('button', { name: 'Siguiente', exact: true }).click()
await page.waitForURL(baseURL + '/')
check(await page.getByRole('heading', { name: 'Encuentra ayuda cuando la necesites' }).isVisible(), 'Finaliza en el FAQ')
await page.getByRole('button', { name: 'Finalizar' }).click()
check(await page.getByRole('dialog').count() === 0, 'Finalizar cierra el tour')
check(await page.evaluate(() => localStorage.getItem('filmdna_tour_completed_v2')) === 'true', 'Recuerda que el Tour Guide v2 fue completado')
check(await page.getByRole('button', { name: 'Repetir tutorial de FilmDNA' }).isVisible(), 'Permite repetir el tutorial')
await page.waitForFunction(() => document.activeElement?.matches('[data-tour="trigger"]'))
check(await page.getByRole('button', { name: 'Repetir tutorial de FilmDNA' }).evaluate((element) => element === document.activeElement), 'Devuelve el foco al botón del tutorial')

await page.setViewportSize({ width: 375, height: 760 })
await page.getByRole('button', { name: 'Repetir tutorial de FilmDNA' }).click()
check((await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)), 'Sin overflow a 375px')
for (let index = 0; index < 6; index += 1) await page.getByRole('button', { name: 'Siguiente', exact: true }).click()
check(await page.getByRole('heading', { name: 'Adapta la interfaz' }).isVisible(), 'El recorrido móvil llega a Accesibilidad')
check(await page.locator('.tour-spotlight').isVisible(), 'Resalta el control móvil visible de Accesibilidad')
await page.keyboard.press('Escape')
check(await page.getByRole('dialog').count() === 0, 'Escape permite omitir el tour y devuelve el foco')

await page.evaluate(() => localStorage.setItem('filmdna_session', JSON.stringify({ id: 81, nombre: 'Psicóloga', email: 'psicologa@example.com', role: 'psychologist' })))
await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
await page.getByRole('button', { name: 'Repetir tutorial de FilmDNA' }).click()
for (let index = 0; index < 5; index += 1) await page.getByRole('button', { name: 'Siguiente', exact: true }).click()
await page.waitForURL('**/psicologo')
check(await page.getByRole('heading', { name: 'Tu espacio profesional' }).isVisible(), 'El rol psicólogo recibe un paso exclusivo para su panel')
await page.keyboard.press('Escape')

await page.evaluate(() => localStorage.setItem('filmdna_session', JSON.stringify({ id: 82, nombre: 'Usuario', email: 'usuario@example.com', role: 'usuario' })))
await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
await page.getByRole('button', { name: 'Repetir tutorial de FilmDNA' }).click()
for (let index = 0; index < 4; index += 1) await page.getByRole('button', { name: 'Siguiente', exact: true }).click()
await page.waitForURL('**/perfil')
check(await page.getByRole('heading', { name: 'Una selección que evoluciona contigo' }).isVisible(), 'El usuario recibe un paso para retomar el quiz desde Perfil')
await page.keyboard.press('Escape')
check(report.errors.length === 0, 'Sin errores de página')

await writeFile(`${outputDir}/report.json`, JSON.stringify(report, null, 2))
await browser.close()
console.log(JSON.stringify(report, null, 2))
if (report.status !== 'PASS') process.exitCode = 1
