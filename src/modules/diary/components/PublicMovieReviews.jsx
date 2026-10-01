import { useEffect, useState } from 'react'
import { getDiaryErrorMessage, listPublicMovieReviews } from '../../../services/diaryService.js'

const formatDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${value}T00:00:00`))
}

function PublicMovieReviews({ movieId, refreshKey = 0 }) {
  const [state, setState] = useState({ status: 'loading', reviews: [], error: null })

  useEffect(() => {
    let active = true
    setState({ status: 'loading', reviews: [], error: null })
    listPublicMovieReviews(movieId)
      .then((reviews) => { if (active) setState({ status: 'success', reviews, error: null }) })
      .catch((error) => { if (active) setState({ status: 'error', reviews: [], error }) })
    return () => { active = false }
  }, [movieId, refreshKey])

  return (
    <section className="public-reviews" aria-labelledby="public-reviews-title">
      <div className="public-reviews__heading">
        <div>
          <p className="eyebrow"><span aria-hidden="true" />Comunidad FilmDNA</p>
          <h2 id="public-reviews-title">Reseñas públicas</h2>
        </div>
        {state.status === 'success' && state.reviews.length > 0 ? <span>{state.reviews.length}</span> : null}
      </div>

      {state.status === 'loading' ? <p className="public-reviews__state" role="status">Cargando reseñas…</p> : null}
      {state.status === 'error' ? <p className="public-reviews__state public-reviews__state--error" role="alert">{getDiaryErrorMessage(state.error)}</p> : null}
      {state.status === 'success' && state.reviews.length === 0 ? <p className="public-reviews__state">Todavía no hay reseñas públicas para esta película.</p> : null}
      {state.status === 'success' && state.reviews.length > 0 ? (
        <div className="public-reviews__list">
          {state.reviews.map((review) => (
            <article className="public-review" key={review.id}>
              <div className="public-review__metadata">
                <strong>{review.calificacion}/10</strong>
                <span>Vista el {formatDate(review.fechaVista)}</span>
              </div>
              <p>{review.resena}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default PublicMovieReviews
