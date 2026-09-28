import { useEffect, useRef, useState } from 'react'
import { useAccessibility } from '../../context/AccessibilityContext.jsx'
import './accessibility.css'

const TEXT_OPTIONS = [
  { value: '100', label: 'Normal', percentage: '100%' },
  { value: '110', label: 'Grande', percentage: '110%' },
  { value: '125', label: 'Muy grande', percentage: '125%' },
]
const CONTRAST_OPTIONS = [
  { value: 'normal', label: 'Normal', description: 'Estilo cinematográfico original' },
  { value: 'high', label: 'Alto contraste', description: 'Negro puro y bordes reforzados' },
]
const FOCUSABLE_SELECTOR = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

function SelectionMark() {
  return <span className="accessibility-option__mark" aria-hidden="true">✓</span>
}

function AccessibilityPanel() {
  const { closePanel, contrast, isPanelOpen, resetPreferences, setContrast, setTextSize, textSize } = useAccessibility()
  const panelRef = useRef(null)
  const closeButtonRef = useRef(null)
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    if (!isPanelOpen) return undefined
    closeButtonRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [isPanelOpen])

  if (!isPanelOpen) return null

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closePanel()
      return
    }
    if (event.key !== 'Tab') return
    const focusableElements = [...panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR)]
    const firstElement = focusableElements[0]
    const lastElement = focusableElements.at(-1)
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  const handleReset = () => {
    resetPreferences()
    setAnnouncement('Preferencias de accesibilidad restablecidas.')
  }

  return (
    <div className="accessibility-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closePanel() }}>
      <section
        id="accessibility-panel"
        ref={panelRef}
        className="accessibility-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="accessibility-title"
        aria-describedby="accessibility-description"
        onKeyDown={handleKeyDown}
      >
        <header className="accessibility-panel__header">
          <div>
            <p className="accessibility-panel__eyebrow">Preferencias visuales</p>
            <h2 id="accessibility-title">Accesibilidad</h2>
          </div>
          <button ref={closeButtonRef} className="accessibility-panel__close" type="button" aria-label="Cerrar preferencias de accesibilidad" onClick={closePanel}>
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <p id="accessibility-description" className="accessibility-panel__description">
          Ajusta la lectura de FilmDNA. Los cambios se aplican al instante.
        </p>

        <fieldset className="accessibility-fieldset">
          <legend>Contraste</legend>
          <div className="accessibility-options accessibility-options--contrast">
            {CONTRAST_OPTIONS.map((option) => (
              <label className="accessibility-option" key={option.value}>
                <input type="radio" name="accessibility-contrast" value={option.value} checked={contrast === option.value} onChange={() => setContrast(option.value)} />
                <span className="accessibility-option__content">
                  <strong>{option.label}</strong><small>{option.description}</small>
                  {contrast === option.value ? <SelectionMark /> : null}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="accessibility-fieldset">
          <legend>Tamaño del texto</legend>
          <div className="accessibility-options accessibility-options--text">
            {TEXT_OPTIONS.map((option) => (
              <label className="accessibility-option accessibility-option--text" key={option.value}>
                <input type="radio" name="accessibility-text-size" value={option.value} checked={textSize === option.value} onChange={() => setTextSize(option.value)} />
                <span className="accessibility-option__content">
                  <span className="accessibility-option__sample" aria-hidden="true">A</span><strong>{option.label}</strong><small>{option.percentage}</small>
                  {textSize === option.value ? <SelectionMark /> : null}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <button className="accessibility-reset" type="button" onClick={handleReset}>Restablecer accesibilidad</button>
        <p className="visually-hidden" role="status" aria-live="polite">{announcement}</p>
      </section>
    </div>
  )
}

export default AccessibilityPanel