export const EXPERIENCE_CRITERIA = [
  { id: 'genre', label: 'Género', options: ['Comedia', 'Acción', 'Animación', 'Romance', 'Drama', 'Terror', 'Ciencia ficción', 'Fantasía'] },
  { id: 'mood', label: 'Qué te apetece', options: ['Para reír', 'Para emocionarme', 'Para relajarme', 'Para sentir suspenso', 'Para ver en familia'] },
  { id: 'pace', label: 'Ritmo', options: ['Tranquila', 'Equilibrada', 'Con mucha acción'] },
  { id: 'duration', label: 'Duración', options: ['Menos de 90 min', 'Entre 90 y 140 min', 'Más de 140 min'] },
  { id: 'era', label: 'Época', options: ['Estrenos', 'Recientes', 'De los 2000', 'Clásicas'] },
  { id: 'intensity', label: 'Intensidad', options: ['Ligera', 'Moderada', 'Intensa'] },
]
export const DURATION_RANGES = { 'Menos de 90 min': { max: 89 }, 'Entre 90 y 140 min': { min: 90, max: 140 }, 'Más de 140 min': { min: 141 } }
export const GENRE_SIGNALS = {
  Comedia: [35], Acción: [28], Animación: [16], Romance: [10749], Drama: [18], Terror: [27], 'Ciencia ficción': [878], Fantasía: [14],
  'Para reír': [35], 'Para emocionarme': [28,12,18], 'Para relajarme': [35,10749,16], 'Para sentir suspenso': [53,9648,27], 'Para ver en familia': [10751,16],
  Tranquila: [18,99,10749], Equilibrada: [12,18,35], 'Con mucha acción': [28,12],
  Ligera: [35,16,10751], Moderada: [12,18,9648], Intensa: [28,27,53],
}
export const DNA_TARGETS = {
  pace: { Tranquila: 25, Equilibrada: 50, 'Con mucha acción': 85, dimension: 'ritmo' },
  intensity: { Ligera: 25, Moderada: 50, Intensa: 85, dimension: 'intensidad' },
}
