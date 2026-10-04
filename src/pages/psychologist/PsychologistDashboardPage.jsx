import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getCinematherapyErrorMessage, listPsychologistCases } from '../../services/cinematherapyService.js'
import PageContainer from '../../components/shared/PageContainer.jsx'
import PsychologistCaseHistory from '../../components/psychologist/PsychologistCaseHistory.jsx'
import '../../styles/pages/psychologist.css'

const SAFETY_PRINCIPLES = Object.freeze([
  'Acceso limitado a usuarios asignados y con consentimiento vigente.',
  'La IA apoyará recomendaciones; no realizará diagnósticos.',
  'Toda concesión y revocación queda registrada para auditoría.',
])

const formatConsentDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(date)
}

function PsychologistDashboardPage() {
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'loading', cases: [], error: '' })
  const [selectedCase, setSelectedCase] = useState(null)

  const loadCases = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }))
    try {
      const cases = await listPsychologistCases(user.id)
      setState({ status: 'success', cases, error: '' })
      setSelectedCase((current) => cases.find(({ assignmentId }) => assignmentId === current?.assignmentId) ?? null)
    } catch (error) {
      setState({ status: 'error', cases: [], error: getCinematherapyErrorMessage(error) })
      setSelectedCase(null)
    }
  }, [user.id])

  useEffect(() => { loadCases() }, [loadCases])

  const summaryItems = useMemo(() => [
    { label: 'Usuarios asignados', value: state.cases.length, detail: 'Con consentimiento vigente' },
    { label: 'Revisiones pendientes', value: 0, detail: 'Recomendaciones por supervisar' },
    { label: 'Planes activos', value: 0, detail: 'Disponible en el próximo incremento' },
  ], [state.cases.length])

  return (
    <main id="main-content" className="psychologist-page">
      <PageContainer>
        <header className="psychologist-page__header" data-tour="psychologist-dashboard">
          <p className="eyebrow"><span aria-hidden="true" />Cinematerapia supervisada</p>
          <h1>Panel del psicólogo</h1>
          <p>Hola, {user.nombre}. Solo puedes ver usuarios que te eligieron y mantienen un consentimiento activo.</p>
        </header>

        <section className="psychologist-summary" aria-labelledby="psychologist-summary-title">
          <header><p className="eyebrow"><span aria-hidden="true" />Acceso controlado</p><h2 id="psychologist-summary-title">Resumen profesional</h2></header>
          <div className="psychologist-summary__grid">
            {summaryItems.map((item) => (
              <article key={item.label}><p>{item.label}</p><strong>{item.value}</strong><span>{item.detail}</span></article>
            ))}
          </div>
        </section>

        <section className="psychologist-cases" aria-labelledby="psychologist-cases-title">
          <header>
            <div><p className="eyebrow"><span aria-hidden="true" />Consentimientos activos</p><h2 id="psychologist-cases-title">Usuarios asignados</h2></div>
            <button className="button button--secondary" type="button" onClick={loadCases} disabled={state.status === 'loading'}>Actualizar</button>
          </header>
          {state.status === 'loading' ? <p aria-live="polite">Consultando asignaciones…</p> : null}
          {state.status === 'error' ? <div className="psychologist-state" role="alert"><p>{state.error}</p><button className="button button--secondary" type="button" onClick={loadCases}>Reintentar</button></div> : null}
          {state.status === 'success' && !state.cases.length ? <p className="psychologist-state">Todavía no tienes usuarios asignados con consentimiento vigente.</p> : null}
          {state.status === 'success' && state.cases.length ? (
            <div className="psychologist-cases__list">
              {state.cases.map((assignedUser) => (
                <article key={assignedUser.assignmentId}>
                  <div className="psychologist-cases__avatar" aria-hidden="true">{assignedUser.nombre.slice(0, 1).toUpperCase()}</div>
                  <div><h3>{assignedUser.nombre}</h3><p>Consentimiento activo desde {formatConsentDate(assignedUser.consentedAt)}</p></div>
                  <span className="psychologist-cases__status">Activo</span>
                  <button className="button button--secondary psychologist-cases__action" type="button" onClick={() => setSelectedCase(assignedUser)}>Ver historial</button>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        {selectedCase ? <PsychologistCaseHistory psychologistId={user.id} assignedUser={selectedCase} onClose={() => setSelectedCase(null)} /> : null}

        <section className="psychologist-safety" aria-labelledby="psychologist-safety-title">
          <div><p className="eyebrow"><span aria-hidden="true" />Límites del sistema</p><h2 id="psychologist-safety-title">Supervisión humana primero</h2><p>FilmDNA organiza el acompañamiento y las recomendaciones. No diagnostica ni reemplaza atención profesional o servicios de emergencia.</p></div>
          <ul>{SAFETY_PRINCIPLES.map((principle) => <li key={principle}>{principle}</li>)}</ul>
        </section>
      </PageContainer>
    </main>
  )
}

export default PsychologistDashboardPage
