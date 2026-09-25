import PageContainer from '../../../shared/components/PageContainer.jsx'
import SectionHeader from '../../../shared/components/SectionHeader.jsx'

const dimensions = ['Misterio', 'Oscuridad', 'Complejidad', 'Tensión', 'Surrealismo', 'Ritmo']

function MovieDNAPreview() {
  return (
    <section className="home-section" aria-labelledby="dna-title">
      <PageContainer className="dna-section">
        <div className="dna-section__copy">
          <SectionHeader
            eyebrow="Movie DNA"
            title="Otra forma de leer una película"
            description="Movie DNA organiza seis dimensiones de la experiencia para ayudarte a comparar y descubrir cine desde nuevas perspectivas."
          />
          <p className="dna-section__note">
            Perfil estimado por FilmDNA a partir de metadatos cinematográficos. No representa una medición científica.
          </p>
          <ul className="dimension-list" aria-label="Dimensiones de Movie DNA">
            {dimensions.map((dimension, index) => (
              <li key={dimension}><span>{String(index + 1).padStart(2, '0')}</span>{dimension}</li>
            ))}
          </ul>
        </div>

        <div className="dna-visual" role="img" aria-label="Diagrama conceptual sin valores de las seis dimensiones de Movie DNA">
          <svg viewBox="0 0 360 360" aria-hidden="true">
            <defs>
              <linearGradient id="dna-preview-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--color-primary)" />
                <stop offset="1" stopColor="var(--color-violet)" />
              </linearGradient>
            </defs>
            <g className="dna-visual__grid">
              <polygon points="180,42 300,111 300,249 180,318 60,249 60,111" />
              <polygon points="180,82 265,131 265,229 180,278 95,229 95,131" />
              <polygon points="180,122 230,151 230,209 180,238 130,209 130,151" />
              <path d="M180 42v276M60 111l240 138M300 111 60 249" />
            </g>
            <polygon className="dna-visual__neutral" points="180,82 265,131 265,229 180,278 95,229 95,131" />
            <g className="dna-visual__nodes">
              <circle cx="180" cy="82" r="4" /><circle cx="265" cy="131" r="4" />
              <circle cx="265" cy="229" r="4" /><circle cx="180" cy="278" r="4" />
              <circle cx="95" cy="229" r="4" /><circle cx="95" cy="131" r="4" />
            </g>
          </svg>
          <span className="dna-visual__label">Vista conceptual · sin datos</span>
        </div>
      </PageContainer>
    </section>
  )
}

export default MovieDNAPreview
