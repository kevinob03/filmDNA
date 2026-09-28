import { validateMovieDNAProfile } from './movieDNAService.js'
import { AIServiceError, getAIStatus, requestMovieDNA } from './aiClient.js'

export { AIServiceError, getAIStatus }

export const generateMovieDNA = async (movie) => {
  const data = await requestMovieDNA(movie)
  const profile = validateMovieDNAProfile(data?.result)
  if (typeof data?.provider !== 'string' || typeof data?.model !== 'string') throw new AIServiceError('invalid-response')
  return { ...profile, provider: data.provider, model: data.model }
}

export const getAIErrorMessage = (error) => {
  if (error?.type === 'configuration') return 'Configura al menos un proveedor de IA en el servidor para generar este perfil.'
  if (error?.type === 'timeout') return 'El análisis tardó demasiado. Puedes intentarlo nuevamente.'
  if (error?.type === 'rate-limited') return 'El servicio de análisis está temporalmente ocupado.'
  if (['invalid-json', 'invalid-schema', 'empty-response', 'invalid-response'].includes(error?.type)) {
    return 'El proveedor devolvió un análisis que FilmDNA no pudo validar.'
  }
  return 'No fue posible generar el Movie DNA en este momento. Inténtalo nuevamente más tarde.'
}
