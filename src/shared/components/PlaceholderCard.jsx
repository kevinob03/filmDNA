function PlaceholderCard({ label = 'Contenido disponible al conectar TMDB' }) {
  return (
    <article className="placeholder-card" aria-label={label}>
      <div className="placeholder-card__visual" aria-hidden="true">
        <span />
      </div>
      <div className="placeholder-card__body">
        <span className="skeleton-line skeleton-line--short" />
        <span className="skeleton-line" />
        <p>{label}</p>
      </div>
    </article>
  )
}

export default PlaceholderCard
