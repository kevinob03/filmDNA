import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const projectRoot = resolve(import.meta.dirname, '../..')
const apiPort = 3202
const webPort = 5202
const apiURL = 'http://127.0.0.1:' + apiPort
const webURL = 'http://127.0.0.1:' + webPort
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'filmdna-emotional-history-'))
const temporaryDatabase = join(temporaryDirectory, 'db.json')
const processes = []
let browser

const fixture = {
  usuarios: [
    { id: 'user-1', nombre: 'Usuario Uno', email: 'user@filmdna.test', password: 'privada', role: 'usuario' },
    { id: 'psych-1', nombre: 'Dra. Elena', email: 'elena@filmdna.test', password: 'privada', role: 'psychologist' },
    { id: 'psych-2', nombre: 'Dr. Marco', email: 'marco@filmdna.test', password: 'privada', role: 'psychologist' },
  ],
  diario: [], favoritos: [], listas: [], listaPeliculas: [], movieDNA: [], configuracionDNA: [],
  asignacionesPsicologicas: [
    { id: 'assignment-1', usuarioId: 'user-1', psicologoId: 'psych-1', status: 'active', scopes: ['emotional-history', 'movie-recommendations', 'external-ai-processing'], consentedAt: '2026-10-01T10:00:00.000Z', revokedAt: null },
  ],
  auditoriaCinematerapia: [],
  registrosEmocionales: [], propuestasCinematerapia: [],
}

const start = (entry, args, extraEnv = {}) => {
  const child = spawn(process.execPath, [entry, ...args], {
    cwd: projectRoot,
    env: { ...process.env, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
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
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150))
  }
  throw new Error('Tiempo agotado esperando ' + url + '\n' + child.diagnostics())
}

const setSession = (context, sessionUser) => context.addInitScript((user) => {
  localStorage.setItem('filmdna_session', JSON.stringify(user))
  localStorage.setItem('filmdna_accessibility_preferences_v1', JSON.stringify({ theme: 'dark', contrast: 'normal', textSize: '100' }))
}, sessionUser)

try {
  await writeFile(temporaryDatabase, JSON.stringify(fixture, null, 2) + '\n', 'utf8')
  const jsonServer = start(join(projectRoot, 'node_modules/json-server/lib/bin.js'), [temporaryDatabase, '--host', '127.0.0.1', '--port', String(apiPort)])
  await waitFor(apiURL + '/usuarios', jsonServer)
  const vite = start(join(projectRoot, 'node_modules/vite/bin/vite.js'), ['--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], { VITE_API_URL: apiURL })
  await waitFor(webURL, vite)
  browser = await chromium.launch({ headless: true })

  const userContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await setSession(userContext, { id: 'user-1', nombre: 'Usuario Uno', email: 'user@filmdna.test', role: 'usuario' })
  const userPage = await userContext.newPage()
  await userPage.goto(webURL + '/perfil')
  await userPage.getByRole('heading', { name: '¿Cómo te sientes hoy?' }).waitFor()
  assert.equal(await userPage.getByRole('heading', { name: 'No tienes que afrontar esto a solas' }).count(), 0)
  await userPage.getByLabel('Estado de ánimo').selectOption('sad')
  await userPage.locator('#emotional-intensity').fill('8')
  await userPage.getByLabel('Nota opcional').fill('Me siento triste por una semana difícil.')
  await userPage.getByRole('button', { name: 'Guardar registro' }).click()
  await userPage.getByText('Tu registro emocional se guardó de forma privada.').waitFor()
  await userPage.getByText('Me siento triste por una semana difícil.').waitFor()
  await userPage.getByRole('heading', { name: 'No tienes que afrontar esto a solas' }).waitFor()
  await userPage.getByText('Intensidad alta', { exact: true }).waitFor()
  assert.equal(await userPage.getByRole('link', { name: '9-1-1' }).getAttribute('href'), 'tel:911')
  assert.equal(await userPage.getByRole('link', { name: '2227-3774' }).getAttribute('href'), 'tel:+50622273774')

  const records = await fetch(apiURL + '/registrosEmocionales?usuarioId=user-1').then((response) => response.json())
  assert.equal(records.length, 1)
  assert.deepEqual(
    { usuarioId: records[0].usuarioId, mood: records[0].mood, intensity: records[0].intensity, note: records[0].note },
    { usuarioId: 'user-1', mood: 'sad', intensity: 8, note: 'Me siento triste por una semana difícil.' },
  )
  assert.equal(Object.hasOwn(records[0], 'diagnosis'), false)

  const psychologistContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await setSession(psychologistContext, { id: 'psych-1', nombre: 'Dra. Elena', email: 'elena@filmdna.test', role: 'psychologist' })
  const psychologistPage = await psychologistContext.newPage()
  await psychologistPage.goto(webURL + '/psicologo')
  await psychologistPage.getByRole('heading', { name: 'Usuario Uno', level: 3 }).waitFor()
  await psychologistPage.getByRole('button', { name: 'Ver historial' }).click()
  await psychologistPage.getByRole('heading', { name: 'Historial emocional de Usuario Uno' }).waitFor()
  await psychologistPage.getByText('Me siento triste por una semana difícil.').waitFor()
  await psychologistPage.getByText('Intensidad 8/10').waitFor()
  await psychologistPage.getByRole('heading', { name: 'Registro con intensidad alta' }).waitFor()
  await psychologistPage.getByText('Requiere revisión humana', { exact: true }).waitFor()

  const otherContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await setSession(otherContext, { id: 'psych-2', nombre: 'Dr. Marco', email: 'marco@filmdna.test', role: 'psychologist' })
  const otherPage = await otherContext.newPage()
  await otherPage.goto(webURL + '/psicologo')
  await otherPage.getByText('Todavía no tienes usuarios asignados').waitFor()
  assert.equal(await otherPage.getByText('Me siento triste por una semana difícil.').count(), 0)
  assert.equal(await otherPage.getByRole('button', { name: 'Ver historial' }).count(), 0)

  console.log(JSON.stringify({
    status: 'PASS',
    database: 'temporary',
    userCreatesRecord: 'PASS',
    userHistory: 'PASS',
    assignedPsychologistAccess: 'PASS',
    otherPsychologistBlocked: 'PASS',
    noAutomatedDiagnosis: 'PASS',
    highIntensityUserSupport: 'PASS',
    humanReviewSignal: 'PASS',
    officialCostaRicaResources: 'PASS',
  }, null, 2))

  await otherContext.close()
  await psychologistContext.close()
  await userContext.close()
} finally {
  await browser?.close().catch(() => {})
  for (const child of processes.reverse()) if (child.exitCode === null) child.kill()
  await rm(temporaryDirectory, { recursive: true, force: true })
}
