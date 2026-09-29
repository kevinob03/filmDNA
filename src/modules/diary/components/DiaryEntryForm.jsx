import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AUTH_STATUS, useAuth } from '../../../context/AuthContext.jsx'
import { createDiaryEntry, getDiaryErrorMessage } from '../../../services/diaryService.js'

const EMPTY_FORM = { fechaVista: '', calificacion: '', resena: '' }

function DiaryEntryForm({ movie }) {
  const { status, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const submittingRef = useRef(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submission, setSubmission] = useState({ status: 'idle', message: '' })

  const authenticated = status === AUTH_STATUS.AUTHENTICATED

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const validate = () => {
    const next = {}
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fechaVista)) next.fechaVista = 'Selecciona la fecha en que viste la película.'
    const rating = Number(form.calificacion)
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) next.calificacion = 'Selecciona una calificación entera entre 1 y 10.'
    if (!form.resena.trim()) next.resena = 'Escribe una reseña.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!authenticated) {
      navigate('/login', { state: { from: location } })
      return
    }
    if (submittingRef.current || !validate()) return
    submittingRef.current = true
    setSubmission({ status: 'submitting', message: 'Guardando registro…' })
    try {
      await createDiaryEntry(user.id, movie.id, form)
      setForm(EMPTY_FORM)
      setErrors({})
      setSubmission({ status: 'success', message: 'Película registrada correctamente en tu Diario.' })
    } catch (error) {
      setSubmission({ status: 'error', message: getDiaryErrorMessage(error) })
    } finally {
      submittingRef.current = false
    }
  }

  if (status !== AUTH_STATUS.AUTHENTICATED) {
    return (
      <section className="diary-form diary-form--guest" aria-labelledby="diary-form-title">
        <p className="eyebrow"><span aria-hidden="true" />Tu experiencia</p>
        <h2 id="diary-form-title">Registrar en mi Diario</h2>
        <p>Inicia sesión para guardar cuándo viste esta película, tu calificación y tu reseña.</p>
        <button type="button" className="button button--primary" disabled={status === AUTH_STATUS.CHECKING} onClick={() => navigate('/login', { state: { from: location } })}>Iniciar sesión para registrar</button>
      </section>
    )
  }

  const submitting = submission.status === 'submitting'
  return (
    <section className="diary-form" aria-labelledby="diary-form-title">
      <div className="diary-form__heading">
        <div><p className="eyebrow"><span aria-hidden="true" />Tu experiencia</p><h2 id="diary-form-title">Registrar en mi Diario</h2></div>
        <Link to="/diario">Abrir Diario</Link>
      </div>
      <p className="diary-form__intro">Guarda la fecha en que la viste y tu valoración personal. Tu calificación es independiente de la puntuación de TMDB.</p>
      <form noValidate onSubmit={handleSubmit}>
        <div className="diary-form__row">
          <div className="form-field">
            <label htmlFor="diary-date">Fecha vista</label>
            <input id="diary-date" name="fechaVista" type="date" value={form.fechaVista} onChange={updateField} aria-invalid={Boolean(errors.fechaVista)} aria-describedby={errors.fechaVista ? 'diary-date-error' : undefined} />
            {errors.fechaVista ? <p className="field-error" id="diary-date-error">{errors.fechaVista}</p> : null}
          </div>
          <div className="form-field">
            <label htmlFor="diary-rating">Tu calificación</label>
            <select id="diary-rating" name="calificacion" value={form.calificacion} onChange={updateField} aria-invalid={Boolean(errors.calificacion)} aria-describedby={`diary-rating-hint${errors.calificacion ? ' diary-rating-error' : ''}`}>
              <option value="">Selecciona</option>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}/10</option>)}
            </select>
            <p className="field-hint" id="diary-rating-hint">Escala personal de 1 a 10.</p>
            {errors.calificacion ? <p className="field-error" id="diary-rating-error">{errors.calificacion}</p> : null}
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="diary-review">Reseña</label>
          <textarea id="diary-review" name="resena" rows="5" value={form.resena} onChange={updateField} aria-invalid={Boolean(errors.resena)} aria-describedby={errors.resena ? 'diary-review-error' : undefined} />
          {errors.resena ? <p className="field-error" id="diary-review-error">{errors.resena}</p> : null}
        </div>
        <button className="button button--primary" type="submit" disabled={submitting}>{submitting ? 'Guardando…' : 'Registrar película vista'}</button>
      </form>
      {submission.message ? <p className={`diary-form__message diary-form__message--${submission.status}`} role={submission.status === 'error' ? 'alert' : 'status'} aria-live="polite">{submission.message}</p> : null}
    </section>
  )
}

export default DiaryEntryForm
