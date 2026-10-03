import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ContentState from '../../../shared/components/ContentState.jsx'
import PageContainer from '../../../shared/components/PageContainer.jsx'
import MovieGridSkeleton from '../../movies/components/MovieGridSkeleton.jsx'
import { getExperienceRecommendations, getSimilarDNARecommendations } from '../../../services/recommendationService.js'
import { getMovieWatchProviders } from '../../../services/tmdbService.js'
import { interpretSearchIntent } from '../../../services/recommendations/searchIntentService.js'
import { requiresExpertMode } from '../../../services/recommendations/searchIntentContract.js'
import { useRecommendationChat } from '../../../context/RecommendationChatContext.jsx'
import ExperienceForm from '../components/ExperienceForm.jsx'
import FilterIcon from '../components/FilterIcon.jsx'
import RecommendationCard from '../components/RecommendationCard.jsx'
import { findOption, getActiveFilterLabels, INITIAL_SELECTIONS, normalizeOptionValue } from '../recommendationConfig.js'
import '../recommendations.css'

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

const describeIntentFilters = (filters) => Object.entries(filters).flatMap(([group, value]) => {
  if (group === 'genres') return value.map((item) => findOption('genres', item)?.label).filter(Boolean)
  if (group === 'minRating') return [`TMDB ${Number(value).toFixed(1)}+`]
  return [findOption(group, value)?.label].filter(Boolean)
})

function RecommendationsPage() {
  const { pendingAction, updateRecommendationContext } = useRecommendationChat()
  const handledChatAction = useRef(0)
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
  const [naturalQuery, setNaturalQuery] = useState('')
  const [intentState, setIntentState] = useState({ status: 'idle', labels: [], unmappedTerms: [] })

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
    if (intentState.status === 'success') setIntentState((current) => ({ ...current, status: 'adjusted' }))
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

  const clear = () => {
    setSelections({ ...INITIAL_SELECTIONS, genres: [], providers: [] })
    if (intentState.status === 'success') setIntentState((current) => ({ ...current, status: 'adjusted' }))
  }

  const searchNaturally = async (event) => {
    event.preventDefault()
    const query = naturalQuery.trim()
    if (!query || intentState.status === 'loading') return
    setIntentState({ status: 'loading', labels: [], unmappedTerms: [] })
    const interpretationStartedAt = performance.now()
    try {
      const intent = await interpretSearchIntent(query)
      const interpretationMs = performance.now() - interpretationStartedAt
      if (!Object.keys(intent.filters).length) {
        setIntentState({ status: 'uninterpretable', labels: [], unmappedTerms: intent.unmappedTerms, interpretationMs })
        return
      }
      const next = { ...INITIAL_SELECTIONS, genres: [], providers: [], ...intent.filters }
      setSelections(next)
      setAppliedSelections(next)
      setMode(requiresExpertMode(intent.filters) ? 'expert' : 'simple')
      setParams(toParams(next))
      setHasSearched(true)
      setFiltersOpen(false)
      const recommendationStartedAt = performance.now()
      await load(null, next)
      setIntentState({
        status: 'success',
        labels: describeIntentFilters(intent.filters),
        unmappedTerms: intent.unmappedTerms,
        interpretationMs,
        recommendationMs: performance.now() - recommendationStartedAt,
      })
    } catch {
      setIntentState({ status: 'error', labels: [], unmappedTerms: [] })
    }
  }

  const activeFilters = useMemo(() => getActiveFilterLabels(appliedSelections, providers), [appliedSelections, providers])

  const removeFilter = (group, value) => {
    const next = {
      ...appliedSelections,
      [group]: ARRAY_FIELDS.has(group)
        ? appliedSelections[group].filter((item) => item !== value)
        : INITIAL_SELECTIONS[group],
    }
    setSelections(next)
    if (intentState.status === 'success') setIntentState((current) => ({ ...current, status: 'adjusted' }))
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

  const handleChatAction = (response) => {
    if (response.action === 'new-search' || response.action === 'refine') {
      const base = response.action === 'new-search'
        ? { ...INITIAL_SELECTIONS, genres: [], providers: [] }
        : { ...appliedSelections, genres: [...appliedSelections.genres], providers: [...appliedSelections.providers] }
      response.clearFilters.forEach((key) => { base[key] = Array.isArray(INITIAL_SELECTIONS[key]) ? [] : INITIAL_SELECTIONS[key] })
      const next = { ...base, ...response.filtersPatch }
      setSelections(next)
      setAppliedSelections(next)
      setMode(requiresExpertMode(response.filtersPatch) ? 'expert' : mode)
      setParams(toParams(next))
      setHasSearched(true)
      setFiltersOpen(false)
      setIntentState({ status: 'adjusted', labels: [], unmappedTerms: [] })
      load(null, next)
      return
    }
    if (response.action === 'replace-one' && response.targetMovieId) {
      dismiss(response.targetMovieId)
      return
    }
    if (response.action === 'reset') {
      const next = { ...INITIAL_SELECTIONS, genres: [], providers: [] }
      setSelections(next)
      setAppliedSelections(next)
      setParams({})
      setHasSearched(false)
      setFiltersOpen(false)
      setIntentState({ status: 'idle', labels: [], unmappedTerms: [] })
      setState({ status: 'idle', movies: [] })
    }
  }

  useEffect(() => {
    updateRecommendationContext(appliedSelections, state.movies)
  }, [appliedSelections, state.movies, updateRecommendationContext])

  useEffect(() => {
    if (!pendingAction || handledChatAction.current === pendingAction.id) return
    handledChatAction.current = pendingAction.id
    handleChatAction(pendingAction.response)
  }, [pendingAction])

  return <main id="main-content" className="recommendations-page"><PageContainer>
    <section className="recommendations-hero">
      <p className="recommendations-hero__eyebrow"><span /> Recomendaciones personalizadas</p>
      <h1>{similarTo ? 'Películas con un Movie DNA similar' : '¿Qué quieres ver hoy?'}</h1>
      <p>{similarTo ? 'Historias conectadas por una experiencia cinematográfica parecida.' : 'Cuéntanos qué te apetece y encontraremos películas que encajen contigo. Sin complicaciones.'}</p>
    </section>

    {!similarTo && <form className="natural-search" aria-labelledby="natural-search-title" aria-busy={intentState.status === 'loading'} onSubmit={searchNaturally}>
      <div className="natural-search__content"><FilterIcon name="magic" size={24} /><div><label id="natural-search-title" htmlFor="natural-query">Describe lo que buscas con tus propias palabras</label><input id="natural-query" placeholder="Ej.: una comedia ligera para ver con amigos" value={naturalQuery} onChange={(event) => setNaturalQuery(event.target.value)} disabled={intentState.status === 'loading'} /><small>FilmDNA convertirá tu descripción en filtros que podrás revisar y ajustar.</small></div></div>
      <button className="button natural-search__action" type="submit" disabled={!naturalQuery.trim() || intentState.status === 'loading'}>{intentState.status === 'loading' ? 'Interpretando…' : 'Buscar con IA'}</button>
    </form>}

    {!similarTo && intentState.status === 'success' && <div className="intent-feedback intent-feedback--success" role="status"><strong>FilmDNA entendió:</strong> {intentState.labels.join(', ')}{intentState.unmappedTerms.length > 0 && <span>No se pudo representar: {intentState.unmappedTerms.join(', ')}.</span>}</div>}
    {!similarTo && intentState.status === 'adjusted' && <div className="intent-feedback" role="status">Filtros interpretados y ajustados manualmente.</div>}
    {!similarTo && intentState.status === 'uninterpretable' && <div className="intent-feedback intent-feedback--error" role="alert"><strong>No pude convertir esa búsqueda en filtros de FilmDNA.</strong> Prueba describiendo género, ritmo, duración o cómo quieres sentirte.</div>}
    {!similarTo && intentState.status === 'error' && <div className="intent-feedback intent-feedback--error" role="alert"><strong>La interpretación con IA no está disponible temporalmente.</strong> Puedes seguir usando los filtros manuales.</div>}

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
