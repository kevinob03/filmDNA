import { useEffect, useState } from 'react'
import {
  getEmotionalHistoryErrorMessage,
  listAssignedUserEmotionalHistory,
} from '../../../services/emotionalHistoryService.js'
import { getEmotionalMoodLabel, needsEmotionalSafetySupport } from '../../cinematherapy/emotionalRecordModel.js'
import EmotionalSafetyNotice from '../../cinematherapy/components/EmotionalSafetyNotice.jsx'
import '../../cinematherapy/cinematherapy.css'
import PsychologistProposalPanel from './PsychologistProposalPanel.jsx'

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' })
const formatDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : DATE_FORMATTER.format(date)
}

function PsychologistCaseHistory({ psychologistId, assignedUser, onClose }) {
  const [state, setState] = useState({ status: 'loading', records: [], error: '' })
  const hasHighIntensityRecord = state.records.some(needsEmotionalSafetySupport)

  useEffect(() => {
    let active = true
    setState({ status: 'loading', records: [], error: '' })
    listAssignedUserEmotionalHistory(psychologistId, assignedUser.userId)
      .then((records) => active && setState({ status: 'success', records, error: '' }))
      .catch((error) => active && setState({ status: 'error', records: [], error: getEmotionalHistoryErrorMessage(error) }))
    return () => { active = false }
  }, [assignedUser.userId, psychologistId])

  return (
    <section className="psychologist-history" aria-labelledby="psychologist-history-title">
      <header>
        <div><p className="eyebrow"><span aria-hidden="true" />Acceso autorizado</p><h2 id="psychologist-history-title">Historial emocional de {assignedUser.nombre}</h2></div>
        <button className="button button--secondary" type="button" onClick={onClose}>Cerrar historial</button>
      </header>
      <p className="psychologist-history__notice">Información aportada por el usuario. No representa un diagnóstico automatizado.</p>
      {hasHighIntensityRecord ? <EmotionalSafetyNotice audience="psychologist" /> : null}
      {state.status === 'loading' ? <p aria-live="polite">Cargando historial autorizado…</p> : null}
      {state.status === 'error' ? <p className="psychologist-state" role="alert">{state.error}</p> : null}
      {state.status === 'success' && !state.records.length ? <p className="psychologist-state">Este usuario todavía no ha creado registros emocionales.</p> : null}
      {state.status === 'success' && state.records.length ? (
        <ol className="psychologist-history__list">
          {state.records.map((record) => (
            <li key={record.id} className={needsEmotionalSafetySupport(record) ? 'emotional-safety-record' : undefined}>
              <div><strong>{getEmotionalMoodLabel(record.mood)}</strong><span>Intensidad {record.intensity}/10</span>{needsEmotionalSafetySupport(record) ? <span className="emotional-safety-badge">Requiere revisión humana</span> : null}</div>
              <time dateTime={record.createdAt}>{formatDate(record.createdAt)}</time>
              {record.note ? <p>{record.note}</p> : <p className="psychologist-history__no-note">Sin nota adicional.</p>}
            </li>
          ))}
        </ol>
      ) : null}
      <PsychologistProposalPanel psychologistId={psychologistId} assignedUser={assignedUser} />
    </section>
  )
}

export default PsychologistCaseHistory
