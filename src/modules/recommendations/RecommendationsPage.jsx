import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ContentState from '../../shared/components/ContentState.jsx'
import PageContainer from '../../shared/components/PageContainer.jsx'
import MovieGridSkeleton from '../movies/components/MovieGridSkeleton.jsx'
import { getExperienceRecommendations, getSimilarDNARecommendations } from '../../services/recommendationService.js'
import { getMovieWatchProviders } from '../../services/tmdbService.js'
import ExperienceForm from './ExperienceForm.jsx'
import FilterIcon from './FilterIcon.jsx'
import RecommendationCard from './RecommendationCard.jsx'
import { getActiveFilterLabels, INITIAL_SELECTIONS, normalizeOptionValue } from './recommendationConfig.js'
import './recommendations.css'

const ARRAY_FIELDS = new Set(['genres', 'providers'])

const readSelections = (params) => Object.keys(INITIAL_SELECTIONS).reduce((result, key) => {
  const raw = params.get(key)
  if (ARRAY_FIELDS.has(key)) result[key] = raw ? raw.split(',').filter(Boolean).map((value) => normalizeOptionValue(key, value)) : []
  else if (key === 'minRating') result[key] = Number(raw) || 0
  else result[key] = raw ? normalizeOptionValue(key, raw) : INITIAL_SELECTIONS[key]
  return result
}, {})

const toParams = (selections) => Object.entries(selections).reduce((params, [key, value]) => {
  const serialized = Array.isArray(value) ? value.join(',') : String(value ?? '')
  if (serialized && !(key === 'minRating' && Number(value) === 0) && !(key === 'popularity' && value === 'popular')) params[key] = serialized
  return params
}, {})

function RecommendationsPage() {
  const [params, setParams] = useSearchParams()
  const similarTo = params.get('similarTo')
  const hasPersistedSearch = Boolean(similarTo || [...params.keys()].some((key) => key !== 'similarTo'))
  const restoredSearch = useRef(false)
  const [selections, setSelections] = useState(() => readSelections(params))
  const [appliedSelections, setAppliedSelections] = useState(() => readSelections(params))
  const [mode, setMode] = useState('simple')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [providers, setProviders] = useState([])
  const [sort, setSort] = useState('compatibility')
  const [hasSearched, setHasSearched] = useState(hasPersistedSearch)
  const [state, setState] = useState({ status: hasPersistedSearch ? 'loading' : 'idle', movies: [] })

  useEffect(() => {
    getMovieWatchProviders('ES')
      .then((data) => setProviders((data.results || []).slice(0, 16)))
      .catch(() => setProviders([]))
  }, [])

  useEffect(() => {
    if (!filtersOpen) return undefined
    const onKeyDown = (event) => { if (event.key === 'Escape') setFiltersOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [filtersOpen])

  const load = async (sourceId, nextSelections = appliedSelections) => {
    setState({ status: 'loading', movies: [] })
    try {
      const movies = sourceId ? await getSimilarDNARecommendations(sourceId) : await getExperienceRecommendations(nextSelections, providers)
      setState({ status: 'success', movies })
    } catch (error) {
      setState({ status: 'error', movies: [], error })
    }
  }

  useEffect(() => {
    if (restoredSearch.current || !hasPersistedSearch) return
    restoredSearch.current = true
    const restoredSelections = readSelections(params)
    load(similarTo, restoredSelections)
  }, [])

  const changeSelection = (group, value, multiple = false) => {
    setSelections((current) => {
      if (multiple) {
        const values = current[group] || []
        return { ...current, [group]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] }
      }
      return { ...current, [group]: current[group] === value ? INITIAL_SELECTIONS[group] : value }
    })
  }

  const submit = (event) => {
    event.preventDefault()
    setAppliedSelections(selections)
    setParams(toParams(selections))
    setHasSearched(true)
    setFiltersOpen(false)
    load(null, selections)
  }

  const clear = () => setSelections({ ...INITIAL_SELECTIONS, genres: [], providers: [] })

  const activeFilters = useMemo(() => getActiveFilterLabels(appliedSelections, providers), [appliedSelections, providers])

  const removeFilter = (group, value) => {
    const next = {
      ...appliedSelections,
      [group]: ARRAY_FIELDS.has(group)
        ? appliedSelections[group].filter((item) => item !== value)
        : INITIAL_SELECTIONS[group],
    }
    setSelections(next)
    setAppliedSelections(next)
    setParams(toParams(next))
    load(null, next)
  }

  const sortedMovies = useMemo(() => {
    const movies = [...state.movies]
    if (sort === 'rating') return movies.sort((a, b) => b.vote_average - a.vote_average)
    if (sort === 'recent') return movies.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
    if (sort === 'popular') return movies.sort((a, b) => b.popularity - a.popularity)
    return movies.sort((a, b) => {
      const aPercentage = a.recommendation?.percentage
      const bPercentage = b.recommendation?.percentage
      if (aPercentage == null && bPercentage != null) return 1
      if (aPercentage != null && bPercentage == null) return -1
      return (bPercentage ?? 0) - (aPercentage ?? 0)
    })
  }, [sort, state.movies])

  const dismiss = (movieId) => setState((current) => ({ ...current, movies: current.movies.filter((movie) => movie.id !== movieId) }))

  return <main id="main-content" className="recommendations-page"><PageContainer>
    <section className="recommendations-hero">
      <p className="recommendations-hero__eyebrow"><span /> Recomendaciones personalizadas</p>
      <h1>{similarTo ? 'Películas con un Movie DNA similar' : '¿Qué quieres ver hoy?'}</h1>
      <p>{similarTo ? 'Historias conectadas por una experiencia cinematográfica parecida.' : 'Cuéntanos qué te apetece y encontraremos películas que encajen contigo. Sin complicaciones.'}</p>
    </section>

    {!similarTo && <section className="natural-search" aria-labelledby="natural-search-title">
      <div className="natural-search__content"><FilterIcon name="magic" size={24} /><div><label id="natural-search-title" htmlFor="natural-query">También puedes describir lo que buscas con tus propias palabras</label><input id="natural-query" placeholder="Describe lo que buscas…" disabled /><small>Esta búsqueda necesita un servicio que convierta el texto en filtros verificables.</small></div></div>
      <button className="button natural-search__action" type="button" disabled aria-disabled="true">Buscar con IA</button>
    </section>}

    {!similarTo && !hasSearched && <ExperienceForm selections={selections} providers={providers} mode={mode} onModeChange={setMode} onChange={changeSelection} onSubmit={submit} onClear={clear} />}

    {(hasSearched || similarTo) && <section className="recommendation-results" aria-live="polite">
      <header className="results-toolbar">
        <div className="results-toolbar__main"><div><h2>Películas para ti</h2>{state.status === 'success' && <span>{state.movies.length} resultados</span>}</div>{!similarTo && <button type="button" className="adjust-filters" onClick={() => setFiltersOpen(true)}><FilterIcon name="tune" size={18} /> Ajustar filtros</button>}</div>
        {state.status === 'success' && state.movies.length > 0 && <label className="results-sort">Ordenar por<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="compatibility">Mejor compatibilidad</option><option value="rating">Mejor puntuadas</option><option value="popular">Más populares</option><option value="recent">Más recientes</option></select></label>}
      </header>

      {!similarTo && activeFilters.length > 0 && <div className="active-filters"><span>Activos:</span>{activeFilters.map((filter) => <button type="button" key={`${filter.group}-${filter.value}`} onClick={() => removeFilter(filter.group, filter.value)}>{filter.label}<span aria-hidden="true">×</span></button>)}</div>}

      {state.status === 'loading' && <MovieGridSkeleton count={8} />}
      {state.status === 'error' && <ContentState title="No pudimos obtener recomendaciones" message="Comprueba la configuración de TMDB y vuelve a intentarlo." />}
      {state.status === 'success' && !state.movies.length && <ContentState title="No encontramos películas con esos filtros" message="Prueba ampliando la duración, época o puntuación." />}
      {state.status === 'success' && state.movies.length > 0 && <div className="recommendation-grid">{sortedMovies.map((movie) => <RecommendationCard movie={movie} key={movie.id} onDismiss={dismiss} />)}</div>}
      {state.status === 'success' && state.movies.some((movie) => movie.recommendation?.providers?.length) && <p className="provider-attribution">La disponibilidad de streaming procede de TMDB y JustWatch y puede variar por región.</p>}
    </section>}
  </PageContainer>

  {filtersOpen && <div className="filter-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false) }}>
    <div className="filter-dialog" role="dialog" aria-modal="true" aria-label="Ajustar filtros de recomendaciones">
      <ExperienceForm panel selections={selections} providers={providers} mode={mode} onModeChange={setMode} onChange={changeSelection} onSubmit={submit} onClear={clear} onClose={() => setFiltersOpen(false)} />
    </div>
  </div>}
  </main>
}

export default RecommendationsPage
