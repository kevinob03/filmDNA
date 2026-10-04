import { normalizeProfileFields, toProfileUser } from '../../src/models/profileModel.js'

describe('profileService', () => {
  test('normaliza únicamente los campos editables permitidos', () => {
    expect(normalizeProfileFields({
      nombre: '  Ana   Cine  ',
      bio: '  Me gustan las historias humanas.  ',
      avatarPreset: 'orbit',
      favoriteGenres: ['28', 18, 28],
      email: 'otro@correo.test',
      role: 'admin',
      password: 'secreto',
    })).toEqual({ nombre: 'Ana Cine', bio: 'Me gustan las historias humanas.', avatarPreset: 'orbit', avatarImage: '', favoriteGenres: [28, 18] })
  })

  test('rechaza más de cinco géneros y valores fuera del catálogo', () => {
    expect(() => normalizeProfileFields({ nombre: 'Ana', favoriteGenres: [28, 35, 18, 53, 27, 878] })).toThrow('invalid-genres')
    expect(() => normalizeProfileFields({ nombre: 'Ana', favoriteGenres: [999999] })).toThrow('invalid-genres')
  })

  test('adapta usuarios antiguos sin exponer password', () => {
    expect(toProfileUser({ id: 'old', nombre: 'Usuario', email: 'old@test.dev', role: 'usuario', password: 'privada' })).toEqual({
      id: 'old', nombre: 'Usuario', email: 'old@test.dev', role: 'usuario', bio: '', avatarPreset: '', avatarImage: '', favoriteGenres: [],
    })
  })

  test('acepta una foto procesada y rechaza contenido que no sea imagen', () => {
    const avatarImage = `data:image/webp;base64,${'a'.repeat(120)}`
    expect(normalizeProfileFields({ nombre: 'Ana', avatarPreset: 'orbit', avatarImage })).toMatchObject({ avatarPreset: '', avatarImage })
    expect(() => normalizeProfileFields({ nombre: 'Ana', avatarImage: 'https://externo.test/foto.jpg' })).toThrow('invalid-avatar-image')
  })
})
