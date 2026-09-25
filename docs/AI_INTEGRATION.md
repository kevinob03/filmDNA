# Integración de IA de FilmDNA

Movie DNA intenta, en orden, Gemini, DeepSeek y Groq. Cada proveedor solo participa si su clave y su modelo están configurados localmente.

Esta integración se ejecuta desde Vite por el alcance académico. Las variables `VITE_*` llegan al navegador y no protegen secretos en producción. Una versión pública debe mover estas llamadas a un backend, función serverless o proxy.

Solo se envía metadata cinematográfica; no se envían sesiones, usuarios ni datos personales. TMDB sigue siendo la fuente principal. OMDb se limita a búsqueda y detalle básicos; sus IDs IMDb nunca se guardan como `tmdbId`.

## Incidencias externas conocidas

El fallback secuencial y sus timeouts están implementados. Gemini puede responder `503` por capacidad o disponibilidad temporal; DeepSeek puede responder `402` cuando la cuenta no tiene saldo; y Groq puede presentar bloqueos de red, CORS o preflight al llamarse directamente desde el navegador. FilmDNA muestra un error controlado y mantiene disponibles el detalle de la película y el resto de la aplicación.

Estas incidencias de proveedores no bloquean el desarrollo del proyecto. No se implementará un backend, proxy o función serverless durante esta fase.
