import { useEffect, useState } from 'react'
import {
  getCinematherapyErrorMessage,
  getUserCinematherapySetup,
  grantCinematherapyConsent,
  revokeCinematherapyConsent,
} from '../../services/cinematherapyService.js'

const INITIAL_FORM = Object.freeze({ psychologistId: '', emotionalHistory: false, recommendations: false, aiProcessing: false })

function CinematherapyConsentPanel({ userId }) {
  const [state, setState] = useState({ status: 'loading', psychologists: [], assignment: null, error: '' })
  const [form, setForm] = useState(INITIAL_FORM)
  const [updating, setUpdating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true
    getUserCinematherapySetup(userId)
      .then((setup) => {
        if (!active) return
        setState({ status: 'success', ...setup, error: '' })
        const scopes = new Set(setup.assignment?.scopes || [])
        setForm({
          psychologistId: setup.assignment?.psicologoId ?? setup.psychologists[0]?.id ?? '',
          emotionalHistory: scopes.has('emotional-history'),
          recommendations: scopes.has('movie-recommendations'),
          aiProcessing: scopes.has('external-ai-processing'),
        })
      })
      .catch((error) => active && setState({ status: 'error', psychologists: [], assignment: null, error: getCinematherapyErrorMessage(error) }))
    return () => { active = false }
  }, [userId])

  const selectedPsychologist = state.psychologists.find(({ id }) => String(id) === String(state.assignment?.psicologoId))
  const hasAIConsent = state.assignment?.scopes?.includes('external-ai-processing') === true

  const activate = async (event) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage(null)
    try {
      const assignment = await grantCinematherapyConsent({ userId, ...form })
      setState((current) => ({ ...current, assignment }))
      setForm((current) => ({ ...current, emotionalHistory: true, recommendations: true, aiProcessing: true }))
      setUpdating(false)
      setMessage({ type: 'success', text: 'Consentimiento registrado. Tú mantienes el control y puedes revocarlo.' })
    } catch (error) {
      setMessage({ type: 'error', text: getCinematherapyErrorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  const revoke = async () => {
    if (busy || !state.assignment) return
    setBusy(true)
    setMessage(null)
    try {
      await revokeCinematherapyConsent(state.assignment)
      setState((current) => ({ ...current, assignment: null }))
      setForm((current) => ({ ...current, emotionalHistory: false, recommendations: false, aiProcessing: false }))
      setUpdating(false)
      setMessage({ type: 'success', text: 'Consentimiento revocado. El psicólogo ya no puede verte como caso activo.' })
    } catch (error) {
      setMessage({ type: 'error', text: getCinematherapyErrorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  const showForm = state.status === 'success' && (!state.assignment || updating)

  return (
    <section id="cinematerapia" className="profile-panel cinematherapy-consent" aria-labelledby="cinematherapy-consent-title">
      <header className="profile-section-heading">
        <p className="eyebrow"><span aria-hidden="true" />Privacidad y acompañamiento</p>
        <h2 id="cinematherapy-consent-title">Cinematerapia con supervisión</h2>
        <p>Esta función es voluntaria, no sustituye atención médica ni realiza diagnósticos.</p>
      </header>

      {state.status === 'loading' ? <p aria-live="polite">Consultando disponibilidad…</p> : null}
      {state.status === 'error' ? <p className="profile-message profile-message--error" role="alert">{state.error}</p> : null}
      {message ? <p className={'profile-message profile-message--' + message.type} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p> : null}

      {state.status === 'success' && state.assignment && !updating ? (
        <div className="cinematherapy-consent__active">
          <div><span>Consentimiento activo con</span><strong>{selectedPsychologist?.nombre ?? 'Psicólogo asignado'}</strong></div>
          <p>Puede consultar tu historial emocional y supervisar recomendaciones mientras este permiso permanezca activo.</p>
          <p className={hasAIConsent ? 'cinematherapy-consent__ai-status' : 'cinematherapy-consent__ai-status cinematherapy-consent__ai-status--pending'}>
            {hasAIConsent
              ? 'IA autorizada: solo se envían estado, intensidad y géneros favoritos, sin nombre, correo ni notas.'
              : 'La IA externa no está autorizada con este consentimiento anterior.'}
          </p>
          {!hasAIConsent ? <button className="button button--secondary" type="button" onClick={() => setUpdating(true)}>Actualizar permisos de IA</button> : null}
          <button className="profile-danger-button" type="button" disabled={busy} onClick={revoke}>{busy ? 'Revocando…' : 'Revocar consentimiento'}</button>
        </div>
      ) : null}

      {showForm ? (
        state.psychologists.length ? (
          <form className="cinematherapy-consent__form" onSubmit={activate}>
            <div className="form-field">
              <label htmlFor="cinematherapy-psychologist">Psicólogo</label>
              <select id="cinematherapy-psychologist" value={form.psychologistId} onChange={({ target }) => setForm((current) => ({ ...current, psychologistId: target.value }))}>
                {state.psychologists.map((psychologist) => <option key={psychologist.id} value={psychologist.id}>{psychologist.nombre}</option>)}
              </select>
            </div>
            <label className="cinematherapy-consent__check"><input type="checkbox" checked={form.emotionalHistory} onChange={({ target }) => setForm((current) => ({ ...current, emotionalHistory: target.checked }))} /><span>Autorizo el acceso a mi historial emocional dentro de FilmDNA.</span></label>
            <label className="cinematherapy-consent__check"><input type="checkbox" checked={form.recommendations} onChange={({ target }) => setForm((current) => ({ ...current, recommendations: target.checked }))} /><span>Autorizo la supervisión de recomendaciones de películas.</span></label>
            <label className="cinematherapy-consent__check"><input type="checkbox" checked={form.aiProcessing} onChange={({ target }) => setForm((current) => ({ ...current, aiProcessing: target.checked }))} /><span>Autorizo enviar mi estado, intensidad y géneros favoritos —sin nombre, correo ni nota— al proveedor de IA configurado, junto con metadata pública de películas, para generar un borrador.</span></label>
            <div className="cinematherapy-consent__actions">
              <button className="button button--primary" disabled={busy || !form.psychologistId}>{busy ? 'Guardando…' : updating ? 'Actualizar consentimiento' : 'Dar consentimiento y asignar'}</button>
              {updating ? <button className="button button--secondary" type="button" onClick={() => setUpdating(false)}>Cancelar</button> : null}
            </div>
          </form>
        ) : <p>No hay psicólogos disponibles en este momento.</p>
      ) : null}
    </section>
  )
}

export default CinematherapyConsentPanel
