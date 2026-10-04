import { Link } from 'react-router-dom'
import PageContainer from '../../../shared/components/PageContainer.jsx'
import FaqList from '../../help/components/FaqList.jsx'
import { FAQ_ITEMS } from '../../help/faqContent.js'
import '../../help/help.css'

function HomeFaq() {
  return <section id="preguntas-frecuentes" className="home-section home-section--faq" data-tour="faq" aria-labelledby="home-faq-title">
    <PageContainer>
      <div className="home-faq__header">
        <div>
          <p className="eyebrow"><span aria-hidden="true" /> Ayuda</p>
          <h2 id="home-faq-title">Preguntas frecuentes</h2>
          <p>Lo esencial para comenzar a descubrir y organizar películas con FilmDNA.</p>
        </div>
        <Link className="button button--secondary" to="/ayuda">Ver todas las preguntas</Link>
      </div>
      <FaqList items={FAQ_ITEMS.slice(0, 4)} labelledBy="home-faq-title" />
    </PageContainer>
  </section>
}

export default HomeFaq
