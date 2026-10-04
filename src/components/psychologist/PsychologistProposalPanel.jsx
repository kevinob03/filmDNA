import { useCallback, useEffect, useState } from 'react'
import {
  createCinematherapyDraft,
  getCinematherapyProposalErrorMessage,
  listPsychologistProposals,
  reviewCinematherapyProposal,
} from '../../services/cinematherapyProposalService.js'

const STATUS_LABELS = Object.freeze({ pending: 'Pendiente de revisión', approved: 'Aprobada', rejected: 'Rechazada' })
const SENSITIVITY_LABELS = Object.freeze({ none: 'Sin alertas claras', mild: 'Sensibilidad moderada', high: 'Sensibilidad alta' })

function PsychologistProposalPanel({ psychologistId, assignedUser }) {
  const [state, setState] = useState({ status: 'loading', proposals: [], error: '' })
  const [busyAction, setBusyAction] = useState('')

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }))
    try {
      setState({ status: 'success', proposals: await listPsychologistProposals(psychologistId, assignedUser.userId), error: '' })
    } catch (error) {
      setState({ status: 'error', proposals: [], error: getCinematherapyProposalErrorMessage(error) })
    }
  }, [assignedUser.userId, psychologistId])

  useEffect(() => { load() }, [load])

  const generate = async () => {
    if (busyAction) return
    setBusyAction('generate')
    try {
      const proposal = await createCinematherapyDraft(psychologistId, assignedUser.userId)
      setState((current) => ({ status: 'success', proposals: [proposal, ...current.proposals], error: '' }))
    } catch (error) {
      setState((current) => ({ ...current, status: 'error', error: getCinematherapyProposalErrorMessage(error) }))
    } finally {
      setBusyAction('')
    }
  }

  const review = async (proposal, status) => {
    if (busyAction) return
    setBusyAction(proposal.id + ':' + status)
    try {
      const updated = await reviewCinematherapyProposal(psychologistId, proposal.id, status)
      setState((current) => ({
        status: 'success',
        error: '',
        proposals: current.proposals.map((item) => String(item.id) === String(updated.id) ? updated : item),
      }))
    } catch (error) {
      setState((current) => ({ ...current, status: 'error', error: getCinematherapyProposalErrorMessage(error) }))
    } finally {
      setBusyAction('')
    }
  }

  return (
    <section className="psychologist-proposals" aria-labelledby="psychologist-proposals-title">
      <header>
        <div><p className="eyebrow"><span aria-hidden="true" />IA con revisión humana</p><h3 id="psychologist-proposals-title">Propuestas cinematográficas</h3></div>
        <button className="button button--primary" type="button" onClick={generate} disabled={Boolean(busyAction)}>{busyAction === 'generate' ? 'Generando…' : 'Generar borrador con IA'}</button>
      </header>
      <p className="psychologist-proposals__privacy">La IA recibe únicamente estado, intensidad, géneros y metadata pública. La nota privada, identidad y correo no se envían.</p>
      {state.status === 'loading' ? <p aria-live="polite">Cargando propuestas…</p> : null}
      {state.error ? <p className="psychologist-state" role="alert">{state.error}</p> : null}
      {state.status === 'success' && !state.proposals.length ? <p className="psychologist-state">No hay propuestas. Genera un borrador cuando exista un registro emocional reciente y autorización de IA.</p> : null}
      {state.proposals.length ? (
        <div className="psychologist-proposals__list">
          {state.proposals.map((proposal) => (
            <article key={proposal.id} className={'psychologist-proposal psychologist-proposal--' + proposal.status}>
              <header><div><span>{STATUS_LABELS[proposal.status] ?? proposal.status}</span><h4>{proposal.summary}</h4></div><small>IA: {proposal.aiProvider}</small></header>
              <ol>
                {proposal.recommendations.map((movie) => (
                  <li key={movie.tmdbId}>
                    <div><strong>{movie.title}</strong><span className={'sensitivity sensitivity--' + movie.sensitivity}>{SENSITIVITY_LABELS[movie.sensitivity]}</span></div>
                    <p>{movie.rationale}</p>
                    {movie.sensitivityReasons.length ? <small>Revisar: {movie.sensitivityReasons.join(', ')}</small> : null}
                  </li>
                ))}
              </ol>
              {proposal.status === 'pending' ? (
                <div className="psychologist-proposal__actions">
                  <button className="button button--primary" type="button" disabled={Boolean(busyAction)} onClick={() => review(proposal, 'approved')}>Aprobar para el usuario</button>
                  <button className="profile-danger-button" type="button" disabled={Boolean(busyAction)} onClick={() => review(proposal, 'rejected')}>Rechazar propuesta</button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default PsychologistProposalPanel
