import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const databasePath = path.join(projectRoot, 'db.json')
const jsonServerEntry = path.join(projectRoot, 'node_modules', 'json-server', 'lib', 'bin.js')
const requiredCollections = ['asignacionesPsicologicas', 'auditoriaCinematerapia', 'registrosEmocionales', 'propuestasCinematerapia']

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
