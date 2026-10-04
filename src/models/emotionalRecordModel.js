export const EMOTIONAL_MOODS = Object.freeze([
  { value: 'very-sad', label: 'Muy triste' },
  { value: 'sad', label: 'Triste' },
  { value: 'anxious', label: 'Con ansiedad' },
  { value: 'tired', label: 'Agotado/a' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'hopeful', label: 'Con esperanza' },
  { value: 'happy', label: 'Feliz' },
])

export const EMOTIONAL_NOTE_MAX_LENGTH = 500
export const HIGH_EMOTIONAL_INTENSITY_MINIMUM = 8
const VALID_MOODS = new Set(EMOTIONAL_MOODS.map(({ value }) => value))
const DISTRESS_MOODS = new Set(['very-sad', 'sad', 'anxious', 'tired'])
const MOOD_LABELS = new Map(EMOTIONAL_MOODS.map(({ value, label }) => [value, label]))

export class EmotionalRecordValidationError extends Error {
  constructor(type) {
    super(type)
    this.name = 'EmotionalRecordValidationError'
    this.type = type
  }
}

export const normalizeEmotionalRecord = ({ mood, intensity, note = '' } = {}) => {
  if (!VALID_MOODS.has(mood)) throw new EmotionalRecordValidationError('invalid-mood')
  const normalizedIntensity = Number(intensity)
  if (!Number.isInteger(normalizedIntensity) || normalizedIntensity < 1 || normalizedIntensity > 10) {
    throw new EmotionalRecordValidationError('invalid-intensity')
  }
  if (typeof note !== 'string') throw new EmotionalRecordValidationError('invalid-note')
  const normalizedNote = note.trim()
  if (normalizedNote.length > EMOTIONAL_NOTE_MAX_LENGTH) throw new EmotionalRecordValidationError('invalid-note')
  return { mood, intensity: normalizedIntensity, note: normalizedNote }
}

export const getEmotionalMoodLabel = (mood) => MOOD_LABELS.get(mood) ?? 'Estado no disponible'

export const hasHighEmotionalIntensity = (intensity) => {
  const normalizedIntensity = Number(intensity)
  return Number.isInteger(normalizedIntensity)
    && normalizedIntensity >= HIGH_EMOTIONAL_INTENSITY_MINIMUM
    && normalizedIntensity <= 10
}

export const needsEmotionalSafetySupport = ({ mood, intensity } = {}) => (
  DISTRESS_MOODS.has(mood) && hasHighEmotionalIntensity(intensity)
)
