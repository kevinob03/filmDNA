# Workflows n8n de FilmDNA

Esta carpeta contiene los dos workflows exportables requeridos para la FASE 10. Ambos trabajan únicamente con el JSON Server local de FilmDNA y no contienen credenciales.

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

## Validación versionada

Ejecutar:

```bash
npm run test:n8n-workflows
```

El script comprueba la estructura de ambos archivos, conexiones, triggers, ausencia de credenciales embebidas, sanitización del respaldo y contratos principales.
