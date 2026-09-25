import '../auth.css'

function AuthPageShell({ eyebrow, title, description, children }) {
  return (
    <main id="main-content" className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-page-title">
        <div className="auth-panel__intro">
          <p className="eyebrow"><span aria-hidden="true" />{eyebrow}</p>
          <h1 id="auth-page-title">{title}</h1>
          <p>{description}</p>

          <div className="auth-panel__signal" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <p className="auth-panel__note">
            Sesión local demostrativa para el entorno académico de FilmDNA.
          </p>
        </div>

        <div className="auth-panel__content">{children}</div>
      </section>
    </main>
  )
}

export default AuthPageShell
