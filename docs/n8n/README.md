# Workflows n8n de FilmDNA

Esta carpeta contiene tres workflows exportables de FilmDNA. Los archivos no contienen valores de credenciales.

## Requisitos

- FilmDNA con JSON Server activo en `http://localhost:3001` mediante `npm run server`.
- Una instancia local de n8n capaz de acceder a esa dirección.
- Para n8n ejecutado en Docker, reemplazar `localhost` en los nodos HTTP por la dirección del host accesible desde el contenedor, por ejemplo `host.docker.internal`.

## Importación

1. Abrir n8n y seleccionar **Import from File**.
2. Importar los archivos de `docs/n8n/workflows/`.
3. Revisar la URL de JSON Server en los nodos **Cargar...**.
4. Ejecutar primero cada workflow con su trigger manual.
5. Activarlos únicamente después de verificar el resultado en el entorno local.

## 1. Reporte de actividad cinematográfica

Archivo: `workflows/activity-report.json`.

- **Objetivo:** consolidar la actividad real de un usuario sin duplicar la interfaz de estadísticas de React.
- **Trigger:** webhook `POST /filmdna/activity-report`.
- **Entrada:** JSON con `userId`, por ejemplo `{ "userId": "usuario-demo" }`.
- **Nodos principales:** validación, consultas HTTP a diario/favoritos/listas/relaciones, agregación y respuesta.
- **Resultado:** JSON con totales, promedio de calificaciones y fecha de generación.
- **Errores esperados:** responde `400` cuando falta `userId`; los errores de conexión a JSON Server quedan visibles en la ejecución de n8n.

Prueba local, con el workflow activo:

```bash
curl -X POST http://localhost:5678/webhook/filmdna/activity-report \
  -H "Content-Type: application/json" \
  -d '{"userId":"usuario-demo"}'
```

## 2. Respaldo programado

Archivo: `workflows/scheduled-backup.json`.

- **Objetivo:** generar automáticamente una copia de los recursos propios de FilmDNA.
- **Trigger:** manual para demostración y Schedule Trigger todos los días a las 02:00.
- **Entrada:** recursos disponibles en JSON Server.
- **Nodos principales:** consultas HTTP, sanitización, conversión a JSON y escritura de archivo.
- **Resultado:** `filmdna-backup-<fecha>.json` dentro de la carpeta `backups/` del directorio desde el que se inicia n8n.
- **Privacidad:** elimina el campo `password` de todos los usuarios. No lee ni copia `.env`.

La carpeta `backups/` incluida en el proyecto debe tener permisos de escritura. En Docker se recomienda cambiar el nodo **Guardar respaldo** a una ruta montada como volumen persistente.

## 3. Chatbot de recomendaciones

Archivo: `workflows/recommendation-chatbot.json`.

- **Objetivo:** orquestar una conversacion de descubrimiento cinematografico sin permitir que la IA invente peliculas.
- **Trigger:** webhook `POST /filmdna/recommendation-chat`.
- **Entrada:** contrato `recommendation-chat-v1` validado por el servidor FilmDNA.
- **IA:** se ejecuta visualmente en `AI Agent`, conectado a `DeepSeek Chat Model`.
- **Herramienta:** `FilmDNA_Filter_Vocabulary` limita al agente a los filtros reales de FilmDNA.
- **Salida:** `Structured Output Parser` obliga al agente a respetar el contrato JSON.
- **Resultado:** una accion conversacional y cambios de filtros; nunca una lista creada por el modelo.
- **Fallback:** si la IA falla o devuelve un contrato invalido, responde con una accion `error` segura.

### Credenciales posteriores a la importacion

El JSON incluye solamente referencias `CONFIGURE_*_AFTER_IMPORT`. n8n solicitara asociar dos credenciales:

1. En **Recibir mensaje**, crear o seleccionar `FilmDNA Recommendation Webhook`.
   - Header: `X-FilmDNA-Webhook-Secret`.
   - Valor: el mismo secreto fuerte de `N8N_RECOMMENDATION_WEBHOOK_SECRET` en el `.env` de FilmDNA.
2. En **DeepSeek Chat Model**, crear o seleccionar una credencial **DeepSeek** llamada `FilmDNA DeepSeek n8n`.
   - API key: una clave DeepSeek valida con saldo.
   - Modelo: `deepseek-flash`, seleccionado desde la lista que carga n8n para la cuenta.
   - La clave queda almacenada en el gestor de credenciales de n8n y no en el workflow.

El secreto del webhook debe tener al menos 12 caracteres y no debe usar el prefijo `VITE_`.

Configurar en el `.env` local:

```env
N8N_RECOMMENDATION_WEBHOOK_URL=http://localhost:5678/webhook/filmdna/recommendation-chat
N8N_RECOMMENDATION_WEBHOOK_SECRET=<secreto-del-webhook>
N8N_RECOMMENDATION_TIMEOUT_MS=30000
```

Antes de activar:

1. Iniciar FilmDNA con `npm run dev`.
2. Asociar la credencial Header Auth y la credencial DeepSeek.
3. Ejecutar el webhook de prueba desde n8n.
4. Confirmar visualmente la ejecucion de **AI Agent**, **DeepSeek Chat Model**, **FilmDNA_Filter_Vocabulary** y **Structured Output Parser**.
5. Publicar o activar el workflow.
6. Usar en FilmDNA la URL de produccion `/webhook/`, no `/webhook-test/`.

## Validación versionada

Ejecutar:

```bash
npm run test:n8n-workflows
```

El script comprueba los tres archivos, conexiones, triggers, ausencia de valores secretos, referencias sanitizadas, autenticacion del chatbot, sanitizacion del respaldo y contratos principales.
