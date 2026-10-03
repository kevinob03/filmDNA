import {
  buildRecommendationChatRequest,
  toRecommendationChatCandidate,
  toRecommendationChatFilters,
} from '../../src/services/recommendations/recommendationChatService.js'

describe('recommendationChatService', () => {
  test('envía únicamente filtros admitidos y omite valores predeterminados', () => {
    expect(toRecommendationChatFilters({
      genres: ['878'], mood: 'think', providers: ['8'], minRating: 0, popularity: 'popular', language: '',
    })).toEqual({ genres: ['878'], mood: 'think' })
  })

  test('reduce una película a metadatos públicos permitidos', () => {
    expect(toRecommendationChatCandidate({
      id: 550,
      title: 'El club de la lucha',
      overview: 'Sinopsis pública',
      release_date: '1999-10-15',
      genres: [{ id: 18 }, { id: 18 }],
      runtime: 139,
      vote_average: 8.432,
      privateNote: 'no debe salir',
    })).toEqual({
      tmdbId: 550,
      title: 'El club de la lucha',
      overview: 'Sinopsis pública',
      releaseYear: 1999,
      genreIds: [18],
      runtime: 139,
      voteAverage: 8.432,
    })
  })

  test('construye un contrato válido limitado a seis turnos y cinco candidatos', () => {
    const history = Array.from({ length: 8 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      text: `Turno ${index}`,
    }))
    const movies = Array.from({ length: 7 }, (_, index) => ({
      id: index + 1,
      title: `Película ${index + 1}`,
      overview: '',
      release_date: '2025-01-01',
      genre_ids: [35],
      vote_average: 7,
    }))
    const result = buildRecommendationChatRequest({
      sessionId: 'session_test_1234',
      message: 'Quiero una comedia',
      history,
      filters: { genres: ['35'] },
      movies,
      turn: 8,
    })
    expect(result.history).toHaveLength(6)
    expect(result.context.candidates).toHaveLength(5)
    expect(result.context.shownMovieIds).toHaveLength(7)
    expect(result).not.toHaveProperty('userId')
  })
})
