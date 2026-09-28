import { AIProviderError } from '../errors.mjs'

export const movieDNAJsonSchema = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: ['alegria', 'emocion', 'complejidad', 'intensidad', 'fantasia', 'ritmo', 'explicacion'],
  properties: {
    alegria: { type: 'number', minimum: 0, maximum: 100 },
    emocion: { type: 'number', minimum: 0, maximum: 100 },
    complejidad: { type: 'number', minimum: 0, maximum: 100 },
    intensidad: { type: 'number', minimum: 0, maximum: 100 },
    fantasia: { type: 'number', minimum: 0, maximum: 100 },
    ritmo: { type: 'number', minimum: 0, maximum: 100 },
    explicacion: { type: 'string', minLength: 1 },
  },
})

const cleanText = (value) => typeof value === 'string' ? value.trim() : ''

export const buildMovieDNAPrompt = (movie) => {
  const metadata = {
    titulo: cleanText(movie?.title || movie?.original_title),
    sinopsis: cleanText(movie?.overview),
    generos: Array.isArray(movie?.genres) ? movie.genres.map((genre) => cleanText(genre?.name)).filter(Boolean) : [],
    duracionMinutos: Number.isFinite(movie?.runtime) ? movie.runtime : null,
    fechaEstreno: cleanText(movie?.release_date),
    tagline: cleanText(movie?.tagline),
  }

  return `Analiza la experiencia cinematográfica estimada de esta película usando únicamente la metadata proporcionada.

Movie DNA no es una medición científica ni un dato de TMDB. Devuelve exclusivamente un objeto JSON válido, sin Markdown ni texto adicional, con esta estructura exacta:
{
  "alegria": number,
  "emocion": number,
  "complejidad": number,
  "intensidad": number,
  "fantasia": number,
  "ritmo": number,
  "explicacion": string
}

Cada número debe estar entre 0 y 100.
- alegria: tono ligero, divertido, optimista o reconfortante.
- emocion: capacidad de conmover, enternecer o generar impacto afectivo.
- complejidad: complejidad narrativa, conceptual o estructural.
- intensidad: fuerza dramática, sensorial o de acción percibida.
- fantasia: distancia frente al realismo, desde cotidiano hasta fantástico o imaginativo.
- ritmo: velocidad narrativa percibida; no equivale a duración. Bajo es contemplativo y alto es rápido o intenso.

La explicación debe ser breve, útil y relacionarse con la película. Si la metadata no permite estimar responsablemente una dimensión, no inventes detalles narrativos.

METADATA:
${JSON.stringify(metadata)}`
}

export const validateMovieDNAProfile = (profile) => {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) throw new AIProviderError('invalid-schema')
  const normalized = {}
  for (const key of ['alegria', 'emocion', 'complejidad', 'intensidad', 'fantasia', 'ritmo']) {
    const value = profile[key]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) throw new AIProviderError('invalid-schema')
    normalized[key] = Math.round(value)
  }
  if (typeof profile.explicacion !== 'string' || !profile.explicacion.trim()) throw new AIProviderError('invalid-schema')
  normalized.explicacion = profile.explicacion.trim()
  return normalized
}

export const movieDNAOperation = Object.freeze({
  name: 'movie-dna',
  schema: movieDNAJsonSchema,
  buildPrompt: buildMovieDNAPrompt,
  validate: validateMovieDNAProfile,
})
