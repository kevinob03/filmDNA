const DEMO_PASSWORD = 'Demo123!'
const MONTHLY_DIARY_COUNTS = Object.freeze([3, 4, 5, 6, 7, 9])
const MOVIE_IDS = Object.freeze([550, 680, 13, 155, 27205, 157336, 603, 807, 238, 424, 120, 129])
const RATINGS = Object.freeze([4, 6, 7, 8, 9, 10, 8, 7, 9, 6])

const monthDate = (referenceDate, monthOffset, day) => {
  const date = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + monthOffset, day))
  return date.toISOString().slice(0, 10)
}

const demoUsers = () => [
  { id: 'demo-admin-01', nombre: 'Admin Demo', email: 'admin.demo@filmdna.test', role: 'admin', personalizationCompleted: true },
  { id: 'demo-admin-02', nombre: 'Mariana Admin', email: 'mariana.admin@filmdna.test', role: 'admin', personalizationCompleted: true },
  { id: 'demo-psych-01', nombre: 'Dra. Elena Demo', email: 'elena.psych@filmdna.test', role: 'psychologist', personalizationCompleted: true },
  { id: 'demo-psych-02', nombre: 'Dr. Daniel Demo', email: 'daniel.psych@filmdna.test', role: 'psychologist', personalizationCompleted: true },
  { id: 'demo-psych-03', nombre: 'Dra. Sofía Demo', email: 'sofia.psych@filmdna.test', role: 'psychologist', personalizationCompleted: true },
  ...Array.from({ length: 10 }, (_, index) => ({
    id: `demo-user-${String(index + 1).padStart(2, '0')}`,
    nombre: `Usuario Demo ${index + 1}`,
    email: `usuario${index + 1}.demo@filmdna.test`,
    role: 'usuario',
    personalizationCompleted: index < 8,
  })),
].map((user) => ({ ...user, password: DEMO_PASSWORD }))

const demoDiary = (referenceDate) => {
  let sequence = 0
  return MONTHLY_DIARY_COUNTS.flatMap((count, monthIndex) => Array.from({ length: count }, (_, entryIndex) => {
    const current = sequence++
    return {
      id: `demo-diary-${String(current + 1).padStart(2, '0')}`,
      usuarioId: `demo-user-${String(current % 10 + 1).padStart(2, '0')}`,
      tmdbId: MOVIE_IDS[current % MOVIE_IDS.length],
      fechaVista: monthDate(referenceDate, monthIndex - 5, Math.min(26, 2 + entryIndex * 3)),
      calificacion: RATINGS[current % RATINGS.length],
      resena: `Reseña sintética de demostración ${current + 1}.`,
      publica: current % 3 === 0,
    }
  }))
}

const demoFavorites = () => Array.from({ length: 20 }, (_, index) => ({
  id: `demo-favorite-${String(index + 1).padStart(2, '0')}`,
  usuarioId: `demo-user-${String(index % 9 + 1).padStart(2, '0')}`,
  tmdbId: MOVIE_IDS[index % MOVIE_IDS.length],
}))

const demoLists = () => Array.from({ length: 8 }, (_, index) => ({
  id: `demo-list-${String(index + 1).padStart(2, '0')}`,
  usuarioId: `demo-user-${String(index + 1).padStart(2, '0')}`,
  nombre: index < 4 ? 'Pendientes' : `Selección Demo ${index - 3}`,
  tipo: index < 4 ? 'pendientes' : 'personalizada',
}))

const demoListMovies = () => Array.from({ length: 24 }, (_, index) => ({
  id: `demo-list-movie-${String(index + 1).padStart(2, '0')}`,
  listaId: `demo-list-${String(index % 8 + 1).padStart(2, '0')}`,
  tmdbId: MOVIE_IDS[index % MOVIE_IDS.length],
}))

const demoMovieDNA = () => [{
  id: 'demo-dna-550',
  tmdbId: 550,
  alegria: 24,
  emocion: 78,
  complejidad: 82,
  intensidad: 86,
  fantasia: 18,
  ritmo: 72,
  explicacion: 'Perfil sintético para demostrar las seis dimensiones de Movie DNA sin consultar proveedores externos.',
  source: 'demo',
  provider: 'fixture',
  model: 'synthetic-v1',
  generatedAt: '2026-10-01T00:00:00.000Z',
}]

export const buildDemoDatabase = (referenceDate = new Date()) => ({
  usuarios: demoUsers(),
  diario: demoDiary(referenceDate),
  favoritos: demoFavorites(),
  listas: demoLists(),
  listaPeliculas: demoListMovies(),
  movieDNA: demoMovieDNA(),
  configuracionDNA: [],
  asignacionesPsicologicas: [],
  auditoriaCinematerapia: [],
  registrosEmocionales: [],
  propuestasCinematerapia: [],
})

export const DEMO_ADMIN_CREDENTIALS = Object.freeze({
  email: 'admin.demo@filmdna.test',
  password: DEMO_PASSWORD,
})
