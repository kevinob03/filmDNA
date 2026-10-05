import { render, screen } from '@testing-library/react'
import { AIProjectionPanel } from '../../src/components/admin/AdminAnalyticsCharts.jsx'

const projectionResult = {
  provider: 'deepseek',
  model: 'deepseek-chat',
  result: {
    trend: 'growing',
    confidence: 'high',
    summary: 'La actividad muestra una tendencia de crecimiento moderado.',
    forecast: [
      { month: '2026-11', count: 12, rationale: 'Crecimiento reciente.' },
      { month: '2026-12', count: 15, rationale: 'Mayor adopción.' },
      { month: '2027-01', count: 14, rationale: 'Estabilización.' },
    ],
    insights: [
      { title: 'Actividad reciente', detail: 'El Diario mantiene un uso constante.' },
      { title: 'Mayor adopción', detail: 'Más cuentas registran películas vistas.' },
    ],
  },
}

const baselineForecast = [
  { month: '2026-11', label: 'nov 26', count: 10 },
  { month: '2026-12', label: 'dic 26', count: 11 },
  { month: '2027-01', label: 'ene 27', count: 12 },
]

describe('AIProjectionPanel', () => {
  test('presenta la proyección como gráfico comparativo accesible', () => {
    render(<AIProjectionPanel result={projectionResult} status="success" error="" onGenerate={jest.fn()} baselineForecast={baselineForecast} />)

    expect(screen.getByRole('heading', { name: 'Próximos 3 meses' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Comparación de proyección IA con línea base/ })).toHaveAccessibleName(/nov 26: IA 12, línea base 10/)
    expect(screen.getByText('Crecimiento')).toBeInTheDocument()
    expect(screen.getByText('Alta')).toBeInTheDocument()
    expect(screen.getAllByText('+2 vs. base')).toHaveLength(2)
    expect(screen.getByText('+4 vs. base')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Actualizar proyección' })).toBeEnabled()
  })

  test('mantiene un estado vacío claro antes de generar la proyección', () => {
    render(<AIProjectionPanel result={null} status="idle" error="" onGenerate={jest.fn()} baselineForecast={baselineForecast} />)

    expect(screen.getByText(/La IA analizará únicamente conteos agregados/)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Comparación de proyección/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generar proyección IA' })).toBeEnabled()
  })
})
