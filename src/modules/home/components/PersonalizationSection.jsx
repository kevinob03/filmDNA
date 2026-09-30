import PageContainer from '../../../shared/components/PageContainer.jsx'
import { Link } from 'react-router-dom'

function PersonalizationSection() {
  return (
    <section className="home-section home-section--personal" aria-labelledby="personal-title">
      <PageContainer className="personal-panel">
        <div>
          <p className="eyebrow"><span aria-hidden="true" /> Personalización</p>
          <h2 id="personal-title">Encuentra una película para hoy</h2>
          <p>
            Combina género, emociones, ritmo, duración y otros criterios para obtener una selección explicable y ajustable.
          </p>
        </div>
        <div className="personal-panel__status">
          <span aria-hidden="true">✦</span>
          <p>Recomendaciones disponibles</p>
          <small>Elige sólo los filtros que te importen</small>
          <Link className="button button--primary" to="/recomendaciones">Obtener recomendaciones</Link>
        </div>
      </PageContainer>
    </section>
  )
}

export default PersonalizationSection
