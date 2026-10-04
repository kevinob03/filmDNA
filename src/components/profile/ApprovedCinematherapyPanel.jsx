import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getCinematherapyProposalErrorMessage,
  listApprovedCinematherapyProposals,
} from '../../services/cinematherapyProposalService.js'
import { buildTmdbImageUrl } from '../../services/tmdbService.js'

const SENSITIVITY_LABELS = Object.freeze({ none: 'Sin alertas claras', mild: 'Sensibilidad moderada', high: 'Sensibilidad alta' })

function ApprovedCinematherapyPanel({ userId }) {
  const [state, setState] = useState({ status: 'loading', proposals: [], error: '' })

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }))
    try {
      setState({ status: 'success', proposals: await listApprovedCinematherapyProposals(userId), error: '' })
    } catch (error) {
      setState({ status: 'error', proposals: [], error: getCinematherapyProposalErrorMessage(error) })
    }
  }, [userId])

  useEffect(() => { load() }, [load])
  const proposal = state.proposals[0]

  return (
    <section className="profile-panel approved-cinematherapy" aria-labelledby="approved-cinematherapy-title">
      <header className="profile-section-heading">
        <p className="eyebrow"><span aria-hidden="true" />Revisión profesional</p>
        <h2 id="approved-cinematherapy-title">Películas para acompañarte</h2>
        <p>Solo aparecen propuestas aprobadas por tu psicólogo. No constituyen diagnóstico ni tratamiento.</p>
      </header>
      {state.status === 'loading' ? <p aria-live="polite">Consultando propuestas aprobadas…</p> : null}
      {state.status === 'error' ? <p className="profile-message profile-message--error" role="alert">{state.error}</p> : null}
      {state.status === 'success' && !proposal ? <p className="emotional-history__empty">Todavía no tienes una propuesta aprobada.</p> : null}
      {proposal ? (
        <div className="approved-cinematherapy__content">
          <div className="approved-cinematherapy__summary"><strong>Orientación supervisada</strong><p>{proposal.summary}</p></div>
          <div className="approved-cinematherapy__movies">
            {proposal.recommendations.map((movie) => (
              <article key={movie.tmdbId}>
                {movie.posterPath ? <img src={buildTmdbImageUrl(movie.posterPath, 'w342')} alt="" loading="lazy" /> : <div className="approved-cinematherapy__poster" aria-hidden="true">FilmDNA</div>}
                <div>
                  <h3>{movie.title}</h3>
                  <span className={'sensitivity sensitivity--' + movie.sensitivity}>{SENSITIVITY_LABELS[movie.sensitivity]}</span>
                  <p>{movie.rationale}</p>
                  {movie.sensitivityReasons.length ? <small>Contenido a considerar: {movie.sensitivityReasons.join(', ')}</small> : null}
                  <Link className="button button--secondary" to={'/pelicula/' + movie.tmdbId}>Ver película</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ApprovedCinematherapyPanel
