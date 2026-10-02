import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import { GENRE_OPTIONS } from '../../recommendations/recommendationConfig.js'
import { getProfileErrorMessage, getProfileUser, updateProfileUser } from '../../../services/profileService.js'
import { deleteProfileAccount } from '../../../services/profileService.js'
import { getStatisticsErrorMessage, getUserStatisticsActivity } from '../../../services/statisticsService.js'
import { summarizeStatistics } from '../../statistics/statisticsCalculations.js'
import ContentState from '../../../shared/components/ContentState.jsx'
import PageContainer from '../../../shared/components/PageContainer.jsx'
import { getRoleLabel } from '../../../shared/auth/roles.js'
import ProfileActivity from '../components/ProfileActivity.jsx'
import DeleteProfileDialog from '../components/DeleteProfileDialog.jsx'
import ProfileEditor from '../components/ProfileEditor.jsx'
import ProfileHero from '../components/ProfileHero.jsx'
import ProfileQuickLinks from '../components/ProfileQuickLinks.jsx'
import CinematherapyConsentPanel from '../components/CinematherapyConsentPanel.jsx'
import EmotionalCheckInPanel from '../components/EmotionalCheckInPanel.jsx'
import ApprovedCinematherapyPanel from '../components/ApprovedCinematherapyPanel.jsx'
import '../profile.css'

const EMPTY_SUMMARY = summarizeStatistics()

const GENRE_LABELS = new Map(GENRE_OPTIONS.map(({ value, label }) => [Number(value), label]))

function ProfileSkeleton() {
  return <div className="profile-skeleton" aria-live="polite" aria-busy="true" aria-label="Cargando perfil"><span /><span /><span /></div>
}

function ProfilePage() {
  const { user, logout, syncSessionUser } = useAuth()
  const [profileState, setProfileState] = useState({ status: 'loading', profile: null, error: '' })
  const [activityState, setActivityState] = useState({ status: 'loading', summary: EMPTY_SUMMARY, error: '' })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [deleteState, setDeleteState] = useState({ open: false, deleting: false, error: '' })

  const loadProfile = useCallback(async () => {
    setProfileState((current) => ({ ...current, status: 'loading', error: '' }))
    try {
      const profile = await getProfileUser(user.id)
      setProfileState({ status: 'success', profile, error: '' })
    } catch (error) {
      setProfileState({ status: 'error', profile: null, error: getProfileErrorMessage(error) })
    }
  }, [user.id])

  const loadActivity = useCallback(async () => {
    setActivityState((current) => ({ ...current, status: 'loading', error: '' }))
    try {
      const activity = await getUserStatisticsActivity(user.id)
      setActivityState({ status: 'success', summary: summarizeStatistics(activity), error: '' })
    } catch (error) {
      setActivityState({ status: 'error', summary: EMPTY_SUMMARY, error: getStatisticsErrorMessage(error) })
    }
  }, [user.id])

  useEffect(() => {
    loadProfile()
    loadActivity()
  }, [loadActivity, loadProfile])

  const saveProfile = async (values) => {
    if (saving) return
    setSaving(true)
    setMessage(null)
    try {
      const updated = await updateProfileUser(user.id, values)
      setProfileState({ status: 'success', profile: updated, error: '' })
      syncSessionUser({ nombre: updated.nombre, avatarPreset: updated.avatarPreset, avatarImage: updated.avatarImage })
      setEditing(false)
      setMessage({ type: 'success', text: 'Tu perfil se actualizó correctamente.' })
    } catch (error) {
      setMessage({ type: 'error', text: getProfileErrorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  const profile = profileState.profile
  const favoriteGenreLabels = profile?.favoriteGenres.map((id) => GENRE_LABELS.get(id)).filter(Boolean) ?? []

  return (
    <main id="main-content" className="profile-page">
      <PageContainer>
        {profileState.status === 'loading' ? <ProfileSkeleton /> : null}
        {profileState.status === 'error' ? <ContentState title="No pudimos cargar tu perfil" message={profileState.error} actionLabel="Reintentar" onAction={loadProfile} /> : null}
        {profileState.status === 'success' && profile ? (
          <div className="profile-layout">
            <ProfileHero profile={profile} editing={editing} onEdit={() => { setEditing(true); setMessage(null) }} />
            {message ? <p className={`profile-message profile-message--${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p> : null}
            {editing ? <ProfileEditor profile={profile} saving={saving} onCancel={() => { setEditing(false); setMessage(null) }} onSave={saveProfile} /> : null}
            {!editing ? (
              <section className="profile-panel profile-preferences" aria-labelledby="favorite-genres-title">
                <header className="profile-section-heading"><p className="eyebrow"><span aria-hidden="true" />Tu selección</p><h2 id="favorite-genres-title">Géneros favoritos</h2><p>Una firma personal en tu perfil; no altera el recomendador.</p></header>
                {favoriteGenreLabels.length ? <ul>{favoriteGenreLabels.map((label) => <li key={label}>{label}</li>)}</ul> : <p className="profile-preferences__empty">Todavía no elegiste géneros favoritos. Puedes añadir hasta cinco al editar tu perfil.</p>}
                <div className="profile-discovery-quiz">
                  <div><h3>Tu selección de descubrimiento</h3><p>Vuelve a responder el quiz para actualizar el contenido que aparece en Explorar.</p></div>
                  <Link className="button button--secondary" to="/personalizacion">Retomar quiz</Link>
                </div>
              </section>
            ) : null}
            {profile.role === 'usuario' ? <CinematherapyConsentPanel userId={user.id} /> : null}
            {profile.role === 'usuario' ? <EmotionalCheckInPanel userId={user.id} /> : null}
            {profile.role === 'usuario' ? <ApprovedCinematherapyPanel userId={user.id} /> : null}
            <ProfileActivity {...activityState} onRetry={loadActivity} />
            <ProfileQuickLinks />
            <section className="profile-panel profile-account" aria-labelledby="profile-account-title">
              <header className="profile-section-heading"><p className="eyebrow"><span aria-hidden="true" />Cuenta</p><h2 id="profile-account-title">Datos de acceso</h2><p>Información protegida y disponible solo como referencia.</p></header>
              <dl><div><dt>Email</dt><dd>{profile.email}</dd></div><div><dt>Rol</dt><dd>{getRoleLabel(profile.role)}</dd></div></dl>
            </section>
            <section className="profile-panel profile-danger-zone" aria-labelledby="profile-danger-title">
              <div><p className="eyebrow"><span aria-hidden="true" />Zona de peligro</p><h2 id="profile-danger-title">Eliminar cuenta</h2><p>Borra permanentemente tu usuario de FilmDNA y cierra la sesión actual.</p></div>
              <button className="profile-danger-button" type="button" onClick={() => setDeleteState({ open: true, deleting: false, error: '' })}>Eliminar mi cuenta</button>
            </section>
            {deleteState.open ? <DeleteProfileDialog deleting={deleteState.deleting} error={deleteState.error} onCancel={() => setDeleteState({ open: false, deleting: false, error: '' })} onConfirm={async () => {
              if (deleteState.deleting) return
              setDeleteState((current) => ({ ...current, deleting: true, error: '' }))
              try {
                await deleteProfileAccount(user.id)
                logout()
              } catch (error) {
                setDeleteState({ open: true, deleting: false, error: getProfileErrorMessage(error) })
              }
            }} /> : null}
          </div>
        ) : null}
      </PageContainer>
    </main>
  )
}

export default ProfilePage
