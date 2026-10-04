import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  createCustomList,
  deleteCustomList,
  getLibraryErrorMessage,
  listCustomLists,
  listFavorites,
  listMoviesInCustomList,
  listWatchlist,
  removeFavorite,
  removeFromWatchlist,
  removeMovieFromCustomList,
  renameCustomList,
} from '../../services/libraryService.js'
import { hydrateLibraryMovies } from '../../services/libraryMovieService.js'
import ContentState from '../../components/shared/ContentState.jsx'
import PageContainer from '../../components/shared/PageContainer.jsx'
import DeleteListDialog from '../../components/library/DeleteListDialog.jsx'
import LibraryListManager from '../../components/library/LibraryListManager.jsx'
import LibraryMovieGrid from '../../components/library/LibraryMovieGrid.jsx'
import '../../styles/pages/library.css'

const VALID_SECTIONS = new Set(['favoritos', 'pendientes', 'listas'])

function LibrarySkeleton() {
  return <div className="library-skeleton" aria-busy="true" aria-label="Cargando Mi biblioteca"><span /><span /><span /></div>
}

function LibraryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sectionParam = searchParams.get('seccion')
  const section = VALID_SECTIONS.has(sectionParam) ? sectionParam : 'favoritos'
  const selectedListId = searchParams.get('lista') || ''
  const [state, setState] = useState({ status: 'loading', favorites: [], watchlist: [], lists: [], movies: [], error: '' })
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [deletingList, setDeletingList] = useState(null)
  const deleteTriggerRef = useRef(null)

  const loadLibrary = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }))
    try {
      const [favorites, watchlist, customLists] = await Promise.all([
        listFavorites(user.id), listWatchlist(user.id), listCustomLists(user.id),
      ])
      const listResults = await Promise.all(customLists.map((list) => listMoviesInCustomList(user.id, list.id)))
      const lists = listResults.map(({ list, relations }) => ({ ...list, relations, movieCount: relations.length }))
      const records = [...favorites, ...watchlist, ...lists.flatMap((list) => list.relations)]
      const movies = await hydrateLibraryMovies(records)
      setState({ status: 'success', favorites, watchlist, lists, movies, error: '' })
    } catch (error) {
      setState((current) => ({ ...current, status: 'error', error: getLibraryErrorMessage(error) }))
    }
  }, [user.id])

  useEffect(() => { loadLibrary() }, [loadLibrary])

  const movieById = useMemo(() => new Map(state.movies.map((entry) => [Number(entry.tmdbId), entry])), [state.movies])
  const entriesFor = (records) => records.map((record) => movieById.get(Number(record.tmdbId)) ?? { tmdbId: Number(record.tmdbId), movie: null, error: null })
  const selectedList = state.lists.find((list) => String(list.id) === String(selectedListId))

  const runMutation = async (key, operation, successText) => {
    if (busy) return false
    setBusy(key)
    setMessage({ type: '', text: '' })
    try {
      await operation()
      setMessage({ type: 'success', text: successText })
      await loadLibrary()
      return true
    } catch (error) {
      setMessage({ type: 'error', text: getLibraryErrorMessage(error) })
      return false
    } finally {
      setBusy('')
    }
  }

  const removeFromSection = (kind, tmdbId) => runMutation(
    `${kind}:${tmdbId}`,
    () => kind === 'favorite'
      ? removeFavorite(user.id, tmdbId)
      : kind === 'watchlist'
        ? removeFromWatchlist(user.id, tmdbId)
        : removeMovieFromCustomList(user.id, selectedList.id, tmdbId),
    'Película eliminada de la sección.',
  )

  const createList = (name) => runMutation('create-list', () => createCustomList(user.id, name), 'Lista creada correctamente.')
  const renameList = (listId, name) => runMutation(`rename:${listId}`, () => renameCustomList(user.id, listId, name), 'Nombre actualizado.')
  const requestDelete = (list, trigger) => {
    deleteTriggerRef.current = trigger
    setDeletingList(list)
  }
  const cancelDelete = () => {
    setDeletingList(null)
    window.requestAnimationFrame(() => deleteTriggerRef.current?.focus())
  }

  const confirmDelete = () => runMutation(
    `delete:${deletingList.id}`,
    () => deleteCustomList(user.id, deletingList.id),
    'Lista eliminada correctamente.',
  ).then((success) => {
    if (!success) return
    setDeletingList(null)
    if (String(selectedListId) === String(deletingList.id)) navigate('/biblioteca?seccion=listas', { replace: true })
    window.requestAnimationFrame(() => document.getElementById('new-list-name')?.focus())
  })

  return (
    <main id="main-content" className="library-page">
      <PageContainer>
        <header className="library-page__header" data-tour="personal-space">
          <div><p className="eyebrow"><span aria-hidden="true" />Espacio personal</p><h1>Mi biblioteca</h1><p>Organiza lo que amas, lo que quieres ver y tus colecciones personales.</p></div>
          <Link className="button button--primary" to="/explorar">Explorar películas</Link>
        </header>

        <nav className="library-tabs" aria-label="Secciones de Mi biblioteca">
          <Link aria-current={section === 'favoritos' ? 'page' : undefined} to="/biblioteca?seccion=favoritos">Favoritos</Link>
          <Link aria-current={section === 'pendientes' ? 'page' : undefined} to="/biblioteca?seccion=pendientes">Pendientes</Link>
          <Link aria-current={section === 'listas' ? 'page' : undefined} to="/biblioteca?seccion=listas">Mis listas</Link>
        </nav>

        {message.text ? <p className={`library-message library-message--${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p> : null}

        {state.status === 'loading' ? <LibrarySkeleton /> : null}
        {state.status === 'error' ? <ContentState title="No pudimos cargar tu biblioteca" message={state.error} actionLabel="Reintentar" onAction={loadLibrary} /> : null}

        {state.status === 'success' && section === 'favoritos' ? (
          <section aria-labelledby="favorites-title"><div className="library-section-heading"><div><h2 id="favorites-title">Favoritos</h2><p>Películas que marcaste como favoritas.</p></div><span>{state.favorites.length}</span></div>
            <LibraryMovieGrid entries={entriesFor(state.favorites)} emptyTitle="Todavía no tienes favoritos" emptyMessage="Abre una película y usa Agregar a Favoritos." removingId={busy.split(':')[1]} onRemove={(id) => removeFromSection('favorite', id)} />
          </section>
        ) : null}

        {state.status === 'success' && section === 'pendientes' ? (
          <section aria-labelledby="watchlist-title"><div className="library-section-heading"><div><h2 id="watchlist-title">Pendientes</h2><p>Películas que quieres ver después.</p></div><span>{state.watchlist.length}</span></div>
            <LibraryMovieGrid entries={entriesFor(state.watchlist)} emptyTitle="No tienes películas pendientes" emptyMessage="Abre una película y usa Ver después." removingId={busy.split(':')[1]} onRemove={(id) => removeFromSection('watchlist', id)} />
          </section>
        ) : null}

        {state.status === 'success' && section === 'listas' ? (
          <>
            <LibraryListManager busy={Boolean(busy)} lists={state.lists} selectedListId={selectedListId} onCreate={createList} onDelete={requestDelete} onRename={renameList} />
            {selectedListId ? (
              selectedList ? <section className="library-selected-list" aria-labelledby="selected-list-title"><div className="library-section-heading"><div><p className="eyebrow"><span aria-hidden="true" />Lista abierta</p><h2 id="selected-list-title">{selectedList.nombre}</h2></div><span>{selectedList.movieCount}</span></div>
                <LibraryMovieGrid entries={entriesFor(selectedList.relations)} emptyTitle="Esta lista está vacía" emptyMessage="Agrega películas desde su página de detalle." removingId={busy.split(':')[1]} onRemove={(id) => removeFromSection('custom', id)} />
              </section> : <ContentState title="Lista no encontrada" message="La lista solicitada no existe o no pertenece a tu cuenta." />
            ) : null}
          </>
        ) : null}
      </PageContainer>
      {deletingList ? <DeleteListDialog list={deletingList} busy={busy.startsWith('delete:')} onCancel={cancelDelete} onConfirm={confirmDelete} /> : null}
    </main>
  )
}

export default LibraryPage
