import { buildTourSteps } from '../../src/context/tourSteps.js'

describe('Tour Guide v2', () => {
  test('mantiene un recorrido público corto y cubre las funciones globales', () => {
    const steps = buildTourSteps()
    expect(steps).toHaveLength(8)
    expect(steps.map(({ title }) => title)).toEqual(expect.arrayContaining([
      'Acompañamiento profesional opcional',
      'Encuentra una película para hoy',
      'Conversa con FilmDNA',
      'Adapta la interfaz',
    ]))
    expect(steps.some(({ path }) => ['/perfil', '/biblioteca', '/psicologo'].includes(path))).toBe(false)
  })

  test('añade personalización y espacio privado para usuarios', () => {
    const steps = buildTourSteps({ role: 'usuario' })
    expect(steps.map(({ title }) => title)).toEqual(expect.arrayContaining([
      'Una selección que evoluciona contigo',
      'Organiza tu recorrido',
    ]))
    expect(steps.some(({ path }) => path === '/psicologo')).toBe(false)
  })

  test('muestra el panel profesional solamente al rol psicólogo', () => {
    const psychologist = buildTourSteps({ role: 'psychologist' })
    const admin = buildTourSteps({ role: 'admin' })
    expect(psychologist.some(({ title }) => title === 'Tu espacio profesional')).toBe(true)
    expect(admin.some(({ title }) => title === 'Tu espacio profesional')).toBe(false)
  })
})
