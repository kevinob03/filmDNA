const formatMonth = (month) => {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(year, monthNumber - 1, 1))
}

function MonthlyActivityChart({ series }) {
  const maximum = Math.max(0, ...series.map(({ count }) => count))
  return (
    <section className="statistics-chart" aria-labelledby="monthly-activity-title">
      <header className="statistics-section-heading"><p className="eyebrow"><span aria-hidden="true" />Ritmo de visualización</p><h2 id="monthly-activity-title">Películas vistas por mes</h2></header>
      {series.length ? (
        <div className="statistics-chart__plot" role="img" aria-label={series.map(({ month, count }) => `${formatMonth(month)}: ${count}`).join('; ')}>
          {series.map(({ month, count }) => {
            const percent = maximum ? Math.round(count / maximum * 100) : 0
            return <div className="statistics-chart__row" key={month}><div className="statistics-chart__label"><span>{formatMonth(month)}</span><strong>{count} {count === 1 ? 'película' : 'películas'}</strong></div><div className="statistics-chart__track" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div></div>
          })}
        </div>
      ) : <p className="statistics-chart__empty">Registra una película en tu Diario para comenzar a ver tu actividad mensual.</p>}
    </section>
  )
}

export default MonthlyActivityChart
