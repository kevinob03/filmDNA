import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const workflowFiles = [
  'docs/n8n/workflows/activity-report.json',
  'docs/n8n/workflows/scheduled-backup.json',
]

const failures = []

const assert = (condition, message) => {
  if (!condition) failures.push(message)
}

for (const relativePath of workflowFiles) {
  const workflow = JSON.parse(await readFile(resolve(relativePath), 'utf8'))
  const names = new Set(workflow.nodes?.map((node) => node.name))
  const serialized = JSON.stringify(workflow)

  assert(typeof workflow.id === 'string' && workflow.id.length > 0, `${relativePath}: falta id exportable`)
  assert(typeof workflow.name === 'string' && workflow.name.startsWith('FilmDNA - '), `${relativePath}: nombre inválido`)
  assert(Array.isArray(workflow.nodes) && workflow.nodes.length >= 5, `${relativePath}: faltan nodos`)
  assert(workflow.active === false, `${relativePath}: debe importarse inactivo`)
  assert(!serialized.includes('credentials'), `${relativePath}: contiene credenciales embebidas`)
  assert(!serialized.includes('VITE_') && !serialized.includes('API_KEY'), `${relativePath}: contiene referencias a secretos`)

  for (const [source, outputs] of Object.entries(workflow.connections ?? {})) {
    assert(names.has(source), `${relativePath}: conexión desde nodo inexistente ${source}`)
    for (const output of outputs.main ?? []) {
      for (const connection of output) {
        assert(names.has(connection.node), `${relativePath}: conexión hacia nodo inexistente ${connection.node}`)
      }
    }
  }
}

const activity = JSON.parse(await readFile(resolve(workflowFiles[0]), 'utf8'))
const activityText = JSON.stringify(activity)
assert(activity.nodes.some((node) => node.type === 'n8n-nodes-base.webhook'), 'activity-report: falta Webhook')
assert(activity.nodes.some((node) => node.type === 'n8n-nodes-base.respondToWebhook'), 'activity-report: falta respuesta Webhook')
for (const resource of ['diario', 'favoritos', 'listas', 'listaPeliculas']) {
  assert(activityText.includes(`/${resource}`), `activity-report: falta recurso ${resource}`)
}
assert(activityText.includes('userId'), 'activity-report: falta contrato userId')

const backup = JSON.parse(await readFile(resolve(workflowFiles[1]), 'utf8'))
const backupText = JSON.stringify(backup)
assert(backup.nodes.some((node) => node.type === 'n8n-nodes-base.scheduleTrigger'), 'scheduled-backup: falta Schedule Trigger')
assert(backup.nodes.some((node) => node.type === 'n8n-nodes-base.manualTrigger'), 'scheduled-backup: falta Manual Trigger')
assert(backupText.includes("delete user.password"), 'scheduled-backup: falta sanitización de contraseñas')
assert(backupText.includes('/files/backups/'), 'scheduled-backup: falta ruta de salida')
for (const resource of ['usuarios', 'diario', 'favoritos', 'listas', 'listaPeliculas', 'movieDNA', 'configuracionDNA']) {
  assert(backupText.includes(`/${resource}`), `scheduled-backup: falta recurso ${resource}`)
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'))
  process.exit(1)
}

console.log(`Validated ${workflowFiles.length} FilmDNA n8n workflows.`)
