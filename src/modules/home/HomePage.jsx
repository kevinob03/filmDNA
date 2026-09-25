import './home.css'

function HomePage() {
  return (
    <main className="home-shell">
      <section className="home-intro" aria-labelledby="home-title">
        <img
          className="home-intro__logo"
          src="/brand/filmdna-logo-primary-dark.svg"
          alt="FilmDNA"
        />
        <p className="home-intro__eyebrow">FASE 0 · BASE DEL PROYECTO</p>
        <h1 id="home-title">Descubre el cine según la experiencia que quieres vivir.</h1>
        <div className="home-intro__spectrum" aria-hidden="true" />
      </section>
    </main>
  )
}

export default HomePage
