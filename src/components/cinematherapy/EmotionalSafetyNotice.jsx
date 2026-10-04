const OFFICIAL_GUIDANCE_URL = 'https://www.ministeriodesalud.go.cr/index.php/prensa/61-noticias-2024/1964-salud-hace-un-llamado-a-crear-conciencia-para-prevenir-el-comportamiento-suicida-en-el-pais'

function EmotionalSafetyNotice({ audience = 'user' }) {
  const professional = audience === 'psychologist'

  return (
    <aside className={'emotional-safety emotional-safety--' + audience} aria-labelledby={'emotional-safety-title-' + audience}>
      <div className="emotional-safety__heading">
        <span className="emotional-safety__indicator" aria-hidden="true">!</span>
        <div>
          <p className="eyebrow">{professional ? 'Revisión humana prioritaria' : 'Apoyo disponible'}</p>
          <h3 id={'emotional-safety-title-' + audience}>
            {professional ? 'Registro con intensidad alta' : 'No tienes que afrontar esto a solas'}
          </h3>
        </div>
      </div>

      {professional ? (
        <p>La intensidad informada requiere atención contextual del profesional. Por sí sola no constituye un diagnóstico ni confirma una emergencia.</p>
      ) : (
        <p>Una emoción muy intensa no significa por sí sola que estés en una emergencia. Considera hablar con una persona de confianza o con un profesional.</p>
      )}

      <div className="emotional-safety__resources">
        <p><strong>Si existe peligro inmediato:</strong> llama al <a href="tel:911">9-1-1</a>.</p>
        <p><strong>Si no es una emergencia:</strong> Línea Aquí Estoy, <a href="tel:+50622273774">2227-3774</a>.</p>
      </div>

      <a className="emotional-safety__source" href={OFFICIAL_GUIDANCE_URL} target="_blank" rel="noreferrer">
        Consultar orientación oficial del Ministerio de Salud
      </a>
    </aside>
  )
}

export default EmotionalSafetyNotice
