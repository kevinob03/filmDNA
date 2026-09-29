function StatisticsSummary({ summary }) {
  const metrics = [
    ['Películas vistas', summary.watchedCount, 'Registros de tu Diario'],
    ['Calificación promedio', summary.averageRating === null ? 'Sin calificaciones' : `${summary.averageRating.toFixed(1)}/10`, 'Tu valoración personal'],
    ['Favoritos', summary.favoriteCount, 'Películas que marcaste'],
  ]
  return (
    <section aria-labelledby="statistics-summary-title">
      <header className="statistics-section-heading"><p className="eyebrow"><span aria-hidden="true" />Tu actividad</p><h2 id="statistics-summary-title">Resumen personal</h2></header>
      <div className="statistics-metrics">{metrics.map(([label, value, detail]) => <article className="statistics-metric" key={label}><p>{label}</p><strong>{value}</strong><span>{detail}</span></article>)}</div>
    </section>
  )
}

export default StatisticsSummary
