import { buildDiscoveryProfile, rankPersonalizedMovies } from '../../src/modules/explore/discoveryProfile.js'

describe('perfil de descubrimiento', () => {
  test('combina géneros explícitos con emoción y compañía sin duplicados', () => {
    expect(buildDiscoveryProfile({ genres: ['35'], mood: 'laugh', company: 'family' }).genreIds)
      .toEqual([35, 10751, 16])
  })

  test('prioriza afinidad explícita y usa popularidad para desempatar', () => {
    const profile = buildDiscoveryProfile({ genres: ['35'], mood: 'fear' })
    const ranked = rankPersonalizedMovies([
      { id: 1, genre_ids: [27], popularity: 90 },
      { id: 2, genre_ids: [35], popularity: 10 },
      { id: 3, genre_ids: [35], popularity: 50 },
    ], profile)
    expect(ranked.map(({ id }) => id)).toEqual([3, 2, 1])
  })
})
