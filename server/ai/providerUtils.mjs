import { AIProviderError } from './errors.mjs'

export const omitSchemaKeywords = (value, omittedKeywords) => {
  if (Array.isArray(value)) return value.map((item) => omitSchemaKeywords(item, omittedKeywords))
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !omittedKeywords.has(key))
    .map(([key, item]) => [key, omitSchemaKeywords(item, omittedKeywords)]))
}

export const supportsStrictJsonSchema = (schema) => {
  if (!schema || typeof schema !== 'object') return true
  if (Array.isArray(schema)) return schema.every(supportsStrictJsonSchema)
  if (schema.type === 'object' && schema.properties) {
    const required = new Set(schema.required || [])
    if (Object.keys(schema.properties).some((key) => !required.has(key))) return false
  }
  return Object.values(schema).every(supportsStrictJsonSchema)
}

export const parseProviderJson = (value, provider) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AIProviderError('empty-response', { provider })
  }

  try {
    return JSON.parse(value)
  } catch (cause) {
    throw new AIProviderError('invalid-json', { provider, cause })
  }
}

export const postJson = async (url, options, provider) => {
  let response
  try {
    response = await fetch(url, options)
  } catch (cause) {
    if (cause?.name === 'AbortError') throw new AIProviderError('timeout', { provider, cause })
    throw new AIProviderError('unavailable', { provider, cause })
  }

  if (!response.ok) {
    const type = response.status === 429 ? 'rate-limited' : 'unavailable'
    throw new AIProviderError(type, { provider, status: response.status })
  }

  try {
    return await response.json()
  } catch (cause) {
    throw new AIProviderError('invalid-json', { provider, status: response.status, cause })
  }
}
