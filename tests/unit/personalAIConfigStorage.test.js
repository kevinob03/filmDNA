import {
  clearPersonalAIConfig,
  clearPersonalAIPreference,
  readPersonalAIConfig,
  readPersonalAIPreference,
  savePersonalAIConfig,
} from '../../src/services/recommendations/personalAIConfigStorage.js'

const CONFIG = { provider: 'groq', apiKey: 'gsk_test_personal_key_1234567890', model: 'openai/gpt-oss-20b' }

describe('personalAIConfigStorage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  test('no persiste la configuración cuando se elige memoria', () => {
    expect(savePersonalAIConfig(CONFIG, { mode: 'memory' })).toEqual(CONFIG)
    expect(readPersonalAIConfig()).toBeNull()
  })

  test('persiste durante la sesión y recuerda sólo proveedor, modelo y decisión', () => {
    savePersonalAIConfig(CONFIG, { mode: 'session', dontAsk: true })
    expect(readPersonalAIConfig()).toEqual(CONFIG)
    expect(readPersonalAIPreference()).toEqual({ mode: 'session', dontAsk: true, provider: 'groq', model: CONFIG.model })
    expect(localStorage.getItem('filmdna_personal_ai_preference_v1')).not.toContain(CONFIG.apiKey)
  })

  test('permite eliminar configuración y preferencia por separado', () => {
    savePersonalAIConfig(CONFIG, { mode: 'session', dontAsk: true })
    clearPersonalAIConfig()
    expect(readPersonalAIConfig()).toBeNull()
    expect(readPersonalAIPreference()).not.toBeNull()
    clearPersonalAIPreference()
    expect(readPersonalAIPreference()).toBeNull()
  })

  test('rechaza proveedor, clave o modelo inválidos', () => {
    expect(() => savePersonalAIConfig({ ...CONFIG, provider: 'otro' })).toThrow('invalid-personal-ai-provider')
    expect(() => savePersonalAIConfig({ ...CONFIG, apiKey: 'corta' })).toThrow('invalid-personal-ai-key')
    expect(() => savePersonalAIConfig({ ...CONFIG, model: 'modelo con espacios' })).toThrow('invalid-personal-ai-model')
  })
})
