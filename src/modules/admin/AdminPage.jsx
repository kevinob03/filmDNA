import { useAuth } from '../../context/AuthContext.jsx'
import PageContainer from '../../shared/components/PageContainer.jsx'
import '../profile/profile.css'

function AdminPage() {
  const { user } = useAuth()

  return (
    <main id="main-content" className="account-page">
      <PageContainer>
        <header className="account-page__header">
          <p className="eyebrow"><span aria-hidden="true" />Acceso por rol</p>
          <h1>Administración</h1>
          <p>Área reservada para cuentas con rol de administrador.</p>
        </header>

        <section className="admin-notice" aria-labelledby="admin-notice-title">
          <p className="admin-notice__status">Acceso autorizado</p>
          <h2 id="admin-notice-title">Hola, {user.nombre}</h2>
          <p>
            La protección por rol está activa. El dashboard y el CRUD administrativo se implementarán
            en la fase correspondiente.
          </p>
        </section>
      </PageContainer>
    </main>
  )
}

export default AdminPage
