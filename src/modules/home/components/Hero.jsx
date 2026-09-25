import PageContainer from '../../../shared/components/PageContainer.jsx'

const dnaRungs = Array.from({ length: 13 }, (_, index) => ({
  id: index,
  y: index * 21,
  angle: index * 34,
  delay: index * -0.12,
}))

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <PageContainer className="hero__layout">
        <div className="hero__content">
          <p className="eyebrow"><span aria-hidden="true" /> Descubrimiento cinematográfico</p>
          <h1 id="hero-title">
            Descubre el cine según la <em>experiencia</em> que quieres vivir
          </h1>
          <p className="hero__lead">Explora películas más allá de los géneros tradicionales.</p>
          <a className="button button--primary" href="#experiencia">
            Descubrir películas <span aria-hidden="true">↓</span>
          </a>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <div className="hero__frame">
            <div className="hero__dna-scene">
              <span className="hero__dna-aura" />
              <div className="hero__dna-helix">
                {dnaRungs.map((rung) => (
                  <span
                    className="hero__dna-rung"
                    key={rung.id}
                    style={{
                      '--rung-y': `${rung.y}px`,
                      '--rung-angle': `${rung.angle}deg`,
                      '--rung-delay': `${rung.delay}s`,
                    }}
                  >
                    <i />
                  </span>
                ))}
              </div>
              <span className="hero__dna-particle hero__dna-particle--one" />
              <span className="hero__dna-particle hero__dna-particle--two" />
              <span className="hero__dna-particle hero__dna-particle--three" />
            </div>
          </div>
          <p>EXPERIENCIA · CINE · FILMDNA</p>
        </div>
      </PageContainer>
    </section>
  )
}

export default Hero
