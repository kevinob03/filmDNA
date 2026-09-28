import { useEffect, useRef } from 'react'

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'

function DeleteListDialog({ busy, list, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const cancelRef = useRef(null)
  useEffect(() => {
    cancelRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && !busy) { event.preventDefault(); onCancel(); return }
    if (event.key !== 'Tab') return
    const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE)]
    const first = focusable[0]
    const last = focusable.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  return (
    <div className="library-dialog-backdrop">
      <section ref={dialogRef} className="library-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-list-title" aria-describedby="delete-list-description" onKeyDown={handleKeyDown}>
        <p className="eyebrow"><span aria-hidden="true" />Confirmación</p>
        <h2 id="delete-list-title">Eliminar lista</h2>
        <p id="delete-list-description">Se eliminará <strong>{list.nombre}</strong> y sus relaciones locales. Las películas de TMDB no se eliminarán.</p>
        <div className="library-dialog__actions">
          <button ref={cancelRef} className="button button--secondary" type="button" disabled={busy} onClick={onCancel}>Cancelar</button>
          <button className="library-danger" type="button" disabled={busy} onClick={onConfirm}>{busy ? 'Eliminando…' : 'Sí, eliminar lista'}</button>
        </div>
      </section>
    </div>
  )
}

export default DeleteListDialog