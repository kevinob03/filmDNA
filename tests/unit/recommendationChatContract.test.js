import {
  RECOMMENDATION_CHAT_SCHEMA_VERSION,
  RECOMMENDATION_CHAT_FORBIDDEN_FIELDS,
  RecommendationChatContractError,
  validateRecommendationChatExchange,
  validateRecommendationChatRequest,
  validateRecommendationChatResponse,
} from '../../src/services/recommendations/recommendationChatContract.js'

const validRequest = (overrides = {}) => ({
  schemaVersion: RECOMMENDATION_CHAT_SCHEMA_VERSION,
  requestId: 'request_12345678',
  sessionId: 'session_12345678',
  message: '  Quiero una comedia corta para ver con amigos.  ',
  history: [
    { role: 'user', text: 'Quiero algo divertido.' },
    { role: 'assistant', text: 'La veras solo o acompanado?' },
  ],
  context: {
    turn: 2,
    filters: { genres: ['35'], duration: 'under-90' },
    shownMovieIds: [101, 202],
    candidates: [{
      tmdbId: 101,
      title: 'Pelicula de prueba',
      overview: 'Una sinopsis publica.',
      releaseYear: 2024,
      genreIds: [35],
      runtime: 88,
      voteAverage: 7.46,
    }],
  },
  ...overrides,
})

const validResponse = (overrides = {}) => ({
  schemaVersion: RECOMMENDATION_CHAT_SCHEMA_VERSION,
  requestId: 'request_12345678',
  action: 'refine',
  reply: 'Buscare comedias cortas para ver con amigos.',
  filtersPatch: { genres: ['35'], duration: 'under-90', company: 'friends' },
  clearFilters: [],
  targetMovieId: null,
  suggestedReplies: ['Que sea reciente', 'Agregar aventura'],
  ...overrides,
})

describe('recommendationChatContract', () => {
  test('normaliza una solicitud valida con contexto cinematografico publico', () => {
    const result = validateRecommendationChatRequest(validRequest())
    expect(result.message).toBe('Quiero una comedia corta para ver con amigos.')
    expect(result.context.filters).toEqual({ genres: ['35'], duration: 'under-90' })
    expect(result.context.candidates[0].voteAverage).toBe(7.5)
  })

  test.each(RECOMMENDATION_CHAT_FORBIDDEN_FIELDS)(
    'rechaza el campo privado %s',
    (field) => {
      expect(() => validateRecommendationChatRequest({ ...validRequest(), [field]: 'dato-privado' }))
        .toThrow(RecommendationChatContractError)
    },
  )

  test('rechaza mensajes, historial y candidatos por encima de sus limites', () => {
    expect(() => validateRecommendationChatRequest(validRequest({ message: 'x'.repeat(501) })))
      .toThrow(RecommendationChatContractError)
    expect(() => validateRecommendationChatRequest(validRequest({
      history: Array(7).fill({ role: 'user', text: 'hola' }),
    }))).toThrow(RecommendationChatContractError)
    const movie = validRequest().context.candidates[0]
    expect(() => validateRecommendationChatRequest(validRequest({
      context: {
        ...validRequest().context,
        candidates: Array.from({ length: 6 }, (_, index) => ({ ...movie, tmdbId: index + 1 })),
      },
    }))).toThrow(RecommendationChatContractError)
  })

  test('el historial debe contener turnos completos y alternados', () => {
    expect(() => validateRecommendationChatRequest(validRequest({
      history: [{ role: 'user', text: 'Primer mensaje' }],
    }))).toThrow(RecommendationChatContractError)
    expect(() => validateRecommendationChatRequest(validRequest({
      history: [
        { role: 'assistant', text: 'Respuesta fuera de orden' },
        { role: 'user', text: 'Mensaje fuera de orden' },
      ],
    }))).toThrow(RecommendationChatContractError)
  })

  test('rechaza filtros inexistentes y valores fuera del vocabulario FilmDNA', () => {
    expect(() => validateRecommendationChatRequest(validRequest({
      context: { ...validRequest().context, filters: { weather: 'rainy' } },
    }))).toThrow(RecommendationChatContractError)
    expect(() => validateRecommendationChatRequest(validRequest({
      context: { ...validRequest().context, filters: { mood: 'diagnose-me' } },
    }))).toThrow(RecommendationChatContractError)
  })

  test('rechaza metadatos inesperados dentro de un candidato', () => {
    expect(() => validateRecommendationChatRequest(validRequest({
      context: {
        ...validRequest().context,
        candidates: [{ ...validRequest().context.candidates[0], userComment: 'dato privado' }],
      },
    }))).toThrow(RecommendationChatContractError)
  })

  test('la respuesta no puede entregar peliculas inventadas', () => {
    expect(validateRecommendationChatResponse(validResponse())).toEqual(validResponse())
    expect(() => validateRecommendationChatResponse({
      ...validResponse(),
      movies: [{ id: 999 }],
    })).toThrow(RecommendationChatContractError)
  })

  test('limita las acciones al flujo conversacional aprobado', () => {
    expect(() => validateRecommendationChatResponse(validResponse({ action: 'delete-account' })))
      .toThrow(RecommendationChatContractError)
  })

  test('permite limpiar filtros sin duplicados ni nombres desconocidos', () => {
    const result = validateRecommendationChatResponse(validResponse({
      filtersPatch: {},
      clearFilters: ['duration'],
    }))
    expect(result.clearFilters).toEqual(['duration'])
    expect(() => validateRecommendationChatResponse(validResponse({
      filtersPatch: {},
      clearFilters: ['duration', 'duration'],
    }))).toThrow(RecommendationChatContractError)
    expect(() => validateRecommendationChatResponse(validResponse({
      filtersPatch: {},
      clearFilters: ['diagnosis'],
    }))).toThrow(RecommendationChatContractError)
  })

  test('un filtro no puede establecerse y limpiarse al mismo tiempo', () => {
    expect(() => validateRecommendationChatResponse(validResponse({ clearFilters: ['duration'] })))
      .toThrow(RecommendationChatContractError)
  })

  test('replace-one exige un ID real y las demas acciones no aceptan objetivo', () => {
    expect(validateRecommendationChatResponse(validResponse({
      action: 'replace-one',
      filtersPatch: {},
      targetMovieId: 101,
    })).targetMovieId).toBe(101)
    expect(() => validateRecommendationChatResponse(validResponse({
      action: 'replace-one',
      filtersPatch: {},
      targetMovieId: null,
    }))).toThrow(RecommendationChatContractError)
    expect(() => validateRecommendationChatResponse(validResponse({ targetMovieId: 101 })))
      .toThrow(RecommendationChatContractError)
  })

  test('acciones informativas no pueden alterar filtros', () => {
    expect(() => validateRecommendationChatResponse(validResponse({ action: 'explain' })))
      .toThrow(RecommendationChatContractError)
    expect(() => validateRecommendationChatResponse(validResponse({
      action: 'explain',
      filtersPatch: {},
    }))).not.toThrow()
  })

  test('new-search y refine siempre deben producir un cambio verificable', () => {
    expect(() => validateRecommendationChatResponse(validResponse({
      action: 'new-search',
      filtersPatch: {},
    }))).toThrow(RecommendationChatContractError)
  })

  test('enlaza la respuesta con la solicitud y candidatos reales', () => {
    const response = validResponse({
      action: 'replace-one',
      filtersPatch: {},
      targetMovieId: 101,
    })
    expect(validateRecommendationChatExchange(validRequest(), response).response.targetMovieId).toBe(101)
    expect(() => validateRecommendationChatExchange(validRequest(), {
      ...response,
      requestId: 'request_different',
    })).toThrow(RecommendationChatContractError)
    expect(() => validateRecommendationChatExchange(validRequest(), {
      ...response,
      targetMovieId: 999,
    })).toThrow(RecommendationChatContractError)
  })
})
