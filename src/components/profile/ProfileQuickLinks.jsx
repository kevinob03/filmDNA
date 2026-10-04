import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/diario', eyebrow: 'Registrar', title: 'Diario', description: 'Revisa las películas que viste y tus impresiones.' },
  { to: '/biblioteca', eyebrow: 'Guardar', title: 'Biblioteca', description: 'Encuentra favoritos, pendientes y listas personales.' },
  { to: '/estadisticas', eyebrow: 'Descubrir', title: 'Estadísticas', description: 'Observa cómo evoluciona tu recorrido cinematográfico.' },
]

function ProfileQuickLinks() {
  return (
    <section className="profile-quick" aria-labelledby="profile-quick-title">
      <header className="profile-section-heading"><p className="eyebrow"><span aria-hidden="true" />Sigue explorando</p><h2 id="profile-quick-title">Accesos rápidos</h2></header>
      <div className="profile-quick__grid">{LINKS.map((link, index) => <Link className="profile-quick__card" to={link.to} key={link.to}><span>0{index + 1} · {link.eyebrow}</span><strong>{link.title}</strong><p>{link.description}</p><i aria-hidden="true">→</i></Link>)}</div>
    </section>
  )
}

export default ProfileQuickLinks
