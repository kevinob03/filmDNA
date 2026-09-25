import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  generateMovieDNA,
  getAIErrorMessage,
  isAIConfigured,
} from '../../../services/aiService.js'
import {
  getMovieDNAByTmdbId,
  getMovieDNAErrorMessage,
  saveMovieDNA,
  validateMovieDNAProfile,
} from '../../../services/movieDNAService.js'
import PageContainer from '../../../shared/components/PageContainer.jsx'
import MovieDNARadar from './MovieDNARadar.jsx'

const INITIAL_STATE = { status: 'checking', profile: null, message: '' }

function MovieDNASkeleton() {
  return (
    <div className="movie-dna-skeleton" aria-label="Comprobando Movie DNA" aria-busy="true">
      <div className="movie-dna-skeleton__chart" />
      <div className="movie-dna-skeleton__lines">
        <span /><span /><span /><span /><span /><span />
      </div>
    </div>
  )
}

function MovieDNASection({ movie }) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState(INITIAL_STATE)

  useEffect(() => {
    let active = true
    setState(INITIAL_STATE)

    getMovieDNAByTmdbId(movie.id)
      .then((profile) => {
        if (!active) return
        setState(profile
          ? { status: 'success', profile, message: '' }
          : { status: 'missing', profile: null, message: '' })
      })
      .catch((error) => {
        if (active) setState({ status: 'error', profile: null, message: getMovieDNAErrorMessage(error) })
      })

    return () => { active = false }
  }, [movie.id, attempt])

  const handleGenerate = async () => {
    setState({ status: 'generating', profile: null, message: '' })

    try {
      const generatedProfile = await generateMovieDNA(movie)
      validateMovieDNAProfile(generatedProfile)
      const savedProfile = await saveMovieDNA(movie.id, generatedProfile)
      setState({ status: 'success', profile: savedProfile, message: '' })
    } catch (error) {
      setState({ status: 'missing', profile: null, message: getAIErrorMessage(error) })
    }
  }

  return (
    <section className="movie-dna-section" aria-labelledby="movie-dna-title">
      <PageContainer>
        <header className="movie-dna-section__header">
          <div>
            <p className="eyebrow"><span aria-hidden="true" /> Movie DNA</p>
            <h2 id="movie-dna-title">Perfil de experiencia cinematográfica</h2>
          </div>
          <p>Perfil estimado por FilmDNA a partir de metadatos cinematográficos.</p>
        </header>

        {state.status === 'checking' && <MovieDNASkeleton />}

        {state.status === 'error' && (
          <div className="movie-dna-state" role="status">
            <h3>No pudimos comprobar Movie DNA</h3>
            <p>{state.message}</p>
            <button className="button button--secondary" type="button" onClick={() => setAttempt((value) => value + 1)}>
              Reintentar consulta
            </button>
          </div>
        )}

        {(state.status === 'missing' || state.status === 'generating') && (
          <div className="movie-dna-state" role="status" aria-live="polite">
            <span className="movie-dna-state__symbol" aria-hidden="true">◇</span>
            <h3>{state.status === 'generating' ? 'Generando Movie DNA' : 'Movie DNA aún no generado'}</h3>
            <p>
              {state.status === 'generating'
                ? 'Analizando únicamente la metadata cinematográfica disponible.'
                : 'Puedes solicitar el análisis cuando haya un proveedor de IA configurado.'}
            </p>
            {state.message && <p className="movie-dna-state__error">{state.message}</p>}
            <button
              className="button button--primary"
              type="button"
              onClick={handleGenerate}
              disabled={state.status === 'generating'}
            >
              {state.status === 'generating' ? 'Generando…' : 'Generar Movie DNA'}
            </button>
            {!isAIConfigured && (
              <small>Configura al menos un proveedor y su modelo para habilitar la generación.</small>
            )}
          </div>
        )}

        {state.status === 'success' && state.profile && (
          <div className="movie-dna-result">
            <MovieDNARadar profile={state.profile} />
            <div className="movie-dna-explanation">
              <p className="movie-dna-explanation__label">Interpretación FilmDNA</p>
              <p>{state.profile.explicacion}</p>
              <small>Estimación orientativa. No representa una medición científica ni datos proporcionados por TMDB.</small>
              <Link className={'button button--secondary'} to={`/recomendaciones?similarTo=${movie.id}`}>Buscar películas con DNA similar</Link>
            </div>
          </div>
        )}
      </PageContainer>
    </section>
  )
}

export default MovieDNASection
