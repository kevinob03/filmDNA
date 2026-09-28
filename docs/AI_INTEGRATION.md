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

## Separación de operaciones futuras

`classifyMovies` clasifica metadata cinematográfica para Recomendaciones. `interpretSearchIntent` será una operación distinta para interpretar texto del usuario y **todavía no está implementada**. El botón de búsqueda natural continúa deshabilitado.

## Desarrollo local

Además de Vite y JSON Server, inicia el backend IA:

```bash
npm run server:ai
```

El orden de proveedores continúa siendo Gemini → DeepSeek → Groq y todos comparten un único deadline por operación.
