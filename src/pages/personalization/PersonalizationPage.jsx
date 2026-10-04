import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import PageContainer from '../../components/shared/PageContainer.jsx'
import {
  ATTENTION_OPTIONS, COMPANY_OPTIONS, GENRE_OPTIONS, MOOD_OPTIONS, PACE_OPTIONS,
} from '../../config/recommendationConfig.js'
import '../../styles/pages/personalization.css'

const STEPS = [
  { key: 'genres', title: '¿Qué sueles disfrutar?', description: 'Elige hasta tres géneros. Podrás cambiarlos al buscar.', options: GENRE_OPTIONS, multiple: true },
  { key: 'mood', title: '¿Cómo te gusta sentirte?', description: 'Elige hasta tres emociones que te guste encontrar en una película.', options: MOOD_OPTIONS, multiple: true, maxSelections: 3 },
  { key: 'pace', title: '¿Qué ritmo prefieres?', description: 'Desde historias tranquilas hasta películas sin descanso.', options: PACE_OPTIONS },
  { key: 'attention', title: '¿Cuánta atención quieres dedicar?', description: 'Selecciona el nivel que más se parezca a ti.', options: ATTENTION_OPTIONS },
  { key: 'company', title: '¿Con quién ves películas normalmente?', description: 'Usaremos esta respuesta como punto de partida.', options: COMPANY_OPTIONS },
]

function PersonalizationPage() {
  const { completePersonalization, user } = useAuth()
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [preferences, setPreferences] = useState(() => {
    const stored = user?.discoveryPreferences || {}
    const storedMood = stored.mood
    return {
      genres: [], pace: '', attention: '', company: '', ...stored,
      mood: Array.isArray(storedMood) ? storedMood : storedMood ? [storedMood] : [],
    }
  })
  const [status, setStatus] = useState('idle')
  const step = STEPS[stepIndex]
  const selected = preferences[step.key]
  const canContinue = step.multiple ? selected.length > 0 : Boolean(selected)
  const progress = useMemo(() => Math.round((stepIndex + 1) / STEPS.length * 100), [stepIndex])

  const select = (value) => setPreferences((current) => {
    if (!step.multiple) return { ...current, [step.key]: value }
    const values = current[step.key]
    if (values.includes(value)) return { ...current, [step.key]: values.filter((item) => item !== value) }
    if (values.length >= (step.maxSelections || 3)) return current
    return { ...current, [step.key]: [...values, value] }
  })

  const finish = async (nextPreferences = preferences) => {
    setStatus('saving')
    try {
      await completePersonalization(nextPreferences)
      navigate('/explorar', { replace: true })
    } catch {
      setStatus('error')
    }
  }

  const next = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex((index) => index + 1)
    else finish()
  }

  return <main id="main-content" className="personalization-page"><PageContainer>
    <section className="personalization-card" aria-labelledby="personalization-title">
      <header>
        <p className="eyebrow"><span aria-hidden="true" />Tu primera selección</p>
        <div className="personalization-progress" aria-label={`Paso ${stepIndex + 1} de ${STEPS.length}`}>
          <span>Paso {stepIndex + 1} de {STEPS.length}</span><div><i style={{ width: `${progress}%` }} /></div>
        </div>
        <h1 id="personalization-title">{step.title}</h1>
        <p>{step.description}</p>
      </header>

      <div className="personalization-options" role="group" aria-label={step.title}>
        {step.options.map((option) => {
          const active = step.multiple ? selected.includes(option.value) : selected === option.value
          return <button type="button" key={option.value} aria-pressed={active} onClick={() => select(option.value)}>
            <strong>{option.label}</strong>{option.description && <small>{option.description}</small>}
          </button>
        })}
      </div>

      {status === 'error' && <p className="form-message form-message--error" role="alert">No pudimos guardar tus preferencias. Comprueba JSON Server e inténtalo de nuevo.</p>}
      <footer>
        <button type="button" className="personalization-skip" onClick={() => finish({})} disabled={status === 'saving'}>Ahora no</button>
        <div>
          {stepIndex > 0 && <button type="button" className="button button--secondary" onClick={() => setStepIndex((index) => index - 1)} disabled={status === 'saving'}>Anterior</button>}
          <button type="button" className="button button--primary" onClick={next} disabled={!canContinue || status === 'saving'}>{status === 'saving' ? 'Guardando…' : stepIndex === STEPS.length - 1 ? 'Explorar para mí' : 'Continuar'}</button>
        </div>
      </footer>
    </section>
  </PageContainer></main>
}

export default PersonalizationPage
