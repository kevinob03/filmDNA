import { toSessionUser } from '../../src/services/authUserModel.js'

describe('toSessionUser', () => {
  test('expone sólo datos seguros y conserva el estado pendiente del quiz', () => {
    expect(toSessionUser({
      id: 'u1', nombre: 'Ana', email: 'ana@test.dev', role: 'usuario', password: 'secreta',
      personalizationCompleted: false, recommendationPreferences: { genres: ['35'] },
    })).toEqual({
      id: 'u1', nombre: 'Ana', email: 'ana@test.dev', role: 'usuario',
      personalizationCompleted: false, recommendationPreferences: { genres: ['35'] },
    })
  })

  test('las cuentas antiguas sin campo de personalización no quedan bloqueadas', () => {
    expect(toSessionUser({ id: 'old', nombre: 'Legacy', email: 'old@test.dev', role: 'usuario' }))
      .toEqual({ id: 'old', nombre: 'Legacy', email: 'old@test.dev', role: 'usuario' })
  })
})
