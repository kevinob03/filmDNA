import { AIServiceError, requestSearchIntent } from '../aiClient.js'
import { validateSearchIntent } from './searchIntentContract.js'

export const interpretSearchIntent = async (query) => {
  if (typeof query !== 'string' || !query.trim()) throw new AIServiceError('empty-query')
  const response = await requestSearchIntent(query.trim())
  let result
  try {
    result = validateSearchIntent(response?.result)
  } catch (cause) {
    throw new AIServiceError('invalid-response', cause)
  }
  if (typeof response?.provider !== 'string' || typeof response?.model !== 'string') throw new AIServiceError('invalid-response')
  return { ...result, provider: response.provider, model: response.model }
}
