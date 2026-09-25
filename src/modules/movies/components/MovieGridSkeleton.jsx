function MovieGridSkeleton({ count = 6 }) {
  return (
    <div className="movie-grid" aria-label="Cargando películas" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="movie-skeleton" key={index} aria-hidden="true">
          <span className="movie-skeleton__poster" />
          <span className="skeleton-line skeleton-line--short" />
          <span className="skeleton-line" />
        </div>
      ))}
    </div>
  )
}

export default MovieGridSkeleton
