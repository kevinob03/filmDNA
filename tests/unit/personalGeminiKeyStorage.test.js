import {
  clearPersonalGeminiKey,
  clearPersonalGeminiKeyPreference,
  readPersonalGeminiKey,
  readPersonalGeminiKeyPreference,
  savePersonalGeminiKey,
} from '../../src/services/recommendations/personalGeminiKeyStorage.js'

const KEY = 'AIza_test_personal_key_1234567890'

describe('personalGeminiKeyStorage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  test('no persiste la clave cuando se elige memoria', () => {
    expect(savePersonalGeminiKey(KEY, { mode: 'memory' })).toBe(KEY)
    expect(readPersonalGeminiKey()).toBe('')
  })

  test('persiste sólo durante la sesión y recuerda únicamente la decisión', () => {
    savePersonalGeminiKey(KEY, { mode: 'session', dontAsk: true })
    expect(readPersonalGeminiKey()).toBe(KEY)
    expect(readPersonalGeminiKeyPreference()).toEqual({ mode: 'session', dontAsk: true })
    expect(localStorage.getItem('filmdna_personal_gemini_key_preference_v1')).not.toContain(KEY)
  })

  test('permite eliminar clave y preferencia por separado', () => {
    savePersonalGeminiKey(KEY, { mode: 'session', dontAsk: true })
    clearPersonalGeminiKey()
    expect(readPersonalGeminiKey()).toBe('')
    expect(readPersonalGeminiKeyPreference()).toEqual({ mode: 'session', dontAsk: true })
    clearPersonalGeminiKeyPreference()
    expect(readPersonalGeminiKeyPreference()).toBeNull()
  })

  test('rechaza claves inválidas', () => {
    expect(() => savePersonalGeminiKey('corta', { mode: 'session' })).toThrow('invalid-personal-gemini-key')
  })
})
