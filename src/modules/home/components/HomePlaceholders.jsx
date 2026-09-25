import PageContainer from '../../../shared/components/PageContainer.jsx'
import PlaceholderCard from '../../../shared/components/PlaceholderCard.jsx'
import SectionHeader from '../../../shared/components/SectionHeader.jsx'

function HomePlaceholders() {
  return (
    <>
      <section className="home-section" aria-labelledby="trending-title">
        <PageContainer>
          <SectionHeader
            eyebrow="Tendencias"
            title="Historias para descubrir"
            description="Este espacio mostrará películas en tendencia cuando FilmDNA se conecte con TMDB."
          />
          <div className="placeholder-grid" aria-live="polite">
            <PlaceholderCard />
            <PlaceholderCard />
            <PlaceholderCard />
          </div>
        </PageContainer>
      </section>

      <section className="home-section home-section--personal" aria-labelledby="personal-title">
        <PageContainer className="personal-panel">
          <div>
            <p className="eyebrow"><span aria-hidden="true" /> Personalización</p>
            <h2 id="personal-title">Una selección que evoluciona contigo</h2>
            <p>
              Las recomendaciones estarán disponibles cuando exista información suficiente sobre tus preferencias y actividad.
            </p>
          </div>
          <div className="personal-panel__status">
            <span aria-hidden="true">◎</span>
            <p>Sin recomendaciones todavía</p>
            <small>Estado informativo · no se han generado resultados</small>
          </div>
        </PageContainer>
      </section>
    </>
  )
}

export default HomePlaceholders
