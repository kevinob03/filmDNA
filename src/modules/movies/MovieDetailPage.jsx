import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ContentState from '../../shared/components/ContentState.jsx'
import PageContainer from '../../shared/components/PageContainer.jsx'
import {
  buildTmdbImageUrl,
  getMovieDetails,
  getTmdbErrorMessage,
} from '../../services/tmdbService.js'
import './movie-detail.css'

const formatDate = (date) => {
  if (!date) return null
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${date}T00:00:00`))
}

const formatRuntime = (minutes) => {
  if (!minutes) return null
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return hours ? `${hours} h ${remainder} min` : `${remainder} min`
}

function DetailSkeleton() {
  return (
    <div className="detail-skeleton" aria-label="Cargando detalle de película" aria-busy="true">
      <span className="detail-skeleton__poster" />
      <div>
        <span className="skeleton-line skeleton-line--short" />
        <span className="detail-skeleton__title" />
        <span className="skeleton-line" />
        <span className="skeleton-line" />
      </div>
    </div>
  )
}

function MovieDetailPage() {
  const { id } = useParams()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading', movie: null, error: null })

  useEffect(() => {
    let active = true

    if (!/^\d+$/.test(id)) {
      setState({ status: 'not-found', movie: null, error: null })
      return () => { active = false }
    }

    setState({ status: 'loading', movie: null, error: null })
    getMovieDetails(id)
      .then((movie) => {
        if (active) setState({ status: 'success', movie, error: null })
      })
      .catch((error) => {
        if (!active) return
        setState({ status: error.type === 'not-found' ? 'not-found' : 'error', movie: null, error })
      })

    return () => { active = false }
  }, [id, attempt])

  if (state.status === 'loading') {
    return <main id="main-content" className="movie-detail-page"><PageContainer><DetailSkeleton /></PageContainer></main>
  }

  if (state.status === 'error' || state.status === 'not-found') {
    return (
      <main id="main-content" className="movie-detail-page">
        <PageContainer>
          <ContentState
            title={state.status === 'not-found' ? 'Película no encontrada' : 'No pudimos cargar esta película'}
            message={state.status === 'not-found' ? 'El identificador no corresponde a una película disponible.' : getTmdbErrorMessage(state.error, 'el detalle de la película')}
            actionLabel={state.error?.type === 'configuration' ? undefined : 'Reintentar'}
            onAction={state.status === 'not-found' || state.error?.type === 'configuration' ? undefined : () => setAttempt((value) => value + 1)}
          />
          <Link className="text-link detail-back-link" to="/explorar">← Volver a Explorar</Link>
        </PageContainer>
      </main>
    )
  }

  const movie = state.movie
  const title = movie.title || movie.original_title
  const posterUrl = buildTmdbImageUrl(movie.poster_path, 'w500')
  const backdropUrl = buildTmdbImageUrl(movie.backdrop_path, 'w1280')
  const releaseDate = formatDate(movie.release_date)
  const runtime = formatRuntime(movie.runtime)
  const score = movie.vote_count > 0 ? movie.vote_average.toFixed(1) : null

  return (
    <main id="main-content" className="movie-detail-page">
      <section className="movie-hero" style={backdropUrl ? { '--movie-backdrop': `url(${backdropUrl})` } : undefined}>
        <PageContainer>
          <nav className="breadcrumbs" aria-label="Ruta de navegación">
            <Link to="/">Inicio</Link><span aria-hidden="true">/</span>
            <Link to="/explorar">Explorar</Link><span aria-hidden="true">/</span>
            <span>{title}</span>
          </nav>

          <div className="movie-hero__layout">
            <div className="movie-detail__poster">
              {posterUrl ? (
                <img src={posterUrl} alt={`Póster de ${title}`} />
              ) : (
                <div className="movie-detail__missing" role="img" aria-label={`Póster no disponible para ${title}`}>
                  <span aria-hidden="true">◇</span>Póster no disponible
                </div>
              )}
            </div>

            <div className="movie-hero__content">
              <p className="eyebrow"><span aria-hidden="true" /> Información de TMDB</p>
              <h1>{title}</h1>
              {movie.original_title && movie.original_title !== title && <p className="movie-original-title">Título original: {movie.original_title}</p>}

              <div className="movie-facts" aria-label="Datos principales">
                {releaseDate && <span>{releaseDate}</span>}
                {runtime && <span>{runtime}</span>}
                {score && <span className="movie-facts__score">★ {score} / 10</span>}
                {movie.status && <span>{movie.status}</span>}
              </div>

              {movie.genres?.length > 0 && (
                <ul className="genre-list" aria-label="Géneros">
                  {movie.genres.map((genre) => <li key={genre.id}>{genre.name}</li>)}
                </ul>
              )}

              <section className="movie-overview" aria-labelledby="overview-title">
                <h2 id="overview-title">Sinopsis</h2>
                <p>{movie.overview || 'TMDB no proporciona una sinopsis en español para esta película.'}</p>
              </section>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="movie-dna-unavailable" aria-labelledby="movie-dna-title">
        <PageContainer className="movie-dna-unavailable__layout">
          <div>
            <p className="eyebrow"><span aria-hidden="true" /> Movie DNA</p>
            <h2 id="movie-dna-title">Análisis de experiencia cinematográfica</h2>
            <p>El perfil Movie DNA se incorporará en una fase posterior. Todavía no existen valores calculados para esta película.</p>
          </div>
          <div className="movie-dna-unavailable__visual" aria-label="Movie DNA no disponible">
            <span>Sin análisis disponible</span>
            <div aria-hidden="true">MISTERIO · OSCURIDAD · COMPLEJIDAD · TENSIÓN · SURREALISMO · RITMO</div>
          </div>
        </PageContainer>
      </section>

      <PageContainer className="movie-detail__footer">
        <Link className="text-link" to="/explorar">← Volver al catálogo</Link>
      </PageContainer>
    </main>
  )
}

export default MovieDetailPage
