const AVATAR_PRESETS = new Set(['orbit', 'prism', 'pulse', 'frame', 'nova', 'signal'])
const SAFE_AVATAR_IMAGE = /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=]+$/i

const getSafeAvatar = (avatarPreset, avatarImage) => {
  const image = typeof avatarImage === 'string'
    && avatarImage.length <= 300_000
    && SAFE_AVATAR_IMAGE.test(avatarImage)
    ? avatarImage
    : ''
  const preset = !image && AVATAR_PRESETS.has(avatarPreset) ? avatarPreset : ''
  return {
    ...(preset ? { avatarPreset: preset } : {}),
    ...(image ? { avatarImage: image } : {}),
  }
}

export const toSessionUser = ({ id, nombre, email, role, avatarPreset, avatarImage, personalizationCompleted, discoveryPreferences, recommendationPreferences }) => ({
  id,
  nombre,
  email,
  role,
  ...getSafeAvatar(avatarPreset, avatarImage),
  ...(personalizationCompleted === false ? { personalizationCompleted: false } : {}),
  ...((discoveryPreferences || recommendationPreferences) && typeof (discoveryPreferences || recommendationPreferences) === 'object'
    ? { discoveryPreferences: discoveryPreferences || recommendationPreferences }
    : {}),
})
