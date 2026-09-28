export const EXPERIENCE_WEIGHTS = Object.freeze({
  mood: 25,
  tone: 20,
  pace: 20,
  attention: 20,
  company: 15,
})

export const COMPATIBILITY_THRESHOLDS = Object.freeze({
  minimumCoverage: 0.6,
  minimumConfidence: 0.6,
  minimumEvidence: 2,
})

// La confianza describe la calidad de la evidencia, no el grado de coincidencia.
export const CONFIDENCE_LEVELS = Object.freeze({
  high: 0.8,
  medium: 0.65,
})

// La confianza IA es autorreportada: se acepta desde 0.75 para que, tras
// aplicar el factor conservador 0.80, alcance el mínimo global de 0.60.
export const AI_CLASSIFICATION_THRESHOLDS = Object.freeze({
  minimumConfidence: 0.75,
  reliabilityMultiplier: 0.8,
  maximumEffectiveConfidence: 0.8,
})

export const PREFERENCE_DNA_MAP = Object.freeze({
  mood: { dnaGroup: 'moods', weight: 'mood', label: 'Encaja con' },
  tone: { dnaGroup: 'tones', weight: 'tone', label: 'Tono' },
  pace: { dnaGroup: 'pace', weight: 'pace', label: 'Ritmo' },
  attention: { dnaGroup: 'attention', weight: 'attention', label: null },
  company: { dnaGroup: 'company', weight: 'company', label: 'Adecuada para verla' },
})

export const GENRE_IDS = Object.freeze({
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  mystery: 9648,
  romance: 10749,
  scienceFiction: 878,
  thriller: 53,
  war: 10752,
})

// IDs comprobados mediante /search/keyword de TMDB. Los nombres se conservan
// únicamente para evidencia legible; la coincidencia se realiza siempre por ID.
export const VERIFIED_KEYWORDS = Object.freeze({
  philosophy: { id: 490, name: 'philosophy' },
  hauntedHouse: { id: 3358, name: 'haunted house' },
  chase: { id: 3713, name: 'chase' },
  timeTravel: { id: 4379, name: 'time travel' },
  dystopia: { id: 4565, name: 'dystopia' },
  investigation: { id: 5340, name: 'investigation' },
  friendship: { id: 6054, name: 'friendship' },
  politics: { id: 6078, name: 'politics' },
  supernatural: { id: 6152, name: 'supernatural' },
  roadTrip: { id: 7312, name: 'road trip' },
  satire: { id: 8201, name: 'satire' },
  basedOnTrueStory: { id: 9672, name: 'based on true story' },
  revenge: { id: 9748, name: 'revenge' },
  parody: { id: 9755, name: 'parody' },
  murder: { id: 9826, name: 'murder' },
  darkComedy: { id: 10123, name: 'dark comedy' },
  gore: { id: 10292, name: 'gore' },
  survival: { id: 10349, name: 'survival' },
  comingOfAge: { id: 10683, name: 'coming of age' },
  serialKiller: { id: 10714, name: 'serial killer' },
  slasher: { id: 12339, name: 'slasher' },
  zombie: { id: 12377, name: 'zombie' },
  psychologicalThriller: { id: 12565, name: 'psychological thriller' },
  family: { id: 18035, name: 'family' },
  ghost: { id: 162846, name: 'ghost' },
  war: { id: 273967, name: 'war' },
  plotTwist: { id: 275311, name: 'plot twist' },
  bodyHorror: { id: 283085, name: 'body horror' },
  familyFriendly: { id: 317983, name: 'family friendly' },
  romanticComedy: { id: 383992, name: 'romantic comedy' },
})

const genre = (id, contribution, confidence = 0.65) => ({ source: 'genre', id, contribution, confidence })
const keyword = (entry, contribution, confidence = 0.85) => ({ source: 'keyword', id: entry.id, contribution, confidence })

export const EXPERIENCE_RULES = Object.freeze([
  { id: 'mood-laugh-comedy', group: 'moods', option: 'laugh', signal: genre(GENRE_IDS.comedy, 2, 0.8) },
  { id: 'mood-laugh-satire', group: 'moods', option: 'laugh', signal: keyword(VERIFIED_KEYWORDS.satire, 2) },
  { id: 'mood-laugh-parody', group: 'moods', option: 'laugh', signal: keyword(VERIFIED_KEYWORDS.parody, 3, 0.9) },
  { id: 'mood-laugh-romcom', group: 'moods', option: 'laugh', signal: keyword(VERIFIED_KEYWORDS.romanticComedy, 2) },

  { id: 'mood-feel-drama', group: 'moods', option: 'feel', signal: genre(GENRE_IDS.drama, 1) },
  { id: 'mood-feel-romance', group: 'moods', option: 'feel', signal: genre(GENRE_IDS.romance, 1) },
  { id: 'mood-feel-coming-age', group: 'moods', option: 'feel', signal: keyword(VERIFIED_KEYWORDS.comingOfAge, 2) },
  { id: 'mood-feel-friendship', group: 'moods', option: 'feel', signal: keyword(VERIFIED_KEYWORDS.friendship, 2, 0.75) },
  { id: 'mood-feel-family', group: 'moods', option: 'feel', signal: keyword(VERIFIED_KEYWORDS.family, 2, 0.75) },

  { id: 'mood-relax-family-friendly', group: 'moods', option: 'relax', signal: keyword(VERIFIED_KEYWORDS.familyFriendly, 3, 0.9) },
  { id: 'mood-relax-family', group: 'moods', option: 'relax', signal: genre(GENRE_IDS.family, 1, 0.65) },
  { id: 'mood-relax-comedy', group: 'moods', option: 'relax', signal: genre(GENRE_IDS.comedy, 1, 0.6) },

  { id: 'mood-tension-thriller', group: 'moods', option: 'tension', signal: genre(GENRE_IDS.thriller, 2, 0.8) },
  { id: 'mood-tension-survival', group: 'moods', option: 'tension', signal: keyword(VERIFIED_KEYWORDS.survival, 2) },
  { id: 'mood-tension-chase', group: 'moods', option: 'tension', signal: keyword(VERIFIED_KEYWORDS.chase, 2) },
  { id: 'mood-tension-psychological', group: 'moods', option: 'tension', signal: keyword(VERIFIED_KEYWORDS.psychologicalThriller, 3, 0.9) },

  { id: 'mood-surprise-mystery', group: 'moods', option: 'surprise', signal: genre(GENRE_IDS.mystery, 1, 0.6) },
  { id: 'mood-surprise-plot-twist', group: 'moods', option: 'surprise', signal: keyword(VERIFIED_KEYWORDS.plotTwist, 3, 0.95) },

  { id: 'mood-fear-horror', group: 'moods', option: 'fear', signal: genre(GENRE_IDS.horror, 2, 0.85) },
  { id: 'mood-fear-haunted', group: 'moods', option: 'fear', signal: keyword(VERIFIED_KEYWORDS.hauntedHouse, 2) },
  { id: 'mood-fear-ghost', group: 'moods', option: 'fear', signal: keyword(VERIFIED_KEYWORDS.ghost, 2) },
  { id: 'mood-fear-slasher', group: 'moods', option: 'fear', signal: keyword(VERIFIED_KEYWORDS.slasher, 2) },
  { id: 'mood-fear-body-horror', group: 'moods', option: 'fear', signal: keyword(VERIFIED_KEYWORDS.bodyHorror, 3, 0.9) },

  { id: 'mood-think-documentary', group: 'moods', option: 'think', signal: genre(GENRE_IDS.documentary, 2, 0.8) },
  { id: 'mood-think-philosophy', group: 'moods', option: 'think', signal: keyword(VERIFIED_KEYWORDS.philosophy, 3, 0.95) },
  { id: 'mood-think-dystopia', group: 'moods', option: 'think', signal: keyword(VERIFIED_KEYWORDS.dystopia, 2) },
  { id: 'mood-think-politics', group: 'moods', option: 'think', signal: keyword(VERIFIED_KEYWORDS.politics, 2) },
  { id: 'mood-think-investigation', group: 'moods', option: 'think', signal: keyword(VERIFIED_KEYWORDS.investigation, 2, 0.8) },

  { id: 'tone-light-comedy', group: 'tones', option: 'light', signal: genre(GENRE_IDS.comedy, 1, 0.65) },
  { id: 'tone-light-family', group: 'tones', option: 'light', signal: genre(GENRE_IDS.family, 1, 0.65) },
  { id: 'tone-light-family-friendly', group: 'tones', option: 'light', signal: keyword(VERIFIED_KEYWORDS.familyFriendly, 3, 0.9) },
  { id: 'tone-emotional-drama', group: 'tones', option: 'emotional', signal: genre(GENRE_IDS.drama, 1, 0.6) },
  { id: 'tone-emotional-romance', group: 'tones', option: 'emotional', signal: genre(GENRE_IDS.romance, 1, 0.65) },
  { id: 'tone-emotional-coming-age', group: 'tones', option: 'emotional', signal: keyword(VERIFIED_KEYWORDS.comingOfAge, 2) },
  { id: 'tone-emotional-family', group: 'tones', option: 'emotional', signal: keyword(VERIFIED_KEYWORDS.family, 2, 0.75) },
  { id: 'tone-serious-drama', group: 'tones', option: 'serious', signal: genre(GENRE_IDS.drama, 1, 0.65) },
  { id: 'tone-serious-documentary', group: 'tones', option: 'serious', signal: genre(GENRE_IDS.documentary, 2, 0.85) },
  { id: 'tone-serious-history', group: 'tones', option: 'serious', signal: genre(GENRE_IDS.history, 2, 0.8) },
  { id: 'tone-serious-true-story', group: 'tones', option: 'serious', signal: keyword(VERIFIED_KEYWORDS.basedOnTrueStory, 2) },
  { id: 'tone-serious-politics', group: 'tones', option: 'serious', signal: keyword(VERIFIED_KEYWORDS.politics, 2) },
  { id: 'tone-dark-horror', group: 'tones', option: 'dark', signal: genre(GENRE_IDS.horror, 2, 0.85) },
  { id: 'tone-dark-crime', group: 'tones', option: 'dark', signal: genre(GENRE_IDS.crime, 1, 0.65) },
  { id: 'tone-dark-murder', group: 'tones', option: 'dark', signal: keyword(VERIFIED_KEYWORDS.murder, 2) },
  { id: 'tone-dark-dystopia', group: 'tones', option: 'dark', signal: keyword(VERIFIED_KEYWORDS.dystopia, 2) },
  { id: 'tone-dark-serial-killer', group: 'tones', option: 'dark', signal: keyword(VERIFIED_KEYWORDS.serialKiller, 3, 0.9) },
  { id: 'tone-disturbing-body-horror', group: 'tones', option: 'disturbing', signal: keyword(VERIFIED_KEYWORDS.bodyHorror, 3, 0.95) },
  { id: 'tone-disturbing-gore', group: 'tones', option: 'disturbing', signal: keyword(VERIFIED_KEYWORDS.gore, 3, 0.9) },
  { id: 'tone-disturbing-slasher', group: 'tones', option: 'disturbing', signal: keyword(VERIFIED_KEYWORDS.slasher, 2, 0.85) },
  { id: 'tone-disturbing-serial-killer', group: 'tones', option: 'disturbing', signal: keyword(VERIFIED_KEYWORDS.serialKiller, 2, 0.85) },

  { id: 'pace-dynamic-action', group: 'pace', option: 'dynamic', signal: genre(GENRE_IDS.action, 1, 0.6) },
  { id: 'pace-dynamic-adventure', group: 'pace', option: 'dynamic', signal: genre(GENRE_IDS.adventure, 1, 0.55) },
  { id: 'pace-dynamic-chase', group: 'pace', option: 'dynamic', signal: keyword(VERIFIED_KEYWORDS.chase, 3, 0.9) },
  { id: 'pace-dynamic-survival', group: 'pace', option: 'dynamic', signal: keyword(VERIFIED_KEYWORDS.survival, 2, 0.75) },
  { id: 'pace-relentless-action', group: 'pace', option: 'relentless', signal: genre(GENRE_IDS.action, 1, 0.55) },
  { id: 'pace-relentless-chase', group: 'pace', option: 'relentless', signal: keyword(VERIFIED_KEYWORDS.chase, 3, 0.9) },
  { id: 'pace-relentless-survival', group: 'pace', option: 'relentless', signal: keyword(VERIFIED_KEYWORDS.survival, 2, 0.75) },

  { id: 'attention-easy-family', group: 'attention', option: 'easy', signal: genre(GENRE_IDS.family, 1, 0.6) },
  { id: 'attention-easy-animation', group: 'attention', option: 'easy', signal: genre(GENRE_IDS.animation, 1, 0.55) },
  { id: 'attention-easy-family-friendly', group: 'attention', option: 'easy', signal: keyword(VERIFIED_KEYWORDS.familyFriendly, 3, 0.9) },
  { id: 'attention-focus-mystery', group: 'attention', option: 'focus', signal: genre(GENRE_IDS.mystery, 1, 0.6) },
  { id: 'attention-focus-investigation', group: 'attention', option: 'focus', signal: keyword(VERIFIED_KEYWORDS.investigation, 2, 0.85) },
  { id: 'attention-focus-politics', group: 'attention', option: 'focus', signal: keyword(VERIFIED_KEYWORDS.politics, 2, 0.8) },
  { id: 'attention-focus-time-travel', group: 'attention', option: 'focus', signal: keyword(VERIFIED_KEYWORDS.timeTravel, 2, 0.8) },
  { id: 'attention-challenge-philosophy', group: 'attention', option: 'challenge', signal: keyword(VERIFIED_KEYWORDS.philosophy, 3, 0.95) },
  { id: 'attention-challenge-politics', group: 'attention', option: 'challenge', signal: keyword(VERIFIED_KEYWORDS.politics, 2, 0.8) },
  { id: 'attention-challenge-dystopia', group: 'attention', option: 'challenge', signal: keyword(VERIFIED_KEYWORDS.dystopia, 2, 0.8) },
  { id: 'attention-challenge-time-travel', group: 'attention', option: 'challenge', signal: keyword(VERIFIED_KEYWORDS.timeTravel, 2, 0.8) },
])

export const CLASSIFICATION_CONFIG = Object.freeze({
  moods: {
    laugh: { minimumPoints: 2, maximumPoints: 5 }, feel: { minimumPoints: 2, maximumPoints: 5 },
    relax: { minimumPoints: 3, maximumPoints: 5 }, tension: { minimumPoints: 2, maximumPoints: 6 },
    surprise: { minimumPoints: 3, maximumPoints: 4 }, fear: { minimumPoints: 2, maximumPoints: 6 },
    think: { minimumPoints: 3, maximumPoints: 6 },
  },
  tones: {
    light: { minimumPoints: 2, maximumPoints: 5, rejectOnConflict: true }, emotional: { minimumPoints: 2, maximumPoints: 5 },
    serious: { minimumPoints: 2, maximumPoints: 6 }, dark: { minimumPoints: 2, maximumPoints: 6 },
    disturbing: { minimumPoints: 3, maximumPoints: 6 },
  },
  pace: {
    calm: { minimumPoints: Number.POSITIVE_INFINITY, maximumPoints: 1 },
    balanced: { minimumPoints: Number.POSITIVE_INFINITY, maximumPoints: 1 },
    dynamic: { minimumPoints: 2, maximumPoints: 6, requireKeyword: true },
    relentless: { minimumPoints: 4, maximumPoints: 6, requireKeyword: true },
  },
  attention: {
    easy: { minimumPoints: 3, maximumPoints: 5 },
    casual: { minimumPoints: Number.POSITIVE_INFINITY, maximumPoints: 1 },
    focus: { minimumPoints: 2, maximumPoints: 6 },
    challenge: { minimumPoints: 3, maximumPoints: 6 },
  },
  company: {
    alone: { minimumPoints: Number.POSITIVE_INFINITY, maximumPoints: 1 },
    couple: { minimumPoints: Number.POSITIVE_INFINITY, maximumPoints: 1 },
    friends: { minimumPoints: Number.POSITIVE_INFINITY, maximumPoints: 1 },
    family: { minimumPoints: 4, maximumPoints: 6 },
  },
})

// Señales reales de TMDB que contradicen de forma fuerte una clasificación
// de tono ligero. Ante conflicto se conserva la preferencia como unknown.
export const CLASSIFICATION_CONFLICTS = Object.freeze({
  tones: {
    light: [
      { source: 'genre', id: GENRE_IDS.horror },
      { source: 'keyword', id: VERIFIED_KEYWORDS.darkComedy.id },
      { source: 'keyword', id: VERIFIED_KEYWORDS.gore.id },
      { source: 'keyword', id: VERIFIED_KEYWORDS.serialKiller.id },
      { source: 'keyword', id: VERIFIED_KEYWORDS.slasher.id },
      { source: 'keyword', id: VERIFIED_KEYWORDS.bodyHorror.id },
    ],
  },
})

export const FAMILY_CERTIFICATIONS_ES = Object.freeze(['APTA', '7', 'TP'])
