import { toSessionUser } from '../../src/services/authUserModel.js'

describe('toSessionUser', () => {
  test('expone sólo datos seguros y conserva el estado pendiente del quiz', () => {
    expect(toSessionUser({
      id: 'u1', nombre: 'Ana', email: 'ana@test.dev', role: 'usuario', password: 'secreta',
      personalizationCompleted: false, discoveryPreferences: { genres: ['35'] },
    })).toEqual({
      id: 'u1', nombre: 'Ana', email: 'ana@test.dev', role: 'usuario',
      personalizationCompleted: false, discoveryPreferences: { genres: ['35'] },
    })
  })

  test('conserva únicamente avatares seguros en la sesión', () => {
    const image = 'data:image/png;base64,YQ=='
    expect(toSessionUser({ id: 'u2', nombre: 'Leo', email: 'leo@test.dev', role: 'usuario', avatarPreset: 'orbit' })).toMatchObject({ avatarPreset: 'orbit' })
    expect(toSessionUser({ id: 'u2', nombre: 'Leo', email: 'leo@test.dev', role: 'usuario', avatarPreset: 'orbit', avatarImage: image })).toMatchObject({ avatarImage: image })
    expect(toSessionUser({ id: 'u2', nombre: 'Leo', email: 'leo@test.dev', role: 'usuario', avatarImage: 'https://externo.test/avatar.jpg' })).not.toHaveProperty('avatarImage')
  })

  test('las cuentas antiguas sin campo de personalización no quedan bloqueadas', () => {
    expect(toSessionUser({ id: 'old', nombre: 'Legacy', email: 'old@test.dev', role: 'usuario' }))
      .toEqual({ id: 'old', nombre: 'Legacy', email: 'old@test.dev', role: 'usuario' })
  })
})
