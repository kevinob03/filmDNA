const formatRating = (rating) => rating === null ? '—' : `${rating.toFixed(1)}/10`

function ProfileActivity({ summary, status, error, onRetry }) {
  const metrics = [
    ['Películas vistas', summary.watchedCount, 'Diario'],
    ['Promedio personal', formatRating(summary.averageRating), 'Calificaciones'],
    ['Favoritos', summary.favoriteCount, 'Biblioteca'],
    ['Ver después', summary.watchlistCount, 'Pendientes'],
  ]
  return (
    <section className="profile-panel profile-activity" aria-labelledby="profile-activity-title">
      <header className="profile-section-heading"><p className="eyebrow"><span aria-hidden="true" />Tu actividad</p><h2 id="profile-activity-title">Tu historia en números</h2><p>Datos reales de tu Diario y Biblioteca.</p></header>
      {status === 'loading' ? <div className="profile-activity__loading" aria-live="polite" aria-busy="true">Cargando actividad…</div> : null}
      {status === 'error' ? <div className="profile-activity__error" role="status"><p>{error}</p><button className="button button--secondary" type="button" onClick={onRetry}>Reintentar</button></div> : null}
      {status === 'success' ? <dl className="profile-metrics">{metrics.map(([label, value, source]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><span>{source}</span></div>)}</dl> : null}
    </section>
  )
}

export default ProfileActivity
