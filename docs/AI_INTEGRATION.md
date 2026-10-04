# Integración de IA de FilmDNA

Las credenciales y llamadas a Gemini, DeepSeek y Groq viven en el backend Node local. El frontend sólo consume `/api/ai/*`; ninguna clave privada ni URL de proveedor forma parte del bundle Vite.

## Operaciones disponibles

### Movie DNA numérico

`POST /api/ai/movie-dna` conserva el perfil histórico de seis valores usado por el radar y la similitud: Alegría, Emoción, Complejidad, Intensidad, Fantasía y Ritmo.

### Clasificación semántica de recomendaciones

`POST /api/ai/classify-movies` enriquece exclusivamente preferencias activas que el análisis determinista dejó con `status: "unknown"`.

- El Movie DNA determinista se calcula primero.
- Una clasificación determinista conocida nunca se sobrescribe.
- Cada batch admite como máximo seis películas; doce candidatos generan como máximo dos requests.
- Cada película envía sólo metadata mínima y los pares `dimension.target` pendientes.
- `score` mide coincidencia; `confidence` mide certeza. Un score bajo con confianza alta es una incompatibilidad conocida, no `unknown`.
- Confianza IA menor de `0.75` permanece `unknown`. Las aceptadas reciben un factor conservador de `0.80`, con confianza efectiva máxima de `0.80`.
- La procedencia `ai`, proveedor, modelo y evidencia breve quedan disponibles para depuración.

## Caché

La caché en memoria se resuelve por:

```text
aiSchemaVersion + tmdbId + movieDataVersion + dimension + target
```

`movieDataVersion` representa la metadata relevante. Las clasificaciones se guardan por dimensión, por lo que una evaluación previa de `pace.calm` se puede reutilizar sin repetir otra dimensión.

## Merge y fallback

La IA sólo puede completar una clasificación determinista `unknown`. Si el backend no está disponible, agota el presupuesto total, recibe rate limit o devuelve JSON/esquema inválido, se ignora ese enriquecimiento y Recomendaciones continúa con el resultado determinista.

Coincidencia, cobertura y confianza siguen siendo medidas independientes. La IA aumenta cobertura sólo cuando resuelve una preferencia con evidencia válida; un score bajo puede reducir la coincidencia.

### Interpretación de búsqueda natural

`POST /api/ai/interpret-search` implementa `interpretSearchIntent`: recibe texto del usuario y devuelve exclusivamente filtros estructurados que existen en `recommendationConfig`. La IA no selecciona películas.

```text
texto del usuario
→ interpretSearchIntent
→ filtros FilmDNA validados
→ recomendador normal
→ TMDB + reglas deterministas + classifyMovies
```

El contrato versionado `recommendation-search-intent-v1` incluye `filters`, `unmappedTerms` y `confidence`. Tanto el servidor como el cliente validan la respuesta contra la fuente de verdad del formulario. Streaming no forma parte del vocabulario de IA porque sus IDs son dinámicos; los filtros todavía deshabilitados de producción y características narrativas tampoco se aceptan.

Una nueva interpretación válida reemplaza los filtros anteriores. Después, el usuario puede ajustarlos manualmente. Una respuesta sin filtros muestra una ayuda sin ejecutar una búsqueda genérica; un fallo de infraestructura conserva intactos los filtros manuales.

## Separación de operaciones

`interpretSearchIntent` convierte texto en filtros. `classifyMovies` clasifica metadata de películas únicamente para completar evidencia `unknown`. Comparten orquestador, proveedores, deadline y manejo de errores, pero tienen prompts, schemas, contratos y responsabilidades independientes.

### Proyección administrativa

`POST /api/ai/admin-projection` genera una interpretación y proyección orientativa de los registros mensuales del Diario para los siguientes tres meses.

- El frontend calcula primero una línea base matemática verificable.
- La IA recibe únicamente conteos agregados, adopción porcentual y series mensuales.
- No se envían identificadores, nombres, correos, contraseñas, reseñas ni notas privadas.
- La salida `admin-projection-v1` exige tendencia, confianza, tres meses predefinidos e insights acotados.
- Los meses y rangos numéricos se validan en el servidor para impedir periodos inventados o cifras desproporcionadas.
- Si la IA no está configurada, alcanza su límite o falla, el dashboard conserva todos los gráficos reales y la línea base matemática.
- La interfaz identifica la proyección como estimación y no permite decisiones automáticas a partir de ella.

## Desarrollo local

El arranque normal levanta Vite y el backend IA en un solo proceso coordinador:

```bash
npm run dev
```

Si la aplicación necesita persistencia local, inicia JSON Server en otra terminal:

```bash
npm run server
```

Para depurar cada servicio por separado:

```bash
npm run dev:vite
npm run server:ai
npm run server
```

Al cerrar `npm run dev` con Ctrl+C se detienen Vite y el backend IA. El backend utiliza las variables server-side del entorno local sin exponerlas al bundle del navegador.

El orden de proveedores continúa siendo Gemini → DeepSeek → Groq y todos comparten un único deadline por operación.
