const confidenceLabels = { low: 'Baja', medium: 'Media', high: 'Alta' }
const confidenceValues = { low: 34, medium: 67, high: 100 }
const trendLabels = { growing: 'Crecimiento', stable: 'Estable', declining: 'Descenso', 'insufficient-data': 'Datos insuficientes' }
const trendSymbols = { growing: '↗', stable: '→', declining: '↘', 'insufficient-data': '—' }
const signedNumberFormatter = new Intl.NumberFormat('es-CR', { signDisplay: 'always', maximumFractionDigits: 0 })

export function EngagementMetrics({ totals }) {
  const metrics = [
    ['Entradas del diario', totals.diaryEntries, 'Películas registradas como vistas'],
    ['Favoritos', totals.favorites, 'Películas marcadas por las cuentas'],
    ['Listas creadas', totals.lists, 'Pendientes y colecciones propias'],
    ['Películas en listas', totals.listMovies, 'Elementos organizados en listas'],
  ]
  return (
    <section className="admin-panel admin-panel--wide" aria-labelledby="engagement-summary-title">
      <header className="admin-section-heading">
        <p className="eyebrow"><span aria-hidden="true" />Actividad real</p>
        <h2 id="engagement-summary-title">Uso de FilmDNA</h2>
      </header>
      <div className="admin-metrics">
        {metrics.map(([label, value, detail]) => (
          <article className="admin-metric" key={label}>
            <p>{label}</p><strong>{value}</strong><span>{detail}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

export function ActivityProjectionChart({ analytics, aiProjection }) {
  const forecast = aiProjection?.forecast?.map((item, index) => ({
    ...item,
    label: analytics.baselineForecast[index]?.label ?? item.month,
    projected: true,
  })) ?? analytics.baselineForecast.map((item) => ({ ...item, projected: true }))
  const series = [...analytics.monthlyActivity, ...forecast]
  const maximum = Math.max(1, ...series.map(({ count }) => count))
  const summary = series.map(({ label, count, projected }) => `${label}: ${count}${projected ? ' estimadas' : ''}`).join(', ')

  return (
    <section className="admin-panel admin-panel--wide admin-activity-chart" aria-labelledby="activity-chart-title">
      <header className="admin-section-heading admin-section-heading--split">
        <div><p className="eyebrow"><span aria-hidden="true" />Tendencia</p><h2 id="activity-chart-title">Actividad y proyección del Diario</h2></div>
        <span className={`admin-confidence admin-confidence--${aiProjection?.confidence ?? analytics.forecastConfidence}`}>
          Confianza {confidenceLabels[aiProjection?.confidence ?? analytics.forecastConfidence]}
        </span>
      </header>
      <div className="admin-columns" role="img" aria-label={`Entradas mensuales del Diario. ${summary}`}>
        {series.map(({ month, label, count, projected }) => (
          <div className="admin-columns__item" key={`${month}-${projected ? 'forecast' : 'actual'}`}>
            <span className="admin-columns__value">{count}</span>
            <span className={`admin-columns__bar${projected ? ' admin-columns__bar--projected' : ''}`} style={{ height: `${Math.max(count ? 12 : 2, count / maximum * 100)}%` }} aria-hidden="true" />
            <span className="admin-columns__label">{label}</span>
          </div>
        ))}
      </div>
      <div className="admin-chart-legend" aria-hidden="true"><span><i />Real</span><span><i className="is-projected" />{aiProjection ? 'Proyección IA' : 'Línea base'}</span></div>
      <p className="admin-chart-note">Los seis primeros meses provienen del Diario. Los tres últimos son estimaciones y no representan resultados garantizados.</p>
    </section>
  )
}

export function FeatureAdoptionChart({ adoption, totalUsers }) {
  const summary = adoption.map(({ label, count, percent }) => `${label}: ${count} cuentas, ${percent}%`).join(', ')
  return (
    <section className="admin-panel admin-adoption" aria-labelledby="adoption-chart-title">
      <header className="admin-section-heading"><p className="eyebrow"><span aria-hidden="true" />Adopción</p><h2 id="adoption-chart-title">Funciones utilizadas</h2></header>
      <div className="admin-chart__plot" role="img" aria-label={`Adopción entre ${totalUsers} cuentas. ${summary}`}>
        {adoption.map(({ label, count, percent }) => (
          <div className="admin-chart__row" key={label}>
            <div className="admin-chart__label"><span>{label}</span><strong>{count} · {percent}%</strong></div>
            <div className="admin-chart__track" aria-hidden="true"><span className="admin-chart__bar admin-chart__bar--adoption" style={{ width: `${percent}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function RatingDistributionChart({ distribution }) {
  const total = distribution.reduce((sum, { count }) => sum + count, 0)
  const high = distribution.find(({ type }) => type === 'high')?.count ?? 0
  const medium = distribution.find(({ type }) => type === 'medium')?.count ?? 0
  const highPercent = total ? Math.round(high / total * 100) : 0
  const mediumPercent = total ? Math.round(medium / total * 100) : 0
  return (
    <section className="admin-panel admin-ratings" aria-labelledby="ratings-chart-title">
      <header className="admin-section-heading"><p className="eyebrow"><span aria-hidden="true" />Valoraciones</p><h2 id="ratings-chart-title">Calificaciones del Diario</h2></header>
      {total ? <div className="admin-ratings__content">
        <div className="admin-donut" role="img" aria-label={distribution.map(({ label, count }) => `${label}: ${count}`).join(', ')} style={{ '--rating-high': `${highPercent}%`, '--rating-medium': `${highPercent + mediumPercent}%` }}><span><strong>{total}</strong><small>Total</small></span></div>
        <ul className="admin-ratings__legend">{distribution.map(({ label, count, type }) => <li key={label}><i className={`admin-rating-dot admin-rating-dot--${type}`} /><span>{label}</span><strong>{count}</strong></li>)}</ul>
      </div> : <p className="admin-chart-note">Todavía no hay calificaciones válidas para representar.</p>}
    </section>
  )
}

export function AIProjectionPanel({ result, status, error, onGenerate, baselineForecast = [] }) {
  const projection = result?.result
  const forecast = projection?.forecast ?? []
  const maximum = Math.max(1, ...forecast.map(({ count }, index) => Math.max(count, baselineForecast[index]?.count ?? 0)))
  const chartSummary = forecast.map(({ month, count }, index) => {
    const baseline = baselineForecast[index]
    return `${baseline?.label ?? month}: IA ${count}, línea base ${baseline?.count ?? 0}`
  }).join(', ')

  return (
    <section className="admin-panel admin-panel--wide admin-ai-projection" aria-labelledby="ai-projection-title">
      <header className="admin-section-heading admin-section-heading--split">
        <div><p className="eyebrow"><span aria-hidden="true" />Modelo predictivo</p><h2 id="ai-projection-title">Proyección asistida por IA</h2></div>
        <button className="button button--primary" type="button" onClick={onGenerate} disabled={status === 'loading'}>{status === 'loading' ? 'Analizando…' : projection ? 'Actualizar proyección' : 'Generar proyección IA'}</button>
      </header>
      {!projection && status !== 'loading' && !error && <p className="admin-ai-projection__intro">La IA analizará únicamente conteos agregados y la línea base matemática. No recibe nombres, correos, reseñas ni notas privadas.</p>}
      {status === 'loading' && <div className="admin-ai-state" aria-live="polite">Comparando tendencia, adopción y actividad reciente…</div>}
      {error && <div className="admin-ai-state admin-ai-state--error" role="alert">{error}</div>}
      {projection && <div className="admin-ai-result" aria-live="polite">
        <div className="admin-ai-result__summary">
          <div><span>Tendencia estimada</span><strong><i className={`admin-trend admin-trend--${projection.trend}`} aria-hidden="true">{trendSymbols[projection.trend]}</i>{trendLabels[projection.trend]}</strong></div>
          <div><span>Confianza</span><strong>{confidenceLabels[projection.confidence]}</strong><i className="admin-confidence-meter" aria-hidden="true"><span style={{ width: `${confidenceValues[projection.confidence]}%` }} /></i></div>
          <div><span>Proveedor</span><strong>{result.provider}</strong></div>
        </div>
        <section className="admin-ai-forecast" aria-labelledby="ai-forecast-title">
          <header className="admin-ai-forecast__header">
            <div><h3 id="ai-forecast-title">Próximos 3 meses</h3><p>Entradas estimadas en el Diario</p></div>
            <div className="admin-ai-forecast__legend" aria-hidden="true"><span><i />IA</span><span><i className="is-baseline" />Línea base</span></div>
          </header>
          <div className="admin-ai-forecast__plot" role="img" aria-label={`Comparación de proyección IA con línea base. ${chartSummary}`}>
            {forecast.map(({ month, count }, index) => {
              const baseline = baselineForecast[index]?.count ?? 0
              const label = baselineForecast[index]?.label ?? month
              const delta = count - baseline
              return <div className="admin-ai-forecast__month" key={month}>
                <div className="admin-ai-forecast__bars" aria-hidden="true">
                  <span className="admin-ai-forecast__bar admin-ai-forecast__bar--baseline" style={{ height: `${Math.max(baseline ? 10 : 2, baseline / maximum * 100)}%` }} />
                  <span className="admin-ai-forecast__bar" style={{ height: `${Math.max(count ? 10 : 2, count / maximum * 100)}%` }} />
                </div>
                <strong>{count}</strong>
                <span>{label}</span>
                <small className={delta > 0 ? 'is-positive' : delta < 0 ? 'is-negative' : ''}>{signedNumberFormatter.format(delta)} vs. base</small>
              </div>
            })}
          </div>
        </section>
        <p>{projection.summary}</p>
        <div className="admin-ai-insights">{projection.insights.map(({ title, detail }) => <article key={title}><h3>{title}</h3><p>{detail}</p></article>)}</div>
        <p className="admin-chart-note">Proyección orientativa generada con {result.model}. Debe interpretarse junto con los datos reales; no toma decisiones automáticas.</p>
      </div>}
    </section>
  )
}
