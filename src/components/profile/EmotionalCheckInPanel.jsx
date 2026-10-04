import { useCallback, useEffect, useState } from 'react'
import {
  createUserEmotionalRecord,
  getEmotionalHistoryErrorMessage,
  listUserEmotionalHistory,
} from '../../services/emotionalHistoryService.js'
import {
  EMOTIONAL_MOODS,
  EMOTIONAL_NOTE_MAX_LENGTH,
  getEmotionalMoodLabel,
  needsEmotionalSafetySupport,
} from '../../models/emotionalRecordModel.js'
import EmotionalSafetyNotice from '../cinematherapy/EmotionalSafetyNotice.jsx'
import '../../styles/pages/cinematherapy.css'

const INITIAL_FORM = Object.freeze({ mood: 'neutral', intensity: 5, note: '' })
const DATE_FORMATTER = new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' })

const formatDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : DATE_FORMATTER.format(date)
}

function EmotionalCheckInPanel({ userId }) {
  const [state, setState] = useState({ status: 'loading', records: [], error: '' })
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const loadHistory = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }))
    try {
      setState({ status: 'success', records: await listUserEmotionalHistory(userId), error: '' })
    } catch (error) {
      setState({ status: 'error', records: [], error: getEmotionalHistoryErrorMessage(error) })
    }
  }, [userId])

  useEffect(() => { loadHistory() }, [loadHistory])
  const latestRecord = state.records[0]

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setMessage(null)
    try {
      const created = await createUserEmotionalRecord(userId, form)
      setState((current) => ({ status: 'success', records: [created, ...current.records], error: '' }))
      setForm(INITIAL_FORM)
      setMessage({ type: 'success', text: 'Tu registro emocional se guardó de forma privada.' })
    } catch (error) {
      setMessage({ type: 'error', text: getEmotionalHistoryErrorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="profile-panel emotional-checkin" aria-labelledby="emotional-checkin-title">
      <header className="profile-section-heading">
        <p className="eyebrow"><span aria-hidden="true" />Registro personal</p>
        <h2 id="emotional-checkin-title">¿Cómo te sientes hoy?</h2>
        <p>Este registro no es un diagnóstico. Solo tú y el psicólogo que autorices podrán consultarlo.</p>
      </header>

      {message ? <p className={'profile-message profile-message--' + message.type} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p> : null}

      {latestRecord && needsEmotionalSafetySupport(latestRecord) ? <EmotionalSafetyNotice /> : null}

      <form className="emotional-checkin__form" onSubmit={submit}>
        <div className="form-field">
          <label htmlFor="emotional-mood">Estado de ánimo</label>
          <select id="emotional-mood" value={form.mood} onChange={({ target }) => setForm((current) => ({ ...current, mood: target.value }))}>
            {EMOTIONAL_MOODS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div className="form-field emotional-checkin__intensity">
          <label htmlFor="emotional-intensity">Intensidad: <output htmlFor="emotional-intensity">{form.intensity}/10</output></label>
          <input id="emotional-intensity" type="range" min="1" max="10" step="1" value={form.intensity} onChange={({ target }) => setForm((current) => ({ ...current, intensity: Number(target.value) }))} />
          <div aria-hidden="true"><span>Leve</span><span>Muy intensa</span></div>
        </div>
        <div className="form-field">
          <label htmlFor="emotional-note">Nota opcional</label>
          <textarea id="emotional-note" rows="4" maxLength={EMOTIONAL_NOTE_MAX_LENGTH} value={form.note} onChange={({ target }) => setForm((current) => ({ ...current, note: target.value }))} placeholder="Describe brevemente qué estás viviendo, si deseas hacerlo." />
          <span className="emotional-checkin__counter">{form.note.length}/{EMOTIONAL_NOTE_MAX_LENGTH}</span>
        </div>
        <button className="button button--primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar registro'}</button>
      </form>

      <div className="emotional-history">
        <div className="emotional-history__heading"><h3>Historial reciente</h3><button className="button button--secondary" type="button" onClick={loadHistory} disabled={state.status === 'loading'}>Actualizar</button></div>
        {state.status === 'loading' ? <p aria-live="polite">Cargando historial…</p> : null}
        {state.status === 'error' ? <p className="profile-message profile-message--error" role="alert">{state.error}</p> : null}
        {state.status === 'success' && !state.records.length ? <p className="emotional-history__empty">Todavía no has creado registros emocionales.</p> : null}
        {state.status === 'success' && state.records.length ? (
          <ol className="emotional-history__list">
            {state.records.map((record) => (
              <li key={record.id} className={needsEmotionalSafetySupport(record) ? 'emotional-safety-record' : undefined}>
                <div><strong>{getEmotionalMoodLabel(record.mood)}</strong><span>Intensidad {record.intensity}/10</span>{needsEmotionalSafetySupport(record) ? <span className="emotional-safety-badge">Intensidad alta</span> : null}</div>
                <time dateTime={record.createdAt}>{formatDate(record.createdAt)}</time>
                {record.note ? <p>{record.note}</p> : null}
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  )
}

export default EmotionalCheckInPanel
