import { Link } from 'react-router-dom'
import { buildTmdbImageUrl } from '../../../services/tmdbService.js'
import FilterIcon from './FilterIcon.jsx'
import MovieQuickActions from '../../movies/components/MovieQuickActions.jsx'

const formatRuntime = (minutes) => {
  if (!Number.isFinite(minutes) || minutes <= 0) return null
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours ? `${hours}h ${rest ? `${rest} min` : ''}`.trim() : `${rest} min`
}

function RecommendationCard({ movie, onDismiss }) {
  const title = movie.title || movie.original_title || 'Título no disponible'
  const poster = buildTmdbImageUrl(movie.poster_path, 'w500')
  const year = movie.release_date?.slice(0, 4)
  const runtime = formatRuntime(movie.runtime)
  const score = Number.isFinite(movie.vote_average) && movie.vote_count > 0 ? movie.vote_average.toFixed(1) : null
  const recommendation = movie.recommendation || { percentage: null, reasons: [], providers: [] }
  const evaluated = recommendation.evaluatedPreferences || []
  const unknown = recommendation.unknownPreferences || []
  const preferenceTotal = evaluated.length + unknown.length

  return <article className="recommendation-card">
    <Link className="recommendation-card__card-link" to={`/pelicula/${movie.id}`} aria-label={`Ver detalles de ${title}`} />
    <div className="recommendation-card__poster">
      {poster ? <img src={poster} alt={`Póster de ${title}`} loading="lazy" /> : <div className="recommendation-card__missing">Póster no disponible</div>}
      <span className={`recommendation-card__match${recommendation.percentage === null ? ' recommendation-card__match--unknown' : ''}`}>
        {recommendation.percentage === null ? 'Compatibilidad por determinar' : `${recommendation.percentage}% de coincidencia`}
      </span>
      {(year || runtime || score) && <div className="recommendation-card__facts">
        <span>{[year, runtime].filter(Boolean).join(' · ')}</span>
        {score && <span className="recommendation-card__rating" aria-label={`Puntuación TMDB ${score} de 10`}>★ {score}</span>}
      </div>}
    </div>
    <div className="recommendation-card__body">
      <div>
        <h3>{title}</h3>
        {recommendation.providers.length > 0 && <p className="recommendation-card__providers">Disponible en {recommendation.providers.slice(0, 2).map((provider) => provider.provider_name).join(' / ')}</p>}
        {preferenceTotal > 0 && <div className="recommendation-card__evaluation">
          <p><strong>{evaluated.length} de {preferenceTotal}</strong> preferencias evaluadas <span aria-hidden="true">·</span> Confianza {recommendation.confidenceLabel || 'Baja'}</p>
          {unknown.length > 0 && <p className="recommendation-card__unknown">Sin datos suficientes: {unknown.map((preference) => preference.label).join(', ')}</p>}
        </div>}
        {recommendation.reasons.length > 0 && <div className="recommendation-card__reasons">
          <strong>Por qué encaja contigo</strong>
          <ul>{recommendation.reasons.slice(0, 3).map((reason) => <li key={`${reason.type}-${reason.text}`}><span aria-hidden="true">✓</span>{reason.text}</li>)}</ul>
        </div>}
      </div>
      <div className="recommendation-card__actions">
        <Link className="recommendation-card__details" to={`/pelicula/${movie.id}`}>Ver detalles <FilterIcon name="arrow" size={17} /></Link>
        <MovieQuickActions movie={movie} />
        <button type="button" className="recommendation-card__icon-action" title="No me interesa" aria-label={`No recomendar ${title}`} onClick={() => onDismiss(movie.id)}><FilterIcon name="hide" /></button>
      </div>
    </div>
  </article>
}

export default RecommendationCard
