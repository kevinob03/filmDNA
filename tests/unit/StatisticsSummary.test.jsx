import { render, screen } from '@testing-library/react'
import StatisticsSummary from '../../src/components/statistics/StatisticsSummary.jsx'

const renderSummary = (changes = {}) => render(<StatisticsSummary summary={{ watchedCount: 4, averageRating: 8.5, favoriteCount: 2, ...changes }} />)

describe('StatisticsSummary', () => {
  test('renderiza la cantidad de películas vistas', () => {
    renderSummary()
    expect(screen.getByText('Películas vistas').closest('article')).toHaveTextContent('4')
  })

  test('renderiza el promedio personal con un decimal y escala', () => {
    renderSummary()
    expect(screen.getByText('Calificación promedio').closest('article')).toHaveTextContent('8.5/10')
  })

  test('renderiza la cantidad de favoritos', () => {
    renderSummary()
    expect(screen.getByText('Favoritos').closest('article')).toHaveTextContent('2')
  })

  test('muestra Sin calificaciones cuando el promedio es null', () => {
    renderSummary({ averageRating: null })
    expect(screen.getByText('Calificación promedio').closest('article')).toHaveTextContent('Sin calificaciones')
  })
})
