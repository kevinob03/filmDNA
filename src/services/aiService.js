export class AIServiceError extends Error {
  constructor(type, cause) {
    super(type)
    this.name = 'AIServiceError'
    this.type = type
    this.cause = cause
  }
}

const providers = [geminiProvider, deepseekProvider, groqProvider]
const PROVIDER_TIMEOUT_MS = 30_000

const generateWithTimeout = (provider, prompt, config) => Promise.race([
  provider.generate(prompt, config),
  new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error('timeout')), PROVIDER_TIMEOUT_MS)
  }),
])

export const isAIConfigured = providers.some((provider) => {
  const config = provider.getConfig()
  return Boolean(config.apiKey && config.model)
})

const cleanText = (value) => typeof value === 'string' ? value.trim() : ''

export const buildMovieDNAPrompt = (movie) => {
  const genres = Array.isArray(movie?.genres)
    ? movie.genres.map((genre) => cleanText(genre?.name)).filter(Boolean)
    : []

  const metadata = {
    titulo: cleanText(movie?.title || movie?.original_title),
    sinopsis: cleanText(movie?.overview),
    generos: genres,
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

La explicación debe ser breve, útil, no excesivamente técnica y relacionarse con la película. Si la metadata no permite estimar responsablemente una dimensión, no inventes detalles narrativos.

METADATA:
${JSON.stringify(metadata)}`
}

export const generateMovieDNA = async (movie) => {
  const configuredProviders = providers
    .map((provider) => ({ provider, config: provider.getConfig() }))
    .filter(({ config }) => config.apiKey && config.model)

  console.info('[Movie DNA] Proveedores configurados:', configuredProviders.map(({ provider }) => provider.name).join(', ') || 'ninguno')

  if (!configuredProviders.length) throw new AIServiceError('configuration')

  const prompt = buildMovieDNAPrompt(movie)
  for (const { provider, config } of configuredProviders) {
    try {
      console.info(`[Movie DNA] Intentando proveedor: ${provider.name}`)
      const profile = validateMovieDNAProfile(await generateWithTimeout(provider, prompt, config))
      return { ...profile, provider: provider.name, model: config.model }
    } catch (error) {
      console.warn(`[Movie DNA] Falló ${provider.name}: ${error?.message || 'error desconocido'}`)
    }
  }

  throw new AIServiceError('unavailable')
}

export const getAIErrorMessage = (error) => {
  if (error?.type === 'configuration') {
    return 'Configura al menos un proveedor de IA para generar este perfil.'
  }

  if (error?.type === 'invalid-response') {
    return 'El proveedor devolvió un análisis que FilmDNA no pudo validar.'
  }

  return 'No fue posible generar el Movie DNA en este momento. Inténtalo nuevamente más tarde.'
}
import { validateMovieDNAProfile } from './movieDNAService.js'
import { geminiProvider } from './ai/geminiProvider.js'
import { deepseekProvider } from './ai/deepseekProvider.js'
import { groqProvider } from './ai/groqProvider.js'
