export const toSessionUser = ({ id, nombre, email, role, personalizationCompleted, discoveryPreferences, recommendationPreferences }) => ({
  id,
  nombre,
  email,
  role,
  ...(personalizationCompleted === false ? { personalizationCompleted: false } : {}),
  ...((discoveryPreferences || recommendationPreferences) && typeof (discoveryPreferences || recommendationPreferences) === 'object'
    ? { discoveryPreferences: discoveryPreferences || recommendationPreferences }
    : {}),
})
