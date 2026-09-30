import PageContainer from '../../../shared/components/PageContainer.jsx'
import '../help.css'

const QUESTIONS = [
  ['¿Qué es FilmDNA?', 'Es una plataforma de descubrimiento cinematográfico que combina información de TMDB con filtros de experiencia, Movie DNA y recomendaciones personalizadas.'],
  ['¿Necesito una cuenta?', 'Puedes explorar películas sin iniciar sesión. Una cuenta es necesaria para guardar favoritos, pendientes, listas, entradas del diario y preferencias personales.'],
  ['¿Cómo funcionan las recomendaciones?', 'Puedes elegir género, cómo quieres sentirte, ritmo y otros filtros. FilmDNA compara esas preferencias con datos verificables y muestra qué aspectos pudo evaluar.'],
  ['¿Qué significa Movie DNA?', 'Es un perfil estimado de seis dimensiones cinematográficas: misterio, oscuridad, complejidad, tensión, surrealismo y ritmo. No es una medición científica.'],
  ['¿De dónde provienen los datos de las películas?', 'Los títulos, imágenes, puntuaciones y disponibilidad proceden principalmente de TMDB. La disponibilidad de streaming puede variar según la región.'],
  ['¿Qué datos guarda FilmDNA?', 'En esta versión académica se guardan localmente la sesión y, mediante JSON Server, los datos de perfil, biblioteca, diario y Movie DNA. No debes utilizar contraseñas reales.'],
  ['¿La búsqueda con IA siempre está disponible?', 'Depende de la configuración local de los proveedores. Si no está disponible, puedes seguir utilizando todos los filtros manuales.'],
]

function FaqPage() {
  return <main id="main-content" className="help-page">
    <PageContainer>
      <header className="help-page__header">
        <p className="eyebrow"><span aria-hidden="true" /> Ayuda</p>
        <h1>Preguntas frecuentes</h1>
        <p>Respuestas rápidas para entender las funciones principales de FilmDNA.</p>
      </header>
      <section className="faq-list" aria-label="Preguntas frecuentes">
        {QUESTIONS.map(([question, answer]) => <details key={question} className="faq-item">
          <summary>{question}<span aria-hidden="true">+</span></summary>
          <p>{answer}</p>
        </details>)}
      </section>
    </PageContainer>
  </main>
}

export default FaqPage
