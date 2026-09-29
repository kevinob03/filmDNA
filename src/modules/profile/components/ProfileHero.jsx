import { ProfileAvatar } from './ProfileAvatar.jsx'

const ROLE_LABELS = { usuario: 'Usuario', admin: 'Administrador' }

function ProfileHero({ profile, editing, onEdit }) {
  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role
  const bio = profile.bio || 'Añade una bio para contar qué lugar ocupa el cine en tu historia.'
  return (
    <section className="profile-hero" aria-labelledby="profile-name">
      <div className="profile-hero__glow" aria-hidden="true" />
      <ProfileAvatar nombre={profile.nombre} preset={profile.avatarPreset} image={profile.avatarImage} />
      <div className="profile-hero__identity">
        <p className="eyebrow"><span aria-hidden="true" />Identidad FilmDNA</p>
        <h1 id="profile-name">{profile.nombre}</h1>
        <p className={`profile-hero__bio ${profile.bio ? '' : 'profile-hero__bio--empty'}`}>{bio}</p>
        <div className="profile-hero__meta"><span>{profile.email}</span><span className={`role-chip role-chip--${profile.role}`}>{roleLabel}</span></div>
      </div>
      {!editing ? <button className="button button--primary profile-hero__edit" type="button" onClick={onEdit}>Editar perfil</button> : null}
    </section>
  )
}

export default ProfileHero
