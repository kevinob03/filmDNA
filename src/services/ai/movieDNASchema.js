export const movieDNAJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['misterio', 'oscuridad', 'complejidad', 'tension', 'surrealismo', 'ritmo', 'explicacion'],
  properties: {
    misterio: { type: 'number', minimum: 0, maximum: 100 },
    oscuridad: { type: 'number', minimum: 0, maximum: 100 },
    complejidad: { type: 'number', minimum: 0, maximum: 100 },
    tension: { type: 'number', minimum: 0, maximum: 100 },
    surrealismo: { type: 'number', minimum: 0, maximum: 100 },
    ritmo: { type: 'number', minimum: 0, maximum: 100 },
    explicacion: { type: 'string', minLength: 1 },
  },
}

export const parseProviderJson = (value) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error('invalid-response')
  return JSON.parse(value)
}
