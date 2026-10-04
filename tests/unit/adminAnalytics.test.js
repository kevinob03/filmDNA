import { buildAdminAnalytics, buildAdminProjectionInput, buildBaselineForecast, buildMonthlyActivity } from '../../src/utils/adminAnalytics.js'

const data = {
  users: [
    { id: 'u1', role: 'usuario', personalizationCompleted: true },
    { id: 'u2', role: 'usuario', personalizationCompleted: false },
    { id: 'p1', role: 'psychologist', personalizationCompleted: false },
    { id: 'a1', role: 'admin', personalizationCompleted: false },
  ],
  diaryEntries: [
    { usuarioId: 'u1', fechaVista: '2026-09-01', calificacion: 8 },
    { usuarioId: 'u1', fechaVista: '2026-09-22', calificacion: 6 },
    { usuarioId: 'u2', fechaVista: '2026-10-03', calificacion: 3 },
  ],
  favorites: [{ usuarioId: 'u1' }, { usuarioId: 'u2' }],
  lists: [{ id: 'l1', usuarioId: 'u1', tipo: 'pendientes' }],
  listMovies: [{ listaId: 'l1' }, { listaId: 'missing' }],
}

test('construye seis meses continuos de actividad real', () => {
  const series = buildMonthlyActivity(data.diaryEntries, new Date('2026-10-15T00:00:00Z'))
  expect(series).toHaveLength(6)
  expect(series.map(({ month, count }) => [month, count])).toEqual([
    ['2026-05', 0], ['2026-06', 0], ['2026-07', 0], ['2026-08', 0], ['2026-09', 2], ['2026-10', 1],
  ])
})

test('la línea base proyecta tres meses sin valores negativos', () => {
  const history = buildMonthlyActivity(data.diaryEntries, new Date('2026-10-15T00:00:00Z'))
  const forecast = buildBaselineForecast(history)
  expect(forecast.map(({ month }) => month)).toEqual(['2026-11', '2026-12', '2027-01'])
  expect(forecast.every(({ count }) => Number.isInteger(count) && count >= 0)).toBe(true)
})

test('resume adopción, calificaciones y actividad con datos agregados', () => {
  const analytics = buildAdminAnalytics(data, new Date('2026-10-15T00:00:00Z'))
  expect(analytics.totals).toEqual({ users: 4, diaryEntries: 3, favorites: 2, lists: 1, listMovies: 2 })
  expect(analytics.adoption).toEqual([
    { label: 'Quiz completado', count: 1, percent: 25 },
    { label: 'Usaron el diario', count: 2, percent: 50 },
    { label: 'Guardaron favoritos', count: 2, percent: 50 },
    { label: 'Añadieron a listas', count: 1, percent: 25 },
  ])
  expect(analytics.ratingDistribution.map(({ count }) => count)).toEqual([1, 1, 1])
  expect(analytics.forecastConfidence).toBe('low')
})

test('el payload para IA excluye identificadores y datos personales', () => {
  const input = buildAdminProjectionInput(buildAdminAnalytics(data, new Date('2026-10-15T00:00:00Z')))
  const serialized = JSON.stringify(input)
  expect(serialized).not.toContain('u1')
  expect(serialized).not.toContain('usuarioId')
  expect(serialized).not.toContain('email')
  expect(input.baselineForecast).toHaveLength(3)
})
