import { useEffect, useState } from 'react'
import PageContainer from '../../../shared/components/PageContainer.jsx'
import ContentState from '../../../shared/components/ContentState.jsx'
import MovieCard from '../../movies/components/MovieCard.jsx'
import MovieGridSkeleton from '../../movies/components/MovieGridSkeleton.jsx'
import { getTmdbErrorMessage } from '../../../services/tmdbService.js'
import { getPopularMovies, searchMovies } from '../../../services/movieService.js'
import { AUTH_STATUS, useAuth } from '../../../context/AuthContext.jsx'
import { getPersonalizedExploreMovies } from '../../../services/personalizedExploreService.js'
import '../explore.css'

function ExplorePage() {
  const { status: authStatus, user } = useAuth()
  const hasDiscoveryProfile = Boolean(user?.discoveryPreferences && Object.keys(user.discoveryPreferences).length)
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading', movies: [], totalPages: 1, error: null })

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setQuery(input.trim())
      setPage(1)
    }, 450)

    return () => window.clearTimeout(timeoutId)
  }, [input])

  useEffect(() => {
    let active = true
    setState((current) => ({ ...current, status: 'loading', error: null }))

    if (!query && authStatus === AUTH_STATUS.CHECKING) return () => { active = false }
    const operation = query
      ? searchMovies(query, page)
      : hasDiscoveryProfile
        ? getPersonalizedExploreMovies(user.discoveryPreferences, page).then((data) => data || getPopularMovies(page))
        : getPopularMovies(page)
    operation
      .then((data) => {
        if (!active) return
        setState({
          status: 'success',
          movies: data.results || [],
          totalPages: Math.min(data.total_pages || 1, 500),
          error: null,
        })
      })
      .catch((error) => {
        if (!active) return
        setState({ status: 'error', movies: [], totalPages: 1, error })
      })

    return () => { active = false }
  }, [query, page, attempt, authStatus, hasDiscoveryProfile, user])

  const submitSearch = (event) => {
    event.preventDefault()
    setQuery(input.trim())
    setPage(1)
  }

  const clearSearch = () => {
    setInput('')
    setQuery('')
    setPage(1)
  }

  const changePage = (nextPage) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main id="main-content" className="explore-page">
      <PageContainer>
        <header className="explore-header">
          <p className="eyebrow"><span aria-hidden="true" /> Catálogo TMDB</p>
          <h1>Explorar películas</h1>
          <p>{hasDiscoveryProfile ? 'Descubre una selección que parte de tus gustos y evoluciona con tu perfil.' : 'Busca por título o descubre películas populares con información actual de TMDB.'}</p>
        </header>

        <form className="movie-search" data-tour="explore-search" role="search" onSubmit={submitSearch}>
          <label htmlFor="movie-search">Buscar películas</label>
          <div className="movie-search__control">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg>
            <input
              id="movie-search"
              type="search"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe el título de una película"
              autoComplete="off"
            />
            {input && <button type="button" className="movie-search__clear" onClick={clearSearch}>Limpiar</button>}
            <button type="submit" className="button button--primary">Buscar</button>
          </div>
        </form>

        <div className="catalog-heading">
          <div>
            <p className="catalog-heading__label">{query ? 'Resultados de búsqueda' : hasDiscoveryProfile ? 'Selección para ti' : 'Películas populares'}</p>
            <h2>{query ? `Resultados para “${query}”` : hasDiscoveryProfile ? 'Basado en tus gustos' : 'Descubre qué ver'}</h2>
          </div>
          {state.status === 'success' && state.movies.length > 0 && (
            <span className="catalog-heading__page">Página {page} de {state.totalPages}</span>
          )}
        </div>

        {state.status === 'loading' && <MovieGridSkeleton count={8} />}
        {state.status === 'error' && (
          <ContentState
            title="No pudimos cargar el catálogo"
            message={getTmdbErrorMessage(state.error, 'el catálogo')}
            actionLabel={state.error?.type === 'configuration' ? undefined : 'Reintentar'}
            onAction={state.error?.type === 'configuration' ? undefined : () => setAttempt((value) => value + 1)}
          />
        )}
        {state.status === 'success' && state.movies.length === 0 && (
          <ContentState
            title="No encontramos resultados"
            message={query ? `No hay coincidencias para “${query}”. Prueba con otro título.` : 'No hay películas disponibles en este momento.'}
            actionLabel={query ? 'Limpiar búsqueda' : undefined}
            onAction={query ? clearSearch : undefined}
          />
        )}
        {state.status === 'success' && state.movies.length > 0 && (
          <>
            <div className="movie-grid">
              {state.movies.map((movie) => <MovieCard movie={movie} key={movie.id} />)}
            </div>
            <nav className="pagination" aria-label="Paginación del catálogo">
              <button type="button" onClick={() => changePage(page - 1)} disabled={page <= 1}>← Anterior</button>
              <span>Página {page}</span>
              <button type="button" onClick={() => changePage(page + 1)} disabled={page >= state.totalPages}>Siguiente →</button>
            </nav>
          </>
        )}
      </PageContainer>
    </main>
  )
}

export default ExplorePage
