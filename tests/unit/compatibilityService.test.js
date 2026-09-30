import { calculateCompatibility } from '../../src/services/recommendations/compatibilityService.js'
import { OPTION_GROUPS } from '../../src/modules/recommendations/recommendationConfig.js'

const objective = (overrides = {}) => ({
  genres: [{ id: 35, name: 'Comedia' }], runtime: 100, releaseDate: '2024-01-01',
  voteAverage: 8, originalLanguage: 'es', productionCountries: [{ iso_3166_1: 'ES' }],
  providers: [{ id: 8, name: 'Netflix' }], ...overrides,
})

const dna = ({ objectiveOverrides, experience = {} } = {}) => ({
  objective: objective(objectiveOverrides),
  experience: { moods: {}, pace: {}, attention: {}, company: {}, ...experience },
})

describe('calculateCompatibility', () => {
  test('calcula 1–100 usando un género verificable aunque no haya criterios emocionales', () => {
    const result = calculateCompatibility({ genres: ['35'] }, dna(), { optionGroups: OPTION_GROUPS })
    expect(result.percentage).toBe(100)
    expect(result.evaluatedCriteria).toHaveLength(1)
    expect(result.coverage).toBe(1)
  })

  test('distingue coincidencia parcial cuando se solicitan varios géneros', () => {
    const result = calculateCompatibility({ genres: ['35', '18'] }, dna(), { optionGroups: OPTION_GROUPS })
    expect(result.percentage).toBe(50)
    expect(result.reasons.some((reason) => reason.text.includes('1 género coincidente'))).toBe(true)
  })

  test('incluye duración, época, puntuación, idioma, país y plataforma', () => {
    const result = calculateCompatibility({
      duration: '90-120', era: '2020s', minRating: 7, language: 'es', region: 'ES', providers: ['8'],
    }, dna(), { optionGroups: OPTION_GROUPS, providers: [{ provider_id: 8, provider_name: 'Netflix' }] })
    expect(result.percentage).toBe(100)
    expect(result.evaluatedCriteria.map(({ key }) => key)).toEqual([
      'duration', 'era', 'minRating', 'language', 'region', 'providers',
    ])
  })

  test('combina criterios objetivos y experiencia con sus pesos documentados', () => {
    const result = calculateCompatibility({ genres: ['35'], mood: 'laugh' }, dna({
      experience: { moods: { laugh: { status: 'known', score: 40, confidence: 0.8, evidence: [{ ruleId: 'laugh', sourceId: 35 }] } } },
    }), { optionGroups: OPTION_GROUPS })
    expect(result.percentage).toBe(70)
    expect(result.evaluatedPreferences).toHaveLength(1)
    expect(result.evaluatedCriteria).toHaveLength(1)
  })

  test('no convierte criterios sin datos en cero por ciento', () => {
    const result = calculateCompatibility({ duration: '90-120' }, dna({ objectiveOverrides: { runtime: null } }), { optionGroups: OPTION_GROUPS })
    expect(result.percentage).toBeNull()
    expect(result.unknownCriteria[0].label).toBe('90–120 min')
  })

  test('nunca muestra 0% cuando existe evidencia evaluable', () => {
    const result = calculateCompatibility({ genres: ['18'] }, dna(), { optionGroups: OPTION_GROUPS })
    expect(result.percentage).toBe(1)
  })
})
