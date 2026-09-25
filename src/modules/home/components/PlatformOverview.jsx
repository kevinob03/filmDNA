import PageContainer from '../../../shared/components/PageContainer.jsx'
import SectionHeader from '../../../shared/components/SectionHeader.jsx'

const areas = [
  { number: '01', title: 'Explora por experiencia', text: 'Busca más allá de categorías tradicionales.' },
  { number: '02', title: 'Descubre conexiones', text: 'Compara atmósfera, ritmo y complejidad.' },
  { number: '03', title: 'Construye tu recorrido', text: 'Organiza tu actividad cinematográfica más adelante.' },
]

function PlatformOverview() {
  return (
    <section className="home-section home-section--last" aria-labelledby="overview-title">
      <PageContainer>
        <SectionHeader
          eyebrow="Descubrimiento alternativo"
          title="El cine desde lo que te hace sentir"
          description="FilmDNA reunirá exploración, análisis y organización personal en una experiencia coherente."
        />
        <div className="overview-grid">
          {areas.map((area) => (
            <article className="overview-card" key={area.number}>
              <span>{area.number}</span>
              <h3>{area.title}</h3>
              <p>{area.text}</p>
              <small>Disponible en una fase posterior</small>
            </article>
          ))}
        </div>
      </PageContainer>
    </section>
  )
}

export default PlatformOverview
