import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const viteEntry = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js')
const aiEntry = path.join(projectRoot, 'server', 'aiServer.mjs')
const children = new Set()
let shuttingDown = false

const start = (label, args) => {
  console.info(`[FilmDNA dev] Starting ${label}...`)
  const child = spawn(process.execPath, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
    windowsHide: false,
  })
  children.add(child)
  child.once('error', (error) => {
    console.error(`[FilmDNA dev] ${label} could not start: ${error.message}`)
    shutdown(1)
  })
  child.once('exit', (code, signal) => {
    children.delete(child)
    if (shuttingDown) return
    console.error(`[FilmDNA dev] ${label} stopped (${signal || `code ${code ?? 1}`}). Closing development services.`)
    shutdown(code || 1)
  })
  return child
}

const shutdown = (exitCode = 0) => {
  if (shuttingDown) return
  shuttingDown = true
  process.exitCode = exitCode
  for (const child of children) {
    if (!child.killed) child.kill()
  }
  const forceExit = setTimeout(() => process.exit(exitCode), 2_000)
  forceExit.unref()
}

const viteArgs = [viteEntry]
if (process.env.FILMDNA_DEV_VITE_PORT) {
  viteArgs.push('--host', '127.0.0.1', '--port', process.env.FILMDNA_DEV_VITE_PORT, '--strictPort')
}

start('Vite', viteArgs)
start('AI server on port 3002', ['--use-system-ca', '--env-file-if-exists=.env', aiEntry])

process.once('SIGINT', () => shutdown(0))
process.once('SIGTERM', () => shutdown(0))
