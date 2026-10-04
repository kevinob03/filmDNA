import { APP_ROLES, APP_ROLE_VALUES, getRoleLabel } from '../../src/constants/roles.js'

describe('roles de FilmDNA', () => {
  test('incluye los tres roles autorizados', () => {
    expect(APP_ROLE_VALUES).toEqual(['usuario', 'psychologist', 'admin'])
  })

  test('presenta etiquetas comprensibles sin alterar roles desconocidos', () => {
    expect(getRoleLabel(APP_ROLES.USER)).toBe('Usuario')
    expect(getRoleLabel(APP_ROLES.PSYCHOLOGIST)).toBe('Psicólogo')
    expect(getRoleLabel(APP_ROLES.ADMIN)).toBe('Administrador')
    expect(getRoleLabel('legacy')).toBe('legacy')
  })
})