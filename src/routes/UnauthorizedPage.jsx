import { Link } from 'react-router-dom'
import PageContainer from '../shared/components/PageContainer.jsx'
import '../modules/profile/profile.css'

function UnauthorizedPage() {
  return (
    <main id="main-content" className="account-page">
      <PageContainer>
        <section className="access-panel" aria-labelledby="unauthorized-title">
          <p className="access-panel__code">ERROR 403</p>
          <h1 id="unauthorized-title">Acceso no autorizado</h1>
          <p>Tu cuenta está activa, pero su rol no permite entrar al área administrativa.</p>

          <div className="access-panel__actions">
            <Link className="button button--primary" to="/perfil">Volver al perfil</Link>
            <Link className="button button--secondary" to="/explorar">Explorar películas</Link>
          </div>
        </section>
      </PageContainer>
    </main>
  )
}

export default UnauthorizedPage
