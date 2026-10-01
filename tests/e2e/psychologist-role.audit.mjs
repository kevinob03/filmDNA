import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

const projectRoot = resolve(import.meta.dirname, '../..')
const apiPort = 3199
const webPort = 5199
const apiURL = `http://127.0.0.1:${apiPort}`
const webURL = `http://127.0.0.1:${webPort}`
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'filmdna-psychologist-role-'))
const temporaryDatabase = join(temporaryDirectory, 'db.json')
const processes = []
let browser

const fixture = {
  usuarios: [
    { id: 'psych-1', nombre: 'Dra. Elena', email: 'elena@filmdna.test', password: 'privada', role: 'psychologist' },
    { id: 'user-1', nombre: 'Usuario Uno', email: 'user@filmdna.test', password: 'privada', role: 'usuario' },
    { id: 'admin-1', nombre: 'Admin Uno', email: 'admin@filmdna.test', password: 'privada', role: 'admin' },
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
    if (child.exitCode !== null) throw new Error(`El proceso terminó antes de iniciar:\n${child.diagnostics()}`)
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150))
  }
  throw new Error(`Tiempo agotado esperando ${url}\n${child.diagnostics()}`)
}

const setSession = (context, sessionUser) => context.addInitScript((user) => {
  localStorage.setItem('filmdna_session', JSON.stringify(user))
  localStorage.setItem('filmdna_accessibility_preferences_v1', JSON.stringify({ theme: 'dark', contrast: 'normal', textSize: '100' }))
}, sessionUser)

try {
  await writeFile(temporaryDatabase, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8')
  const jsonServer = start(join(projectRoot, 'node_modules/json-server/lib/bin.js'), [temporaryDatabase, '--host', '127.0.0.1', '--port', String(apiPort)])
  await waitFor(`${apiURL}/usuarios`, jsonServer)
  const vite = start(join(projectRoot, 'node_modules/vite/bin/vite.js'), ['--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], { VITE_API_URL: apiURL })
  await waitFor(webURL, vite)
  browser = await chromium.launch({ headless: true })

  const psychologistContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await setSession(psychologistContext, { id: 'psych-1', nombre: 'Dra. Elena', email: 'elena@filmdna.test', role: 'psychologist' })
  const psychologistPage = await psychologistContext.newPage()
  await psychologistPage.goto(`${webURL}/psicologo`)
  await psychologistPage.getByRole('heading', { name: 'Panel del psicólogo', level: 1 }).waitFor()
  await psychologistPage.getByRole('link', { name: 'Psicología' }).waitFor()
  assert.equal(await psychologistPage.getByRole('heading', { name: 'Usuarios asignados', level: 2 }).count(), 1)
  await psychologistContext.close()

  const userContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await setSession(userContext, { id: 'user-1', nombre: 'Usuario Uno', email: 'user@filmdna.test', role: 'usuario' })
  const userPage = await userContext.newPage()
  await userPage.goto(`${webURL}/psicologo`)
  await userPage.waitForURL('**/acceso-denegado')
  assert.equal(await userPage.getByRole('link', { name: 'Psicología' }).count(), 0)
  await userContext.close()

  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await setSession(adminContext, { id: 'admin-1', nombre: 'Admin Uno', email: 'admin@filmdna.test', role: 'admin' })
  const adminPage = await adminContext.newPage()
  await adminPage.goto(`${webURL}/admin`)
  await adminPage.getByRole('heading', { name: 'Administración', level: 1 }).waitFor()
  await adminPage.getByRole('heading', { name: 'Nuevo usuario', level: 2 }).waitFor()
  assert.equal(await adminPage.getByRole('option', { name: 'Psicólogo' }).count(), 1)
  await adminPage.getByLabel('Nombre').fill('Psicóloga Nueva')
  await adminPage.getByLabel('Email').fill('nueva@filmdna.test')
  await adminPage.getByLabel('Contraseña').fill('segura123')
  await adminPage.getByLabel('Rol', { exact: true }).selectOption('psychologist')
  await adminPage.getByRole('button', { name: 'Crear usuario' }).click()
  await adminPage.getByText('Usuario creado correctamente.').waitFor()
  const created = await fetch(`${apiURL}/usuarios?email=nueva%40filmdna.test`).then((response) => response.json())
  assert.equal(created.length, 1)
  assert.equal(created[0].role, 'psychologist')
  await adminContext.close()

  console.log(JSON.stringify({
    status: 'PASS',
    database: 'temporary',
    psychologistAccess: 'PASS',
    normalUserBlocked: 'PASS',
    adminCreatesPsychologist: 'PASS',
  }, null, 2))
} finally {
  await browser?.close().catch(() => {})
  for (const child of processes.reverse()) if (child.exitCode === null) child.kill()
  await rm(temporaryDirectory, { recursive: true, force: true })
}