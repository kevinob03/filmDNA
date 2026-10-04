import { useState } from 'react'
import { Link } from 'react-router-dom'

function LibraryListManager({ busy, lists, selectedListId, onCreate, onDelete, onRename }) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const create = async (event) => {
    event.preventDefault()
    if (await onCreate(newName)) setNewName('')
  }
  const rename = async (event, list) => {
    event.preventDefault()
    if (await onRename(list.id, editingName)) setEditingId(null)
  }

  return (
    <div className="library-lists-layout">
      <section className="library-panel" aria-labelledby="create-list-title">
        <p className="eyebrow"><span aria-hidden="true" />Organiza</p><h2 id="create-list-title">Nueva lista</h2>
        <form className="library-list-form" onSubmit={create}>
          <label htmlFor="new-list-name">Nombre de la lista</label>
          <input id="new-list-name" name="listName" autoComplete="off" maxLength="60" placeholder="Ej.: Cine para el fin de semana…" value={newName} onChange={(event) => setNewName(event.target.value)} />
          <button className="button button--primary" type="submit" disabled={busy || !newName.trim()}>{busy ? 'Guardando…' : 'Crear lista'}</button>
        </form>
      </section>

      <section className="library-panel" aria-labelledby="my-lists-title">
        <h2 id="my-lists-title">Mis listas</h2>
        {!lists.length ? (
          <div className="library-empty library-empty--compact" role="status"><span aria-hidden="true">◇</span><h3>Sin listas personalizadas</h3><p>Crea tu primera lista para organizar películas a tu manera.</p></div>
        ) : (
          <div className="library-list-cards">
            {lists.map((list) => (
              <article className={`library-list-card ${String(selectedListId) === String(list.id) ? 'library-list-card--selected' : ''}`} key={list.id}>
                {editingId === list.id ? (
                  <form onSubmit={(event) => rename(event, list)}>
                    <label htmlFor={`rename-list-${list.id}`}>Nuevo nombre</label>
                    <input id={`rename-list-${list.id}`} name="listName" autoComplete="off" maxLength="60" value={editingName} onChange={(event) => setEditingName(event.target.value)} />
                    <div><button className="button button--primary" type="submit" disabled={busy || !editingName.trim()}>Guardar nombre</button><button className="button button--secondary" type="button" onClick={() => setEditingId(null)}>Cancelar</button></div>
                  </form>
                ) : (
                  <>
                    <div><h3>{list.nombre}</h3><p>{list.movieCount} {list.movieCount === 1 ? 'película' : 'películas'}</p></div>
                    <div className="library-list-card__actions">
                      <Link className="button button--secondary" to={`/biblioteca?seccion=listas&lista=${encodeURIComponent(list.id)}`}>Abrir lista</Link>
                      <button type="button" onClick={() => { setEditingId(list.id); setEditingName(list.nombre) }}>Cambiar nombre</button>
                      <button className="library-danger" type="button" onClick={(event) => onDelete(list, event.currentTarget)}>Eliminar</button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default LibraryListManager