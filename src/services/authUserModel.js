export const toSessionUser = ({ id, nombre, email, role, personalizationCompleted, recommendationPreferences }) => ({
  id,
  nombre,
  email,
  role,
  ...(personalizationCompleted === false ? { personalizationCompleted: false } : {}),
  ...(recommendationPreferences && typeof recommendationPreferences === 'object' ? { recommendationPreferences } : {}),
})
