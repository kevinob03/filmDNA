import { useState } from 'react'
import PageContainer from '../../../shared/components/PageContainer.jsx'
import SectionHeader from '../../../shared/components/SectionHeader.jsx'

const criteria = [
  { id: 'mood', label: 'Estado de ánimo', options: ['Reflexivo', 'Inquieto', 'Eufórico', 'Melancólico'] },
  { id: 'atmosphere', label: 'Atmósfera', options: ['Íntima', 'Onírica', 'Oscura', 'Luminosa'] },
  { id: 'pace', label: 'Ritmo', options: ['Pausado', 'Equilibrado', 'Dinámico'] },
  { id: 'complexity', label: 'Complejidad', options: ['Accesible', 'Moderada', 'Laberíntica'] },
  { id: 'duration', label: 'Duración', options: ['Breve', 'Media', 'Extensa'] },
  { id: 'intensity', label: 'Intensidad', options: ['Suave', 'Intermedia', 'Profunda'] },
]

function ExperienceSelector() {
  const [selections, setSelections] = useState({})

  const selectOption = (criterionId, option) => {
    setSelections((current) => ({ ...current, [criterionId]: option }))
  }

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
            <button className="button button--disabled" type="button" disabled>
              Resultados disponibles al conectar TMDB
            </button>
          </div>
        </div>
      </PageContainer>
    </section>
  )
}

export default ExperienceSelector
