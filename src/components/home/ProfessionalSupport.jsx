import { Link } from 'react-router-dom'
import { AUTH_STATUS, useAuth } from '../../context/AuthContext.jsx'
import PageContainer from '../shared/PageContainer.jsx'

const PRINCIPLES = [
  ['Voluntario', 'Tú decides si activar el acompañamiento y puedes revocarlo.'],
  ['Acceso controlado', 'El profesional sólo ve usuarios asignados con consentimiento vigente.'],
  ['Supervisión humana', 'FilmDNA organiza información; no diagnostica ni sustituye atención profesional.'],
]

function ProfessionalSupport() {
  const { status, user } = useAuth()
  const isAuthenticated = status === AUTH_STATUS.AUTHENTICATED
  const isPsychologist = isAuthenticated && user.role === 'psychologist'
  const isRegularUser = isAuthenticated && user.role === 'usuario'
  const action = isPsychologist
    ? { to: '/psicologo', label: 'Ir al panel profesional' }
    : isRegularUser
      ? { to: '/perfil#cinematerapia', label: 'Gestionar consentimiento' }
      : { to: '/ayuda', label: 'Conocer cómo funciona' }

  return <section className="home-section home-section--professional" data-tour="professional-support" aria-labelledby="professional-support-title">
    <PageContainer>
      <div className="professional-support">
        <div className="professional-support__copy">
          <p className="eyebrow"><span aria-hidden="true" />Acompañamiento profesional</p>
          <h2 id="professional-support-title">Cinematerapia con consentimiento y supervisión</h2>
          <p>Un espacio opcional para organizar el historial emocional y supervisar recomendaciones cinematográficas junto a un profesional asignado.</p>
          <Link className="button button--secondary" to={action.to}>{action.label}</Link>
        </div>
        <ul className="professional-support__principles">
          {PRINCIPLES.map(([title, description], index) => <li key={title}><span>0{index + 1}</span><div><strong>{title}</strong><p>{description}</p></div></li>)}
        </ul>
      </div>
    </PageContainer>
  </section>
}

export default ProfessionalSupport
