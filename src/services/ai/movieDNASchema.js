export const movieDNAJsonSchema = {
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
}

export const parseProviderJson = (value) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error('invalid-response')
  return JSON.parse(value)
}
