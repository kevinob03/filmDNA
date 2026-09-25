import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../../../shared/components/PageContainer.jsx'
import SectionHeader from '../../../shared/components/SectionHeader.jsx'
import ContentState from '../../../shared/components/ContentState.jsx'
import MovieCard from '../../movies/components/MovieCard.jsx'
import MovieGridSkeleton from '../../movies/components/MovieGridSkeleton.jsx'
import { getTmdbErrorMessage, getTrendingMovies } from '../../../services/tmdbService.js'

function TrendingMovies() {
  const [state, setState] = useState({ status: 'loading', movies: [], error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setState({ status: 'loading', movies: [], error: null })

    getTrendingMovies()
      .then((data) => {
        if (!active) return
        setState({ status: 'success', movies: data.results?.slice(0, 6) || [], error: null })
      })
      .catch((error) => {
        if (!active) return
        setState({ status: 'error', movies: [], error })
      })

    return () => { active = false }
  }, [attempt])

  return (
    <section className="home-section" aria-labelledby="trending-title">
      <PageContainer>
        <div className="section-heading-row">
          <SectionHeader
            eyebrow="Tendencias"
            title="Historias para descubrir"
            description="Películas que están despertando interés esta semana, con información proporcionada por TMDB."
          />
          {state.status === 'success' && state.movies.length > 0 && (
            <Link className="text-link section-heading-row__link" to="/explorar">Ver catálogo →</Link>
          )}
        </div>

        {state.status === 'loading' && <MovieGridSkeleton />}
        {state.status === 'error' && (
          <ContentState
            title="Contenido no disponible"
            message={getTmdbErrorMessage(state.error)}
            actionLabel={state.error?.type === 'configuration' ? undefined : 'Reintentar'}
            onAction={state.error?.type === 'configuration' ? undefined : () => setAttempt((value) => value + 1)}
          />
        )}
        {state.status === 'success' && state.movies.length === 0 && (
          <ContentState title="Sin tendencias disponibles" message="TMDB no devolvió películas para mostrar en este momento." />
        )}
        {state.status === 'success' && state.movies.length > 0 && (
          <div className="movie-grid movie-grid--home">
            {state.movies.map((movie) => <MovieCard movie={movie} key={movie.id} />)}
          </div>
        )}
      </PageContainer>
    </section>
  )
}

export default TrendingMovies
