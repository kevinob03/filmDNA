import { AIProviderError } from './errors.mjs'

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
