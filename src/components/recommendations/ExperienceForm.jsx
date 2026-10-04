import {
  ATTENTION_OPTIONS,
  COMPANY_OPTIONS,
  DURATION_OPTIONS,
  ERA_OPTIONS,
  GENRE_OPTIONS,
  LANGUAGE_OPTIONS,
  MOOD_OPTIONS,
  PACE_OPTIONS,
  POPULARITY_OPTIONS,
  REGION_OPTIONS,
} from '../../config/recommendationConfig.js'
import FilterIcon from './FilterIcon.jsx'

const selected = (selections, group, value) => Array.isArray(selections[group])
  ? selections[group].includes(String(value))
  : selections[group] === value

function Chips({ group, options, selections, onChange, multiple = false, icons = false }) {
  return <div className="filter-chips">
    {options.map((option) => <button
      className="filter-chip"
      type="button"
      aria-pressed={selected(selections, group, option.value)}
      key={option.value}
      onClick={() => onChange(group, String(option.value), multiple)}
    >
      {icons && <FilterIcon name={option.icon} size={18} />}
      {option.label}
    </button>)}
  </div>
}

function ExperienceForm({ selections, providers, mode, onModeChange, onChange, onSubmit, onClear, panel = false, onClose }) {
  return <form className={`recommendation-filters${panel ? ' recommendation-filters--panel' : ''}`} onSubmit={onSubmit}>
    <header className="recommendation-filters__header">
      <div className="recommendation-filters__title">
        {panel && <FilterIcon name="tune" />}
        <div>
          <h2>{panel ? 'Ajustar filtros de búsqueda' : 'Cuéntanos qué te apetece'}</h2>
          {!panel && <p>Puedes elegir sólo lo que te importe. Ningún filtro es obligatorio.</p>}
        </div>
      </div>
      <div className="recommendation-filters__header-actions">
        <div className="mode-switch" aria-label="Nivel de filtros">
          <button type="button" aria-pressed={mode === 'simple'} onClick={() => onModeChange('simple')}>Sencillo</button>
          <button type="button" aria-pressed={mode === 'expert'} onClick={() => onModeChange('expert')}>Experto</button>
        </div>
        {panel && <button type="button" className="recommendation-filters__close" onClick={onClose} aria-label="Cerrar filtros"><FilterIcon name="close" /></button>}
      </div>
    </header>

    <div className="recommendation-filters__scroll">
      <fieldset className="filter-group filter-group--wide">
        <legend><span>1</span> ¿Qué género te apetece?</legend>
        <Chips group="genres" options={GENRE_OPTIONS} selections={selections} onChange={onChange} multiple />
      </fieldset>

      <fieldset className="filter-group filter-group--wide">
        <legend><span>2</span> ¿Cómo quieres sentirte?</legend>
        <Chips group="mood" options={MOOD_OPTIONS} selections={selections} onChange={onChange} icons />
        <small className="filter-group__note">Esta preferencia sólo afina resultados cuando existen señales compatibles verificables.</small>
      </fieldset>

      <fieldset className="filter-group filter-group--wide">
        <legend><span>3</span> ¿Qué ritmo prefieres?</legend>
        <div className="pace-options">{PACE_OPTIONS.map((option) => <button type="button" aria-pressed={selected(selections, 'pace', option.value)} key={option.value} onClick={() => onChange('pace', option.value)}>
          <strong>{option.label}</strong><span>{option.description}</span>
        </button>)}</div>
      </fieldset>

      <fieldset className="filter-group">
        <legend><span>4</span> Nivel de atención</legend>
        <Chips group="attention" options={ATTENTION_OPTIONS} selections={selections} onChange={onChange} />
      </fieldset>

      <fieldset className="filter-group">
        <legend><span>5</span> Duración</legend>
        <Chips group="duration" options={DURATION_OPTIONS} selections={selections} onChange={onChange} />
      </fieldset>

      <fieldset className="filter-group">
        <legend><span>6</span> ¿Con quién la ves?</legend>
        <Chips group="company" options={COMPANY_OPTIONS} selections={selections} onChange={onChange} />
      </fieldset>

      {mode === 'expert' && <section className="expert-filters" aria-labelledby="expert-title">
        <div className="expert-filters__intro">
          <p className="eyebrow" id="expert-title">Afinar resultados</p>
          <p>Estos controles usan metadatos reales de TMDB.</p>
        </div>
        <fieldset className="filter-group"><legend>Época / año</legend><Chips group="era" options={ERA_OPTIONS} selections={selections} onChange={onChange} /></fieldset>
        <fieldset className="filter-group filter-group--range"><legend>Puntuación mínima de TMDB</legend><div><input type="range" min="0" max="9" step="0.5" value={selections.minRating} onChange={(event) => onChange('minRating', Number(event.target.value))} /><output>{Number(selections.minRating) ? `${Number(selections.minRating).toFixed(1)}+` : 'Cualquiera'}</output></div></fieldset>
        <label className="filter-select">Idioma original<select value={selections.language} onChange={(event) => onChange('language', event.target.value)}>{LANGUAGE_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
        <label className="filter-select">País / región de origen<select value={selections.region} onChange={(event) => onChange('region', event.target.value)}>{REGION_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
        <fieldset className="filter-group filter-group--wide"><legend>Plataforma de streaming</legend>{providers.length ? <Chips group="providers" options={providers.map((provider) => ({ value: String(provider.provider_id), label: provider.provider_name }))} selections={selections} onChange={onChange} multiple /> : <p className="filter-group__note">Las plataformas se cargarán desde TMDB cuando el servicio esté disponible.</p>}</fieldset>
        <fieldset className="filter-group filter-group--wide"><legend>Popularidad</legend><Chips group="popularity" options={POPULARITY_OPTIONS} selections={selections} onChange={onChange} /></fieldset>
        <fieldset className="filter-group filter-group--pending" disabled><legend>Tipo de producción</legend><div className="filter-chips"><button type="button">Gran producción</button><button type="button">Independiente</button><button type="button">Cine de autor</button></div><small>Requiere una fuente de clasificación adicional.</small></fieldset>
        <fieldset className="filter-group filter-group--pending" disabled><legend>Características de la historia</legend><div className="filter-chips"><button type="button">Final sorprendente</button><button type="button">Basada en hechos reales</button><button type="button">Personajes complejos</button></div><small>Requiere keywords verificadas o análisis editorial.</small></fieldset>
      </section>}
    </div>

    <footer className="recommendation-filters__footer">
      <button type="button" className="recommendation-filters__clear" onClick={onClear}>Limpiar</button>
      {panel && <button type="button" className="button button--secondary" onClick={onClose}>Cerrar</button>}
      <button type="submit" className="button button--primary">{panel ? 'Aplicar cambios' : 'Encontrar películas'}</button>
    </footer>
  </form>
}

export default ExperienceForm
