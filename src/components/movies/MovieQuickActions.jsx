import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AUTH_STATUS, useAuth } from '../../context/AuthContext.jsx'
import {
  addFavorite,
  addToWatchlist,
  getLibraryErrorMessage,
  getMovieLibraryActions,
  removeFavorite,
  removeFromWatchlist,
} from '../../services/libraryService.js'

const ActionIcon = ({ type, active }) => <svg viewBox="0 0 24 24" aria-hidden="true">
  {type === 'favorite'
    ? <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" fill={active ? 'currentColor' : 'none'} />
    : <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z" fill={active ? 'currentColor' : 'none'} />}
</svg>

function MovieQuickActions({ movie, favorite = false, watchlist = true, className = '' }) {
  const { status, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [state, setState] = useState({ favorite: false, watchlist: false, loading: false })
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const title = movie.title || movie.original_title || 'esta película'

  const load = useCallback(async () => {
    if (status !== AUTH_STATUS.AUTHENTICATED) return
    setState((current) => ({ ...current, loading: true }))
    try {
      const actions = await getMovieLibraryActions(user.id, movie.id)
      setState({ favorite: actions.favorite, watchlist: actions.watchlist, loading: false })
    } catch {
      setState((current) => ({ ...current, loading: false }))
    }
  }, [movie.id, status, user?.id])

  useEffect(() => { load() }, [load])

  const toggle = async (kind) => {
    if (status !== AUTH_STATUS.AUTHENTICATED) {
      navigate('/login', { state: { from: location } })
      return
    }
    if (busy) return
    const active = state[kind]
    const operation = kind === 'favorite'
      ? (active ? removeFavorite : addFavorite)
      : (active ? removeFromWatchlist : addToWatchlist)
    setBusy(kind)
    setMessage('')
    try {
      await operation(user.id, movie.id)
      setState((current) => ({ ...current, [kind]: !active }))
      setMessage(active ? `${title} se eliminó correctamente.` : `${title} se guardó correctamente.`)
    } catch (error) {
      setMessage(getLibraryErrorMessage(error))
    } finally {
      setBusy('')
    }
  }

  const button = (kind, label) => {
    const active = state[kind]
    const action = active ? `Quitar ${title} de ${label}` : `Agregar ${title} a ${label}`
    return <button
      type="button"
      className={`movie-quick-action${active ? ' movie-quick-action--active' : ''}`}
      aria-label={action}
      aria-pressed={active}
      title={action}
      disabled={state.loading || Boolean(busy)}
      onClick={() => toggle(kind)}
    ><ActionIcon type={kind} active={active} /></button>
  }

  return <div className={`movie-quick-actions ${className}`.trim()}>
    {favorite && button('favorite', 'Favoritos')}
    {watchlist && button('watchlist', 'Pendientes')}
    <span className="visually-hidden" role="status" aria-live="polite">{message}</span>
  </div>
}

export default MovieQuickActions
