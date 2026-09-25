import { Link } from 'react-router-dom'
import { buildTmdbImageUrl } from '../../../services/tmdbService.js'
import './movie-card.css'

const getYear = (date) => date?.slice(0, 4) || null

function MovieCard({ movie }) {
  const title = movie.title || movie.original_title || 'Título no disponible'
  const posterUrl = movie.posterUrl || buildTmdbImageUrl(movie.poster_path, 'w500')
  const score = Number.isFinite(movie.vote_average) && movie.vote_count > 0
    ? movie.vote_average.toFixed(1)
    : null

  return (
    <article className="movie-card">
      <Link className="movie-card__link" to={`/pelicula/${movie.id}`} aria-label={`Ver detalle de ${title}`}>
        <div className="movie-card__poster">
          {posterUrl ? (
            <img src={posterUrl} alt={`Póster de ${title}`} loading="lazy" />
          ) : (
            <div className="movie-card__missing-image" role="img" aria-label={`Póster no disponible para ${title}`}>
              <span aria-hidden="true">◇</span>
              Póster no disponible
            </div>
          )}
          {score && <span className="movie-card__score" aria-label={`Puntuación de TMDB: ${score} de 10`}>★ {score}</span>}
        </div>
        <div className="movie-card__body">
          <p className="movie-card__meta">{getYear(movie.release_date) || 'Año no disponible'}</p>
          <h3>{title}</h3>
          <span className="movie-card__action">Ver detalle <span aria-hidden="true">→</span></span>
        </div>
      </Link>
    </article>
  )
}

export default MovieCard
