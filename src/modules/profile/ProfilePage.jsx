import { useAuth } from '../../context/AuthContext.jsx'
import PageContainer from '../../shared/components/PageContainer.jsx'
import './profile.css'

const ROLE_LABELS = {
  usuario: 'Usuario',
  admin: 'Administrador',
}

function ProfilePage() {
  const { user, logout } = useAuth()

  return (
    <main id="main-content" className="account-page">
      <PageContainer>
        <header className="account-page__header">
          <p className="eyebrow"><span aria-hidden="true" />Sesión activa</p>
          <h1>Tu perfil</h1>
          <p>Información real disponible en tu cuenta local de FilmDNA.</p>
        </header>

        <section className="account-card" aria-labelledby="profile-details-title">
          <div className="account-card__identity" aria-hidden="true">
            {user.nombre.slice(0, 1).toUpperCase()}
          </div>

          <div className="account-card__content">
            <p className="account-card__label">Identidad de cuenta</p>
            <h2 id="profile-details-title">{user.nombre}</h2>

            <dl className="account-data">
              <div>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Rol</dt>
                <dd><span className={`role-chip role-chip--${user.role}`}>{ROLE_LABELS[user.role]}</span></dd>
              </div>
            </dl>

            <button className="button button--secondary account-card__action" type="button" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </section>
      </PageContainer>
    </main>
  )
}

export default ProfilePage
