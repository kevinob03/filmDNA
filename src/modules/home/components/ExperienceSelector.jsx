import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageContainer from '../../../shared/components/PageContainer.jsx'
import SectionHeader from '../../../shared/components/SectionHeader.jsx'
import { EXPERIENCE_CRITERIA as criteria } from '../../recommendations/recommendationConfig.js'

function ExperienceSelector() {
  const navigate = useNavigate()
  const [selections, setSelections] = useState({})

  const selectOption = (criterionId, option) => {
    setSelections((current) => ({ ...current, [criterionId]: option }))
  }

  const findMovies = () => navigate(`/recomendaciones?${new URLSearchParams(selections)}`)

  return (
    <section id="experiencia" className="home-section home-section--experience" aria-labelledby="experience-title">
      <PageContainer>
        <SectionHeader
          eyebrow="Tu experiencia"
          title="¿Qué quieres sentir hoy?"
          description="Selecciona parámetros para definir la experiencia cinematográfica que buscas. En esta fase, las selecciones son una demostración visual."
        />

        <div className="experience-panel">
          <div className="experience-panel__grid">
            {criteria.map((criterion) => (
              <fieldset className="criterion" key={criterion.id}>
                <legend>{criterion.label}</legend>
                <div className="criterion__options">
                  {criterion.options.map((option) => {
                    const selected = selections[criterion.id] === option
                    return (
                      <button
                        className="chip"
                        type="button"
                        aria-pressed={selected}
                        key={option}
                        onClick={() => selectOption(criterion.id, option)}
                      >
                        <span className="chip__indicator" aria-hidden="true" />
                        {option}
                        {selected && <span className="visually-hidden">, seleccionado</span>}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <div className="experience-panel__footer">
            <p><span aria-hidden="true">◇</span> Tus preferencias se usarán para descubrir películas en una fase posterior.</p>
            <button className="button button--primary" type="button" onClick={findMovies} disabled={!Object.keys(selections).length}>
              Ver recomendaciones
            </button>
          </div>
        </div>
      </PageContainer>
    </section>
  )
}

export default ExperienceSelector
