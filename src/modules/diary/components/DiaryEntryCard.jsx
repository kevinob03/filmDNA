import { Link } from 'react-router-dom'
import { buildTmdbImageUrl } from '../../../services/tmdbService.js'

const formatViewedDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${value}T00:00:00`))
}

function DiaryEntryCard({ item }) {
  const { entry, movie } = item
  const title = movie?.title || movie?.original_title
  const posterUrl = movie?.posterUrl || buildTmdbImageUrl(movie?.poster_path, 'w342')
  return (
    <article className="diary-entry">
      <div className="diary-entry__poster">{posterUrl ? <img src={posterUrl} alt={`Póster de ${title}`} /> : <div role="img" aria-label="Póster no disponible"><span aria-hidden="true">◇</span></div>}</div>
      <div className="diary-entry__content">
        <p className="eyebrow"><span aria-hidden="true" />Vista el {formatViewedDate(entry.fechaVista)}</p>
        <h2>{title || `Película TMDB #${entry.tmdbId}`}</h2>
        {!movie ? <p className="diary-entry__metadata-error" role="status">Los datos de esta película no están disponibles temporalmente. Tu registro sigue guardado.</p> : null}
        <p className="diary-entry__rating"><strong>Tu calificación:</strong> {entry.calificacion}/10</p>
        <p className={`diary-entry__visibility diary-entry__visibility--${entry.publica === true ? 'public' : 'private'}`}>
          {entry.publica === true ? 'Reseña pública' : 'Reseña privada'}
        </p>
        <p className="diary-entry__review">{entry.resena}</p>
        <Link className="text-link" to={`/pelicula/${entry.tmdbId}`}>Ver película</Link>
      </div>
    </article>
  )
}

export default DiaryEntryCard
