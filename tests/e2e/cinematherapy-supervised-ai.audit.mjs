import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const projectRoot = resolve(import.meta.dirname, '../..')
const apiPort = 3204
const webPort = 5204
const apiURL = 'http://127.0.0.1:' + apiPort
const webURL = 'http://127.0.0.1:' + webPort
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'filmdna-supervised-ai-'))
const temporaryDatabase = join(temporaryDirectory, 'db.json')
const processes = []
let browser

const movies = [
  { id: 101, title: 'Viaje sereno', overview: 'Una amistad encuentra esperanza durante un viaje.', genre_ids: [18], vote_average: 8, poster_path: '/one.jpg', release_date: '2024-01-01' },
  { id: 102, title: 'Risas cercanas', overview: 'Una comedia amable entre amigos.', genre_ids: [35], vote_average: 7.5, poster_path: '/two.jpg', release_date: '2023-02-01' },
  { id: 103, title: 'Nuevo comienzo', overview: 'Una familia reconstruye sus vínculos.', genre_ids: [10751], vote_average: 7.8, poster_path: '/three.jpg', release_date: '2022-03-01' },
  { id: 104, title: 'Cuarto candidato', overview: 'Historia de crecimiento personal.', genre_ids: [18], vote_average: 7, poster_path: null, release_date: '2021-04-01' },
]

const fixture = {
  usuarios: [
    { id: 'user-1', nombre: 'Usuario Uno', email: 'user@filmdna.test', password: 'privada', role: 'usuario', favoriteGenres: [18, 35] },
    { id: 'psych-1', nombre: 'Dra. Elena', email: 'elena@filmdna.test', password: 'privada', role: 'psychologist' },
  ],
  diario: [], favoritos: [], listas: [], listaPeliculas: [], movieDNA: [], configuracionDNA: [],
  asignacionesPsicologicas: [
    { id: 'assignment-1', usuarioId: 'user-1', psicologoId: 'psych-1', status: 'active', scopes: ['emotional-history', 'movie-recommendations', 'external-ai-processing'], consentedAt: '2026-10-01T10:00:00.000Z', revokedAt: null },
  ],
  auditoriaCinematerapia: [],
  registrosEmocionales: [
    { id: 'emotion-1', usuarioId: 'user-1', mood: 'sad', intensity: 8, note: 'NOTA PRIVADA QUE NO DEBE SALIR', createdAt: '2026-10-01T11:00:00.000Z' },
  ],
  propuestasCinematerapia: [],
}

const start = (entry, args, extraEnv = {}) => {
  const child = spawn(process.execPath, [entry, ...args], {
    cwd: projectRoot, env: { ...process.env, ...extraEnv }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  })
  let diagnostics = ''
  child.stdout.on('data', (chunk) => { diagnostics += chunk })
  child.stderr.on('data', (chunk) => { diagnostics += chunk })
  child.diagnostics = () => diagnostics
  processes.push(child)
  return child
}

const waitFor = async (url, child, timeout = 30_000) => {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('El proceso terminó antes de iniciar:\n' + child.diagnostics())
    try { if ((await fetch(url)).ok) return } catch {}
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150))
  }
  throw new Error('Tiempo agotado esperando ' + url + '\n' + child.diagnostics())
}

const setSession = (context, sessionUser) => context.addInitScript((user) => {
  localStorage.setItem('filmdna_session', JSON.stringify(user))
  localStorage.setItem('filmdna_accessibility_preferences_v1', JSON.stringify({ theme: 'dark', contrast: 'normal', textSize: '100' }))
}, sessionUser)

const installExternalMocks = async (page, capturedBodies) => {
  await page.route('https://api.themoviedb.org/3/discover/movie**', (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ page: 1, results: movies, total_pages: 1, total_results: movies.length }),
  }))
  await page.route('**/api/ai/cinematherapy-draft', async (route) => {
    capturedBodies.push(route.request().postDataJSON())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        provider: 'gemini-test',
        model: 'safe-test-model',
        result: {
          schemaVersion: 'cinematherapy-draft-v1',
          summary: 'Opciones prudentes para acompañar este momento.',
          recommendations: [
            { tmdbId: 101, rationale: 'Podría ofrecer una experiencia serena.', sensitivity: 'none', sensitivityReasons: [] },
            { tmdbId: 102, rationale: 'Puede acompañar con humor amable.', sensitivity: 'none', sensitivityReasons: [] },
            { tmdbId: 103, rationale: 'Ofrece una historia emotiva de vínculos.', sensitivity: 'mild', sensitivityReasons: ['Temas familiares emotivos'] },
          ],
        },
      }),
    })
  })
}

try {
  await writeFile(temporaryDatabase, JSON.stringify(fixture, null, 2) + '\n', 'utf8')
  const jsonServer = start(join(projectRoot, 'node_modules/json-server/lib/bin.js'), [temporaryDatabase, '--host', '127.0.0.1', '--port', String(apiPort)])
  await waitFor(apiURL + '/usuarios', jsonServer)
  const vite = start(join(projectRoot, 'node_modules/vite/bin/vite.js'), ['--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], { VITE_API_URL: apiURL, VITE_TMDB_API_KEY: 'test-key' })
  await waitFor(webURL, vite)
  browser = await chromium.launch({ headless: true })

  const capturedBodies = []
  const psychologistContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await setSession(psychologistContext, { id: 'psych-1', nombre: 'Dra. Elena', email: 'elena@filmdna.test', role: 'psychologist' })
  const psychologistPage = await psychologistContext.newPage()
  await installExternalMocks(psychologistPage, capturedBodies)
  await psychologistPage.goto(webURL + '/psicologo')
  await psychologistPage.getByRole('button', { name: 'Ver historial' }).click()
  await psychologistPage.getByRole('heading', { name: 'Propuestas cinematográficas' }).waitFor()
  await psychologistPage.getByRole('button', { name: 'Generar borrador con IA' }).click()
  await psychologistPage.getByText('Pendiente de revisión').waitFor()

  assert.equal(capturedBodies.length, 1)
  const serializedAIInput = JSON.stringify(capturedBodies[0])
  assert.equal(serializedAIInput.includes('NOTA PRIVADA'), false)
  assert.equal(serializedAIInput.includes('Usuario Uno'), false)
  assert.equal(serializedAIInput.includes('user@filmdna.test'), false)
  assert.deepEqual(capturedBodies[0].input.emotion, { mood: 'sad', intensity: 8 })

  let proposals = await fetch(apiURL + '/propuestasCinematerapia').then((response) => response.json())
  assert.equal(proposals.length, 1)
  assert.equal(proposals[0].status, 'pending')

  const userContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await setSession(userContext, { id: 'user-1', nombre: 'Usuario Uno', email: 'user@filmdna.test', role: 'usuario' })
  const userPage = await userContext.newPage()
  await userPage.goto(webURL + '/perfil')
  await userPage.getByText('Todavía no tienes una propuesta aprobada.').waitFor()
  assert.equal(await userPage.getByText('Viaje sereno').count(), 0)

  await psychologistPage.getByRole('button', { name: 'Aprobar para el usuario' }).click()
  await psychologistPage.getByText('Aprobada', { exact: true }).waitFor()
  await userPage.reload()
  await userPage.getByRole('heading', { name: 'Películas para acompañarte' }).waitFor()
  await userPage.getByRole('heading', { name: 'Viaje sereno' }).waitFor()
  await userPage.getByRole('heading', { name: 'Risas cercanas' }).waitFor()
  await userPage.getByText('Sensibilidad moderada').waitFor()

  await psychologistPage.getByRole('button', { name: 'Generar borrador con IA' }).click()
  await psychologistPage.getByRole('button', { name: 'Rechazar propuesta' }).click()
  await psychologistPage.getByText('Rechazada', { exact: true }).waitFor()
  proposals = await fetch(apiURL + '/propuestasCinematerapia').then((response) => response.json())
  assert.deepEqual(proposals.map(({ status }) => status).sort(), ['approved', 'rejected'])

  const audit = await fetch(apiURL + '/auditoriaCinematerapia').then((response) => response.json())
  assert.deepEqual(audit.map(({ action }) => action), ['proposal-generated', 'proposal-approved', 'proposal-generated', 'proposal-rejected'])

  console.log(JSON.stringify({
    status: 'PASS',
    database: 'temporary',
    dataMinimization: 'PASS',
    pendingHiddenFromUser: 'PASS',
    professionalApproval: 'PASS',
    rejectedHiddenFromUser: 'PASS',
    sensitivityFlags: 'PASS',
    auditTrail: 'PASS',
  }, null, 2))

  await userContext.close()
  await psychologistContext.close()
} finally {
  await browser?.close().catch(() => {})
  for (const child of processes.reverse()) if (child.exitCode === null) child.kill()
  await rm(temporaryDirectory, { recursive: true, force: true })
}
