import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AUTH_STATUS, useAuth } from '../../../context/AuthContext.jsx'
import '../../library/library.css'
import {
  addFavorite,
  addMovieToCustomList,
  addToWatchlist,
  getLibraryErrorMessage,
  getMovieLibraryActions,
  removeFavorite,
  removeFromWatchlist,
} from '../../../services/libraryService.js'

function MovieLibraryActions({ movie }) {
  const { status, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'idle', favorite: false, watchlist: false, customLists: [], error: '' })
  const [selectedListId, setSelectedListId] = useState('')
  const [busyAction, setBusyAction] = useState('')
  const [message, setMessage] = useState('')

  const loadActions = useCallback(async () => {
    if (status !== AUTH_STATUS.AUTHENTICATED) {
      setState({ status: 'idle', favorite: false, watchlist: false, customLists: [], error: '' })
      return
    }
    setState((current) => ({ ...current, status: 'loading', error: '' }))
    try {
      const actions = await getMovieLibraryActions(user.id, movie.id)
      setState({ status: 'success', ...actions, error: '' })
      setSelectedListId((current) => current || String(actions.customLists[0]?.id ?? ''))
    } catch (error) {
      setState((current) => ({ ...current, status: 'error', error: getLibraryErrorMessage(error) }))
    }
  }, [movie.id, status, user?.id])

  useEffect(() => { loadActions() }, [loadActions])

  const requireSession = () => {
    if (status === AUTH_STATUS.AUTHENTICATED) return true
    navigate('/login', { state: { from: location } })
    return false
  }

  const runAction = async (name, operation, successMessage, updates = {}) => {
    if (!requireSession() || busyAction) return
    setBusyAction(name)
    setMessage('')
    try {
      await operation()
      setState((current) => ({ ...current, ...updates, status: 'success', error: '' }))
      setMessage(successMessage)
    } catch (error) {
      setMessage(getLibraryErrorMessage(error))
    } finally {
      setBusyAction('')
    }
  }

  const toggleFavorite = () => runAction(
    'favorite',
    () => state.favorite ? removeFavorite(user.id, movie.id) : addFavorite(user.id, movie.id),
    state.favorite ? 'Película eliminada de Favoritos.' : 'Película agregada a Favoritos.',
    { favorite: !state.favorite },
  )

  const toggleWatchlist = () => runAction(
    'watchlist',
    () => state.watchlist ? removeFromWatchlist(user.id, movie.id) : addToWatchlist(user.id, movie.id),
    state.watchlist ? 'Película eliminada de Pendientes.' : 'Película agregada a Pendientes.',
    { watchlist: !state.watchlist },
  )

  const addToList = (event) => {
    event.preventDefault()
    if (!selectedListId) return
    runAction(
      'custom-list',
      () => addMovieToCustomList(user.id, selectedListId, movie.id),
      'Película agregada a la lista seleccionada.',
    )
  }

  const loading = status === AUTH_STATUS.CHECKING || state.status === 'loading'

  return (
    <section className="movie-library-actions" aria-labelledby="movie-library-title" aria-busy={loading}>
      <div className="movie-library-actions__heading">
        <div><p className="eyebrow"><span aria-hidden="true" />Tu biblioteca</p><h2 id="movie-library-title">Guarda esta película</h2></div>
        {status === AUTH_STATUS.AUTHENTICATED ? <Link to="/biblioteca">Abrir Mi biblioteca</Link> : null}
      </div>

      {state.status === 'error' ? (
        <div className="movie-library-actions__error" role="alert"><p>{state.error}</p><button type="button" className="button button--secondary" onClick={loadActions}>Reintentar</button></div>
      ) : (
        <>
          <div className="movie-library-actions__buttons">
            <button
              type="button"
              className={`library-toggle ${state.favorite ? 'library-toggle--active' : ''}`}
              aria-pressed={state.favorite}
              disabled={loading || Boolean(busyAction)}
              onClick={toggleFavorite}
            >
              <span aria-hidden="true">{state.favorite ? '♥' : '♡'}</span>
              {state.favorite ? 'En Favoritos' : 'Agregar a Favoritos'}
            </button>
            <button
              type="button"
              className={`library-toggle ${state.watchlist ? 'library-toggle--active' : ''}`}
              aria-pressed={state.watchlist}
              disabled={loading || Boolean(busyAction)}
              onClick={toggleWatchlist}
            >
              <span aria-hidden="true">{state.watchlist ? '✓' : '+'}</span>
              {state.watchlist ? 'En Pendientes' : 'Ver después'}
            </button>
          </div>

          {status === AUTH_STATUS.AUTHENTICATED ? (
            state.customLists.length ? (
              <form className="movie-library-actions__list" onSubmit={addToList}>
                <label htmlFor="movie-custom-list">Lista personalizada</label>
                <div>
                  <select id="movie-custom-list" name="customList" value={selectedListId} onChange={(event) => setSelectedListId(event.target.value)}>
                    {state.customLists.map((list) => <option value={list.id} key={list.id}>{list.nombre}</option>)}
                  </select>
                  <button className="button button--secondary" type="submit" disabled={!selectedListId || Boolean(busyAction)}>Agregar a lista</button>
                </div>
              </form>
            ) : (
              <p className="movie-library-actions__hint">Aún no tienes listas personalizadas. <Link to="/biblioteca?seccion=listas">Crea la primera</Link>.</p>
            )
          ) : (
            <p className="movie-library-actions__hint">Inicia sesión para guardar películas en tu biblioteca.</p>
          )}
        </>
      )}
      <p className="movie-library-actions__message" role="status" aria-live="polite">{busyAction ? 'Guardando cambios…' : message}</p>
    </section>
  )
}

export default MovieLibraryActions