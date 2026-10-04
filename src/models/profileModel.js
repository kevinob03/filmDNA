import { GENRE_OPTIONS } from '../config/recommendationConfig.js'

export const PROFILE_BIO_MAX_LENGTH = 160
export const PROFILE_NAME_MAX_LENGTH = 80
export const MAX_FAVORITE_GENRES = 5
export const MAX_AVATAR_IMAGE_LENGTH = 300_000
export const AVATAR_PRESET_IDS = Object.freeze(['orbit', 'prism', 'pulse', 'frame', 'nova', 'signal'])

const VALID_AVATARS = new Set(AVATAR_PRESET_IDS)
const VALID_GENRES = new Set(GENRE_OPTIONS.map(({ value }) => Number(value)))
const invalid = (type) => Object.assign(new Error(type), { type })
const normalizeName = (value) => String(value ?? '').trim().replace(/\s+/g, ' ')

const normalizeAvatarImage = (value) => {
  const image = String(value ?? '')
  if (!image) return ''
  if (image.length > MAX_AVATAR_IMAGE_LENGTH || !/^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(image)) throw invalid('invalid-avatar-image')
  return image
}

export const normalizeProfileFields = ({ nombre, bio, avatarPreset, avatarImage, favoriteGenres } = {}) => {
  const normalizedName = normalizeName(nombre)
  const normalizedBio = String(bio ?? '').trim()
  const normalizedAvatar = String(avatarPreset ?? '')
  const normalizedAvatarImage = normalizeAvatarImage(avatarImage)
  const normalizedGenres = [...new Set((Array.isArray(favoriteGenres) ? favoriteGenres : []).map(Number))]
  if (!normalizedName || normalizedName.length > PROFILE_NAME_MAX_LENGTH) throw invalid('invalid-name')
  if (normalizedBio.length > PROFILE_BIO_MAX_LENGTH) throw invalid('invalid-bio')
  if (normalizedAvatar && !VALID_AVATARS.has(normalizedAvatar)) throw invalid('invalid-avatar')
  if (normalizedGenres.length > MAX_FAVORITE_GENRES || normalizedGenres.some((id) => !VALID_GENRES.has(id))) throw invalid('invalid-genres')
  return { nombre: normalizedName, bio: normalizedBio, avatarPreset: normalizedAvatarImage ? '' : normalizedAvatar, avatarImage: normalizedAvatarImage, favoriteGenres: normalizedGenres }
}

export const toProfileUser = (user) => ({
  id: user.id,
  nombre: normalizeName(user.nombre),
  email: String(user.email ?? ''),
  role: user.role,
  bio: String(user.bio ?? ''),
  avatarPreset: VALID_AVATARS.has(user.avatarPreset) ? user.avatarPreset : '',
  avatarImage: (() => { try { return normalizeAvatarImage(user.avatarImage) } catch { return '' } })(),
  favoriteGenres: [...new Set((Array.isArray(user.favoriteGenres) ? user.favoriteGenres : []).map(Number))].filter((id) => VALID_GENRES.has(id)).slice(0, MAX_FAVORITE_GENRES),
})
