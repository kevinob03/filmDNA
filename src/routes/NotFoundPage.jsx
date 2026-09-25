import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="status-page">
      <p className="status-page__code">404</p>
      <h1>Página no encontrada</h1>
      <p>La dirección solicitada no existe.</p>
      <Link className="text-link" to="/">
        Volver al inicio
      </Link>
    </main>
  )
}

export default NotFoundPage
