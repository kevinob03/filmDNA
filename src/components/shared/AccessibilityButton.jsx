import { useAccessibility } from '../../context/AccessibilityContext.jsx'

function AccessibilityIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4" r="2" /><path d="M5 8h14M12 6v6M8 21l4-9 4 9M7 14l5-2 5 2" /></svg>
}

function AccessibilityButton({ mobile = false }) {
  const { isPanelOpen, openPanel } = useAccessibility()
  return (
    <button
      className={mobile ? 'mobile-nav__item accessibility-trigger accessibility-trigger--mobile' : 'accessibility-trigger'}
      data-tour="accessibility"
      type="button"
      aria-expanded={isPanelOpen}
      aria-controls="accessibility-panel"
      aria-label={isPanelOpen ? 'Cerrar preferencias de accesibilidad' : 'Abrir preferencias de accesibilidad'}
      onClick={(event) => openPanel(event.currentTarget)}
    >
      <AccessibilityIcon />
      <span>{mobile ? 'Acceso' : 'Accesibilidad'}</span>
    </button>
  )
}

export default AccessibilityButton
