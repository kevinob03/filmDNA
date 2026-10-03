const SESSION_KEY = 'filmdna_personal_gemini_key_session_v1'
const PREFERENCE_KEY = 'filmdna_personal_gemini_key_preference_v1'
const VALID_MODES = new Set(['memory', 'session'])

export const readPersonalGeminiKey = () => {
  try { return window.sessionStorage.getItem(SESSION_KEY) || '' } catch { return '' }
}

export const readPersonalGeminiKeyPreference = () => {
  try {
    const value = JSON.parse(window.localStorage.getItem(PREFERENCE_KEY) || 'null')
    return value?.dontAsk === true && VALID_MODES.has(value.mode) ? value : null
  } catch { return null }
}

export const savePersonalGeminiKey = (apiKey, { mode = 'memory', dontAsk = false } = {}) => {
  const key = String(apiKey || '').trim()
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(key)) throw new Error('invalid-personal-gemini-key')
  try {
    if (mode === 'session') window.sessionStorage.setItem(SESSION_KEY, key)
    else window.sessionStorage.removeItem(SESSION_KEY)
    if (dontAsk && VALID_MODES.has(mode)) window.localStorage.setItem(PREFERENCE_KEY, JSON.stringify({ mode, dontAsk: true }))
    else window.localStorage.removeItem(PREFERENCE_KEY)
  } catch {
    if (mode === 'session') throw new Error('personal-gemini-key-storage-unavailable')
  }
  return key
}

export const clearPersonalGeminiKey = () => {
  try { window.sessionStorage.removeItem(SESSION_KEY) } catch { /* La clave en memoria igualmente se elimina. */ }
}

export const clearPersonalGeminiKeyPreference = () => {
  try { window.localStorage.removeItem(PREFERENCE_KEY) } catch { /* La preferencia puede seguir pidiéndose. */ }
}
