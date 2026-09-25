import { EXPERIENCE_CRITERIA } from './recommendationConfig.js'

function ExperienceForm({ selections, onSelect, onSubmit }) {
  return <form className={'recommendation-tuner'} onSubmit={onSubmit}>
    <div className={'recommendation-tuner__grid'}>{EXPERIENCE_CRITERIA.map((criterion) => (
      <fieldset key={criterion.id}><legend>{criterion.label}</legend><div className={'criterion__options'}>
        {criterion.options.map((option) => <button type={'button'} aria-pressed={selections[criterion.id] === option} key={option} onClick={() => onSelect(criterion.id, option)}>{option}</button>)}
      </div></fieldset>
    ))}</div>
    <button className={'button button--primary'} disabled={!Object.keys(selections).length}>Generar recomendaciones</button>
  </form>
}
export default ExperienceForm
