import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildDemoDatabase, DEMO_ADMIN_CREDENTIALS } from './demoDatabase.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const demoMode = process.argv.includes('--demo')
const databasePath = path.join(projectRoot, demoMode ? 'db.demo.json' : 'db.json')
const jsonServerEntry = path.join(projectRoot, 'node_modules', 'json-server', 'lib', 'bin.js')
const requiredCollections = ['asignacionesPsicologicas', 'auditoriaCinematerapia', 'registrosEmocionales', 'propuestasCinematerapia']

if (demoMode) {
  await writeFile(databasePath, JSON.stringify(buildDemoDatabase(), null, 2) + '\n', 'utf8')
  console.info('[FilmDNA server] Modo demo: db.demo.json regenerado con datos sinteticos recientes.')
  console.info(`[FilmDNA server] Acceso Admin demo: ${DEMO_ADMIN_CREDENTIALS.email} / ${DEMO_ADMIN_CREDENTIALS.password}`)
}

if (!demoMode) {
const rawDatabase = await readFile(databasePath, 'utf8')
const database = JSON.parse(rawDatabase)
let updated = false

for (const collection of requiredCollections) {
  if (Array.isArray(database[collection])) continue
  if (Object.hasOwn(database, collection)) {
    throw new Error('La colección ' + collection + ' existe pero no es un arreglo.')
  }
  database[collection] = []
  updated = true
}

if (updated) {
  await writeFile(databasePath, JSON.stringify(database, null, 2) + '\n', 'utf8')
  console.info('[FilmDNA server] Esquema de cinematerapia preparado sin modificar datos existentes.')
}
}

const port = process.env.FILMDNA_JSON_SERVER_PORT || '3001'
const child = spawn(process.execPath, [jsonServerEntry, databasePath, '--port', port], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
  windowsHide: false,
})

child.once('error', (error) => {
  console.error('[FilmDNA server] JSON Server no pudo iniciar: ' + error.message)
  process.exitCode = 1
})

child.once('exit', (code, signal) => {
  if (signal) return
  process.exitCode = code ?? 1
})

const stop = () => {
  if (!child.killed) child.kill()
}

process.once('SIGINT', stop)
process.once('SIGTERM', stop)
