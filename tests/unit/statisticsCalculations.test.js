import {
  buildMonthlySeries,
  calculateAverageRating,
  groupEntriesByMonth,
  summarizeStatistics,
} from '../../src/modules/statistics/statisticsCalculations.js'

describe('calculateAverageRating', () => {
  test('calcula el promedio de varias calificaciones personales', () => {
    expect(calculateAverageRating([{ calificacion: 8 }, { calificacion: 9 }, { calificacion: 7 }])).toBe(8)
  })

  test('conserva el valor de una sola calificación', () => {
    expect(calculateAverageRating([{ calificacion: 6 }])).toBe(6)
  })

  test('devuelve null cuando no existen calificaciones', () => {
    expect(calculateAverageRating([])).toBeNull()
  })

  test('ignora valores inválidos y no mezcla vote_average de TMDB', () => {
    const entries = [{ calificacion: 10, vote_average: 1 }, { calificacion: 0 }, { calificacion: 11 }, { calificacion: 'inválida' }, { vote_average: 9 }]
    expect(calculateAverageRating(entries)).toBe(10)
  })
})

describe('groupEntriesByMonth', () => {
  test('agrupa varias entradas del mismo mes', () => {
    expect(groupEntriesByMonth([{ fechaVista: '2026-09-01' }, { fechaVista: '2026-09-30' }])).toEqual({ '2026-09': 2 })
  })

  test('mantiene meses distintos en grupos separados', () => {
    expect(groupEntriesByMonth([{ fechaVista: '2026-08-31' }, { fechaVista: '2026-09-01' }])).toEqual({ '2026-08': 1, '2026-09': 1 })
  })

  test('mantiene el mismo mes de años distintos separado', () => {
    expect(groupEntriesByMonth([{ fechaVista: '2025-09-01' }, { fechaVista: '2026-09-01' }])).toEqual({ '2025-09': 1, '2026-09': 1 })
  })

  test('ignora fechas ausentes y meses inválidos', () => {
    expect(groupEntriesByMonth([{ fechaVista: '' }, {}, { fechaVista: '2026-13-01' }, { fechaVista: 'texto' }])).toEqual({})
  })
})

describe('buildMonthlySeries', () => {
  test('ordena cronológicamente aunque la entrada llegue desordenada', () => {
    const entries = [{ fechaVista: '2026-12-01' }, { fechaVista: '2025-09-01' }, { fechaVista: '2026-01-01' }]
    expect(buildMonthlySeries(entries).map(({ month }) => month)).toEqual(['2025-09', '2026-01', '2026-12'])
  })

  test('incluye la cantidad correspondiente a cada mes', () => {
    const entries = [{ fechaVista: '2026-01-01' }, { fechaVista: '2026-01-20' }, { fechaVista: '2026-02-01' }]
    expect(buildMonthlySeries(entries)).toEqual([{ month: '2026-01', count: 2 }, { month: '2026-02', count: 1 }])
  })

  test('no rellena meses sin actividad', () => {
    expect(buildMonthlySeries([{ fechaVista: '2026-01-01' }, { fechaVista: '2026-03-01' }])).toHaveLength(2)
  })

  test('devuelve una serie vacía sin registros', () => {
    expect(buildMonthlySeries([])).toEqual([])
  })
})

describe('summarizeStatistics', () => {
  test('produce exactamente los KPI usados por la vista', () => {
    const summary = summarizeStatistics({
      diaryEntries: [{ fechaVista: '2026-01-01', calificacion: 8 }, { fechaVista: '2026-01-20', calificacion: 10 }],
      favorites: [{ id: 1 }, { id: 2 }],
      watchlist: [{ id: 1 }, { id: 2 }, { id: 3 }],
      customLists: [{ id: 1 }],
    })
    expect(summary).toEqual({ watchedCount: 2, averageRating: 9, favoriteCount: 2, watchlistCount: 3, customListCount: 1, monthlyActivity: [{ month: '2026-01', count: 2 }] })
  })

  test('devuelve un resumen seguro para un usuario sin actividad', () => {
    expect(summarizeStatistics()).toEqual({ watchedCount: 0, averageRating: null, favoriteCount: 0, watchlistCount: 0, customListCount: 0, monthlyActivity: [] })
  })
})
