import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ContentState from '../../shared/components/ContentState.jsx'
import PageContainer from '../../shared/components/PageContainer.jsx'
import MovieCard from '../movies/components/MovieCard.jsx'
import MovieGridSkeleton from '../movies/components/MovieGridSkeleton.jsx'
import { getExperienceRecommendations, getSimilarDNARecommendations } from '../../services/recommendationService.js'
import ExperienceForm from './ExperienceForm.jsx'
import { EXPERIENCE_CRITERIA } from './recommendationConfig.js'
import './recommendations.css'

function RecommendationsPage() {
  const [params, setParams] = useSearchParams()
  const similarTo = params.get('similarTo')
  const [selections, setSelections] = useState(() => Object.fromEntries(EXPERIENCE_CRITERIA.flatMap(({ id, options }) => options.includes(params.get(id)) ? [[id, params.get(id)]] : [])))
  const [state, setState] = useState({ status: similarTo ? 'loading' : 'idle', movies: [] })

  const load = async (sourceId) => {
    setState({ status: 'loading', movies: [] })
    try {
      const movies = sourceId ? await getSimilarDNARecommendations(sourceId) : await getExperienceRecommendations(selections)
      setState({ status: 'success', movies })
    } catch (error) { setState({ status: 'error', movies: [], error }) }
  }
  useEffect(() => { if (similarTo) load(similarTo) }, [similarTo])
  const submit = (event) => { event.preventDefault(); setParams(selections); load(null) }
  const select = (id, option) => setSelections((current) => ({ ...current, [id]: option }))

  return <main id={'main-content'} className={'recommendations-page'}><PageContainer>
    <h1>{similarTo ? 'Peliculas con Movie DNA similar' : 'Recomendaciones por experiencia'}</h1>
    {!similarTo && <ExperienceForm selections={selections} onSelect={select} onSubmit={submit} />}
    <section className={'recommendation-results'} aria-live={'polite'}>
      {state.status === 'loading' && <MovieGridSkeleton count={8} />}
      {state.status === 'idle' && <ContentState title={'Configura tu experiencia'} message={'Selecciona al menos un criterio.'} />}
      {state.status === 'error' && <ContentState title={'No pudimos obtener recomendaciones'} message={'Comprueba TMDB y JSON Server.'} />}
      {state.status === 'success' && !state.movies.length && <ContentState title={'Aun no hay suficientes resultados'} message={'Prueba otros criterios o genera mas perfiles.'} />}
      {state.status === 'success' && state.movies.length > 0 && <div className={'movie-grid'}>{state.movies.map((movie) => <MovieCard movie={movie} key={movie.id} />)}</div>}
    </section>
  </PageContainer></main>
}
export default RecommendationsPage
