const SESSION_KEY = 'filmdna_personal_ai_config_session_v1'
const PREFERENCE_KEY = 'filmdna_personal_ai_preference_v1'
const VALID_MODES = new Set(['memory', 'session'])
const VALID_PROVIDERS = new Set(['gemini', 'groq', 'deepseek'])

const normalizeConfig = ({ provider, apiKey, model } = {}) => {
  const normalizedProvider = String(provider || '').trim().toLowerCase()
  const normalizedKey = String(apiKey || '').trim()
  const normalizedModel = String(model || '').trim()
  if (!VALID_PROVIDERS.has(normalizedProvider)) throw new Error('invalid-personal-ai-provider')
  if (!/^[\x21-\x7E]{16,512}$/.test(normalizedKey)) throw new Error('invalid-personal-ai-key')
  if (!/^[A-Za-z0-9._:/-]{1,120}$/.test(normalizedModel)) throw new Error('invalid-personal-ai-model')
  return { provider: normalizedProvider, apiKey: normalizedKey, model: normalizedModel }
}

export const readPersonalAIConfig = () => {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || 'null')
    return stored ? normalizeConfig(stored) : null
  } catch { return null }
}

export const readPersonalAIPreference = () => {
  try {
    const value = JSON.parse(window.localStorage.getItem(PREFERENCE_KEY) || 'null')
    return value?.dontAsk === true && VALID_MODES.has(value.mode) && VALID_PROVIDERS.has(value.provider)
      ? value
      : null
  } catch { return null }
}

export const savePersonalAIConfig = (config, { mode = 'memory', dontAsk = false } = {}) => {
  const normalized = normalizeConfig(config)
  try {
    if (mode === 'session') window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(normalized))
    else window.sessionStorage.removeItem(SESSION_KEY)
    if (dontAsk && VALID_MODES.has(mode)) {
      window.localStorage.setItem(PREFERENCE_KEY, JSON.stringify({ mode, dontAsk: true, provider: normalized.provider, model: normalized.model }))
    } else window.localStorage.removeItem(PREFERENCE_KEY)
  } catch {
    if (mode === 'session') throw new Error('personal-ai-storage-unavailable')
  }
  return normalized
}

export const clearPersonalAIConfig = () => {
  try { window.sessionStorage.removeItem(SESSION_KEY) } catch { /* La configuración en memoria igualmente se elimina. */ }
}

export const clearPersonalAIPreference = () => {
  try { window.localStorage.removeItem(PREFERENCE_KEY) } catch { /* La preferencia puede seguir pidiéndose. */ }
}
