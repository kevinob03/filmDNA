import { useState } from 'react'

const CONFIRMATION = 'ELIMINAR'

function DeleteProfileDialog({ deleting, error, onCancel, onConfirm }) {
  const [confirmation, setConfirmation] = useState('')
  const valid = confirmation === CONFIRMATION
  return (
    <div className="profile-dialog-backdrop" role="presentation">
      <section className="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-profile-title" aria-describedby="delete-profile-description">
        <p className="eyebrow"><span aria-hidden="true" />Acción irreversible</p>
        <h2 id="delete-profile-title">¿Eliminar tu cuenta?</h2>
        <p id="delete-profile-description">Se eliminarán tu Diario, favoritos y listas. Esta acción no se puede deshacer.</p>
        <div className="profile-field">
          <label htmlFor="delete-profile-confirmation">Escribe <strong>{CONFIRMATION}</strong> para confirmar</label>
          <input id="delete-profile-confirmation" autoFocus autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={deleting} />
        </div>
        {error ? <p className="profile-field__error" role="alert">{error}</p> : null}
        <div className="profile-dialog__actions">
          <button className="profile-danger-button" type="button" disabled={!valid || deleting} onClick={onConfirm}>{deleting ? 'Eliminando…' : 'Eliminar definitivamente'}</button>
          <button className="button button--secondary" type="button" disabled={deleting} onClick={onCancel}>Cancelar</button>
        </div>
      </section>
    </div>
  )
}

export default DeleteProfileDialog
