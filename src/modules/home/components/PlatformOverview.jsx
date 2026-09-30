import PageContainer from '../../../shared/components/PageContainer.jsx'
import SectionHeader from '../../../shared/components/SectionHeader.jsx'
import { Link } from 'react-router-dom'

const areas = [
  { number: '01', title: 'Explora el catálogo', text: 'Busca y descubre películas con información real de TMDB.', label: 'Ir a Explorar', to: '/explorar' },
  { number: '02', title: 'Encuentra algo para ti', text: 'Combina tus preferencias y comprende por qué encaja cada resultado.', label: 'Ver Recomendaciones', to: '/recomendaciones' },
  { number: '03', title: 'Construye tu recorrido', text: 'Guarda películas y registra lo que has visto en tu espacio personal.', label: 'Abrir Biblioteca', to: '/biblioteca' },
]

function PlatformOverview() {
  return (
    <section className="home-section home-section--last" aria-labelledby="overview-title">
      <PageContainer>
        <SectionHeader
          eyebrow="Descubrimiento alternativo"
          title="El cine desde lo que te hace sentir"
          description="FilmDNA conecta exploración, análisis y organización personal en una experiencia coherente."
        />
        <div className="overview-grid">
          {areas.map((area) => (
            <article className="overview-card" key={area.number}>
              <span>{area.number}</span>
              <h3>{area.title}</h3>
              <p>{area.text}</p>
              <Link to={area.to}>{area.label} <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
      </PageContainer>
    </section>
  )
}

export default PlatformOverview
