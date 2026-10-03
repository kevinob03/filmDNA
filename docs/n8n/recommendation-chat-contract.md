# Contrato del chatbot de recomendaciones

## Alcance

El chatbot es un copiloto cinematografico. Interpreta busquedas, solicita aclaraciones, refina filtros, pide sustituir una pelicula y explica candidatos reales. No ofrece acompanamiento psicologico ni realiza diagnosticos.

La IA no selecciona ni crea peliculas. Solo devuelve acciones y filtros validados. El motor determinista de FilmDNA conserva la responsabilidad de consultar TMDB, ordenar resultados y renderizar las tarjetas existentes.

## Frontera de confianza

El navegador se comunica exclusivamente con el servidor de FilmDNA. El servidor agregara la autenticacion antes de llamar al webhook de n8n. La URL y el secreto del webhook nunca deben usar el prefijo `VITE_` ni incluirse en el bundle.

```text
React -> servidor FilmDNA -> webhook protegido de n8n -> gateway IA de FilmDNA
```

`src/services/recommendations/recommendationChatContract.js` es la fuente ejecutable de verdad.

## Datos permitidos

- Identificadores aleatorios de solicitud y sesion.
- Mensaje actual y un maximo de seis turnos recientes.
- Filtros del contrato `recommendation-search-intent-v1`.
- Identificadores de TMDB ya mostrados.
- Hasta cinco candidatos con metadatos publicos limitados de TMDB.

## Datos prohibidos

- Identificador real, nombre, correo o contrasena del usuario.
- Historial emocional.
- Notas privadas o psicologicas.
- Contenido de `.env` o credenciales de proveedores.

La primera version no persiste transcripciones en `db.json`. El historial sera efimero y se eliminara al cerrar sesion.

## Acciones permitidas

- `new-search`: iniciar una busqueda con filtros aprobados.
- `clarify`: solicitar informacion sin cambiar filtros.
- `refine`: establecer o limpiar filtros.
- `replace-one`: reemplazar mediante un ID real de TMDB.
- `explain`: explicar usando solo metadatos recibidos.
- `reset`: reiniciar el estado conversacional.
- `error`: comunicar un fallo sin detalles internos.

Las respuestas no pueden incluir `movies`. Esto impide que un modelo genere titulos o IDs y obliga a usar el motor real de FilmDNA.

## Limites

| Elemento | Limite |
| --- | ---: |
| Mensaje del usuario | 500 caracteres |
| Respuesta del asistente | 800 caracteres |
| Historial | 6 turnos |
| IDs ya mostrados | 20 |
| Candidatos para explicar | 5 |
| Respuestas sugeridas | 4 |
| Turnos por sesion | 50 |

## Gateway seguro implementado

El endpoint publico de FilmDNA es `POST /api/ai/recommendation-chat`. React usara esta ruta y nunca llamara directamente a n8n.

El servidor valida el contrato antes de cualquier llamada, limita cada cliente y sesion a 12 solicitudes por minuto, rechaza cuerpos mayores de 64 KiB y aplica un timeout entre 1 y 15 segundos. Tambien rechaza HTTP para hosts remotos, redirecciones y credenciales incrustadas en la URL.

Variables exclusivas del servidor:

```env
N8N_RECOMMENDATION_WEBHOOK_URL=http://localhost:5678/webhook/filmdna/recommendation-chat
N8N_RECOMMENDATION_WEBHOOK_SECRET=
N8N_RECOMMENDATION_TIMEOUT_MS=30000
```

El secreto se envia a n8n mediante `X-FilmDNA-Webhook-Secret` y no debe usar el prefijo `VITE_`. La IA del chatbot se ejecuta directamente en el nodo visual `AI Agent`, conectado a `Google Gemini Chat Model`, una herramienta de vocabulario y un parser estructurado.

## Siguiente bloque

El workflow exportable `FilmDNA - Recommendation Chatbot` ya esta implementado y validado. El Bloque 4 creara la interfaz React y conectara sus acciones con el motor determinista de recomendaciones.
