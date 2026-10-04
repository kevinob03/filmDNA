import MovieCard from '../movies/MovieCard.jsx'

function LibraryMovieGrid({ entries, emptyTitle, emptyMessage, onRemove, removingId }) {
  if (!entries.length) return <div className="library-empty" role="status"><span aria-hidden="true">◇</span><h3>{emptyTitle}</h3><p>{emptyMessage}</p></div>
  return (
    <div className="library-movie-grid">
      {entries.map(({ tmdbId, movie, error }) => (
        <div className="library-movie" key={tmdbId}>
          {movie ? <MovieCard movie={movie} /> : (
            <article className="library-movie__unavailable">
              <span aria-hidden="true">◇</span><h3>Película no disponible</h3>
              <p>TMDB no pudo cargar temporalmente la película #{tmdbId}. Puedes quitarla o intentarlo más tarde.</p>
              {error ? <small>Contenido local preservado</small> : null}
            </article>
          )}
          <button className="library-remove" type="button" disabled={String(removingId) === String(tmdbId)} onClick={() => onRemove(tmdbId)}>
            {String(removingId) === String(tmdbId) ? 'Quitando…' : 'Quitar de esta sección'}
          </button>
        </div>
      ))}
    </div>
  )
}

export default LibraryMovieGrid