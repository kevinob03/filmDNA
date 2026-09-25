const DEFAULT_API_URL = 'http://localhost:3001'
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
const API_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '')

export const MOVIE_DNA_DIMENSIONS = Object.freeze([
  { key: 'misterio', label: 'Misterio' },
  { key: 'oscuridad', label: 'Oscuridad' },
  { key: 'complejidad', label: 'Complejidad' },
  { key: 'tension', label: 'Tensión' },
  { key: 'surrealismo', label: 'Surrealismo' },
  { key: 'ritmo', label: 'Ritmo' },
])

export class MovieDNAServiceError extends Error {
  constructor(type, status) {
    super(type)
    this.name = 'MovieDNAServiceError'
    this.type = type
    this.status = status
  }
}

const request = async (endpoint, options = {}) => {
  let response

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    })
  } catch {
    throw new MovieDNAServiceError('network')
  }

  if (!response.ok) {
    throw new MovieDNAServiceError('request', response.status)
  }

  if (response.status === 204) return null
  return response.json()
}

const requireValidTmdbId = (tmdbId) => {
  const normalizedId = Number(tmdbId)

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new MovieDNAServiceError('invalid-tmdb-id')
  }

  return normalizedId
}

export const validateMovieDNAProfile = (profile) => {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    throw new MovieDNAServiceError('invalid-profile')
  }

  const normalized = {}

  for (const { key } of MOVIE_DNA_DIMENSIONS) {
    const value = profile[key]

    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
      throw new MovieDNAServiceError('invalid-profile')
    }

    normalized[key] = Math.round(value)
  }

  if (typeof profile.explicacion !== 'string' || !profile.explicacion.trim()) {
    throw new MovieDNAServiceError('invalid-profile')
  }

  normalized.explicacion = profile.explicacion.trim()
  return normalized
}

export const getMovieDNAByTmdbId = async (tmdbId) => {
  const normalizedId = requireValidTmdbId(tmdbId)
  const records = await request(`/movieDNA?tmdbId=${encodeURIComponent(normalizedId)}`)
  const record = records.find((item) => Number(item.tmdbId) === normalizedId)

  if (!record) return null

  return {
    id: record.id,
    tmdbId: normalizedId,
    ...validateMovieDNAProfile(record),
    source: record.source,
    provider: record.provider,
    model: record.model,
    generatedAt: record.generatedAt,
  }
}

export const saveMovieDNA = async (tmdbId, profile) => {
  const normalizedId = requireValidTmdbId(tmdbId)
  const normalizedProfile = validateMovieDNAProfile(profile)
  const provider = typeof profile.provider === 'string' ? profile.provider.trim() : ''
  const model = typeof profile.model === 'string' ? profile.model.trim() : ''

  if (!['gemini', 'deepseek', 'groq'].includes(provider) || !model) {
    throw new MovieDNAServiceError('invalid-profile')
  }

  const existing = await getMovieDNAByTmdbId(normalizedId)
  if (existing) return existing

  return request('/movieDNA', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tmdbId: normalizedId,
      ...normalizedProfile,
      source: 'ai',
      provider,
      model,
      generatedAt: new Date().toISOString(),
    }),
  })
}

export const interpretMovieDNAValue = (value) => {
  if (value <= 20) return 'Muy bajo'
  if (value <= 40) return 'Bajo'
  if (value <= 60) return 'Medio'
  if (value <= 80) return 'Alto'
  return 'Muy alto'
}

export const getMovieDNAErrorMessage = (error) => {
  if (error?.type === 'network') {
    return 'No pudimos consultar Movie DNA. Comprueba que JSON Server esté activo.'
  }

  if (error?.type === 'invalid-profile') {
    return 'El perfil guardado no tiene una estructura válida.'
  }

  return 'No pudimos consultar el perfil Movie DNA en este momento.'
}
