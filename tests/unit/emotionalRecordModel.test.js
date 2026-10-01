import {
  EMOTIONAL_NOTE_MAX_LENGTH,
  getEmotionalMoodLabel,
  hasHighEmotionalIntensity,
  needsEmotionalSafetySupport,
  normalizeEmotionalRecord,
} from '../../src/modules/cinematherapy/emotionalRecordModel.js'

describe('emotionalRecordModel', () => {
  test('normaliza un registro estructurado y elimina espacios exteriores', () => {
    expect(normalizeEmotionalRecord({ mood: 'hopeful', intensity: '7', note: '  Hoy pude descansar.  ' })).toEqual({
      mood: 'hopeful',
      intensity: 7,
      note: 'Hoy pude descansar.',
    })
  })

  test('rechaza estados e intensidades fuera del catálogo', () => {
    expect(() => normalizeEmotionalRecord({ mood: 'inventado', intensity: 5 })).toThrow('invalid-mood')
    expect(() => normalizeEmotionalRecord({ mood: 'sad', intensity: 0 })).toThrow('invalid-intensity')
    expect(() => normalizeEmotionalRecord({ mood: 'sad', intensity: 11 })).toThrow('invalid-intensity')
  })

  test('limita la nota personal a 500 caracteres', () => {
    expect(() => normalizeEmotionalRecord({ mood: 'neutral', intensity: 5, note: 'a'.repeat(EMOTIONAL_NOTE_MAX_LENGTH + 1) })).toThrow('invalid-note')
  })

  test('ofrece etiquetas presentables sin inventar estados desconocidos', () => {
    expect(getEmotionalMoodLabel('very-sad')).toBe('Muy triste')
    expect(getEmotionalMoodLabel('unknown')).toBe('Estado no disponible')
  })

  test('marca como alta únicamente una intensidad válida entre 8 y 10', () => {
    expect(hasHighEmotionalIntensity(7)).toBe(false)
    expect(hasHighEmotionalIntensity(8)).toBe(true)
    expect(hasHighEmotionalIntensity('10')).toBe(true)
    expect(hasHighEmotionalIntensity(11)).toBe(false)
    expect(hasHighEmotionalIntensity('sin dato')).toBe(false)
  })

  test('ofrece apoyo solo ante malestar de intensidad alta', () => {
    expect(needsEmotionalSafetySupport({ mood: 'sad', intensity: 8 })).toBe(true)
    expect(needsEmotionalSafetySupport({ mood: 'anxious', intensity: 10 })).toBe(true)
    expect(needsEmotionalSafetySupport({ mood: 'sad', intensity: 7 })).toBe(false)
    expect(needsEmotionalSafetySupport({ mood: 'happy', intensity: 10 })).toBe(false)
    expect(needsEmotionalSafetySupport({ mood: 'neutral', intensity: 9 })).toBe(false)
  })
})
