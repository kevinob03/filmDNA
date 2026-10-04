export const APP_ROLES = Object.freeze({
  USER: 'usuario',
  PSYCHOLOGIST: 'psychologist',
  ADMIN: 'admin',
})

export const APP_ROLE_VALUES = Object.freeze(Object.values(APP_ROLES))

export const APP_ROLE_LABELS = Object.freeze({
  [APP_ROLES.USER]: 'Usuario',
  [APP_ROLES.PSYCHOLOGIST]: 'Psicólogo',
  [APP_ROLES.ADMIN]: 'Administrador',
})

export const getRoleLabel = (role) => APP_ROLE_LABELS[role] ?? role