import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const forbiddenNames = [
  'VITE_GEMINI_API_KEY',
  'VITE_DEEPSEEK_API_KEY',
  'VITE_GROQ_API_KEY',
  'N8N_RECOMMENDATION_WEBHOOK_SECRET',
]
const distDir = resolve('dist/assets')
const assetNames = await readdir(distDir)
const assets = (await Promise.all(assetNames.map((name) => readFile(resolve(distDir, name), 'utf8').catch(() => '')))).join('\n')
const envText = await readFile(resolve('.env'), 'utf8').catch(() => '')
const configuredSecrets = envText
  .split(/\r?\n/)
  .filter((line) => /^(?:(?:VITE_)?(?:GEMINI|DEEPSEEK|GROQ)_API_KEY|N8N_RECOMMENDATION_WEBHOOK_SECRET)=/.test(line))
  .map((line) => line.split('=').slice(1).join('=').trim())
  .filter((value) => value.length >= 8)

const exposedName = forbiddenNames.some((name) => assets.includes(name))
const exposedValue = configuredSecrets.some((secret) => assets.includes(secret) || assets.includes(secret.slice(0, 8)))
const pass = !exposedName && !exposedValue
console.log(`AI bundle secret exposure: ${pass ? 'PASS' : 'FAIL'}`)
if (!pass) process.exitCode = 1
