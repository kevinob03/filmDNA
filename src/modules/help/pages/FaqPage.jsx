import PageContainer from '../../../shared/components/PageContainer.jsx'
import FaqList from '../components/FaqList.jsx'
import { FAQ_ITEMS } from '../faqContent.js'
import '../help.css'

function FaqPage() {
  return <main id="main-content" className="help-page">
    <PageContainer>
      <header className="help-page__header">
        <p className="eyebrow"><span aria-hidden="true" /> Ayuda</p>
        <h1 id="faq-page-title">Preguntas frecuentes</h1>
        <p>Respuestas rápidas para entender las funciones principales de FilmDNA.</p>
      </header>
      <FaqList items={FAQ_ITEMS} labelledBy="faq-page-title" />
    </PageContainer>
  </main>
}

export default FaqPage
