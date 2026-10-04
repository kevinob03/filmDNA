import { useState } from 'react'
import { GENRE_OPTIONS } from '../../config/recommendationConfig.js'
import { MAX_FAVORITE_GENRES, PROFILE_BIO_MAX_LENGTH, PROFILE_NAME_MAX_LENGTH } from '../../models/profileModel.js'
import { AvatarPicker } from './ProfileAvatar.jsx'

const initialValues = (profile) => ({ nombre: profile.nombre, bio: profile.bio ?? '', avatarPreset: profile.avatarPreset ?? '', avatarImage: profile.avatarImage ?? '', favoriteGenres: profile.favoriteGenres ?? [] })

function ProfileEditor({ profile, saving, onCancel, onSave }) {
  const [values, setValues] = useState(() => initialValues(profile))
  const [errors, setErrors] = useState({})
  const update = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }
  const toggleGenre = (genreId) => {
    const selected = values.favoriteGenres.includes(genreId)
    if (!selected && values.favoriteGenres.length >= MAX_FAVORITE_GENRES) {
      setErrors((current) => ({ ...current, favoriteGenres: 'Puedes seleccionar hasta 5 géneros.' }))
      return
    }
    update('favoriteGenres', selected ? values.favoriteGenres.filter((id) => id !== genreId) : [...values.favoriteGenres, genreId])
  }
  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!values.nombre.trim() || values.nombre.trim().length > PROFILE_NAME_MAX_LENGTH) nextErrors.nombre = 'Escribe un nombre de hasta 80 caracteres.'
    if (values.bio.trim().length > PROFILE_BIO_MAX_LENGTH) nextErrors.bio = 'La bio puede tener hasta 160 caracteres.'
    if (values.favoriteGenres.length > MAX_FAVORITE_GENRES) nextErrors.favoriteGenres = 'Puedes seleccionar hasta 5 géneros.'
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return }
    await onSave(values)
  }

  return (
    <section className="profile-panel profile-editor" aria-labelledby="profile-editor-title">
      <header className="profile-section-heading"><p className="eyebrow"><span aria-hidden="true" />Personalización</p><h2 id="profile-editor-title">Haz tuyo este espacio</h2><p>Tu email y rol permanecen protegidos como datos de cuenta.</p></header>
      <form onSubmit={submit} noValidate>
        <div className="profile-field">
          <label htmlFor="profile-name-input">Nombre visible</label>
          <input id="profile-name-input" value={values.nombre} maxLength={PROFILE_NAME_MAX_LENGTH} onChange={(event) => update('nombre', event.target.value)} aria-invalid={Boolean(errors.nombre)} aria-describedby={errors.nombre ? 'profile-name-error' : undefined} />
          {errors.nombre ? <p className="profile-field__error" id="profile-name-error">{errors.nombre}</p> : null}
        </div>
        <div className="profile-field">
          <div className="profile-field__label-row"><label htmlFor="profile-bio-input">Bio</label><span>{values.bio.length}/{PROFILE_BIO_MAX_LENGTH}</span></div>
          <textarea id="profile-bio-input" rows="4" value={values.bio} maxLength={PROFILE_BIO_MAX_LENGTH} onChange={(event) => update('bio', event.target.value)} aria-invalid={Boolean(errors.bio)} aria-describedby="profile-bio-help" />
          <p id="profile-bio-help" className={errors.bio ? 'profile-field__error' : 'profile-field__hint'}>{errors.bio || 'Opcional. Una mirada breve a tu relación con el cine.'}</p>
        </div>
        <AvatarPicker
          value={values.avatarPreset}
          image={values.avatarImage}
          nombre={values.nombre}
          onChange={(value) => { update('avatarPreset', value); update('avatarImage', '') }}
          onImageChange={(value) => { update('avatarImage', value); update('avatarPreset', '') }}
          onImageError={(message) => setErrors((current) => ({ ...current, avatarImage: message }))}
        />
        {errors.avatarImage ? <p className="profile-field__error" role="alert">{errors.avatarImage}</p> : null}
        <fieldset className="profile-editor__fieldset">
          <legend>Géneros favoritos</legend>
          <p id="genre-picker-help">Selecciona hasta 5. Esto personaliza tu perfil, no cambia tus recomendaciones.</p>
          <div className="genre-picker" aria-describedby="genre-picker-help">
            {GENRE_OPTIONS.map((genre) => {
              const id = Number(genre.value)
              const selected = values.favoriteGenres.includes(id)
              const disabled = !selected && values.favoriteGenres.length >= MAX_FAVORITE_GENRES
              return <button className={`genre-option ${selected ? 'genre-option--selected' : ''}`} type="button" aria-pressed={selected} disabled={disabled} onClick={() => toggleGenre(id)} key={genre.value}><span aria-hidden="true">{selected ? '✓' : '+'}</span>{genre.label}</button>
            })}
          </div>
          <div className="genre-picker__status" aria-live="polite"><span>{values.favoriteGenres.length} de {MAX_FAVORITE_GENRES} seleccionados</span>{errors.favoriteGenres ? <span className="profile-field__error">{errors.favoriteGenres}</span> : null}</div>
        </fieldset>
        <div className="profile-editor__actions"><button className="button button--primary" disabled={saving} type="submit">{saving ? 'Guardando…' : 'Guardar cambios'}</button><button className="button button--secondary" disabled={saving} type="button" onClick={onCancel}>Cancelar</button></div>
      </form>
    </section>
  )
}

export default ProfileEditor
