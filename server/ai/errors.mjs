export class AIProviderError extends Error {
  constructor(type, { provider = null, status = null, cause = null } = {}) {
    super(type)
    this.name = 'AIProviderError'
    this.type = type
    this.provider = provider
    this.status = status
    this.cause = cause
  }
}

export const toPublicAIError = (error) => {
  const supported = new Set(['configuration', 'timeout', 'rate-limited', 'invalid-json', 'invalid-schema', 'empty-response', 'unavailable'])
  return supported.has(error?.type) ? error.type : 'unavailable'
}
