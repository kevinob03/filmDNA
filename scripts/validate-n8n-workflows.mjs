import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const workflowFiles = [
  'docs/n8n/workflows/activity-report.json',
  'docs/n8n/workflows/scheduled-backup.json',
  'docs/n8n/workflows/recommendation-chatbot.json',
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
  const credentialNodes = workflow.nodes.filter((node) => node.credentials)
  if (relativePath.endsWith('recommendation-chatbot.json')) {
    assert(credentialNodes.length === 2, `${relativePath}: deben existir dos referencias de credenciales`)
    for (const node of credentialNodes) {
      const entries = Object.entries(node.credentials)
      const [credentialType, reference] = entries[0] ?? []
      assert(
        reference
          && entries.length === 1
          && ['httpHeaderAuth', 'googlePalmApi'].includes(credentialType)
          && Object.keys(reference).every((key) => ['id', 'name'].includes(key))
          && String(reference.id).startsWith('CONFIGURE_')
          && String(reference.name).startsWith('FilmDNA '),
        `${relativePath}: ${node.name} contiene una credencial no sanitizada`,
      )
    }
  } else {
    assert(credentialNodes.length === 0, `${relativePath}: contiene credenciales embebidas`)
  }
  assert(!serialized.includes('VITE_') && !serialized.includes('API_KEY'), `${relativePath}: contiene referencias a secretos`)
  for (const node of workflow.nodes.filter((candidate) => candidate.type === 'n8n-nodes-base.httpRequest')) {
    assert(node.alwaysOutputData === true, `${relativePath}: ${node.name} debe tolerar respuestas vacías`)
  }

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
assert(backupText.includes('backups/filmdna-backup-'), 'scheduled-backup: falta ruta de salida')
for (const resource of ['usuarios', 'diario', 'favoritos', 'listas', 'listaPeliculas', 'movieDNA', 'configuracionDNA']) {
  assert(backupText.includes(`/${resource}`), `scheduled-backup: falta recurso ${resource}`)
}

const chatbot = JSON.parse(await readFile(resolve(workflowFiles[2]), 'utf8'))
const chatbotText = JSON.stringify(chatbot)
const chatbotWebhook = chatbot.nodes.find((node) => node.type === 'n8n-nodes-base.webhook')
const chatbotAgent = chatbot.nodes.find((node) => node.type === '@n8n/n8n-nodes-langchain.agent')
const chatbotModel = chatbot.nodes.find((node) => node.type === '@n8n/n8n-nodes-langchain.lmChatGoogleGemini')
const chatbotTool = chatbot.nodes.find((node) => node.type === '@n8n/n8n-nodes-langchain.toolCode')
const chatbotParser = chatbot.nodes.find((node) => node.type === '@n8n/n8n-nodes-langchain.outputParserStructured')
assert(chatbotWebhook?.parameters?.path === 'filmdna/recommendation-chat', 'recommendation-chatbot: ruta Webhook invalida')
assert(chatbotWebhook?.parameters?.authentication === 'headerAuth', 'recommendation-chatbot: Webhook sin Header Auth')
assert(chatbotWebhook?.parameters?.responseMode === 'responseNode', 'recommendation-chatbot: respuesta no controlada')
assert(chatbot.nodes.filter((node) => node.type === 'n8n-nodes-base.respondToWebhook').length === 2, 'recommendation-chatbot: faltan respuestas controladas')
assert(chatbotAgent?.name === 'AI Agent' && chatbotAgent.typeVersion >= 3, 'recommendation-chatbot: falta AI Agent actual')
assert(chatbotAgent?.parameters?.hasOutputParser === true, 'recommendation-chatbot: AI Agent sin salida estructurada')
assert(chatbotAgent?.onError === 'continueRegularOutput', 'recommendation-chatbot: AI Agent sin fallback seguro')
assert(chatbotModel?.credentials?.googlePalmApi?.id === 'CONFIGURE_GEMINI_AFTER_IMPORT', 'recommendation-chatbot: Gemini sin credencial sanitizada')
assert(Number(chatbotModel?.parameters?.options?.temperature) <= 0.3, 'recommendation-chatbot: temperatura Gemini demasiado alta')
assert(chatbotTool?.name === 'FilmDNA_Filter_Vocabulary', 'recommendation-chatbot: falta herramienta de vocabulario')
assert(chatbotTool?.parameters?.specifyInputSchema === true, 'recommendation-chatbot: herramienta sin schema')
assert(chatbotParser?.parameters?.schemaType === 'manual', 'recommendation-chatbot: parser sin JSON Schema')
for (const [source, connectionType] of [
  ['Google Gemini Chat Model', 'ai_languageModel'],
  ['FilmDNA_Filter_Vocabulary', 'ai_tool'],
  ['Structured Output Parser', 'ai_outputParser'],
]) {
  const connection = chatbot.connections?.[source]?.[connectionType]?.[0]?.[0]
  assert(connection?.node === 'AI Agent' && connection?.type === connectionType, `recommendation-chatbot: ${source} no conectado al AI Agent`)
}
for (const marker of ['recommendation-chat-v1', 'requestId', 'candidates', 'filtersPatch', 'clearFilters', 'targetMovieId']) {
  assert(chatbotText.includes(marker), `recommendation-chatbot: falta contrato ${marker}`)
}
for (const forbidden of ['VITE_', 'API_KEY', 'server-only-secret', 'private@example.com']) {
  assert(!chatbotText.includes(forbidden), `recommendation-chatbot: contiene secreto o dato privado ${forbidden}`)
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'))
  process.exit(1)
}

console.log(`Validated ${workflowFiles.length} FilmDNA n8n workflows.`)
