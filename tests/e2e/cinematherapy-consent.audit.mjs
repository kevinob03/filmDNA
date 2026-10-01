import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const projectRoot = resolve(import.meta.dirname, '../..')
const apiPort = 3201
const webPort = 5201
const apiURL = 'http://127.0.0.1:' + apiPort
const webURL = 'http://127.0.0.1:' + webPort
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'filmdna-cinematherapy-consent-'))
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
  asignacionesPsicologicas: [], auditoriaCinematerapia: [], registrosEmocionales: [], propuestasCinematerapia: [],
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
  await userPage.getByRole('heading', { name: 'Cinematerapia con supervisión' }).waitFor()
  await userPage.getByLabel('Psicólogo').selectOption('psych-1')
  await userPage.getByRole('button', { name: 'Dar consentimiento y asignar' }).click()
  await userPage.getByText('Debes aceptar todos los permisos').waitFor()
  await userPage.getByLabel('Autorizo el acceso a mi historial emocional dentro de FilmDNA.').check()
  await userPage.getByLabel('Autorizo la supervisión de recomendaciones de películas.').check()
  await userPage.getByLabel(/Autorizo enviar mi estado/).check()
  await userPage.getByRole('button', { name: 'Dar consentimiento y asignar' }).click()
  await userPage.getByText('Consentimiento registrado.').waitFor()

  let assignments = await fetch(apiURL + '/asignacionesPsicologicas').then((response) => response.json())
  assert.equal(assignments.length, 1)
  assert.equal(assignments[0].usuarioId, 'user-1')
  assert.equal(assignments[0].psicologoId, 'psych-1')
  assert.equal(assignments[0].status, 'active')
  assert.deepEqual(assignments[0].scopes, ['emotional-history', 'movie-recommendations', 'external-ai-processing'])

  const psychologistContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await setSession(psychologistContext, { id: 'psych-1', nombre: 'Dra. Elena', email: 'elena@filmdna.test', role: 'psychologist' })
  const psychologistPage = await psychologistContext.newPage()
  await psychologistPage.goto(webURL + '/psicologo')
  await psychologistPage.getByRole('heading', { name: 'Usuarios asignados', level: 2 }).waitFor()
  await psychologistPage.getByRole('heading', { name: 'Usuario Uno', level: 3 }).waitFor()

  const otherPsychologistContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await setSession(otherPsychologistContext, { id: 'psych-2', nombre: 'Dr. Marco', email: 'marco@filmdna.test', role: 'psychologist' })
  const otherPsychologistPage = await otherPsychologistContext.newPage()
  await otherPsychologistPage.goto(webURL + '/psicologo')
  await otherPsychologistPage.getByText('Todavía no tienes usuarios asignados').waitFor()
  assert.equal(await otherPsychologistPage.getByRole('heading', { name: 'Usuario Uno', level: 3 }).count(), 0)

  await userPage.getByRole('button', { name: 'Revocar consentimiento' }).click()
  await userPage.getByText('Consentimiento revocado.').waitFor()
  assignments = await fetch(apiURL + '/asignacionesPsicologicas').then((response) => response.json())
  assert.equal(assignments[0].status, 'revoked')

  await psychologistPage.getByRole('button', { name: 'Actualizar' }).click()
  await psychologistPage.getByText('Todavía no tienes usuarios asignados').waitFor()
  assert.equal(await psychologistPage.getByRole('heading', { name: 'Usuario Uno', level: 3 }).count(), 0)

  const audit = await fetch(apiURL + '/auditoriaCinematerapia').then((response) => response.json())
  assert.deepEqual(audit.map(({ action }) => action), ['consent-granted', 'consent-revoked'])

  console.log(JSON.stringify({
    status: 'PASS',
    database: 'temporary',
    explicitConsent: 'PASS',
    psychologistAssignment: 'PASS',
    crossPsychologistIsolation: 'PASS',
    revocation: 'PASS',
    auditTrail: 'PASS',
  }, null, 2))

  await otherPsychologistContext.close()
  await psychologistContext.close()
  await userContext.close()
} finally {
  await browser?.close().catch(() => {})
  for (const child of processes.reverse()) if (child.exitCode === null) child.kill()
  await rm(temporaryDirectory, { recursive: true, force: true })
}
